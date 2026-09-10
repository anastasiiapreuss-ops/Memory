// @ts-ignore: SCSS is handled by the bundler.
import './styles/main.scss';

// -----------------------------------------------------------------------------
// Navigation: Homescreen -> Settings-Ansicht
// Kein Routing, keine neue Seite – nur Ein-/Ausblenden der Container per hidden.
// -----------------------------------------------------------------------------

const playButton = document.querySelector<HTMLButtonElement>('#play-button');
const homeScreen = document.querySelector<HTMLElement>('.home');
const homeWatermark = document.querySelector<HTMLElement>('.gamepad-watermark');
const settingsScreen = document.querySelector<HTMLElement>('.settings');

playButton?.addEventListener('click', () => {
    if (homeScreen) homeScreen.hidden = true;
    if (homeWatermark) homeWatermark.hidden = true;
    if (settingsScreen) settingsScreen.hidden = false;
});

// -----------------------------------------------------------------------------
// Settings-Auswahl -> Werte fuer den spaeteren Spielstart
// Liest die aktuell gewaehlten Optionen aus, aktiviert "Start" erst wenn
// Theme + mindestens ein Spieler + Board Size gewaehlt sind und uebergibt die
// Werte beim Klick (vorerst nur Zwischenspeicher + console.log). Noch keine
// Game-Board-Logik.
// -----------------------------------------------------------------------------

type Theme = 'code-vibes' | 'gaming';
type PlayerColor = 'blue' | 'orange';

interface GameConfig {
    theme: Theme;
    players: PlayerColor[];
    boardSize: number;
}

const settingsForm = document.querySelector<HTMLFormElement>('.settings__form');
const startButton = document.querySelector<HTMLButtonElement>('.button--start');

// Zuletzt beim Start uebernommene Auswahl – hier greift spaeter die Game-Logik.
let currentGameConfig: GameConfig | null = null;

function readSelectedTheme(): Theme | null {
    const input = document.querySelector<HTMLInputElement>('input[name="game-theme"]:checked');
    return input ? (input.value as Theme) : null;
}

function readSelectedPlayers(): PlayerColor[] {
    return Array.from(
        document.querySelectorAll<HTMLInputElement>('input[name="player"]:checked'),
    ).map((input) => input.value as PlayerColor);
}

function readSelectedBoardSize(): number | null {
    const input = document.querySelector<HTMLInputElement>('input[name="board-size"]:checked');
    return input ? Number(input.value) : null;
}

function isSelectionComplete(): boolean {
    return (
        readSelectedTheme() !== null &&
        readSelectedPlayers().length > 0 &&
        readSelectedBoardSize() !== null
    );
}

function updateStartButtonState(): void {
    // Button bleibt immer klick-/hoverbar; nur fuer Screenreader markieren.
    // Die eigentliche Sperre uebernimmt der Click-Handler unten.
    if (startButton) {
        startButton.setAttribute('aria-disabled', String(!isSelectionComplete()));
    }
}

// Bei jeder Aenderung in den Settings den Start-Button-Zustand nachziehen.
// (16 / 24 / 36 sind fuer beide Themes waehlbar; die noch fehlenden Gaming-
// Motive werden erst spaeter bei der Karten-/Pair-Logik behandelt.)
settingsForm?.addEventListener('change', updateStartButtonState);
updateStartButtonState();

// -----------------------------------------------------------------------------
// Settings -> Game-Screen: GameConfig uebergeben, statisches Board aufbauen.
// Noch KEINE Flip-/Match-/Game-over-Logik.
// -----------------------------------------------------------------------------

const gameScreen = document.querySelector<HTMLElement>('.game');
const board = document.querySelector<HTMLElement>('#board');
const exitGameButton = document.querySelector<HTMLButtonElement>('#exit-game');
const currentPlayerIcon = document.querySelector<HTMLElement>('.current-player-icon');
const quitPopup = document.querySelector<HTMLElement>('#quit-popup');
const quitStayButton = document.querySelector<HTMLButtonElement>('#quit-stay');
const quitLeaveButton = document.querySelector<HTMLButtonElement>('#quit-leave');

// -----------------------------------------------------------------------------
// Karten-Daten (nur Daten + Darstellung, noch KEINE Flip-/Match-Logik).
//
// Rueckseiten je Theme:
//   Code vibes -> Property 1=Component 21.svg
//   Gaming     -> Property 1=Component 1.svg  (Optik wird im CSS ueber den
//                 gleichen Verlauf nachgebaut, damit der Kartenabstand exakt
//                 wie bei Code vibes bleibt – die SVG hat transparenten
//                 Schatten-Rand.)
//
// Vorderseiten je Theme: jede Datei ist ein eindeutiges Motiv (vorab geprueft).
//   Code vibes: 18 eindeutige Motive
//   Gaming:     12 eindeutige Motive
// -----------------------------------------------------------------------------

interface Card {
    id: number; // eindeutig ueber das gesamte Board
    pairId: number; // beide Karten eines Paares teilen sich diese Nummer
    front: string; // Pfad zur Vorderseite (themenabhaengig)
    back: string; // Pfad zur Rueckseite (themenabhaengig)
}

const CARD_BACKS: Record<Theme, string> = {
    'code-vibes': '/assets/Property%201=Component%2021.svg',
    gaming: '/assets/Property%201=Component%201.svg',
};

const CARD_FRONTS: Record<Theme, string[]> = {
    'code-vibes': [
        '/assets/Property%201=Component%2022.svg',
        ...Array.from(
            { length: 16 },
            (_, i) => `/assets/Property%201=Component%2022%20(${i + 1}).svg`,
        ),
        '/assets/Front.svg',
    ],
    gaming: [
        '/assets/Property%201=Component%202.svg',
        ...Array.from(
            { length: 10 },
            (_, i) => `/assets/Property%201=Component%202%20(${i + 1}).svg`,
        ),
        '/assets/Front%20(1).svg',
    ],
};

// Zuletzt aufgebautes Karten-Deck – hier greift spaeter die Flip-/Match-Logik.
let currentDeck: Card[] = [];

// Fisher–Yates: mischt eine Kopie, laesst das Original unangetastet.
function shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Baut das Karten-Deck fuer die gewaehlte Konfiguration:
// boardSize / 2 Paare, jedes Motiv genau zweimal, anschliessend gemischt.
// Reichen die eindeutigen Motive nicht (Gaming bei 36), wird auf die
// vorhandene Anzahl begrenzt – es werden KEINE uneindeutigen Paare erfunden.
function buildDeck(config: GameConfig): Card[] {
    const fronts = CARD_FRONTS[config.theme];
    const back = CARD_BACKS[config.theme];

    const requestedPairs = Math.floor(config.boardSize / 2);
    const pairCount = Math.min(requestedPairs, fronts.length);

    if (pairCount < requestedPairs) {
        console.warn(
            `Theme "${config.theme}": nur ${fronts.length} eindeutige Motive vorhanden – ` +
                `${pairCount} Paare (${pairCount * 2} Karten) statt ${config.boardSize}.`,
        );
    }

    const chosenFronts = shuffle(fronts).slice(0, pairCount);

    const cards: Card[] = [];
    chosenFronts.forEach((front, pairId) => {
        cards.push({ id: cards.length, pairId, front, back });
        cards.push({ id: cards.length, pairId, front, back });
    });

    return shuffle(cards);
}

function startGame(config: GameConfig): void {
    if (!gameScreen || !board) return;

    gameScreen.dataset.theme = config.theme;
    gameScreen.dataset.players = config.players.join(' ');
    gameScreen.dataset.board = String(config.boardSize);

    // Score auf 0 setzen
    document.querySelectorAll<HTMLElement>('.score__value').forEach((el) => {
        el.textContent = '0';
    });

    // Aktiver Spieler = erster gewaehlter Spieler
    const firstPlayer = config.players[0];
    currentPlayerIcon?.classList.toggle('is-blue', firstPlayer === 'blue');
    currentPlayerIcon?.classList.toggle('is-orange', firstPlayer === 'orange');

    // Karten aufbauen und verdeckt ins Board rendern. Die Vorderseite liegt
    // bereits im DOM (deckungsgleich, per hidden ausgeblendet) und kann so
    // beim spaeteren Flip einfach eingeblendet werden.
    currentDeck = buildDeck(config);
    board.replaceChildren();
    currentDeck.forEach((card) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.id = String(card.id);
        cardEl.dataset.pairId = String(card.pairId);

        const frontEl = document.createElement('img');
        frontEl.className = 'card__front';
        frontEl.src = card.front;
        frontEl.alt = '';
        frontEl.hidden = true; // erst beim spaeteren Flip sichtbar
        cardEl.append(frontEl);

        board.append(cardEl);
    });

    if (settingsScreen) settingsScreen.hidden = true;
    gameScreen.hidden = false;
}

startButton?.addEventListener('click', () => {
    const theme = readSelectedTheme();
    const players = readSelectedPlayers();
    const boardSize = readSelectedBoardSize();

    // Start ist erst mit vollstaendiger Auswahl aktiv.
    if (theme === null || players.length === 0 || boardSize === null) return;

    currentGameConfig = { theme, players, boardSize };

    console.log('Theme:', theme);
    console.log('Players:', players);
    console.log('Board size:', boardSize);
    console.log('Game config:', currentGameConfig);

    startGame(currentGameConfig);
});

// Exit game -> Quit-Popup zeigen (Bild kommt themenabhaengig aus dem CSS ueber
// data-theme). Erst die Bestaetigung fuehrt zurueck in die Settings-Ansicht.
function closeQuitPopup(): void {
    if (quitPopup) quitPopup.hidden = true;
}

function leaveGame(): void {
    closeQuitPopup();
    if (gameScreen) gameScreen.hidden = true;
    if (settingsScreen) settingsScreen.hidden = false;
}

exitGameButton?.addEventListener('click', () => {
    if (quitPopup) quitPopup.hidden = false;
});

quitStayButton?.addEventListener('click', closeQuitPopup);
quitLeaveButton?.addEventListener('click', leaveGame);

// Klick auf den abgedunkelten Hintergrund schliesst das Popup (= "im Spiel bleiben").
quitPopup?.addEventListener('click', (event) => {
    if (event.target === quitPopup) closeQuitPopup();
});

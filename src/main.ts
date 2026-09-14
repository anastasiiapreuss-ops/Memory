// @ts-ignore: SCSS is handled by the bundler.
import './styles/main.scss';

// -----------------------------------------------------------------------------
// Navigation: Home screen -> Settings screen.
// No routing, no new page – just showing/hiding containers via hidden.
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
// Settings selection -> values for the later game start.
// Reads the currently selected options, only enables "Start" once
// theme + player color + board size are chosen and passes the values
// to startGame() on click.
// -----------------------------------------------------------------------------

type Theme = 'code-vibes' | 'gaming';
type PlayerColor = 'blue' | 'orange';

interface GameConfig {
  theme: Theme;
  // Color the playing person plays as – the game ALWAYS has both players
  // (blue + orange), the selection only determines your own color.
  playerColor: PlayerColor;
  boardSize: number;
}

const settingsForm = document.querySelector<HTMLFormElement>('.settings__form');
const startButton = document.querySelector<HTMLButtonElement>('.button--start');

// Selection taken over on the last start – reused by the game-over logic
// to determine Player 1 (the chosen color).
let currentGameConfig: GameConfig | null = null;

/**
 * Reads the currently selected theme from the settings.
 * @returns The selected theme, or `null` if none is selected yet.
 */
function readSelectedTheme(): Theme | null {
  const input = document.querySelector<HTMLInputElement>('input[name="game-theme"]:checked');
  return input ? (input.value as Theme) : null;
}

/**
 * Reads the currently selected player color from the settings.
 * @returns The selected color, or `null` if none is selected yet.
 */
function readSelectedPlayerColor(): PlayerColor | null {
  const input = document.querySelector<HTMLInputElement>('input[name="player"]:checked');
  return input ? (input.value as PlayerColor) : null;
}

/**
 * Reads the currently selected board size from the settings.
 * @returns The selected number of cards, or `null` if none is selected yet.
 */
function readSelectedBoardSize(): number | null {
  const input = document.querySelector<HTMLInputElement>('input[name="board-size"]:checked');
  return input ? Number(input.value) : null;
}

/**
 * Checks whether theme, player color and board size are all selected.
 * @returns `true` if all three settings are set.
 */
function isSelectionComplete(): boolean {
  return (
    readSelectedTheme() !== null &&
    readSelectedPlayerColor() !== null &&
    readSelectedBoardSize() !== null
  );
}

/**
 * Marks the start button as (not) ready whenever the selection changes.
 * The button always stays clickable/hoverable; the actual guard is
 * handled by startButton's click handler.
 */
function updateStartButtonState(): void {
  if (startButton) {
    startButton.setAttribute('aria-disabled', String(!isSelectionComplete()));
  }
}

settingsForm?.addEventListener('change', updateStartButtonState);
updateStartButtonState();

// -----------------------------------------------------------------------------
// Settings -> Game screen: pass GameConfig, build the board.
// -----------------------------------------------------------------------------

const gameScreen = document.querySelector<HTMLElement>('.game');
const board = document.querySelector<HTMLElement>('#board');
const exitGameButton = document.querySelector<HTMLButtonElement>('#exit-game');
const currentPlayerIcon = document.querySelector<HTMLElement>('.current-player-icon');
const quitPopup = document.querySelector<HTMLElement>('#quit-popup');
const quitStayButton = document.querySelector<HTMLButtonElement>('#quit-stay');
const quitLeaveButton = document.querySelector<HTMLButtonElement>('#quit-leave');

const endScreen = document.querySelector<HTMLElement>('.end-screen');
const endScreenPlayerColorEl = document.querySelector<HTMLElement>('.end-screen__player-color');
const endScoreBlueEl = document.querySelector<HTMLElement>('#end-score-blue');
const endScoreOrangeEl = document.querySelector<HTMLElement>('#end-score-orange');

// -----------------------------------------------------------------------------
// Card data (rendering + flip/match logic).
//
// Backs per theme:
//   Code vibes -> theme1/Property 1=Component 21.svg
//   Gaming     -> theme2/Property 1=Component 1.svg  (look is recreated in CSS
//                 using the same gradient, so the card spacing stays exactly
//                 the same as Code vibes – the SVG has a transparent
//                 shadow margin.)
//
// Fronts per theme: all remaining files in the respective theme folder
// (public/assets/theme1 or theme2), each a unique motif.
//   Code vibes: 18 motifs (theme1)
//   Gaming:     18 motifs (theme2) – some carry irregular suffixes
//               ((40), (8)s, (9s), (s7), a(6)) from the Figma export;
//               "Match card.svg" is NOT one of them (intended later for
//               the match state).
// -----------------------------------------------------------------------------

interface Card {
  id: number; // unique across the whole board
  pairId: number; // both cards of a pair share this number
  front: string; // path to the front (theme-dependent)
  back: string; // path to the back (theme-dependent)
}

// Number of cards per pair – drives both the deck build (motifs x 2) and
// when two open cards get compared.
const CARDS_PER_PAIR = 2;

/**
 * Prefixes a path relative to `public/` with the configured Vite base
 * (e.g. `/memory/`), so image references also work outside the domain
 * root. Unlike paths in index.html/CSS, string literals in TypeScript are
 * not rewritten automatically by Vite.
 * @param path - Path relative to `public/`, without a leading slash.
 * @returns The full, base-aware path.
 */
function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

const CARD_BACKS: Record<Theme, string> = {
  'code-vibes': assetUrl('assets/theme1/Property%201=Component%2021.svg'),
  gaming: assetUrl('assets/theme2/Property%201=Component%201.svg'),
};

const CARD_FRONTS: Record<Theme, string[]> = {
  'code-vibes': [
    assetUrl('assets/theme1/Property%201=Component%2022.svg'),
    ...Array.from({ length: 16 }, (_, i) =>
      assetUrl(`assets/theme1/Property%201=Component%2022%20(${i + 1}).svg`),
    ),
    assetUrl('assets/theme1/Front.svg'),
  ],
  gaming: [
    assetUrl('assets/theme2/Property%201=Component%202.svg'),
    ...Array.from({ length: 12 }, (_, i) =>
      assetUrl(`assets/theme2/Property%201=Component%202%20(${i + 1}).svg`),
    ),
    assetUrl('assets/theme2/Property%201=Component%202%20(40).svg'),
    assetUrl('assets/theme2/Property%201=Component%202%20(8)s.svg'),
    assetUrl('assets/theme2/Property%201=Component%202%20(9s).svg'),
    assetUrl('assets/theme2/Property%201=Component%202%20(s7).svg'),
    assetUrl('assets/theme2/Property%201=Component%202%20a(6).svg'),
  ],
};

// Most recently built card deck.
let currentDeck: Card[] = [];

/**
 * Shuffles a copy of the given list (Fisher–Yates); the original is
 * left unchanged.
 * @param items - The items to shuffle.
 * @returns A new, shuffled list of the same items.
 */
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Warns in the console if there aren't enough unique motifs available for
 * the requested board size (currently only affects Gaming + 36 cards).
 * @param config - The current game configuration (for theme/board size).
 * @param availableCount - Number of actually available motifs.
 * @param pairCount - Number of pairs actually formed.
 * @param requestedPairs - Number of pairs actually requested.
 */
function warnIfNotEnoughFronts(
  config: GameConfig,
  availableCount: number,
  pairCount: number,
  requestedPairs: number,
): void {
  if (pairCount >= requestedPairs) return;
  console.warn(
    `Theme "${config.theme}": only ${availableCount} unique motifs available – ` +
      `${pairCount} pairs (${pairCount * CARDS_PER_PAIR} cards) instead of ${config.boardSize}.`,
  );
}

/**
 * Randomly picks `pairCount` unique fronts for the theme.
 * @param theme - The current theme.
 * @param pairCount - Number of unique motifs needed.
 * @returns A shuffled selection of front paths.
 */
function pickUniqueFronts(theme: Theme, pairCount: number): string[] {
  return shuffle(CARD_FRONTS[theme]).slice(0, pairCount);
}

/**
 * Builds card pairs from the chosen motifs (each motif twice).
 * @param fronts - The chosen front paths, one entry per pair.
 * @param back - The back path for all cards (theme-dependent).
 * @returns Unshuffled card list, two cards per motif.
 */
function createCardPairs(fronts: string[], back: string): Card[] {
  const cards: Card[] = [];
  fronts.forEach((front, pairId) => {
    cards.push({ id: cards.length, pairId, front, back });
    cards.push({ id: cards.length, pairId, front, back });
  });
  return cards;
}

/**
 * Builds the card deck for the chosen configuration: boardSize / 2 pairs,
 * each motif exactly twice, then shuffled. If there aren't enough unique
 * motifs, the deck is capped at the available count – NO non-unique pairs
 * are ever invented.
 * @param config - The current game configuration.
 * @returns The shuffled card deck.
 */
function buildDeck(config: GameConfig): Card[] {
  const fronts = CARD_FRONTS[config.theme];
  const back = CARD_BACKS[config.theme];
  const requestedPairs = Math.floor(config.boardSize / CARDS_PER_PAIR);
  const pairCount = Math.min(requestedPairs, fronts.length);
  warnIfNotEnoughFronts(config, fronts.length, pairCount, requestedPairs);

  const chosenFronts = pickUniqueFronts(config.theme, pairCount);
  return shuffle(createCardPairs(chosenFronts, back));
}

/**
 * Sets theme, active players and board size as data attributes on
 * .game – this drives the entire theme/layout styling.
 * @param config - The current game configuration.
 */
function applyGameDataset(config: GameConfig): void {
  if (!gameScreen) return;
  gameScreen.dataset.theme = config.theme;
  // The game always has both players; the settings selection only
  // determines your own color (see config.playerColor), not who plays.
  gameScreen.dataset.players = 'blue orange';
  gameScreen.dataset.board = String(config.boardSize);
}

/**
 * Marks Player 1's (chosen color) score chip with the glow class, so it's
 * recognizable in the game header which color is your own. Only affects
 * the game header, not the end-screen score.
 * @param color - Player 1's color.
 */
function markSelfScoreChip(color: PlayerColor): void {
  gameScreen?.querySelectorAll('.score__chip').forEach((chip) => {
    chip.classList.remove('is-you');
  });
  gameScreen?.querySelector(`.score__chip--${color}`)?.classList.add('is-you');
}

/** Resets the score display and internal score for a new round. */
function resetScoreboard(): void {
  document.querySelectorAll<HTMLElement>('.score__value').forEach((el) => {
    el.textContent = '0';
  });
  scores = { blue: 0, orange: 0 };
  matchedPairs = 0;
}

/**
 * Creates the back of a card (the face aligned with .card__inner).
 * @returns The back-face element.
 */
function createCardBackFace(): HTMLDivElement {
  const backFaceEl = document.createElement('div');
  backFaceEl.className = 'card__face card__face--back';
  return backFaceEl;
}

/**
 * Creates the front of a card including its motif image.
 * @param frontSrc - Path to the front motif.
 * @returns The front-face element.
 */
function createCardFrontFace(frontSrc: string): HTMLDivElement {
  const frontFaceEl = document.createElement('div');
  frontFaceEl.className = 'card__face card__face--front';

  const frontEl = document.createElement('img');
  frontEl.className = 'card__front';
  frontEl.src = frontSrc;
  frontEl.alt = '';
  frontFaceEl.append(frontEl);

  return frontFaceEl;
}

/**
 * Builds the full DOM element for a card (back/front in .card__inner,
 * plus the initially invisible match-frame overlay).
 * @param card - The card to render.
 * @returns The finished card element, ready to be appended to the board.
 */
function createCardElement(card: Card): HTMLDivElement {
  const cardEl = document.createElement('div');
  cardEl.className = 'card';
  cardEl.dataset.id = String(card.id);
  cardEl.dataset.pairId = String(card.pairId);

  const innerEl = document.createElement('div');
  innerEl.className = 'card__inner';
  innerEl.append(createCardBackFace(), createCardFrontFace(card.front));

  const matchFrameEl = document.createElement('div');
  matchFrameEl.className = 'card__match-frame';
  cardEl.append(innerEl, matchFrameEl);

  return cardEl;
}

/**
 * Renders the full deck face-down onto the board (replaces existing cards).
 * @param deck - The card deck to render.
 */
function renderBoard(deck: Card[]): void {
  if (!board) return;
  board.replaceChildren();
  deck.forEach((card) => {
    board.append(createCardElement(card));
  });
}

/**
 * Starts a new round: resets theme/score/deck, builds the board and
 * switches from the settings screen to the game screen.
 * @param config - The game configuration chosen in the settings.
 */
function startGame(config: GameConfig): void {
  if (!gameScreen || !board) return;

  applyGameDataset(config);
  markSelfScoreChip(config.playerColor);
  resetScoreboard();
  setCurrentPlayer(config.playerColor);

  currentDeck = buildDeck(config);
  totalPairs = currentDeck.length / CARDS_PER_PAIR;
  renderBoard(currentDeck);

  openCards = [];
  boardLocked = false;

  if (settingsScreen) settingsScreen.hidden = true;
  gameScreen.hidden = false;
}

// -----------------------------------------------------------------------------
// Flip/match interaction.
// Up to two cards can be open at once: click 1 reveals a card, click 2
// compares the pairId. On a match, both stay permanently in the match
// state (.is-matched, see CSS – also shows the themed frame over the
// still-visible card motif and is no longer clickable). On a mismatch,
// both flip back after a short pause automatically. During that pause the
// board is locked so a third card can't jump in.
// -----------------------------------------------------------------------------

// Must match the CSS transition of .card__inner (transform 0.6s), so the
// match frame only appears once the second card has finished flipping.
const FLIP_DURATION_MS = 600;

// Short pause before a mismatch flips back – gives time to memorize
// both motifs.
const MISMATCH_DELAY_MS = 800;

let openCards: HTMLElement[] = [];
let boardLocked = false;
let currentPlayer: PlayerColor = 'blue';
let scores: Record<PlayerColor, number> = { blue: 0, orange: 0 };
let matchedPairs = 0;
let totalPairs = 0;

/**
 * Sets the active player color and reflects it in the "Current player" icon.
 * @param color - The new active color.
 */
function setCurrentPlayer(color: PlayerColor): void {
  currentPlayer = color;
  currentPlayerIcon?.classList.toggle('is-blue', color === 'blue');
  currentPlayerIcon?.classList.toggle('is-orange', color === 'orange');
}

/**
 * Determines the other player color.
 * @param color - The starting color.
 * @returns The opposite color.
 */
function otherPlayer(color: PlayerColor): PlayerColor {
  return color === 'blue' ? 'orange' : 'blue';
}

/**
 * Increases a color's score by one and updates the display.
 * @param color - The color that scores the point.
 */
function addScore(color: PlayerColor): void {
  scores[color] += 1;
  const scoreEl = document.querySelector<HTMLElement>(`.score__value[data-score="${color}"]`);
  if (scoreEl) scoreEl.textContent = String(scores[color]);
}

/**
 * Flips a single open, not-yet-confirmed card back down.
 * @param cardEl - The card to flip back down.
 */
function unflipSingleOpenCard(cardEl: HTMLElement): void {
  cardEl.classList.remove('is-flipped');
  openCards = [];
}

/**
 * Marks a found pair as a permanent match once the flip animation has
 * finished, awards the point and checks whether the game is over.
 * @param first - First card of the pair.
 * @param second - Second card of the pair.
 */
function resolveMatch(first: HTMLElement, second: HTMLElement): void {
  window.setTimeout(() => {
    first.classList.add('is-matched');
    second.classList.add('is-matched');
    addScore(currentPlayer);
    matchedPairs += 1;
    // Match -> the same player continues their turn.
    openCards = [];
    boardLocked = false;

    if (matchedPairs >= totalPairs) endGame();
  }, FLIP_DURATION_MS);
}

/**
 * Flips two non-matching cards back down after a short pause and hands
 * the turn to the other player.
 * @param first - First, non-matching card.
 * @param second - Second, non-matching card.
 */
function resolveMismatch(first: HTMLElement, second: HTMLElement): void {
  window.setTimeout(() => {
    first.classList.remove('is-flipped');
    second.classList.remove('is-flipped');
    setCurrentPlayer(otherPlayer(currentPlayer));
    openCards = [];
    boardLocked = false;
  }, MISMATCH_DELAY_MS);
}

/** Compares the two open cards and triggers a match or mismatch. */
function evaluateOpenCards(): void {
  const [first, second] = openCards;
  boardLocked = true;

  if (first.dataset.pairId === second.dataset.pairId) {
    resolveMatch(first, second);
    return;
  }
  resolveMismatch(first, second);
}

/**
 * Click handler for the board: reveals cards, flips a single open card
 * back down, or triggers the comparison of two open cards.
 * @param event - The click event whose target lies within a card.
 */
function handleBoardClick(event: MouseEvent): void {
  if (boardLocked) return;

  const cardEl = (event.target as HTMLElement).closest<HTMLElement>('.card');
  if (!cardEl || cardEl.classList.contains('is-matched')) return;

  if (cardEl.classList.contains('is-flipped')) {
    if (openCards.length === 1 && openCards[0] === cardEl) unflipSingleOpenCard(cardEl);
    return;
  }

  cardEl.classList.add('is-flipped');
  openCards.push(cardEl);
  if (openCards.length === CARDS_PER_PAIR) evaluateOpenCards();
}

board?.addEventListener('click', handleBoardClick);

/** Reads the settings selection and starts the game once it's complete. */
function handleStartClick(): void {
  const theme = readSelectedTheme();
  const playerColor = readSelectedPlayerColor();
  const boardSize = readSelectedBoardSize();
  if (theme === null || playerColor === null || boardSize === null) return;

  currentGameConfig = { theme, playerColor, boardSize };
  startGame(currentGameConfig);
}

startButton?.addEventListener('click', handleStartClick);

// -----------------------------------------------------------------------------
// Game-over evaluation. The screen ALWAYS shows from Player 1's perspective
// (the color chosen in the settings) - Player 2 (the opponent) is
// automatically the other color and never gets their own screen on a win.
// -----------------------------------------------------------------------------

type GameResult = 'win' | 'lose' | 'draw';

/**
 * Capitalizes the first letter of a text.
 * @param text - The source text.
 * @returns The text with a capitalized first letter.
 */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Determines the result for Player 1 based on both scores.
 * @param player1Score - Player 1's score (chosen color).
 * @param player2Score - Player 2's score (opponent).
 * @returns "win", "lose" or "draw" from Player 1's perspective.
 */
function determineResult(player1Score: number, player2Score: number): GameResult {
  if (player1Score > player2Score) return 'win';
  if (player1Score < player2Score) return 'lose';
  return 'draw';
}

/**
 * Updates the end screen's theme, result state, winner color and score texts.
 * @param config - The current game configuration (for theme/Player 1's color).
 * @param result - The determined result from Player 1's perspective.
 */
function applyEndScreenContent(config: GameConfig, result: GameResult): void {
  if (!endScreen) return;
  endScreen.dataset.theme = config.theme;
  endScreen.dataset.result = result;
  endScreen.classList.toggle('is-blue', result === 'win' && config.playerColor === 'blue');
  endScreen.classList.toggle('is-orange', result === 'win' && config.playerColor === 'orange');

  if (endScreenPlayerColorEl) endScreenPlayerColorEl.textContent = capitalize(config.playerColor);
  if (endScoreBlueEl) endScoreBlueEl.textContent = String(scores.blue);
  if (endScoreOrangeEl) endScoreOrangeEl.textContent = String(scores.orange);
}

/**
 * Ends the current round: determines the result, updates the end screen
 * with its content and switches from the game screen to the end screen.
 */
function endGame(): void {
  if (!currentGameConfig || !gameScreen || !endScreen) return;

  const player1Score = scores[currentGameConfig.playerColor];
  const player2Score = scores[otherPlayer(currentGameConfig.playerColor)];
  const result = determineResult(player1Score, player2Score);

  applyEndScreenContent(currentGameConfig, result);
  gameScreen.hidden = true;
  endScreen.hidden = false;
}

// "Back to start" / "Home": back to the home screen, regardless of the result.
endScreen?.addEventListener('click', (event) => {
  if (!(event.target as HTMLElement).closest('[data-end-action="restart"]')) return;
  endScreen.hidden = true;
  if (homeScreen) homeScreen.hidden = false;
  if (homeWatermark) homeWatermark.hidden = false;
});

// -----------------------------------------------------------------------------
// Exit game -> show the quit popup (image comes from CSS based on
// data-theme). Only confirming leads back to the settings view.
// -----------------------------------------------------------------------------

/** Closes the quit-confirmation popup without leaving the game. */
function closeQuitPopup(): void {
  if (quitPopup) quitPopup.hidden = true;
}

/** Leaves the current game and returns to the settings view. */
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

// Clicking the dimmed background closes the popup (= "stay in the game").
quitPopup?.addEventListener('click', (event) => {
  if (event.target === quitPopup) closeQuitPopup();
});

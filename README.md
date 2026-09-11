# Memory Game

A browser-based memory (card-matching) game built with TypeScript, SCSS and Vite — no framework, no backend.

---

## Deutsch 🇩🇪

### Beschreibung
Ein klassisches Memory-Spiel im Browser für zwei Spieler (Blue und Orange). Auf dem Home-Screen startet man ins Spiel, wählt in den Settings Theme, eigene Spielerfarbe und Board-Größe aus und spielt anschließend gegeneinander, bis alle Kartenpaare gefunden sind.

### Verwendete Technologien
- **HTML** – statisches Grundgerüst (`index.html`), alle Screens liegen als Sektionen darin und werden per `hidden`-Attribut ein-/ausgeblendet
- **SCSS** – Styling nach 7-1-Pattern (abstracts, base, layout, components, pages)
- **TypeScript** – gesamte Spiel-/UI-Logik in `src/main.ts`
- **Vite** – Dev-Server und Build-Tool

### Spielablauf
1. Home-Screen: "Ready to play?" → Klick auf **Play**
2. Settings: Theme, Spielerfarbe und Board-Größe wählen – der **Start**-Button aktiviert sich erst, wenn alle drei Optionen gesetzt sind
3. Game-Screen: Karten aufdecken, Paare finden, Punkte sammeln
4. Sobald alle Paare gefunden sind, erscheint automatisch der End-Screen (Winner, Game Over oder Draw)
5. Über den Button im End-Screen geht es zurück zum Home-Screen

### Verfügbare Themes
- **Code vibes** – dunkles, türkis-grünliches Design
- **Gaming** – petrolfarbenes Design mit pinken Akzenten

Jedes Theme hat eigene Kartenrückseiten/-vorderseiten, einen eigenen Header-Stil sowie eigene Winner-/Game-Over-/Draw-Screens.

### Board-Größen
16, 24 oder 36 Karten (4-spaltiges bzw. 6-spaltiges Grid).

### Spieler-Auswahl
In den Settings wird eine Farbe gewählt – **Blue** oder **Orange**. Diese Farbe ist "Player 1"; die jeweils andere Farbe ist automatisch der Gegner ("Player 2"). Im Spiel sind immer beide Farben mit eigener Punkteanzeige aktiv.

### Match- und Score-System
- Klick auf eine Karte deckt sie auf; bei der zweiten offenen Karte wird verglichen
- **Treffer:** Beide Karten bleiben dauerhaft aufgedeckt (themenfarbiger Rahmen), der aktuelle Spieler bekommt einen Punkt und ist weiter am Zug
- **Kein Treffer:** Beide Karten klappen nach kurzer Pause wieder zu, der Zug geht an den anderen Spieler
- Die Punktestände beider Spieler werden im Header live angezeigt

### Winner-, Game-Over- und Draw-Screen
Der End-Screen zeigt sich immer aus Sicht von Player 1 (der gewählten Farbe):
- **Winner:** mehr Punkte als der Gegner → "The winner is …" mit Spieler-Icon/Pokal
- **Game over:** weniger Punkte als der Gegner → Endstand beider Spieler, kein eigener Screen für den Gegner
- **Draw:** gleich viele Punkte → "It's a DRAW" mit Waage-Icon

### Responsives Verhalten
Das Layout funktioniert ab einer Bildschirmbreite von 320px ohne horizontales Scrollen und passt sich bis 1440px stufenlos an; darüber bleibt die Desktop-Größe erhalten. Der Hintergrund füllt dabei immer die komplette Bildschirmfläche.

### Projektstruktur
```
index.html              # alle Screens (Home, Settings, Game, End-Screen)
src/
  main.ts                # gesamte Spiel-/UI-Logik
  styles/
    main.scss             # zentraler SCSS-Einstiegspunkt
    abstracts/             # Variablen
    base/                  # globale Basis-Styles
    layout/                # Bühnen-Layout (.page/.stage)
    components/             # Button, Radio, Gamepad-Wasserzeichen
    pages/                  # Home, Settings, Game, End-Screen
public/
  assets/
    theme1/                # Code-vibes-Grafiken
    theme2/                # Gaming-Grafiken
    shared/                 # themenübergreifende Grafiken/Icons
```

### Installation und Start
```bash
npm install     # Abhängigkeiten installieren
npm run dev      # Dev-Server starten
npm run build    # Produktions-Build erstellen
npm run preview  # Build lokal ansehen
```

### npm Scripts (aus package.json)
| Script | Beschreibung |
| --- | --- |
| `dev` | Startet den Vite-Dev-Server |
| `build` | TypeScript-Check (`tsc -noEmit`) + Produktions-Build mit Vite |
| `preview` | Zeigt den erstellten Build lokal an |

---

## English 🇬🇧

### Description
A classic browser-based memory (card-matching) game for two players (Blue and Orange). Start on the home screen, choose theme, your player color and board size in the settings, then play against each other until every pair is found.

### Technologies Used
- **HTML** – static markup (`index.html`); every screen is a section, shown/hidden via the `hidden` attribute
- **SCSS** – styling using the 7-1 pattern (abstracts, base, layout, components, pages)
- **TypeScript** – all game/UI logic lives in `src/main.ts`
- **Vite** – dev server and build tool

### Game Flow
1. Home screen: "Ready to play?" → click **Play**
2. Settings: choose theme, player color and board size – the **Start** button only activates once all three are selected
3. Game screen: flip cards, find pairs, score points
4. Once all pairs are found, the end screen (Winner, Game Over or Draw) appears automatically
5. The button on the end screen returns to the home screen

### Available Themes
- **Code vibes** – dark, teal/green design
- **Gaming** – petrol-colored design with pink accents

Each theme has its own card backs/fronts, header style, and its own Winner/Game Over/Draw screens.

### Board Sizes
16, 24 or 36 cards (4-column or 6-column grid).

### Player Selection
In the settings you choose one color – **Blue** or **Orange**. That color becomes "Player 1"; the other color automatically becomes the opponent ("Player 2"). Both colors are always active in-game with their own score.

### Match and Score System
- Clicking a card flips it; the second open card triggers a comparison
- **Match:** both cards stay permanently revealed (themed match frame), the current player scores a point and continues their turn
- **No match:** both cards flip back after a short delay and the turn passes to the other player
- Both players' scores are shown live in the header

### Winner, Game Over and Draw Screen
The end screen always shows from Player 1's perspective (the chosen color):
- **Winner:** more points than the opponent → "The winner is …" with a player icon/trophy
- **Game over:** fewer points than the opponent → final score for both players, no separate screen for the opponent
- **Draw:** equal points → "It's a DRAW" with a scale icon

### Responsive Behavior
The layout works from 320px screen width upward without horizontal scrolling and scales fluidly up to 1440px; above that, the desktop size is kept fixed. The background always fills the entire viewport.

### Project Structure
```
index.html              # all screens (Home, Settings, Game, End-Screen)
src/
  main.ts                # all game/UI logic
  styles/
    main.scss             # central SCSS entry point
    abstracts/             # variables
    base/                  # global base styles
    layout/                # stage layout (.page/.stage)
    components/             # button, radio, gamepad watermark
    pages/                  # home, settings, game, end-screen
public/
  assets/
    theme1/                # Code-vibes graphics
    theme2/                # Gaming graphics
    shared/                 # cross-theme graphics/icons
```

### Installation and Start
```bash
npm install     # install dependencies
npm run dev      # start the dev server
npm run build    # create a production build
npm run preview  # preview the build locally
```

### npm Scripts (from package.json)
| Script | Description |
| --- | --- |
| `dev` | Starts the Vite dev server |
| `build` | Type-checks (`tsc -noEmit`) and creates a production build with Vite |
| `preview` | Serves the production build locally |

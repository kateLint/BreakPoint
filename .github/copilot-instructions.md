# Copilot Instructions for BreakPoint

Use this as working knowledge for coding agents in this repo. Keep edits concise and aligned with existing patterns.

## Architecture & Views
- Single-page PWA served statically; routing is manual via `ViewManager.show`/`goBack` toggling `.view` elements (`index.html`). Hidden states use Tailwind’s `hidden` class.
- Core controllers: `js/app.js` wires view navigation, poll logic, and imports component modules (`DrinkWheel`, `FoodWheel`, `SwipeVoting`). Initialization happens on `DOMContentLoaded`.
- UI built with Tailwind CDN + custom CSS tokens (`css/main.css`, `wheel.css`, `swipe.css`, `animations.css`); icons via Lucide CDN; fonts Outfit/Inter via Google Fonts.
- Wheels use `<canvas>` with gradient slices: `js/components/DrinkWheel.js` and `FoodWheel.js` share the same pointer math (offset by slice/2 + π/2). Keep this consistent when adding options.
- Swipe voting is DOM-driven, no framework (`SwipeVoting.js`). Cards are absolutely positioned; swipe logic attaches per-card drag handlers and advances the stack.
- Poll in `app.js` is minimal mock data; there is a second legacy poll in `FoodDecider.js` with timers/confetti (uses `createConfetti`); prefer one source before extending.
- Animation helpers live in `js/utils/animations.js` (confetti expects a `#confettiCanvas` container in DOM; many helpers assume classes defined in `animations.css`).
- AI integration stub in `js/services/ai.js` for Gemini 2.5 Flash preview; `setApiKey` must be called to avoid mock responses. Mock returns structured JSON for restaurant lists and fallback strings otherwise.

## Data & State
- Global state is light: `AppState` (currentView, currentUser, selectedDrink). Component modules store their own module-level state (rotation angles, votes, timers). Avoid global window state beyond existing exports (spin functions exposed for debug).
- Restaurant/drink options are plain arrays at top of each module; updating options requires redrawing wheels or reinitializing views (call `initializeWheel()`/`initializeFoodWheel()` after changes).
- Swipe votes stored in `swipeVotes`; currently winner logic is stubbed (alerts). If adding persistence, thread it through `initializeSwipeVoting` and `swipeCard`.

## UX/Interaction Patterns
- Canvas wheels start at top (pointer 270°) with half-slice offset; maintain when changing slice counts to keep pointer alignment.
- Haptics and vibrations are optional (`navigator.vibrate` checks). Preserve guards when modifying spin loops.
- Result overlays (`wheelResult`, `foodWheelResult`) are shown by removing `hidden`; reset functions re-hide overlays and clear AI text.
- AI UI: Drink wheel has “Generate Hype Message” button and copy action; swipe view has toggleable “AI Lunch Curator” input (`#aiInputPanel`, `#generateCardsButton`).

## Assets & Styling
- Design tokens and gradients in `css/main.css`; use CSS variables for new colors. Specialized styles: `wheel.css`, `swipe.css`, `animations.css` for motion effects. Tailwind utility classes are heavily used inline in HTML.
- Confetti particles are absolutely positioned; ensure `#confettiCanvas` exists if you invoke `createConfetti()`.

## PWA & Offline
- PWA manifest at `manifest.json`; theme/background colors are set there. Service worker caches fixed file list in `service-worker.js` (`CACHE_NAME = 'breakpoint-v12'`). Bump `CACHE_NAME` and list when adding JS/CSS/assets so clients pick updates.

## Running & Debugging
- No build step; run a static server from repo root (e.g., `python3 -m http.server 8000` or `npx http-server -p 8000`) and open `http://localhost:8000`.
- Browser console logs init flow; most interactions are DOM-driven. Lucide icons may need `lucide.createIcons()` rerun if you inject new icons after load.
- Tests are absent; manual QA via browser. Keep code ES modules friendly (imports use relative paths from `js/`).

## Extending Safely
- When adding features, hook into existing view IDs; prefer new modules under `js/components/` or utilities under `js/utils/` to match structure.
- Preserve inline accessibility: buttons rely on click handlers; add focus states via Tailwind if introducing custom elements.
- If integrating real backend/Firebase, thread asynchronous calls through existing view flows without blocking spin/swipe animations.

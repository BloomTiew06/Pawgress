# Pawgress

A hand-drawn pet that grows when you keep your habits, and is always happy to see you come back.

Pick a cat, pup, bunny or bear cub, choose a few daily habits, and check them in as you go. Your friend's mood follows how the last few days went, it grows through four life stages, and every milestone becomes a page in its scrapbook. Missed days make it sad and pause its growth, but it never runs away, and doing one small thing today always lifts its mood.

## Run it

```bash
npm install
npm run dev       # local dev server
npm test          # engine unit tests
npm run build     # typecheck + production build into dist/
```

Everything is stored in the browser on your device. There's no account and no server.

## Trying it quickly

The **Time travel** panel on the Today screen (also under Settings) lets you skip days or load a ready-made history:

- **Two good weeks**: a happy Teen with a streak and treats to spend
- **Missed 3 days**: a sad pet; log any habit to see the welcome back
- **One step from Grown**: one more check-in and it grows up
- **Fresh start**: just adopted

## How it's built

```
React app (screens, forms, buttons)
   │ reads                 ▲ actions
   ▼                       │
Store (Zustand + localStorage): habits, check-ins, spending
   │
   ▼
Pet engine (pure TypeScript): (state, today) → mood, stage, treats, memories, reactions
   │ PetView               ▲ pet taps
   ▼                       │
PetStage (PixiJS canvas): layered rig, boiling-ink filter, particles, toys, Starfall
```

- **`src/engine/`**: the rules. Nothing stores mood or growth; it's always derived from the check-in log, which is what makes time travel and testing simple. Covered by unit tests.
- **`src/art/`**: the Storybook Ink art. Every animal is one shared body plus swappable ear, tail and marking layers, drawn as SVG.
- **`src/pet/`**: PixiJS. The art becomes textures on a small rig (ears, tail and body move independently), with a displacement filter that redraws the ink lines a few times a second.
- **`src/styles/tokens.css`**: the design system tokens (paper and ink colors, mood colors, hand-lettered type, uneven "hand-cut" corners, printed ink-offset shadows, motion).
- **`src/components/`** and **`src/screens/`**: the React UI.

## The rules

| | |
|---|---|
| Good day | At least half of the day's habit progress done |
| Missed day | Under a quarter done |
| Mood | Last five days, weighted toward yesterday. Anything done today can only raise it |
| Growth | Baby → Kid (3 good days) → Teen (10) → Grown (21). Never goes backwards |
| Treats | One per finished habit, plus one for finishing them all |
| Play | Petting is free. Ball or bubbles cost 1 treat, Starfall costs 2 |

## Accessibility

Every pet interaction is also a regular button. The canvas has a text description that follows the pet's mood and stage, the pet's lines are announced politely, Starfall works with arrow keys, and idle motion and the ink wobble turn off with reduced motion settings.

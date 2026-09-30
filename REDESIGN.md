# Econva Mobile — UI Redesign Guidelines

This document defines the rules, constraints, and visual direction for the complete UI redesign of the Econva mobile application.

---

## 1. Non-Negotiable Rules

These rules take absolute priority. No visual redesign effort may violate them.

1. **NEVER change business logic.** All calculations, data transformations, validation rules, and business workflows must remain identical.
2. **NEVER change API endpoints, request/response contracts, authentication logic, or API services.** The HTTP layer is frozen.
3. **NEVER change navigation behavior or navigation routes unless explicitly requested.** Stack structure, tab structure, route names, and params stay as-is.
4. **NEVER remove existing functionality.** Every screen, feature, and interaction that exists today must continue to exist.
5. **NEVER change data models or types unless strictly required for a visual implementation.** The `src/types/` definitions are the source of truth.
6. **NEVER modify the backend.** This repository is the mobile client only.
7. **NEVER introduce mock data to replace real data.** All data must come from the real API.
8. **NEVER rewrite working functionality just for stylistic reasons.** If it works, leave the logic alone.
9. **Preserve the current Expo/React Native architecture whenever possible.** Do not migrate frameworks or restructure the app architecture.
10. **Before making large structural changes, inspect the existing implementation and reuse existing components where appropriate.**

---

## 2. Dependencies and Libraries

### Current Stack

The app uses Expo SDK 57, React Native 0.86, React 19.2, and React Navigation 7. This stack is fixed.

### Adding New Dependencies

Additional libraries **are allowed** when they meaningfully improve the visual implementation, styling system, animations, icons, charts, typography, or overall UI quality.

Before installing a new dependency, evaluate:

- [ ] Does an existing dependency already provide this functionality?
- [ ] Is the library well-maintained and widely adopted in the React Native / Expo ecosystem?
- [ ] Is it compatible with Expo SDK 57 and React Native 0.86?
- [ ] Does it solve a real visual/UX problem, or is it convenience-only?
- [ ] Does it avoid replacing the existing architecture unnecessarily?

### Permitted Categories

| Category | Examples |
|---|---|
| Styling and design systems | NativeWind, Tamagui, Dripsy |
| UI component libraries | React Native Paper (already installed), Tamagui |
| Animations and micro-interactions | Reanimated (already included with Expo), Lottie |
| Icons | @expo/vector-icons (already installed) |
| Typography | @expo-google-fonts/*, expo-font |
| Charts and data visualization | react-native-svg-charts, victory-native, react-native-gifted-charts |
| Gradients and visual effects | expo-linear-gradient, expo-blur |
| Gestures | react-native-gesture-handler (already included with Expo) |
| Haptics | expo-haptics |

### Dependency Decision Rule

> If the same result can be achieved cleanly with the existing stack, do not install a new library.

When a new dependency is introduced, document:
- **Why it was chosen**
- **What problem it solves**
- **What it replaces (if anything)**

---

## 3. Visual Direction

### Brand Identity

Econva is a **modern, premium, trustworthy** financial product. The visual identity should communicate:

- **Trust** — clean, precise, reliable
- **Clarity** — financial data is immediately scannable
- **Sophistication** — refined details, not flashy gimmicks
- **Calm** — the user is managing money; the UI should reduce anxiety, not create it

### What to Avoid

| Do Not | Why |
|---|---|
| Generic AI-generated UI | Feels soulless and templated |
| Generic banking-app templates | Econva should feel unique |
| Excessive cards | Creates visual monotony and clutter |
| Excessive gradients | Looks cheap and dates quickly |
| Excessive shadows | Creates visual noise and muddies hierarchy |
| Excessive rounded elements | Every corner the same radius looks lazy |
| Visual clutter | Financial data needs whitespace to breathe |
| Unnecessary animations | Distracts from the core task |
| Emojis as UI elements | Unprofessional; use icon library |

### What to Prefer

| Do | Why |
|---|---|
| Strong visual hierarchy | Guides the eye to what matters first |
| Clean layouts | Reduces cognitive load |
| Consistent spacing | Creates rhythm and order |
| Carefully selected typography | Numbers are the hero; type must serve them |
| Subtle borders and shadows | Defines surfaces without shouting |
| Consistent iconography | One icon family, consistent sizing |
| Clear financial data visualization | Charts and numbers must be instantly readable |
| Refined empty, loading, error, and success states | These are part of the product experience |
| Purposeful micro-interactions | Feedback that feels responsive, not decorative |

### Iconography

- Use **Ionicons** (already available via `@expo/vector-icons`) as the primary icon family.
- Consistent icon sizing: 16 (inline), 20 (list items), 24 (headers), 28+ (hero/empty states).
- Use `outline` variant for inactive/default, `filled` for active/selected.
- Never use emojis as UI elements.

---

## 4. Design System

### Design Tokens

**Status: implemented.** The design system was built with a layered architecture
so that the authentication experience and the authenticated application cannot
drift apart. The authentication screens defined the identity; everything else
is derived from the same primitives.

```
src/theme/foundation.ts   raw, shared primitives — the single source of truth
src/theme/auth.ts         the authentication expression (re-exports the foundation)
src/theme/app.ts          the authenticated application expression
src/theme/appLayout.ts    screen-level constants
```

#### Foundation (`src/theme/foundation.ts`)

One dark canvas, one accent hue, one type scale, one spacing grid:

- **Canvas** `#07080B` — depth is expressed with light and surface contrast,
  never with heavy drop shadows.
- **Surfaces** translucent (`rgba(255,255,255,0.04)`) so the backdrop reads
  through the UI.
- **Accent** a single hue: `#3C68F0`, with `#5A83FF` for highlights and
  `#2544C0` for depth. Used for primary actions, focus, selected state and
  progress. Nothing else.
- **Semantic colour** is reserved for financial direction: income, expense,
  warning, neutral. It never becomes decoration.
- **Type scale** 4px-based spacing, 8 radius steps, sizes from `11` (eyebrow) to
  `42` (Welcome hero).
- **Motion** a shared stagger constant, an easing breath for ambient artwork
  and a duration for progress fills. Every animation yields to the system
  Reduce Motion setting.

#### Application tokens (`src/theme/app.ts`)

Adds the roles the authenticated app needs on top of the foundation:

| Role | Size | Use |
|---|---|---|
| `hero` | 42/46/800 | Welcome headline only |
| `screenTitle` | 30/36/700 | Screen titles |
| `section` | 18/24/700 | Section titles |
| `value` | 36/42/800 | The single most important number on a screen |
| `valueLarge` | 26/32/800 | Secondary money: goal totals, account balances |
| `statValue` | 21/27/800 | Figures inside two-up stat tiles |
| `amount` | 15/20/700 | Money in rows and lists |
| `amountHero` | 34/40/800 | Money at the centre of a detail screen |

All money variants use tabular numerals, applied by `AppText` from a single
place rather than repeated per component.

### Reusable Components

All components live in `src/components/`, in three layers:

| Layer | Purpose |
|---|---|
| `ui/` | Primitives shared by every surface: `Backdrop`, `Button`, `Field`, `Link`, `Logo`, `Orbit`, `Progress`, `SectionLabel`, `useEntrance` |
| `app/` | The authenticated application: `AppText`, `Screen`, `ScrollScreen`, `AppHeader`, `Surface`, `ListRow`, `Section`, `Metric`, `Stat`, `StatGrid`, states |
| `auth/` | The authentication experience: `AuthScreen`, `AuthGroup`, and the shared primitives re-exported under the names that journey uses |

Every component must:

- Use design tokens (no hardcoded values)
- Use `AppText` rather than a bare `Text`, so type and colour stay consistent
- Have proper TypeScript props with defaults
- Be accessible (`accessibilityLabel`, `accessibilityRole` where appropriate)
- Respect the system Reduce Motion setting

### Component API Principles

- **Composition over configuration** — small, composable components rather than one giant configurable component.
- **Consistent sizing** — every interactive element has sm/md/lg sizes that map to the spacing scale.
- **Consistent spacing** — internal padding uses spacing tokens, not magic numbers.
- **Accessible by default** — touch targets minimum 44x44dp.

---

## 5. Redesign Strategy

### Order of Operations

Do **not** redesign everything blindly in one step. Follow this sequence:

#### Phase 1: Foundation

1. **Create the design token system** (`src/theme/`)
2. **Build the component library** (`src/components/`)
3. **Verify** — ensure all tokens and components work in isolation

#### Phase 2: Screen Refactoring

4. **Refactor screens one at a time**, starting with the most visible:
   - Dashboard (most complex, most visible)
   - Transactions (most used)
   - Goals
   - Profile
   - Login / Register
   - Transaction Details
   - Create Transaction
   - Goal Details
   - Create Goal
   - Connect Bank
5. **After each screen**, verify functionality is intact

#### Phase 3: Polish

6. **Add micro-interactions** — button press states, screen transitions, number animations
7. **Refine empty/loading/error states** across all screens
8. **Accessibility audit** — labels, roles, touch targets, dynamic type
9. **Performance check** — memoization, list optimization, re-render audit

### Screen Refactoring Checklist

For each screen, before modifying:

- [ ] Read and understand the current screen implementation
- [ ] Identify all data sources and state
- [ ] Map current visual elements to new design system components
- [ ] Identify what can be reused vs. what needs rebuilding
- [ ] Note any business logic that must be preserved exactly

After modifying:

- [ ] Verify all data still loads correctly
- [ ] Verify all buttons/actions still work
- [ ] Verify navigation still works (push, replace, goBack)
- [ ] Verify loading states display correctly
- [ ] Verify empty states display correctly
- [ ] Verify error handling still works
- [ ] Run `npx tsc --noEmit` — no type errors
- [ ] Run `npx expo lint` — no lint errors

---

## 6. Architecture Constraints

### What Stays the Same

| Layer | Constraint |
|---|---|
| Navigation | Stack + Tab structure, route names, params — unchanged |
| API | `apiClient.ts`, all `api/*.ts` files — unchanged |
| Services | `openFinanceService.ts` — unchanged |
| Types | `src/types/*.ts` — unchanged |
| Utils | `src/utils/*.ts` — unchanged |
| Auth | SecureStore token, login/register flow — unchanged |
| Expo config | `app.json` plugins, orientation, package — unchanged |

### What Changes

| Layer | Change |
|---|---|
| `src/theme/` | **New** — design tokens |
| `src/components/` | **Expanded** — reusable component library |
| `src/screens/*` | **Refactored** — visual redesign using new components |
| `src/navigation/TabNavigator.tsx` | **Refactored** — visual restyle of tab bar |
| `App.tsx` | **Possibly updated** — if theme provider is needed |

---

## 7. Quality Gates

Before declaring any redesign task complete:

1. **Type check:** `npx tsc --noEmit` passes
2. **Lint:** `npx expo lint` passes
3. **Functionality:** All existing features work identically
4. **Visual consistency:** All screens use design tokens, no hardcoded values
5. **Accessibility:** Interactive elements have labels, touch targets >= 44dp
6. **Performance:** No unnecessary re-renders, lists are optimized

---

## 8. Design Principles Summary

```
1. Numbers are the hero — typography serves financial data
2. Whitespace is a feature — clutter is the enemy
3. Consistency builds trust — every screen feels like the same product
4. Subtlety is sophistication — no loud gradients or heavy shadows
5. Every pixel has purpose — if it doesn't serve the user, remove it
6. Logic is sacred — visual changes never touch business logic
```

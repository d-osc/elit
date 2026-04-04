# Native CSS Support

Elit's native renderer maps a practical subset of CSS into Jetpack Compose and SwiftUI output. It is useful for real mobile UI work, but it is not a browser-complete CSS engine.

This document reflects the current renderer behavior in [../src/native.ts](../src/native.ts) and [../src/style.ts](../src/style.ts), with regression coverage in [../testing/unit/native.test.ts](../testing/unit/native.test.ts).

Validation command:

```bash
bun test testing/unit/native.test.ts
```

## Current Status

The current target is best described as a stable CSS subset for native generation.

It already covers many common app patterns:

- typography-heavy screens
- cards, pills, panels, and form fields
- responsive mobile shells
- button rows and stacked layouts
- simple grid-like two-column sections
- shared styling across hybrid and native mobile flows

## Supported Well

| Area | Current support | Notes |
| --- | --- | --- |
| Typography | `color`, `fontSize`, `fontWeight`, `fontFamily`, `letterSpacing`, `lineHeight`, `textAlign`, `textTransform`, `textDecoration` | `fontFamily` currently maps into platform font buckets rather than loading custom fonts directly |
| Sizing | `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`, plain `%` sizing, `100%` fill, `aspectRatio` | Percentages are resolved against propagated native parent space or viewport fallbacks rather than a full browser layout engine |
| Units | `px`, `dp`, `pt`, `sp`, `rem`, `em`, `vw`, `vh`, `vmin`, `vmax` | Viewport units are resolved against native viewport defaults |
| Numeric CSS functions | `calc()`, `clamp()`, `min()`, `max()` | `calc()` currently handles additive and subtractive length expressions |
| Box model | `padding`, directional padding, margin translation, horizontal auto margins for constrained shells | Margin is translated into outer spacing rather than a full browser margin model |
| Surfaces | `backgroundColor`, `linear-gradient`, practical mixed `background-image` plus `linear-gradient(...)` layers with comma-separated multi-layer support, `backgroundSize`, `backgroundPosition`, and `backgroundRepeat` subset including practical `background` shorthand parsing plus `repeat`, `repeat-x`, `repeat-y`, and `no-repeat`, `border`, `borderRadius`, practical multi-shadow `boxShadow`, `overflow: hidden` clipping subset, backdrop blur approximation | Background layering is intentionally practical rather than browser-complete, especially for advanced gradient types, repeat fidelity, and platform differences |
| Flex-style layout | `display: flex`, `flexDirection`, practical `alignItems` start/center/end plus explicit stretch and partial default-stretch subset, `justifyContent`, `gap`, `rowGap`, `columnGap`, `flex`, common `flex` shorthand for grow/shrink/basis, `flexGrow`, `flexWrap` subset, `order`, `flexBasis`, practical `flexShrink` subset with sibling-aware negotiation for basis and explicit main-axis sizes in explicit-size containers, `alignSelf` start/center/end/stretch subset, plus practical wrapped-stack `alignContent` / `placeContent` start/center/end/stretch and `space-between` / `space-around` / `space-evenly` subset | Good for common row and column layouts; Compose uses `weight(...)` and SwiftUI uses frame plus `layoutPriority(...)` approximations for flex growth |
| Grid-style layout | `display: grid`, `gridTemplateColumns`, `gridTemplateRows`, practical fixed-length, clamped `minmax(min, max)` rows including `minmax(auto, max)` max-only clamps, direct intrinsic row keywords `min-content` / `max-content` through a preferred-content height heuristic, `fit-content(...)`, and simple `fr` / `minmax(..., fr)` row-track sizing, practical explicit and implicit column sizing through fixed lengths, direct intrinsic column keywords `min-content` / `max-content` through a preferred-content width heuristic, clamped `minmax(min, max)`, `fit-content(...)`, and `fr` tracks, practical numeric and named-line `gridColumn` / `gridRow` placement including repeated named-line ordinals and negative line references such as `foo 2`, `2 foo`, `foo -1`, `-1 foo`, and `-1`, numeric-or-span and named-area `gridArea` placement through `gridTemplateAreas`, practical grid item alignment through `justifyItems` / `justifySelf` plus grid-aware `alignItems` / `alignSelf` and `placeItems` / `placeSelf` shorthands, plus practical wrapped-stack and single-row grid `alignContent` / `placeContent` start/center/end/stretch and `space-between` / `space-around` / `space-evenly` subset including stretch of auto row tracks, suppression of outer content packing when weighted rows already consume free space, explicit spanning-height hints into mixed fixed/auto rows, and spanning-width hints that can raise mixed fixed/clamped/flexible column minimums while accounting for internal gaps | Rendered as weighted native rows rather than a full browser grid engine |
| Form primitives | text inputs, textarea hints, checkbox to native toggle | Native field chrome is intentionally neutralized to preserve authored styling |
| Layering and effects | `opacity`, `zIndex`, `transform` subset for `translate`, `scale`, and `rotate` | Native modifier mapping is practical, not a browser stacking-context implementation |
| Native interaction bridge | external links, downloadable links, route dispatch, action metadata | Shared source can target native navigation, native downloads, and native actions |

## Supported with Limits

| Area | Current behavior | Important limit |
| --- | --- | --- |
| Selectors | tag, class, id, attribute, descendant, child, adjacent sibling, and general sibling combinators | No full browser selector engine |
| Pseudo-classes | `:checked`, `:disabled`, `:enabled`, `:selected`, `:required`, `:optional`, `:invalid`, `:valid`, `:read-only`, `:read-write`, `:placeholder-shown`, `:focus`, `:focus-visible`, `:focus-within`, `:active`, `:empty`, `:first-child`, `:last-child`, `:only-child`, `:first-of-type`, `:last-of-type`, `:only-of-type`, practical `:nth-child(...)`, `:nth-last-child(...)`, `:nth-of-type(...)`, and `:nth-last-of-type(...)` subsets, plus practical `:not(...)` and `:has(...)` subsets with selector lists, nested simple selector arguments, descendant chains, and leading `>`, `+`, and `~` relative matching including chained sibling-descendant combinations | `:focus`, `:focus-visible`, and `:focus-within` currently track explicit focus signals on practical native focus targets such as text inputs, buttons, links, toggles, pickers, and opt-in `tabIndex` / editable elements rather than live runtime focus changes; `:enabled` currently covers generated native buttons plus form controls; `:active` still relies on explicit `active`, `pressed`, and `aria-pressed` signals for generic elements, but generated native buttons and links can now also emit runtime press-state variants when authored active styles differ; `:empty` reflects the transformed native child tree; validation pseudos currently reflect the native required/value/type/pattern/length/min-max-step subset and exclude disabled controls from automatic valid/invalid derivation; edit-state pseudos are currently scoped to generated text inputs and textareas; and full browser relative selector semantics remain partial |
| Media queries | `min-width`, `max-width`, `prefers-color-scheme`, `prefers-reduced-motion` | Native resolution path does not evaluate every CSS query type |
| Cascade layers | `@layer` rules are evaluated in native style resolution | Layered and unlayered rules still use grouped native ordering rather than full source-order fidelity |
| Supports queries | `@supports` works for a practical feature subset such as `display: grid` and `backdrop-filter: blur(...)` | Native feature detection is a renderer capability check, not a browser engine check |
| Container queries | named and unnamed width-based `@container` queries support `min-width` and `max-width` subset | Container width is approximated from native layout sizing rather than full browser intrinsic sizing |
| Percentage sizing | plain `%` width and height values on native sizing props | Nested percentages rely on propagated native available space rather than full browser containing-block calculation |
| Color parsing | hex, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, modern space-separated and slash-alpha `rgb()` / `hsl()` forms, the full CSS named-color table including aliases such as `darkslategrey`, `magenta`, and `rebeccapurple`, plus `currentColor` across inherited text, backgrounds, borders, gradients, and shadows | Full CSS Color 4 coverage beyond this practical subset is still partial |
| Cross-axis stretch | explicit `alignItems: stretch` and `alignSelf: stretch` stretch auto-sized flex children across row and column cross-axes, and row flex containers now approximate the browser default stretch behavior when they have an explicit cross-axis size | Baseline self-alignment now counts as an explicit override, so row stretch no longer force-fills those children, but full browser baseline semantics are still partial |
| Baseline alignment | row flex containers support `alignItems: baseline` and `alignItems: last baseline` for text-heavy layouts, and direct text flex children can request `alignSelf: baseline` or `alignSelf: last baseline` | Compose currently maps first and last baseline to the same text baseline modifier, while non-text children remain approximate |
| Self alignment | `alignSelf` start, center, end, and stretch on flex children, a practical grid-item `alignSelf` / `justifySelf` subset with `placeSelf`, plus a direct-text baseline subset in row layouts | Full baseline and browser-complete grid self-alignment semantics are not fully mapped |
| Flex shrinking | `flexBasis`, common `flex` shorthand values, and explicit main-axis `width` or `height` with positive shrink now negotiate sibling max-size hints inside explicit main-axis containers, while `flexShrink: 0` keeps a pinned size and authored min constraints still clamp redistribution | This is still a practical heuristic rather than a full intrinsic flexbox negotiation algorithm |
| Positioning | `position: relative`, `position: absolute` for non-screen containers, and `position: fixed` for direct screen children with directional offsets | Sticky behavior and broader containing-block rules remain approximate |
| Font families | serif, sans, monospace, cursive, rounded-like buckets | No custom font asset loading or exact browser stack resolution |
| Borders | shorthand `border` parsing, uniform `borderWidth`/`borderColor`/`borderStyle`, practical dashed and dotted border approximation, uniform per-side border longhands when they collapse to a single stroke, and practical non-uniform per-side solid, dashed, and dotted borders rendered as edge lines or overlay strokes with corner-aware join insets and improved line-cap dash rendering | Rounded corners and richer border styles still remain approximate |
| Overflow | `overflow: hidden` and `overflow: clip` map to native clipping | Axis-specific overflow behavior and scroll containers are not fully mapped |
| Transforms | `translate`, `scale`, and `rotate` map to native view transforms | Transform order, transform-origin, skew, matrix, and percentage-based translation are not fully mapped |
| Shadows | practical multiple `box-shadow` layers, with positive spread folded into blur and inset entries ignored rather than rendered as misleading outer shadows | Native output is still an approximation rather than browser shadow geometry |
| Gradients | `linear-gradient(...)` | No radial gradients, conic gradients, or stop-position fidelity |
| Grid | explicit `fr` tracks and `repeat(...)` subset, practical `gridTemplateRows` fixed-length, clamped `minmax(min, max)` rows including `minmax(auto, max)`, direct intrinsic `min-content` / `max-content` row keywords via a preferred-content heuristic, `fit-content(...)`, and simple `fr` / `minmax(..., fr)` row sizing, practical `gridTemplateColumns` and `gridAutoColumns` fixed-length, direct intrinsic `min-content` / `max-content` column keywords via a preferred-content heuristic, clamped `minmax(min, max)`, `fit-content(...)`, and `fr` sizing, simple numeric and named-line `gridColumn` / `gridRow` line or span placement including positive and negative repeated named-line ordinals plus negative numeric line indexes, numeric-or-span and named-area `gridArea` placement, practical `gridAutoFlow` row, row-dense, and explicit-row-count column subsets for auto-placed items, practical definite `gridAutoRows` track sizing including fixed, `fit-content(...)`, direct intrinsic rows, and simple flexible rows plus matching explicit and implicit column clamps, explicit spanning-height hints that can raise mixed fixed/auto row minimums, spanning-width hints that can raise mixed fixed/clamped/flexible column minimums while accounting for internal gaps, plus practical grid item alignment through `justifyItems` / `justifySelf` and grid-aware `alignItems` / `alignSelf` with `placeItems` / `placeSelf`, and practical wrapped-stack plus single-row grid `alignContent` / `placeContent` start/center/end/stretch plus `space-between` / `space-around` / `space-evenly` subset including stretch of auto row tracks and inert outer packing when weighted rows already absorb free space | Browser-accurate auto-placement, broader line-resolution edge cases, and full row-track sizing remain incomplete |
| Object fitting | practical `object-fit` and `object-position` mapping for native image surfaces and video poster surfaces with `cover`, `contain`, `fill`, `none`, `scale-down`, and common edge/corner alignment keywords | Current support is limited to native image output plus media poster rendering rather than all replaced elements |
| Wrap layout | wrapped rows are approximated from estimated widths | Useful, but not identical to browser intrinsic layout |
| Background blur | `backdropFilter: blur(...)` is approximated | This is visual parity work, not true browser filter execution |

## Not Supported Yet

These areas are still outside the current native CSS subset:

- full positioning fidelity beyond the current relative, non-screen absolute, and direct screen fixed subset
- full transform fidelity beyond the current `translate` and `scale` and `rotate` subset
- `transition` and `animation`
- full flexbox fidelity beyond the current practical `flexBasis`, explicit main-axis size, and `flexShrink` subset with sibling negotiation
- full `alignContent` / `placeContent` fidelity beyond the current practical multi-row start/center/end/stretch plus `space-between` / `space-around` / `space-evenly` subset
- full CSS grid coverage beyond the current practical `gridTemplateColumns` / `gridTemplateRows` / named-line `gridColumn` / `gridRow` / `gridArea` / `gridTemplateAreas` / `gridAutoFlow` / `gridAutoRows` / `gridAutoColumns` subset, including broader line-resolution edge cases, browser-accurate track sizing, fuller intrinsic negotiation, and tighter spanning behavior across both axes
- browser-complete background semantics beyond the current practical color/image/`linear-gradient(...)` layer subset, including radial or conic gradients, richer shorthand/token coverage, browser-accurate repeat tiling behavior, and tighter parity for axis-specific repeat on every native target
- `object-position` and `object-fit` beyond the current practical image and video subset and common alignment keywords
- full CSS Color 4 function coverage beyond the current hex/rgb/hsl/hwb, `currentColor`, and full named-color table, plus remaining dynamic or system color keywords
- pseudo-elements and the remaining relative-selector edge cases outside the current practical `:has(...)` subset, including standalone browser `:scope` semantics and broader selector-engine edge cases
- full-fidelity native evaluation of complex `@container` and `@supports` expressions

## Priority Backlog

These are the best next steps if the goal is to improve native parity quickly without turning the renderer into a browser engine.

### 1. Style Resolution Correctness

Focus:

- replace synthetic `:focus` behavior with real runtime state where possible, or narrow support to avoid misleading matches
- evaluate `@container`, `@supports`, and `@layer` in the native style resolution path
- expand selector coverage carefully with higher-complexity additions such as functional selectors and richer runtime pseudo-state support

Why first:

These changes improve which rules apply at all. If style resolution is wrong, downstream property mapping does not matter.

### 2. Layout Fidelity

Focus:

- extend percentage sizing beyond the current plain `%` width and height subset
- extend shrink negotiation beyond the current basis and explicit-size subset and add baseline self-alignment semantics where Compose and SwiftUI have practical equivalents
- extend grid support to rows and placement-aware layouts

Why second:

This closes the biggest visible parity gaps for responsive screens, dashboards, and form layouts.

### 3. Visual Fidelity

Focus:

- extend border support beyond the current practical solid/dashed/dotted subset into rounded-corner fidelity and richer border styles
- support multiple shadows and better fallback behavior for spread and inset values
- extend color parsing beyond the current rgb/hsl/hwb, `currentColor`, and full named-color table into wider CSS Color 4 functions and remaining dynamic or system keywords
- extend replaced-element fitting controls beyond the current practical image and video subset

Why third:

These changes improve polish and reduce design drift without forcing major architectural changes.

### 4. Positioning and Layering

Focus:

- extend beyond the current relative, non-screen absolute, and direct screen fixed subset into richer positioning semantics, richer overflow behavior, and stacking-context-aware layering

Why fourth:

This unlocks overlays, badges, floating actions, and clipped panels, but it requires more careful translation into native layout systems.

### 5. Motion and Effects

Focus:

- extend beyond the current `translate` and `scale` and `rotate` transform subset into richer transform semantics, `transition`, and animation support where there is a reasonable cross-platform mapping

Why fifth:

These matter for polish, but they are less urgent than correct rule matching and layout parity.

## Practical Guidance

If you are authoring shared styles for native output today, the safest approach is:

- favor spacing, typography, gradients, radius, and simple flex or column layouts
- treat grid and wrap behavior as native approximations, not browser-identical rendering
- avoid selector tricks that depend on advanced pseudo-classes or sibling relationships
- avoid relying on percentage sizing beyond full-width and full-height shells
- prefer simple surface styling over layered visual effects

For real-world parity checks, use [../examples/universal-app-example](../examples/universal-app-example) and [../examples/mobile-native-example](../examples/mobile-native-example) as validation projects.
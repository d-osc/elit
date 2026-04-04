# Native Element Support

This document compares the element factories exported by [../src/el.ts](../src/el.ts) with the current native transform and renderer behavior in [../src/native.ts](../src/native.ts).

It is meant to answer a narrower question than the CSS support guide: which `el` factories have a defined native path today, and what kind of path is it?

Validation command:

```bash
bun test testing/unit/native.test.ts
```

## Current Snapshot

- HTML element factories: `111 / 111` have a defined native handling path
- SVG element factories: classified into native `Vector` surfaces, with a practical `svg` + `circle`/`rect`/`path`/`line`/`polyline`/`polygon`/`ellipse` canvas subset rendered natively
- MathML element factories: classified into native `Math` placeholder surfaces
- `frag(...)`: supported as a transparent fragment
- browser DOM helpers from `el.ts`: still web-only utilities, not native render targets

Important limit:

- `100% handled` here means the native transformer has an intentional behavior for every HTML factory
- it does **not** mean browser-equivalent semantics or a full Android/iOS renderer for every tag
- attribute semantics are still selective; browser-like generic `setAttribute(...)` parity does not exist on the native target

## Practical Parity Scorecard

These scores are directional estimates for the current native target, not browser-compat guarantees.

| Area | Estimated parity | Current notes |
| --- | --- | --- |
| Layout and text content | `80-85%` | Shared structural tags, text tags, spacing, sizing, positioning, and practical flex/grid behavior are now strong for common mobile UI screens, including practical numeric and named-line `gridRow` / `gridColumn` placement with positive and negative repeated named-line ordinals plus negative numeric line indexes, numeric-or-span and named-area `gridArea` placement through `gridTemplateAreas`, practical fixed, clamped `minmax(min, max)`, direct intrinsic `min-content` / `max-content`, `fit-content(...)`, and simple flexible row sizing through `gridTemplateRows`, practical definite `gridAutoRows` sizing for fixed, intrinsic, `fit-content(...)`, and simple flexible rows plus explicit and implicit fixed, intrinsic, clamped `minmax(min, max)`, and `fit-content(...)` column sizing with weighted `fr` fallbacks through `gridTemplateColumns` and `gridAutoColumns`, explicit spanning-height hints that can raise mixed fixed/auto row minimums, practical spanning-width hints that can raise mixed fixed/clamped/flexible column minimums while accounting for internal gaps, practical grid-cell item alignment via `justifyItems` / `justifySelf` plus grid-aware `alignItems` / `alignSelf` and `placeItems` / `placeSelf`, and practical wrapped-stack plus single-row grid `alignContent` / `placeContent` start/center/end/stretch plus `space-between` / `space-around` / `space-evenly` subset including stretch of auto row tracks and inert outer packing when weighted rows already absorb free space |
| Common controls and form flows | `80-85%` | Buttons, text inputs, toggles, picker/select, progress, read-only/disabled/autofocus, common text-entry `input[type]` values, practical text-input constraint validation, practical bridge dispatch for authored `onInput` / `onChange` / `onSubmit` on native text inputs, toggles, and picker/select controls, `input[type="range"]` slider output, download links, required select placeholders, and both static and bound multiple-select flows now have native handling; browser-complete form semantics and event timing remain partial |
| Styling and selector resolution | `70-75%` | The renderer covers a broad practical CSS subset, including typography, colors, gradients, practical mixed color/image/`linear-gradient(...)` background stacks with shorthand parsing and repeat/no-repeat/repeat-x/repeat-y subset handling, borders, practical multi-shadow output, media/container queries, many selectors, and runtime `:active` styling on generated native buttons and links when authored active variants differ, but it is still intentionally narrower than a browser engine |
| Media, embedded, and drawing surfaces | `70-75%` | First-pass `img`/`picture` surfaces, WebView, audio/video, canvas `drawOps`, and a practical SVG subset now render natively; image helpers and video poster helpers both consume practical `object-fit` and `object-position` hints in a platform-approximated subset, while richer browser APIs remain incomplete |
| Accessibility and semantic attrs | `60-65%` | Labels, descriptions, link hints, validation state, and a practical role/aria state subset now map into generated Compose and SwiftUI accessibility output, but generic ARIA and browser semantics are still selective rather than comprehensive |
| Browser-complete DOM/attr semantics | `55-60%` | Every HTML factory is intentionally handled, but the native target still exposes a focused shared-runtime subset rather than general browser parity |

## HTML Factories

| Status | Tags | Native behavior |
| --- | --- | --- |
| Dedicated native primitives | `a`, `button`, `input`, `textarea`, `select`, `option`, `img`, `picture`, `progress`, `meter`, `hr` | Render into explicit native branches such as link handling, buttons, text inputs, picker menus, first-pass image surfaces with placeholder-backed loading fallback, progress views, and dividers |
| Structural layout containers | `html`, `body`, `main`, `section`, `address`, `header`, `footer`, `nav`, `article`, `aside`, `div`, `figure`, `details`, `dialog`, `ul`, `ol`, `li`, `table`, `tbody`, `thead`, `tfoot`, `tr`, `td`, `th`, `dl`, `dt`, `dd`, `form`, `fieldset`, `datalist`, `optgroup`, `menu`, `map` | Transform into native layout containers such as `Screen`, `View`, `List`, `ListItem`, `Row`, `Table`, and `Cell`, with practical layout approximation rather than browser DOM semantics |
| Text-oriented content | `figcaption`, `caption`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `p`, `span`, `label`, `legend`, `summary`, `strong`, `em`, `b`, `bdi`, `bdo`, `i`, `small`, `code`, `data`, `mark`, `q`, `cite`, `ruby`, `rp`, `rt`, `s`, `time`, `sub`, `sup`, `u`, `del`, `ins`, `output`, `abbr`, `dfn`, `kbd`, `samp`, `blockquote`, `pre` | Transform into native text nodes with inherited text-style mapping |
| First-pass drawing surfaces | `canvas` | Renders a native Compose/SwiftUI canvas surface with explicit `width`/`height` attrs or browser-like `300x150` intrinsic sizing; serializable `drawOps` can render declarative rect/circle/ellipse/line/polyline/polygon/path content. Browser Canvas 2D/WebGL command APIs are still not translated |
| First-pass media and embedded surfaces | `audio`, `video`, `iframe`, `object`, `embed`, `portal` | Render into native audio/video players or WebView wrappers when a usable source is present; unsupported or source-less cases still fall back to explicit placeholders |
| Non-rendering metadata | `head`, `title`, `base`, `link`, `meta`, `style`, `script`, `noscript`, `template`, `source`, `track`, `param`, `area`, `col`, `colgroup`, `wbr` | Omitted from native output to avoid producing misleading layout wrappers for document-only metadata |
| Transparent or special handling | `br`, `slot` | `br` becomes a newline text node; `slot` passes children through without an extra wrapper |

## SVG And MathML

| Factory group | Count | Current native behavior |
| --- | --- | --- |
| SVG factories from `svgSvg` through `svgFeTurbulence` | `42` | Classified as `Vector` surfaces; `svg` roots that resolve into a practical `circle`/`rect`/`path`/`line`/`polyline`/`polygon`/`ellipse` subset now render into Compose and SwiftUI canvas output, and supported `path` data now includes straight commands plus practical `C`, `Q`, `S`, `T`, and `A` curve parsing. Broader SVG content still falls back to explicit placeholders |
| MathML factories from `mathMath` through `mathMsup` | `12` | Classified as `Math` surfaces; current Compose and SwiftUI emit unsupported placeholders rather than formula layout |

## Non-Tag Exports In `el.ts`

| Export group | Current native status |
| --- | --- |
| `frag(...)` | Supported; native transform flattens the fragment children |
| DOM helper exports such as `doc`, `getEl`, `getEls`, `createEl`, `createSvgEl`, `createMathEl`, `fragment`, `textNode`, `commentNode`, `getElId`, `getElClass`, `getElTag`, `getElName` | Browser-only helpers; they are not part of the native renderer surface |

## What This Means

The native target now has a complete HTML factory handling path at transform time, but the quality of that handling still varies by category:

- strong support for common mobile UI tags and text content
- practical structural support for layout-heavy HTML sections
- first-pass native surfaces for picker/progress/divider, embedded web content, audio/video playback, declarative canvas surfaces, and a growing SVG vector subset
- intentional omission for document metadata tags
- honest placeholders still remain for unsupported SVG content and MathML instead of pretending they are fully supported

## Attribute Parity Snapshot

The browser renderer in [../src/dom.ts](../src/dom.ts) behaves mostly like a generic attribute pass-through with special cases for `class`, `style`, `on*`, `dangerouslySetInnerHTML`, and `ref`. The native renderer in [../src/native.ts](../src/native.ts) is narrower: it only turns selected attrs into Android/iOS behavior.

| Attribute group | Native status | Current notes |
| --- | --- | --- |
| `class`, `className`, `style` | Strong | Used by native style resolution and renderer modifiers |
| `value`, `checked`, `selected`, `placeholder` | Strong | Drive text inputs, toggles, picker selection, and progress semantics |
| `disabled`, `aria-disabled` | Practical subset | Now disable native `button`, `input`, `textarea`, checkbox/toggle, and `select` output, feed practical disabled accessibility state, and suppress automatic native `:valid` / `:invalid` derivation for those controls; this is not a generic attr toggle for every tag |
| `readOnly`, `readonly` | Practical subset | Text inputs and textareas now render read-only native bindings instead of editable fields |
| `autofocus`, `autoFocus`, `focused`, `aria-focused` | Practical subset | Text inputs and textareas now request initial native focus, and explicit focus signals also feed practical `:focus`, `:focus-visible`, and `:focus-within` selector state on common focusable native elements; broader browser autofocus parity is still incomplete |
| `tabIndex`, `tabindex`, `contentEditable`, `contenteditable` | Practical subset | These attrs do not create full browser tab-order behavior, but they can opt generic native elements into the practical selector-side focus subset when explicit focus state is also present |
| `type` on `input` | Practical subset | `checkbox` maps to `Toggle`, `range` maps to a native `Slider`, and text-entry types now have native handling for `password`, `email`, `number`, `tel`, `url`, and text-like fallback; `email` / `url` / `number` also feed practical validity checks |
| `min`, `max`, `step`, `minLength`, `maxLength`, `pattern` | Practical subset | Native text inputs now derive practical valid/invalid state from numeric range and step constraints, length limits, and string pattern checks; this feeds generated accessibility output and `:valid` / `:invalid` selector matching, while disabled controls are excluded from that automatic validation path without claiming browser-complete constraint validation |
| `onInput`, `onChange`, `onSubmit` | Practical subset | Authored control events on native text inputs, toggles, range sliders, and picker/select output now dispatch through generated `ElitNativeBridge` helpers with JSON payloads carrying practical value, checked, name, and input-type metadata. Implicit internal `onInput` handlers injected by shared state bindings stay internal and do not auto-dispatch bridge events |
| `href`, `target`, `rel`, `download`, `src`, `data`, `alt`, `title`, `aria-label`, `autoplay`, `loop`, `muted` | Practical subset | Drive link routing, external-open hints, native download helpers, first-pass image surfaces with placeholder-backed fallback, media and webview accessibility labels, media playback options, mute state, and embedded surface sources |
| `controls`, `poster`, `playsinline` | Practical subset | Video helpers now consume playback controls, poster overlays, inline/fullscreen hints, and a practical poster `object-fit` / `object-position` style subset with platform approximation rather than browser-identical behavior |
| `required`, `multiple`, `aria-required` | Practical subset | Required state now feeds native accessibility output, valid/invalid selector state, required single-select empty placeholders, and both static and bound `select[multiple]` checklist output; browser-complete constraint validation remains incomplete |
| `role`, `aria-description`, `aria-selected`, `aria-checked`, `aria-pressed`, `aria-expanded`, `aria-invalid`, `aria-valuetext`, most other `aria-*`, `data-*` | Limited to practical subset | A focused role/aria subset now feeds generated Compose and SwiftUI accessibility output plus selector, validation, focus, edit-state, explicit active-state hooks, and runtime active styling on generated buttons/links; generic accessibility attr parity is not complete |

## Practical Examples

```ts
import { audio, canvas, div, iframe, svgEllipse, svgLine, svgPath, svgPolygon, svgPolyline, svgSvg, type NativeCanvasDrawOperation, video } from 'elit';

const badgeOps: NativeCanvasDrawOperation[] = [
	{ kind: 'rect', x: 16, y: 16, width: 64, height: 32, fill: '#d56e43' },
	{ kind: 'line', x1: 16, y1: 80, x2: 128, y2: 80, stroke: '#123456', strokeWidth: 2 },
	{ kind: 'path', d: 'M 32 120 Q 64 96 96 120 T 160 120', fill: 'none', stroke: 'goldenrod', strokeWidth: 1.5 },
];

export const nativeSurfaceDemo = () => (
	div(
		svgSvg(
			{ viewBox: '0 0 24 24', width: 24, height: 24 },
			svgLine({ x1: 2, y1: 4, x2: 22, y2: 4, stroke: '#123456', strokeWidth: 2 }),
			svgPolyline({ points: '2,20 8,14 12,18 18,10', stroke: '#008000', fill: 'none' }),
			svgPolygon({ points: '14,4 20,8 18,14 12,12', fill: '#ff8c00' }),
			svgEllipse({ cx: 6, cy: 7, rx: 3, ry: 2, fill: '#0f1419' }),
			svgPath({ d: 'M 2 12 C 6 2 18 2 22 12 S 18 22 10 18 Q 8 16 6 14 T 10 10 A 4 4 0 0 1 14 14 Z', fill: 'none', stroke: '#123456' }),
		),
		canvas({ width: 320, height: 180, drawOps: badgeOps }),
		iframe({ src: 'https://example.com/embed' }),
		video({ src: 'https://cdn.example.com/demo.mp4', autoplay: true }),
		audio({ src: 'https://cdn.example.com/theme.mp3' }),
	)
);
```

When those media or embedded nodes do not have a usable source, native generation deliberately falls back to explicit unsupported placeholders rather than emitting broken player or WebView code. The native `canvas` surface is now a real drawable area with intrinsic sizing and declarative `drawOps`, but it still does not translate browser-side `getContext(...)`, Canvas 2D, or WebGL imperative drawing APIs.

For CSS fidelity and styling limits, see [native-css-support.md](native-css-support.md).
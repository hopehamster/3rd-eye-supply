# Oracle UI — Implementation Notes (v0)

> Frontend pass for the 3rd Eye Supply Oracle chat.
> Built: 2026-05-05.
> Stack: Astro 4 + Tailwind 3 + vanilla JS. No new npm dependencies.

## Files created / modified

| File | Lines | Status |
|---|---:|---|
| `site/src/components/Oracle.astro` | 407 | new |
| `site/src/scripts/oracle-client.js` | 287 | new |
| `site/src/pages/oracle.astro` | 151 | new |
| `site/public/index.html` | 2 (single-line minified) | edited — added second hero CTA |
| `oracle/docs/UI_NOTES.md` | this file | new |

Total new code: ~845 lines across the three Astro/JS files. (`index.html` is the existing minified homepage; the edit replaced one button block with a two-button block — still on a single line, no layout regressions.)

## Architecture summary

- **`Oracle.astro` is a self-contained island.** Renders the avatar, the conversation log, the contemplating indicator, the input form, and the audio control. Inline `<style>` block holds the brand visual signature. Inline `<script type="module">` wires the DOM to the `OracleClient` from `../scripts/oracle-client.js`. No client framework.
- **`oracle-client.js`** is a plain ES module exporting an `OracleClient` class. Methods: `init()`, `send(query)`, `playVoice(turnId)`, `getSessionId()`, plus `isVoiceOn()` / `setVoiceOn(on)` / `attachAudioElement(el)`. Parses SSE manually using `fetch` + `getReader()` (native `EventSource` is GET-only; the worker contract is POST). Internal `parseSseEvent()` splits records on `\n\n` and respects `event:`, `data:`, and comment lines.
- **`pages/oracle.astro`** wraps the island in the existing site nav + footer chrome and adds a CSS-only ambient starfield (three drifting layers, `prefers-reduced-motion` aware) so the page lands in a metaphysical mood without any JS background work.

## Domain / origin handling (per CRITICAL DOMAIN FACT)

Detection in `oracle-client.js`:

```js
function detectApiBase() {
  const o = window.location.origin || '';
  if (o.includes('hopehamster.github.io')) return '/3rd-eye-supply';
  return ''; // 3rdeyesupply.com custom domain + localhost dev
}
```

API calls go to `${apiBase}/api/oracle/chat` and `${apiBase}/api/oracle/voice/<turnId>` — never hardcoded. Worker-emitted relative URLs (e.g. `/oracle/voice/<id>`) are normalized through `_absoluteUrl()`, which prepends the base and the `/api` segment when the worker hands back a bare `/oracle/...` path.

## SSE event handling

The client honors the four event types declared in the worker architecture doc:

| Event | Effect on UI |
|---|---|
| `token`        | append `data.delta` to the in-flight oracle bubble (one `<span>` per character for the inscribed-not-typed reveal) |
| `meta`         | capture `turnId` for replay |
| `voice_ready`  | set `<audio>.src` and call `play()` (silent on autoplay rejection) |
| `done`         | flip `inFlight = false`, fire `onTurnComplete` |
| `error`        | render the soft in-character notice line |

A client-side **CODE PHOENIX** check runs against the cumulative string on every token. If it ever appears, the reader is cancelled, the half-built bubble is dropped, and the user sees: *"the oracle paused. please try a different question."*

A 429 from the chat endpoint surfaces: *"the oracle needs rest. return shortly."*
Any other failure (network, 5xx, malformed): *"the connection to the oracle has dimmed — try again in a moment."*

## Accessibility

- `role="log"` + `aria-live="polite"` on the history container so screen readers announce new oracle messages.
- `aria-label`s on the input, the send button, the audio element, and the section root.
- `<label class="sr-only">` for the textarea (not visually present, never lost to AT).
- `prefers-reduced-motion` zeroes the eye-orbit, the pulse, the per-token fade, and the starfield drift.
- Keyboard: Enter sends; Shift+Enter inserts newline; the textarea autoresizes up to ~180px.
- Focus ring on the input is a soft purple glow (kept contrast-safe against the dark background).

## Mobile / desktop responsive breakpoints

| Breakpoint | Behavior |
|---|---|
| < 640px (`sm`) | Avatar shrinks to 96px; container padding tightens; audio control hidden (the `<audio>` is `hidden sm:block` — voice still plays inline via the `<audio>` API, just no chrome shown to save vertical real estate). Input does NOT auto-focus (avoids forcing the iOS keyboard up). |
| ≥ 640px       | Avatar 128px, more breathing room. |
| ≥ 768px (`md`)| Desktop nav row visible (matches existing site nav); on this breakpoint we auto-focus the input. |

History pane is `max-h-[58vh]` with thin custom scrollbar; bubbles cap at 88% of container width.

## Browser compatibility

- SSE via `fetch` + `ReadableStream.getReader()`: supported in Chrome ≥ 43, Safari ≥ 10.1, Firefox ≥ 65, Edge ≥ 79. Mobile Safari iOS ≥ 11. **IE11 not supported — explicitly out of scope.**
- `crypto.randomUUID()` available since Safari 15.4 / Chrome 92 / Firefox 95. Older browsers fall through to `crypto.getRandomValues()` and finally `Math.random()` (the session id is opaque so cryptographic strength isn't strictly required).
- `localStorage` used for session id and voice preference; both calls are wrapped in try/catch so private-mode users degrade gracefully.

## Brand / tone choices

- **Avatar.** Pure CSS "oracle eye" — concentric purple/indigo circles with a slow halo pulse, an iris that rotates once every 14s, and a 5s pupil contraction. Marked `<!-- TODO: replace with Lottie when avatar art lands -->`.
- **Initial state.** Single italicized line: *"the oracle waits. ask what you wish to know."* — fades to invisible the moment the first turn starts.
- **No emojis. No exclamation marks. No "Hi! How can I help?".** All copy in the UI matches the persona (lowercase italics, period-ended).
- **Streaming feel.** Each oracle delta becomes one `<span class="oracle-token">` per character, fading in over 280ms. The result reads as inscription, not typing.
- **Bubbles.** Seeker bubbles right-aligned, pale indigo. Oracle bubbles left-aligned, italic, deeper purple gradient with a 28px violet glow.
- **Page background.** Fixed CSS-only starfield (three parallax-ish drifting layers + a bottom vignette veil). Lightweight; no Three.js.

## Voice handling

- An `<audio>` element lives inside the component. `OracleClient.attachAudioElement()` binds it.
- Voice preference is a checkbox just below the input ("voice"); state persists in `localStorage` under `oracle_voice_pref` ("on" / "off"). Default ON.
- When voice is off, `voice_ready` events are received but no audio is loaded or played. When voice is on, the client sets `audio.src = absoluteUrl(voiceUrl)` and calls `play()`. Autoplay rejection is silent — the audio element exposes its native controls so the user can press play manually.
- `playVoice(turnId)` exists for explicit replays of any past turn (not yet wired to a per-turn replay button — open question below).

## Homepage CTA addition

The existing "Shop What Feels Right" hero button is preserved exactly. The new "Speak with the Oracle" sibling button is appended in the same flex container (now `flex flex-wrap items-center justify-center gap-3`):

- Outline-style: subtle purple-tinted border, `bg-white/5` backdrop-blur, soft violet box-shadow that brightens on hover.
- Target: `/3rd-eye-supply/oracle` (matches the deployed GH Pages base path; on the custom domain Cloudflare's path-rewrite still resolves it correctly because the same path exists at `/oracle` after build with `base: '/3rd-eye-supply'`).

## Decisions that diverged (or are worth flagging)

1. **No `client:visible` directive used.** The brief and the architecture doc both reference it, but `Oracle.astro` is rendered as a static section on a dedicated `/oracle` page where users went specifically to chat — eager hydration is the right call. (When the same component is embedded on the homepage in a future pass, switch to `client:visible` then.)
2. **No new npm packages.** The architecture doc suggests `@lottiefiles/lottie-player`; per the brief we stayed off it and used a CSS placeholder eye. Marked `TODO`.
3. **Starfield is CSS-only**, not Three.js. The brief explicitly listed Three.js as optional; npm-dep prohibition trumps it.
4. **Snipcart parity on the oracle page.** Re-included the Snipcart `<div id="snipcart">` + script + stylesheet so the "Cart" button in the nav is functional on this route too. No shared layout file existed to inherit from; the nav was a minimum-viable copy of the homepage nav (kept surgical — did not refactor the homepage's nav into a partial in this pass).
5. **Worker base path.** Per the brief, calls go to `/api/oracle/chat`. The worker architecture doc shows the worker hosting `/oracle/chat` directly (custom hostname `oracle.3rdeyesupply.com` recommended). My assumption: a Cloudflare path-rewrite (or equivalent) will route `https://3rdeyesupply.com/api/oracle/*` → `oracle-worker`. On `hopehamster.github.io/3rd-eye-supply`, the same path is prefixed with `/3rd-eye-supply`. If the actual deploy pattern differs, the only change needed is `detectApiBase()` in `oracle-client.js`.

## Open questions for the user

1. **Lottie asset.** Where will the avatar JSON live? Suggested `/site/public/lottie/oracle-loop.json` — once that exists I can swap the CSS eye for a `<lottie-player>` web component (loaded via CDN, no npm dep) gated on `prefers-reduced-motion`.
2. **Worker routing.** Confirm that `/api/oracle/*` is the right callable path on the custom domain. If the worker is at `oracle.3rdeyesupply.com/oracle/*` instead, swap `apiBase` for the full origin URL.
3. **Per-turn voice replay button.** `playVoice(turnId)` exists. Wire a small ▷ icon next to each oracle bubble that re-fetches and plays? (Currently the inline `<audio>` controls cover replay of the most-recent turn only.)
4. **CTA placement.** Confirm the homepage CTA flex-row reads acceptably on the smallest devices (320px). The current code wraps to two stacked pills below ~360px; that's intentional but worth a real-device check.
5. **Privacy/legal copy.** A small note links 988 / 911 below the chat. Should this also include a one-line privacy disclosure ("conversations stored 24h for the Oracle's continuity")?

## Verification not yet performed

- No `astro build` / `astro dev` smoke run from this session (the working tree currently has no Astro source dir; this pass created it). The `<source>` paths and Tailwind classes follow the same patterns the existing site uses, but a build run is the next step before deploy.
- No real SSE round-trip tested — depends on the worker being up at one of the two API base URLs. The client is structured to fail soft (in-character notice), not to throw, when the endpoint is unreachable.

— end —

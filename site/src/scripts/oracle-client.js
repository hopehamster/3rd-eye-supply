/*
 * OracleClient — vanilla JS client for the 3rd Eye Supply Oracle worker.
 *
 * Talks to:
 *   POST /api/oracle/chat        (SSE stream of `token`, `meta`, `voice_ready`, `done`, `error`)
 *   GET  /api/oracle/voice/:turnId  (audio/mpeg)
 *
 * Origin detection (per CRITICAL DOMAIN FACT):
 *   - https://3rdeyesupply.com           → API base = ""        (root paths)
 *   - https://hopehamster.github.io      → API base = "/3rd-eye-supply"
 *   - localhost / preview                → API base = ""        (root paths; dev proxy)
 *
 * No third-party dependencies. No frameworks. No npm packages.
 */

const STORAGE_SESSION_KEY = 'oracle_session_id';
const STORAGE_VOICE_PREF_KEY = 'oracle_voice_pref'; // "on" | "off"

/* ------------------------------------------------------------------ *
 * Tiny UUID v4 — RFC 4122 §4.4. Uses crypto.randomUUID when available,
 * falls back to crypto.getRandomValues, and finally to Math.random.
 * ------------------------------------------------------------------ */
function uuidv4() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = [...b].map((x) => x.toString(16).padStart(2, '0'));
      return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`;
    }
  } catch (_) { /* fall through */ }
  // Last-ditch fallback (not RFC-strict, fine for an opaque session id).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* Detect API base from the deployed origin. */
function detectApiBase() {
  if (typeof window === 'undefined') return '';
  const o = window.location.origin || '';
  if (o.includes('hopehamster.github.io')) return '/3rd-eye-supply';
  // 3rdeyesupply.com (custom domain) and localhost dev — root paths.
  return '';
}

export class OracleClient {
  /**
   * @param {object} opts
   * @param {(text: string) => void}      opts.onTokenAppend     called with each new token (raw delta)
   * @param {() => void}                   opts.onTurnStart       fired when a request begins
   * @param {(turnId: string) => void}     opts.onTurnComplete    fired when SSE `done` arrives
   * @param {(url: string) => void}        opts.onVoiceReady      fired when `voice_ready` arrives
   * @param {(message: string) => void}    opts.onError           soft, in-character error string
   * @param {(state: 'idle'|'thinking'|'streaming') => void} opts.onState
   */
  constructor(opts = {}) {
    this.onTokenAppend   = opts.onTokenAppend   || (() => {});
    this.onTurnStart     = opts.onTurnStart     || (() => {});
    this.onTurnComplete  = opts.onTurnComplete  || (() => {});
    this.onVoiceReady    = opts.onVoiceReady    || (() => {});
    this.onError         = opts.onError         || (() => {});
    this.onState         = opts.onState         || (() => {});

    this.apiBase   = detectApiBase();
    this.sessionId = null;
    this.inFlight  = false;
    this.audioEl   = null;
    this.currentTurnId = null;
  }

  init() {
    // Session id: persist across reloads, mint once per browser.
    let sid = null;
    try { sid = localStorage.getItem(STORAGE_SESSION_KEY); } catch (_) {}
    if (!sid) {
      sid = uuidv4();
      try { localStorage.setItem(STORAGE_SESSION_KEY, sid); } catch (_) {}
    }
    this.sessionId = sid;
    this.onState('idle');
    return sid;
  }

  getSessionId() { return this.sessionId; }

  isVoiceOn() {
    try {
      const v = localStorage.getItem(STORAGE_VOICE_PREF_KEY);
      return v !== 'off'; // default ON unless user opts out
    } catch (_) { return true; }
  }

  setVoiceOn(on) {
    try { localStorage.setItem(STORAGE_VOICE_PREF_KEY, on ? 'on' : 'off'); } catch (_) {}
    if (!on && this.audioEl) {
      try { this.audioEl.pause(); } catch (_) {}
    }
  }

  attachAudioElement(el) { this.audioEl = el; }

  /**
   * Send a query to the Oracle. Streams tokens through onTokenAppend.
   * Returns the resolved turnId (or null on error).
   */
  async send(query) {
    if (this.inFlight) return null;
    if (!query || !query.trim()) return null;
    if (!this.sessionId) this.init();

    this.inFlight = true;
    this.currentTurnId = null;
    this.onTurnStart();
    this.onState('thinking');

    const url = `${this.apiBase}/api/oracle/chat`;
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'X-Session-Id': this.sessionId
        },
        body: JSON.stringify({ sessionId: this.sessionId, query: query.trim() })
      });
    } catch (e) {
      this.inFlight = false;
      this.onState('idle');
      this.onError('the connection to the oracle has dimmed — try again in a moment');
      return null;
    }

    if (!response.ok) {
      this.inFlight = false;
      this.onState('idle');
      if (response.status === 429) {
        this.onError('the oracle needs rest. return shortly.');
      } else {
        this.onError('the connection to the oracle has dimmed — try again in a moment');
      }
      return null;
    }

    if (!response.body) {
      this.inFlight = false;
      this.onState('idle');
      this.onError('the connection to the oracle has dimmed — try again in a moment');
      return null;
    }

    this.onState('streaming');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buf = '';
    let accumulated = '';
    let phoenixTripped = false;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // SSE event records are separated by a blank line ("\n\n").
        let idx;
        while ((idx = buf.indexOf('\n\n')) !== -1) {
          const raw = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const evt = parseSseEvent(raw);
          if (!evt) continue;

          if (evt.event === 'token') {
            const delta = (evt.data && evt.data.delta) || '';
            if (delta) {
              accumulated += delta;
              if (accumulated.includes('CODE PHOENIX')) {
                phoenixTripped = true;
                try { reader.cancel(); } catch (_) {}
                break;
              }
              this.onTokenAppend(delta);
            }
          } else if (evt.event === 'meta') {
            if (evt.data && evt.data.turnId) this.currentTurnId = evt.data.turnId;
          } else if (evt.event === 'voice_ready') {
            const url = evt.data && evt.data.url;
            if (url) this._handleVoiceReady(url);
          } else if (evt.event === 'error') {
            const m = evt.data && evt.data.message;
            this.onError(m || 'the connection to the oracle has dimmed — try again in a moment');
          } else if (evt.event === 'done') {
            // Stream over. Loop will exit on next read.
          }
        }

        if (phoenixTripped) break;
      }
    } catch (_) {
      // Silent — we close cleanly below.
    }

    this.inFlight = false;
    this.onState('idle');

    if (phoenixTripped) {
      this.onError('the oracle paused. please try a different question.');
      return null;
    }

    this.onTurnComplete(this.currentTurnId);
    return this.currentTurnId;
  }

  _handleVoiceReady(relUrl) {
    if (!this.isVoiceOn()) return;
    const full = this._absoluteUrl(relUrl);
    this.onVoiceReady(full);
    if (this.audioEl) {
      try {
        this.audioEl.src = full;
        // play() may reject without user gesture; ignore silently.
        const p = this.audioEl.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (_) {}
    }
  }

  _absoluteUrl(relUrl) {
    if (!relUrl) return '';
    if (/^https?:/i.test(relUrl)) return relUrl;
    // Worker returns paths like "/oracle/voice/<turnId>" or "/api/oracle/voice/<turnId>".
    // Normalize to the deployed origin's API base.
    const base = this.apiBase || '';
    if (relUrl.startsWith('/api/')) return `${base}${relUrl}`;
    if (relUrl.startsWith('/oracle/')) return `${base}/api${relUrl}`;
    return `${base}${relUrl.startsWith('/') ? '' : '/'}${relUrl}`;
  }

  /** Manually replay voice audio for a given turnId. */
  async playVoice(turnId) {
    if (!turnId || !this.audioEl) return;
    const url = `${this.apiBase}/api/oracle/voice/${encodeURIComponent(turnId)}`;
    try {
      this.audioEl.src = url;
      const p = this.audioEl.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) {}
  }
}

/* Parse one SSE event block. Returns { event, data } or null. */
function parseSseEvent(block) {
  if (!block) return null;
  const lines = block.split('\n');
  let event = 'message';
  const dataLines = [];
  for (const ln of lines) {
    if (!ln || ln.startsWith(':')) continue; // comment / heartbeat
    const ci = ln.indexOf(':');
    const field = ci === -1 ? ln : ln.slice(0, ci);
    let val = ci === -1 ? '' : ln.slice(ci + 1);
    if (val.startsWith(' ')) val = val.slice(1);
    if (field === 'event') event = val;
    else if (field === 'data') dataLines.push(val);
  }
  const dataStr = dataLines.join('\n');
  let data = null;
  if (dataStr) {
    try { data = JSON.parse(dataStr); }
    catch (_) { data = { raw: dataStr }; }
  }
  return { event, data };
}

/* Default export for convenience. */
export default OracleClient;

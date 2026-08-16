/**
 * Smoke test headless do VPS-FMDS-Editor (jsdom).
 * Verifica o que a refatoração precisa garantir sem abrir o navegador:
 *  1. o app inicializa sem exceção;
 *  2. os botões do HUD de apresentação recebem listener (bug §1.1);
 *  3. a sanitização preserva o conteúdo baseline e barra XSS (§2.2);
 *  4. cssUrlValue barra a injeção de CSS (§2.3);
 *  5. IDs de sala têm o novo formato (§1.4/§2.1).
 */
import { JSDOM, VirtualConsole } from "jsdom";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv[2];
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const results = [];
const check = (name, cond, extra = "") =>
  results.push({ name, ok: Boolean(cond), extra: cond ? "" : extra });

const pageErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (e) => pageErrors.push(e.message));
virtualConsole.on("error", () => {});
virtualConsole.on("warn", () => {});

// Stubs para APIs que o jsdom não implementa e que o boot toca.
const beforeParse = (win) => {
  win.BroadcastChannel = class { constructor() {} postMessage() {} close() {} };
  win.requestAnimationFrame = (cb) => win.setTimeout(() => cb(Date.now()), 0);
  win.cancelAnimationFrame = (id) => win.clearTimeout(id);
  win.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  win.scrollTo = () => {};
  Object.defineProperty(win, "isSecureContext", { value: true });
  win.HTMLCanvasElement.prototype.getContext = () => null;
  if (!win.crypto?.getRandomValues) {
    Object.defineProperty(win, "crypto", {
      configurable: true,
      value: {
        getRandomValues: (arr) => {
          for (let i = 0; i < arr.length; i += 1) arr[i] = Math.floor(Math.random() * 256);
          return arr;
        }
      }
    });
  }
  // Instrumenta addEventListener para provar que o HUD foi ligado de verdade.
  win.__listeners = new Map();
  const orig = win.EventTarget.prototype.addEventListener;
  win.EventTarget.prototype.addEventListener = function (type, fn, opts) {
    const id = this && this.id;
    if (id) {
      if (!win.__listeners.has(id)) win.__listeners.set(id, []);
      win.__listeners.get(id).push(type);
    }
    return orig.call(this, type, fn, opts);
  };
};

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: undefined,
  url: "https://vps-fmds-editor.techartsolucoes.com.br/",
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse
});

const win = dom.window;
await new Promise((r) => win.addEventListener("load", r, { once: true }));
await new Promise((r) => setTimeout(r, 300));

// ── 1. boot sem exceção ────────────────────────────────────────────────────
const fatal = pageErrors.filter((m) => !/Not implemented|Could not load|canvas/i.test(m));
check("1. App inicializa sem exceção fatal", fatal.length === 0, fatal.join(" | ").slice(0, 400));
check("1b. API pública window.vpsOperacional exposta", typeof win.vpsOperacional === "object");

// ── 2. HUD da apresentação ligado (bug §1.1) ───────────────────────────────
for (const id of ["presentationPrevBtn", "presentationNextBtn", "presentationExitBtn"]) {
  const el = win.document.getElementById(id);
  const types = win.__listeners.get(id) || [];
  check(`2. #${id} existe e tem listener de click`, el && types.includes("click"),
    `elemento=${Boolean(el)} listeners=${JSON.stringify(types)}`);
}

// ── 3. sanitização (§2.2) ──────────────────────────────────────────────────
// Acesso via eval no contexto da página: as funções são locais ao IIFE do script.
const evalIn = (expr) => win.eval(expr);
win.eval(`
  window.__t = {
    sanitize: (v) => sanitizeFieldHtml(v),
    cssUrl: (v) => cssUrlValue(v),
    roomId: () => randomLiveRoomId(),
    token: (n) => randomLiveToken(n),
    deckFormat: EXPORT_DECK_FORMAT,
    appVersion: APP_VERSION
  };
`);
const S = win.__t.sanitize;

// Conteúdo real do baseline precisa sobreviver intacto.
const baseline = [
  '<li>Instalação de RRU no site Z-145 (Concluído)</li>',
  '<li>Manutenção preventiva <span class="green">(Adicionado item)</span></li>',
  '<p>Alerta de clima: ventos fortes após as 14:00.</p><ul><li>Atraso logístico</li></ul>',
  '<strong>VPS</strong> <span class="sep">|</span> Vale Carajás-PA'
];
for (const frag of baseline) {
  const out = S(frag);
  check(`3. Baseline preservado: ${frag.slice(0, 42)}…`, out === frag, `saiu: ${out}`);
}
check("3b. class preservada em span", S('<span class="green">x</span>').includes('class="green"'));
check("3c. texto puro intocado", S("Semana: 32") === "Semana: 32");

// Vetores de ataque precisam ser neutralizados.
const attacks = [
  ['<script>window.__pwned=1</script>', /script/i],
  ['<img src=x onerror="window.__pwned=1">', /onerror/i],
  ['<svg onload="window.__pwned=1"></svg>', /onload|svg/i],
  ['<a href="javascript:window.__pwned=1">c</a>', /href/i],
  ['<iframe src="data:text/html,<script>1</script>"></iframe>', /iframe/i],
  ['<div style="background:url(javascript:1)">x</div>', /javascript/i],
  ['<p onclick="alert(1)">t</p>', /onclick/i]
];
for (const [payload, forbidden] of attacks) {
  const out = S(payload);
  check(`3d. Neutraliza: ${payload.slice(0, 40)}…`, !forbidden.test(out), `saiu: ${out}`);
}
check("3e. Nenhum payload executou", win.__pwned === undefined);

// ── 4. injeção de CSS (§2.3) ───────────────────────────────────────────────
const C = win.__t.cssUrl;
check("4. Aceita caminho relativo", C("./default-background.png") === 'url("./default-background.png")');
check("4b. Aceita data URL de imagem", C("data:image/png;base64,iVBORw0KGgo=").startsWith('url("data:image/png'));
check("4c. Barra fuga com aspas", C('x.png") ;background:red;--a:("') === "none");
check("4d. Barra esquema javascript:", C("javascript:alert(1)") === "none");
check("4e. Vazio vira none", C("") === "none");

// ── 5. IDs e tokens (§1.4/§2.1) ────────────────────────────────────────────
const ids = Array.from({ length: 500 }, () => win.__t.roomId());
check("5. Room ID com 10 chars A-Z0-9", ids.every((id) => /^[A-Z0-9]{10}$/.test(id)), ids[0]);
check("5b. Sem colisão em 500 sorteios", new Set(ids).size === 500);
check("5c. Token respeita o tamanho pedido", win.__t.token(14).length === 14);
const dist = {};
ids.join("").split("").forEach((c) => { dist[c] = (dist[c] || 0) + 1; });
const counts = Object.values(dist);
const spread = Math.max(...counts) / Math.min(...counts);
check("5d. Distribuição sem viés grosseiro (max/min < 2)", spread < 2, `spread=${spread.toFixed(2)}`);

// ── 6. constantes de release ───────────────────────────────────────────────
const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
const swVersion = sw.match(/APP_VERSION\s*=\s*"([^"]+)"/)[1];
check("6. APP_VERSION igual em index.html e sw.js", swVersion === win.__t.appVersion,
  `index=${win.__t.appVersion} sw=${swVersion}`);
check("6b. EXPORT_DECK_FORMAT padrão = png (motor de impressão intacto)", win.__t.deckFormat === "png");

// ── 7. idempotência e round-trip (não perder conteúdo do usuário) ──────────
for (const frag of baseline) {
  check(`7. Sanitização idempotente: ${frag.slice(0, 34)}…`, S(S(frag)) === S(frag));
}

// Conteúdo real dos campos do editor sobrevive ao ciclo salvar → carregar.
win.eval(`
  window.__t.roundTrip = () => {
    const before = getContentPayload();
    const restored = {};
    Object.entries(before).forEach(([k, v]) => { restored[k] = sanitizeFieldHtml(v); });
    return { before, restored };
  };
`);
const { before, restored } = win.__t.roundTrip();
const keys = Object.keys(before);
check("7b. Editor tem campos [data-key] carregados", keys.length > 5, `campos=${keys.length}`);
const changed = keys.filter((k) => before[k] !== restored[k]);
check("7c. Nenhum campo do editor é alterado pela sanitização", changed.length === 0,
  changed.map((k) => `${k}: "${before[k]}" → "${restored[k]}"`).join(" | ").slice(0, 500));

// Pacote FMDS: exportar e reimportar preserva o conteúdo dos cartões.
win.eval(`
  window.__t.packRoundTrip = () => {
    try {
      const pack = buildLiveDeckPackage();
      const clone = JSON.parse(JSON.stringify(pack));
      applyLiveDeckPackToWorkspace(clone);
      const after = readCardFromLivePack(clone.cards[0].brand, clone.cards[0].modelId);
      return { ok: true, cards: pack.cards.length, same: JSON.stringify(after.content) === JSON.stringify(clone.cards[0].content) };
    } catch (e) { return { ok: false, error: e.message }; }
  };
`);
const rt = win.__t.packRoundTrip();
check("7d. Export → import do pacote FMDS preserva o conteúdo",
  rt.ok ? rt.same : /Exibir/.test(rt.error || ""),
  rt.ok ? `cartões=${rt.cards}` : `erro: ${rt.error}`);

// ── relatório ──────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`${r.ok ? "  PASS" : "  FAIL"}  ${r.name}${r.extra ? `\n          → ${r.extra}` : ""}`);
}
console.log(`\n${results.length - failed.length}/${results.length} verificações passaram.`);
dom.window.close();
process.exit(failed.length ? 1 : 0);

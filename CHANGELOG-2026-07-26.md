# Changelog — julho de 2026

## `2026.08.16-v56-code-audit`

- Revisão completa do código (`index.html`, `sw.js`): sem `eval`/`new Function`,
  sem `console.log`/`debugger` residual, `innerHTML` conferido (todos os pontos
  usam `escapeHtml`, conteúdo estático ou o sanitizador `sanitizeFieldHtml`)
- Confirmado o fluxo de atualização do PWA: ao reabrir o app com uma versão nova
  publicada, o Service Worker dispara `updatefound` → modal "Atualização
  disponível" → **Atualizar agora** preserva a edição local, aplica
  `SKIP_WAITING` e recarrega (com fallback de reload se `controllerchange` não
  disparar)
- `README.md` desatualizado (build `v54`) sincronizado com a versão publicada
  real (`v55-hardening`, agora `v56`); link de produção no VPS Hostinger
  adicionado à tabela de links oficiais
- 37/37 verificações de `tests/smoke.mjs` conferidas antes e depois do bump
- Nenhuma mudança funcional necessária — bump de versão para acionar o prompt
  de atualização em quem já tem o app instalado

## `2026.08.04-v55-hardening`

- Versão publicável usada no primeiro deploy ao VPS Hostinger
  (`vps-fmds-editor.techartsolucoes.com.br`) — ver `deploy/README-DEPLOY.md`
- `deploy/deploy.sh`: publicação idempotente com backup, troca atômica via
  staging, validação de sintaxe e de paridade de `APP_VERSION` entre
  `index.html` e `sw.js`, checagem de headers de segurança pós-deploy
- Checklist FMDS: corrigido falso-negativo do probe do Firebase Realtime
  Database (lia a raiz e sempre acusava falha)
- Sala ao vivo: código passa de 6 para 10 caracteres
- HUD da apresentação responde a clique nos botões Próximo/Anterior/Sair
  (antes só respondia a teclado)

## `2026.07.29-v54-presentation-media`

- **Apresentação Painel/KPI:** não força mais as 4 guias de texto visíveis (vazavam por trás do quadro fotográfico)
- Grid oculto com `report-media-active`; chrome de edição (×, toolbar, legendas vazias) oculto na apresentação
- Imagem livre não compete com o quadro fotográfico

## `2026.07.29-v53-media-no-fill`

- Quadro fotográfico **sem preenchimento escuro** (editor + bake PNG/PDF) — letterbox transparente
- Vale para **todos** os ambientes (mesmo motor de exportação)
- Skill/regra de projeto: `.cursor/skills/vps-fmds-export` — não regressar o Baixar

## `2026.07.29-v52-export-icon-fix`

- **Regressão v51 no Baixar (PNG/PDF):** ícones (calendário/torre/etc.) eram “assados” com a caixa do **pai** (`.meta` / `.panel-head`) e `width/height: 100%` — explodiam e cobriam a prancha com silhueta verde
- Assa no tamanho do próprio `<img>` (px explícitos); slots de foto/logo continuam no container
- Pseudodecorativos `::before/::after` ocultos na captura; free-media não cobre o quadro fotográfico
- Captura de volta na prancha viva travada (sem clone off-screen que perdia o layout)

## `2026.07.29-v51-export-print-fix`

- **Bug crônico de impressão/exportação corrigido:** `normalizeCanvasToSlide` recortava a origem com dimensões do destino (title/rodapé sumiam quando o canvas do html2canvas vinha maior que 3840×2160)
- Captura via host off-screen (sem scale/scroll/filter do editor) + borda/sombra removidas na trava
- Libs `html2canvas` / `jsPDF` vendored em `vendor/` (offline/PWA), CDN só como fallback
- Bake de object-fit ampliado a ícones; `backdrop-filter` desligado na captura
- Fallback silencioso `window.print()` removido em falha de PDF
- **PDF do deck (Exibir):** exporta multipágina 16:9 de todos os cartões marcados
- Exibir passa a persistir o cartão ativo antes de marcar (espelho ao vivo fiel)
- Print CSS oculta overlays (apresentação, modais, host de captura)

## `2026.07.28-v50-useful-area`

- Mídia/grade respeitam a área útil: param acima do rodapé (gap ≥ 8px) e não pintam por cima dele
- Rodapé com altura fixa e z-index acima do conteúdo
- Export: sincroniza `--footer-h` com a faixa real do footer antes do html2canvas

## `2026.07.28-v49-export-no-crop`

- PDF/PNG: deixa de **cortar** o centro do canvas (sumiam título e rodapé)
- Captura fixa 1280×720 da prancha; normalização por contain (sem crop)

## `2026.07.28-v48-report-media-3up`

- Quadro fotográfico com **3 imagens**: layout em “L” (1 alta + 2 à direita), sem quadrante vazio
- PDF/PNG: oculta caixas sem foto e reaplica o grid certo na captura

## `2026.07.28-v47-firebase-live-room`

- Canal FMDS ao vivo migrado para **Firebase Realtime Database** (+ Auth anônima)
- Config em `firebase-config.js`; regras em `database.rules.json`
- Listener em tempo real no índice do slide (sem polling Netlify)
- Fallback local (BroadcastChannel) se Firebase estiver `enabled: false`
- Guia atualizado: `FMDS-AO-VIVO.md`

## `2026.07.28-v46-fmds-live-multisite`

- FMDS ao vivo multi-site: pacote de deck exportar/importar + sala com tokens
- Canal leve `/api/room` (Netlify Function) sincroniza **só o índice** do slide
- Modo espectador (`?modo=view`) e apresentador; checklist pré-FMDS no menu
- Fallback local via BroadcastChannel quando a função não está no ar
- Guia: `FMDS-AO-VIVO.md`

## `2026.07.28-v45-update-storage-fix`

- Fotos deixam de ser duplicadas em settings + sidecar (blobs só no sidecar)
- Atualizar agora: limpa cópias pesadas, não trava mais por cota cheia
- Ao abrir o app, remove duplicatas antigas e libera espaço no navegador

## `2026.07.28-v44-update-apply-fix`

- Botão **Atualizar agora**: relê o service worker em espera no clique (evita referência stale)
- Se `controllerchange` não disparar, força reload após 1,2s (antes o modal só fechava)
- Erros de preservação de imagens aparecem no próprio modal (não só no status oculto)

## `2026.07.28-v43-export-object-fit`

- PDF/PNG: pré-renderiza fotos do quadro com contain/cover antes do html2canvas
- Corrige esticamento no motor de impressão (html2canvas ignora `object-fit`)
- SVG de ícones/logos também exportados sem distorção de proporção

## `2026.07.28-v42-image-fit-engine`

- Motor de enquadramento no quadro fotográfico: imagem ancorada ao slot com `object-fit`
- Qualquer proporção/tamanho cabe sem distorção (nunca estica)
- Preview ao vivo no modal ao trocar “Caber inteira” / “Preencher quadro”

## `2026.07.28-v41-media-reload-guard`

- Proteção antidesastre: reload/atualização não sobrescreve fotos com estado vazio
- Une settings + sidecar de mídia e preserva o conjunto mais completo
- “Atualizar agora” só segue se a persistência das imagens for bem-sucedida
- Validação das 4 caixas do relatório em todos os ambientes

## `2026.07.28-v40-report-media-fit`

- Relatório fotográfico: padrão **Conter inteira** (sem cortar a foto no quadro)
- Clique na imagem abre modal rápido: enquadramento, legenda, trocar/remover
- Opção **Preencher área** permanece disponível quando o corte for desejado

## `2026.07.28-v39-presentation-mirror`

- Apresentação em **espelho ao vivo**: cada slide relê o cartão do ambiente (textos + imagens + logos/fundo)
- Botão **Enviar** substituído por **Exibir** (barra + checkbox no menu Apresentação)
- Controle por cartão em todas as bandeiras; Subir/Descer mantém a ordem
- Migração antidesastre: deck `presentation-deck-v1` → `presentation-mirror-v2` **sem apagar** o legado
- Snapshot de saída da apresentação preserva mídia e bandeira do editor

## `2026.07.28-v38-image-persist-fix`

- Sidecar de mídia por cartão (`model-media-v1`) para imagens sobreviverem a updates
- Resync forçado de template desligado (não apaga fotos no bump de versão)
- Feedback claro quando o armazenamento local enche

## `2026.07.28-v37-image-freeze-fix`

- Histórico sem data-URLs (evita travar o display ao inserir imagens)
- Compressão sempre na importação; persistência adiada

## `2026.07.26-v27-code-cleanup`

- Remoção de CSS morto (`.meta .calendar`, `--deep-2`)
- Listeners de teclado unificados; remoção de handlers mortos no overlay
- Mensagens de erro sem referência a Imprimir
- Ajustes de a11y/labels e tipografia do HUD da apresentação

## `2026.07.26-v26-presentation-nav`

- Enter / Shift+Enter e clique esquerdo/direito na apresentação

## `2026.07.26-v25-team-workspaces-presentation`

- Ambientes isolados por bandeira (VPS, VALE, SONDA, SETFANINI, ALDAK, ENGEFAME, MINAS LASER)
- Migração dos dados legados para o ambiente `vps`
- Botão **Enviar** — snapshot do cartão ativo para o deck FMDS (substituído na v39 pelo espelho + Exibir)
- Menu **Apresentação**: listar, subir/descer, iniciar
- Slideshow tela cheia (setas, Espaço, clique, Esc)

## `2026.07.26-v24-corporate-flags` / `v23` / `v22`

- Bandeiras no Espaço Corporativo; menus à direita; Instalar em Configurações; overlay da toolbar acima do Admin

## `2026.07.26-v21-icon-pack`

- Pack oficial de ícones embutido em `icons/icon-pack.js` (8 SVGs em data URI)
- App consome o pack na inicialização; fallback para `icons/*.svg` se o script falhar
- Service worker passa a cachear `icons/icon-pack.js`

## `2026.07.26-v20-release-baseline`

Release de baseline visual para deploy VPS/Netlify no mesmo dia.

### Padrão de produto (congelado no source)

- Layout tipográfico e de medidas alinhado ao estado ao vivo da revisão local
- Abas/guias (caixas) **ocultas por padrão**
- Semana e data **automáticas** (`dateAuto: true`); HTML placeholder `Semana: —` / `Data: —`
- `STANDARD` de todos os modelos regenerado nesta versão via `BASELINE_FLAG`
- `:root` CSS espelha `adminDefaults` (primeira pintura correta)

### Frontend — melhorias do ciclo 26/07

- Toolbar: Cartão VPS · Exportar · Salvar · Desfazer · Refazer · D+olho · Configurações
- Exportar: PDF 16:9 e PNG 16:9 (sem Imprimir)
- Admin fixo à direita; configuração de arquivo/data na toolbar
- Prancha com fit automático ao editor (`sheet-stage` + scale)
- Histórico de sessão (undo/redo)
- Quatro cartões VPS: D-1, D0, Painel Geral, KPIs

### Removido

- Notas
- Imprimir
- Restaurar conteúdo original
- Chip de modelo na toolbar
- Configuração embutida no Admin

### Builds intermediárias do dia (contexto)

| Build | Foco |
|---|---|
| v11 (pré-revisão) | Base 16:9 / print |
| v12–v18 (locais) | Toolbar, admin, scroll, zoom fit, menus |
| v19 | Restauração dos 4 cartões (incl. D0) |
| **v20** | Baseline de release + docs |

### Documentação

- `README.md` atualizado
- `RELATORIO-REVISAO-2026-07-26.md`
- Este changelog

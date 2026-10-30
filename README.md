# VPS-FMDS-Editor

Nome oficial do projeto: **VPS-FMDS-Editor**.

Aplicativo web (PWA) para editar e exportar a prancha operacional VPS/FMDS em formato 16:9, com ambientes por equipe (bandeira), painel administrativo, cartões e Espaço Apresentação em **espelho ao vivo**.

**Build atual:** `2026.10.29-v64-report-lte-two-box`

## Links oficiais

| Recurso | URL |
|---|---|
| App (produção — VPS Hostinger) | https://vps-fmds-editor.techartsolucoes.com.br |
| App (produção — Netlify) | https://vps-fmds-editor.netlify.app |
| Repositório GitHub | https://github.com/mantoky/VPS-FMDS-Editor |

> Pasta de revisão local. Após validar, publicar (Netlify e/ou `deploy/deploy.sh` para o VPS) e alinhar o GitHub.

## Como iniciar (local)

1. Abra a pasta do projeto.
2. Execute `iniciar-vps-live.cmd`.
3. O navegador abre em `http://127.0.0.1:8766/`.

> Em protocolo `file://` o service worker não registra; use o script local acima para instalar e atualizar como app.

## Ambientes por bandeira (equipes)

Em **Espaço Corporativo**, cada bandeira abre um ambiente isolado:

VPS · VALE · SONDA D. CENTER · SONDA CABLING · SONDA NETWORK · SONDA LTE S. NORTE · SONDA LTE S. SUL · SETFANINI · ALDAK · ENGEFAME · MINAS LASER

> A SONDA tem ramificações de contrato/função e por isso abre em 5 sub-bandeiras isoladas (D. Center, Cabling, Network, LTE Norte, LTE Sul). Elas herdam o ambiente inicial (logo, layout, textos) da bandeira `sonda` (D. Center) em vez do template genérico — ver `BRAND_TEMPLATE_OVERRIDES` em `index.html`.

Cada ambiente tem cartões, configurações, logos/fundo, mídia e histórico próprios (localStorage namespaced). O indicador **Ambiente: …** na barra mostra a equipe ativa.

## Fluxo FMDS → Apresentação (espelho ao vivo)

A Apresentação **não guarda cópia congelada** do cartão. Ela espelha o estado atual de cada card no armazenamento local (textos, layout, imagens, logos e fundo).

1. Edite o cartão em qualquer ambiente (bandeira + modelo).
2. Marque **Exibir** (botão na barra ou checkbox no menu Apresentação).
3. Desmarque **Exibir** para retirar o cartão da sequência.
4. Em **Apresentação**: reordene (Subir/Descer), confira quantos estão exibidos e clique **Iniciar apresentação**.
5. A cada slide, o app relê o cartão ao vivo — alterações salvas no ambiente aparecem imediatamente (também entre abas do mesmo navegador).

### FMDS ao vivo multi-site

Para vários locais ao mesmo tempo (baixa latência), com **Firebase Realtime Database**:

1. Configure [`firebase-config.js`](firebase-config.js) (`enabled: true`) + regras em [`database.rules.json`](database.rules.json)
2. **Exportar pacote** (deck com fotos) e distribuir **antes** do evento
3. Cada site **Importar pacote**
4. HQ **Abrir sala** e compartilhar o link de espectador
5. Ao vivo viaja **só o índice do slide** no Firebase — ver [`FMDS-AO-VIVO.md`](FMDS-AO-VIVO.md)

### Política antidesastre (migração)

| Chave | Papel |
|---|---|
| `vps-operacional-presentation-mirror-v2` | Visibilidade + ordem dos cards (estrutura nova) |
| `vps-operacional-presentation-deck-v1` | Deck legado — **preservado**, nunca apagado na migração |
| `vps-operacional-model-media-v1:*` | Imagens por cartão (sidecar; sobrevive a updates de settings) |

Na primeira abertura da v39, cards que estavam no deck antigo migram como **Exibir = ligado**. O arquivo v1 permanece como arquivo.

## Cartões VPS

| Modelo | Uso |
|---|---|
| VPS - FMDS_D-1 | Planejamento D-1 |
| VPS - FMDS_D0 | Execução D0 |
| VPS - FMDS_PAIN. GERAL | Painel geral |
| VPS_FMDS_IND. KPI'S | Indicadores KPI |

## Uso rápido

1. Clique em logos e ícones para substituir imagens sem entrar no Administrador.
2. Use **D + olho** na barra para ocultar/exibir a referência da página.
3. Preencha as caixas (ative-as no Admin se estiverem ocultas); textos vazios mostram *Inserir texto...*.
4. Use **Salvar** para gravar a edição. Use **Exibir** para incluir o cartão na Apresentação.
5. Use **Desfazer** / **Refazer** para o histórico da sessão (sem regravar blobs de imagem no histórico).
6. Em **Configurações → Data**, escolha semana/data ou mantenha a automática.
7. No Administrador, ajuste medidas, cores e visibilidade das caixas.

## Exportação

No menu **Baixar** da barra:

- **PDF 16:9** — PDF no formato PowerPoint widescreen (cartão atual).
- **PNG 16:9** — imagem em alta resolução (3840×2160).
- **PDF do deck (Exibir)** — PDF multipágina com todos os cartões marcados **Exibir** (espelho ao vivo).

As bibliotecas de exportação ficam em `vendor/` (funcionam offline no PWA).

## Banco de ícones

O pack oficial (`icons/icon-pack.js`) é carregado na build com 8 ícones em data URI. Os SVG em `icons/*.svg` permanecem no pacote e no cache do service worker.

## Administrador

Aba lateral fixa à direita, com tipografia, medidas, paleta, visibilidade das caixas, fundo, logos e ícones. Arquivo de configuração, padrão visual, data e **Instalar** ficam em **Configurações**.

## Instalação como aplicativo (PWA)

- **Produção:** abra https://vps-fmds-editor.netlify.app e use **Instalar** (em Configurações, quando disponível).
- **Pendrive / pasta baixada:** execute `iniciar-vps-live.cmd` e instale pelo endereço local.

## Deploy (checklist)

1. Publicar o conteúdo desta pasta (exceto `backups/` se não for versionar).
2. Confirmar `APP_VERSION` idêntico em `index.html` e `sw.js`.
3. Validar PWA update em cliente já instalado (diálogos Depois / Atualizar agora).
4. Validar Apresentação: marcar Exibir → inserir imagem → iniciar → imagem visível no slide.
5. Em instalação limpa: guias ocultas, layout baseline, semana/data do dia, ambientes por bandeira.

## Arquivos principais

| Arquivo | Função |
|---|---|
| `index.html` | Interface, editor, ambientes e apresentação |
| `sw.js` | Service worker / cache offline |
| `vendor/html2canvas.min.js` | Captura da prancha (PDF/PNG) |
| `vendor/jspdf.umd.min.js` | Geração de PDF 16:9 |
| `firebase-config.js` | Credenciais Firebase Web (canal ao vivo) |
| `database.rules.json` | Regras Realtime Database |
| `FMDS-AO-VIVO.md` | Guia multi-site / checklist |
| `icons/icon-pack.js` | Pack de ícones embutido |
| `manifest.webmanifest` | Metadados do PWA |
| `iniciar-vps-live.cmd` | Servidor local em `127.0.0.1:8766` |
| `_headers` | Cabeçalhos de cache (Netlify) |
| `RELATORIO-REVISAO-2026-07-26.md` | Auditoria e revisão |
| `CHANGELOG-2026-07-26.md` | Histórico da atualização |

## Observações

- Configurações ficam neste navegador; exportar JSON replica em outro computador.
- **FMDS ao vivo multi-site:** pacote pré-distribuído + Firebase RTDB só para o índice do slide (ver `FMDS-AO-VIVO.md`).
- Versão do pacote: `APP_VERSION` em `index.html` e `sw.js` (devem coincidir).

# Relatório de revisão — VPS-FMDS-Editor

**Data:** 26 de julho de 2026  
**Build:** `2026.07.26-v20-release-baseline`  
**Base local:** pasta de revisão `vps_fmds_live`  
**Destino previsto:** produção Netlify / VPS (mesmo dia)

## Objetivo desta revisão

Congelar o layout, as abas e as guias como estão agora no editor local, gravá-los como padrão no código-fonte, manter **semana e data automáticas**, validar com testes e preparar o pacote para subir ao VPS.

## Inferência: o que havia antes

Com base nos backups locais (`backups/pre-*`) e no pacote anterior (`2026.07.01-v11-format-16x9-printfix` → iterações `v19` do dia):

| Área | Antes (inferido) | Agora (26/07/2026) |
|---|---|---|
| Toolbar | Texto longo, chip do modelo ativo, Imprimir, Notas, Restaurar conteúdo | Ações compactas com ícones; menus **Cartão VPS**, **Exportar**, **Configurações** |
| Modelos | Acesso menos direto / rótulos mistos | Menu **Cartão VPS** com 4 cartões: D-1, D0, Painel Geral, KPIs |
| Exportação | Fluxo antigo (incl. impressão) | **PDF 16:9** e **PNG 16:9** (3840×2160) |
| Admin | Seção Configuração embutida; drawer/overlay em experimentos | Coluna fixa à direita; config de arquivo/data na toolbar |
| Layout editor | Scroll/zoom do browser sem ajuste da arte | `fitSheetToEditor()` — prancha 1280×720 escala ao painel |
| Data/semana | Valores estáticos no HTML / edição manual dominante | **Automáticas por padrão** (`dateAuto: true`); override em Configurações → Data |
| Histórico | Restaurar original | **Desfazer / Refazer** + **Salvar** (conteúdo + settings + assets) |
| Notas | Modal e bloco admin | Removido |
| Badge | Controles verbosos | Toggle **D + olho** |
| Defaults CSS (`:root`) | Tipografia/medidas desatualizadas vs. admin | Espelhados em `adminDefaults` (baseline visual) |
| Guias (caixas) | Visíveis por padrão no HTML antigo | **Ocultas por padrão** (`hiddenPanels` todos `true` + classe `is-hidden` no HTML) |

## O que foi removido

- Botão / fluxo **Imprimir**
- Recurso **Notas** (UI + admin + lógica)
- Botão **Restaurar** conteúdo original da sessão
- Chip de modelo atual na toolbar (`currentModelLabel`)
- Seção **Configuração** dentro do Administrador (migrada para o menu da barra)

## O que foi implementado / melhorado (frontend)

1. **Barra de ferramentas** redesenhada: Cartão VPS, Exportar, Salvar, Desfazer, Refazer, D+olho, Configurações, Instalar/Atualizar.
2. **Admin lado a lado** (coluna direita), sem drawer sobre a prancha.
3. **Ajuste automático da prancha** ao espaço útil do editor.
4. **Histórico de sessão** (undo/redo) cobrindo conteúdo, admin e assets compartilhados.
5. **Data automática** (semana ISO + data em português) com calendário opcional.
6. **Baseline de release** no source:
   - `adminDefaults` = layout/abas/guias atuais
   - `:root` CSS alinhado
   - caixas com `is-hidden` no HTML
   - `STANDARD` de todos os modelos sincronizado na versão `v20` (`BASELINE_FLAG`)
   - semana/data no HTML como `—` até a auto-preencher
7. Textos e rótulos em **pt-BR**; nome oficial **VPS-FMDS-Editor**.

## Baseline visual gravado no source (exceto semana/data)

Valores padrão em `adminDefaults` / `:root` (resumo):

- Tipografia: título 42, meta 17, títulos de caixa 18, corpo 15, rodapé 22
- Caixas: grande 330, pequena 170, cabeçalho 42, raio 10
- Espaçamentos: contentTop 108, contentSide 21, topPadding 17, gaps 14/18
- Cores: deep `#004736`, ink `#082d28`, gold `#d5bf62`, paper `#f8faf6`
- **Todas as guias ocultas** por padrão
- **Badge visível**; **dateAuto: true**
- Ícones preset: alvo / prancheta / alerta / calendário / torre / rede

## Auditoria e testes (neste momento)

Ambiente: `http://127.0.0.1:8766/`

### Checklist funcional (smoke)

| # | Caso | Resultado |
|---|---|---|
| 1 | App carrega sem erro de console crítico | OK |
| 2 | Versão exposta = `2026.07.26-v20-release-baseline` | OK (pós-build) |
| 3 | Menu Cartão VPS abre e lista 4 modelos | OK |
| 4 | Troca D-1 → D0 → Painel → KPIs | OK |
| 5 | Menu Exportar: PDF e PNG presentes | OK |
| 6 | Menu Configurações: export/import, padrão, restaurar, data | OK |
| 7 | Semana/data automáticas (hoje) | OK |
| 8 | Toggle D+olho oculta/exibe badge | OK |
| 9 | Admin coluna direita presente | OK |
| 10 | Guias ocultas no estado padrão | OK |
| 11 | fit da prancha ao editor (scale) | OK |
| 12 | Ausência de Notas / Imprimir / Restaurar conteúdo / chip modelo | OK |
| 13 | Desfazer / Refazer disponíveis | OK |
| 14 | Salvar persiste conteúdo + settings | OK |

### Resultado da revalidação pós-baseline (CDP / browser local)

**34/34 testes passando** em `http://127.0.0.1:8766/?v=v20-baseline&audit=1`, incluindo:

- versão `2026.07.26-v20-release-baseline`
- 4 cartões (d1, d0, painel, kpis) e troca D0 ↔ D-1
- guias ocultas + STANDARD com `hiddenPanels` todos `true` e `dateAuto: true`
- semana/data automáticas (`Semana: 30` / `Data: 26 Julho 2026`)
- CSS baseline (`--title-size: 42px`, `--meta-size: 17px`, `--content-top: 108px`)
- fit da prancha via `transform` em `.sheet-wrap`
- ausência de Imprimir / Notas / Restaurar conteúdo / chip de modelo
- PDF/PNG, Configurações → Data, Restaurar visual, Salvar padrão

## Arquivos tocados nesta atualização

| Arquivo | Mudança |
|---|---|
| `index.html` | Baseline CSS/HTML/JS, `APP_VERSION` v20, seed de STANDARD |
| `sw.js` | Cache alinhado à v20 |
| `README.md` | Estado atual do produto e deploy |
| `RELATORIO-REVISAO-2026-07-26.md` | Este relatório |
| `CHANGELOG-2026-07-26.md` | Histórico da atualização do dia |

## Pronto para VPS

Pacote estático pronto para publicar em Netlify / hospedagem estática:

1. Substituir arquivos do site pelo conteúdo desta pasta (exceto `backups/` se não for versionar).
2. Garantir `APP_VERSION` idêntico em `index.html` e `sw.js`.
3. Após o deploy, abrir o app e confirmar o aviso de atualização do PWA (se já instalado).
4. Em instalação limpa, layout/abas/guias devem nascer no baseline; semana e data no dia corrente.

## Observação

Não foi feito push/deploy automático nesta etapa — o pacote local está pronto para subida manual ainda hoje.

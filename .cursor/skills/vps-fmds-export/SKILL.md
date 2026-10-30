---
name: vps-fmds-export
description: >-
  Regras invioláveis do Baixar/PDF/PNG do VPS-FMDS-Editor. Use ao tocar em
  renderCanvas, bakeFittedImageForExport, prepareImagesForExport,
  normalizeCanvasToSlide, html2canvas, jsPDF, object-fit, report-media ou
  qualquer fluxo de impressão/exportação deste app.
---

# VPS-FMDS-Editor — Exportação (não quebrar)

## Contexto

O app exporta a prancha 16:9 via **html2canvas + jsPDF** (menu Baixar).
Ambientes (VPS, VALE, SONDA, …) compartilham o **mesmo** motor — não há
pipeline por bandeira. Regressão em `bakeFittedImageForExport` / estilos
inline afeta **todos** os ambientes e o PDF do deck.

## Sintoma clássico de regressão

PNG/PDF com **silhueta verde enorme** cobrindo fotos/textos = ícone
(calendário/torre/etc.) estourado na captura.

## Invariantes (não violar)

1. **Ícones assam no próprio `<img>`**, nunca na caixa do pai (`.meta`,
   `.panel-head`, `.footer-left`). Pai flex largo + bake = blob gigante.
2. **Depois do bake: só `width/height` em px explícitos** do tamanho medido.
   Proibido `width/height: 100%` em ícones (estoura no flex).
3. **Slots de foto/logo** usam o container (`.report-media-slot-image`,
   `.free-media-layer`, logos) — aí sim a caixa do pai é correta.
4. **Sem preenchimento escuro** no quadro fotográfico (`#101c1a` ou similar).
   `resolveExportFillColor` → `null`. CSS do slot com imagem → `transparent`.
   Letterbox do `contain` fica sem tinta.
5. **Apresentação Painel/KPI:** `adminStateForPresentation` **não** força painéis
   de texto visíveis. Grid fica `visibility: hidden` com `report-media-active`.
   Chrome (×, toolbar, legendas vazias) oculto em `presentation-open`.
6. **`normalizeCanvasToSlide`**: `drawImage` usa **sempre**
   `sourceCanvas.width/height` na origem — nunca `targetWidth/Height` como
   recorte (corta título/rodapé).
7. Captura na prancha **viva** travada em 1280×720 (sem scale/sombra/borda).
   Clone off-screen já causou layout quebrado — só reintroduzir com teste.
8. Libs em `vendor/` (offline); CDN só fallback. `APP_VERSION` idêntico em
   `index.html` e `sw.js`.

## Antes de mudar exportação

- [ ] Diff mínimo — não “melhorar” bake/ícones/fill sem necessidade.
- [ ] Testar **PNG** e **PDF** no Painel Geral com 3 fotos (contain).
- [ ] Testar **PDF do deck** com 2+ cards Exibir.
- [ ] Confirmar ícone de calendário na meta **pequeno**, não cobrindo a arte.
- [ ] Confirmar letterbox **sem** faixa preta/verde atrás da foto.
- [ ] Trocar bandeira (VALE/SONDA/…) e repetir um export — mesmo motor.

## Funções sensíveis

`renderCanvas`, `prepareImagesForExport`, `bakeFittedImageForExport`,
`applyBakedImageStyles`, `measureExportBox`, `resolveExportBox`,
`resolveExportFillColor`, `normalizeCanvasToSlide`, `lockSheetForExport`,
`downloadPng`, `downloadPdf`, `downloadDeckPdf`.

## Lição (v51 → v52)

Mexer no que “parecia inocente” (`width: 100%` + medir o pai) quebrou o
Baixar em todos os ambientes. Se a exportação está boa, **não refatore**
o bake por higiene — só com bug reproduzido e checklist acima.

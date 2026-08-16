# Relatório de validação — v51

**Data:** 29 de julho de 2026  
**Build:** `2026.07.29-v51-export-print-fix`  
**Ambiente:** `http://127.0.0.1:8766/`

## Problema crônico (impressão / PDF / PNG)

**Causa raiz:** em `normalizeCanvasToSlide`, o `drawImage` usava `targetCanvas.width/height` como recorte da *origem*. Quando o html2canvas devolvia canvas maior que 3840×2160 (borda, scale, DPR), a captura **cortava** o fundo da prancha — título e/ou rodapé sumiam ou saíam do quadro.

**Correção:** contain da origem completa + caminho off-screen + trava sem borda/sombra + libs locais.

## Testes automatizados (Puppeteer)

**22 casos** — evidência em `backups/audit-v51/`:

| Área | Resultado |
|---|---|
| Versão v51 | OK |
| 4 cartões + troca | OK |
| Badge D+olho | OK |
| Semana/data auto | OK |
| Fit da prancha | OK |
| 7 bandeiras | OK |
| Exibir / Apresentação | OK |
| normalize sem crop | OK |
| Export 3840×2160 | OK |
| Vendor libs | OK |
| PDF do deck (API) | OK |
| Sem erros de console | OK |

## Checklist manual sugerido

1. Hard refresh em http://127.0.0.1:8766/
2. Baixar → **PDF 16:9** e **PNG 16:9** — conferir título + rodapé + logos
3. Marcar 2+ cartões com **Exibir** → Baixar → **PDF do deck**
4. Iniciar Apresentação e navegar com setas / Esc
5. Trocar bandeira e confirmar isolamento de ambiente

## Pronto para validação final

Pacote local pronto. Após OK do usuário: publicar Netlify + alinhar GitHub (`APP_VERSION` idêntico em `index.html` e `sw.js`).

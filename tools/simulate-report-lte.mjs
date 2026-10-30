/**
 * Gera um pacote #rlte= simulado (Report LTE → FMDS) com D-3, D-2, D-1 e D0.
 * Uso: node tools/simulate-report-lte.mjs
 *      node tools/simulate-report-lte.mjs --open
 */
import { writeFileSync } from "fs";
import { spawn } from "child_process";

function makeAttention(paragraph, items) {
  const parts = [];
  if (paragraph) parts.push(`<p>${paragraph}</p>`);
  if (items?.length) parts.push(`<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`);
  return parts.join("");
}

function makeList(items) {
  return `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}

const payload = {
  kind: "report-lte-fmds-card",
  version: 2,
  brand: "vps",
  team: { label: "Equipe VPS · Sonda LTE" },
  period: { label: "Semana 44 · 27–30 out 2026" },
  hide: [],
  cards: [
    {
      modelId: "d3",
      content: {
        executionTitle: "Programação PCM: D-3",
        executionList: makeList([
          "Checklist pré-trabalho em altura — sites Z-140 / Z-141 (Concluído)",
          "Liberação de PTW e isolamento energético no site Y-018 (Concluído)",
          "Recebimento e conferência de RRU Ericsson — lote #4421 (Em progresso)",
          "Alinhamento com logística Vale — janela de acesso sexta à noite"
        ]),
        attentionTitle: "Pontos de Atenção",
        attentionBody: makeAttention(
          "Frente climática úmida na região; priorizar atividades em solo na manhã.",
          [
            "Atraso de 1 dia no caminhão de fibra — replanejar Y-018 para D-2.",
            "Equipe de içamento reduzida (1 técnico em ASOlimpo)."
          ]
        ),
        helpLeftTitle: "Pedidos de ajuda",
        helpLeftList: makeList([
          "Confirmar com Vale a liberação de chave do container Y-018.",
          "Suporte N2 Ericsson para alarmes de VSWR no Z-140."
        ]),
        helpRightTitle: "Atividades extras",
        helpRightList: makeList(["Registro fotográfico de inventário RRU."])
      }
    },
    {
      modelId: "d2",
      content: {
        executionTitle: "Programação PCM: D-2",
        executionList: makeList([
          "Instalação de RRU no site Z-141 (Em progresso)",
          "Lançamento de FO 12FO trecho Y-018 → POP Sul (Pendente)",
          "Teste de throughput LTE-A pré-corte no Z-140 (Concluído)",
          "Manutenção preventiva gerador backup — site X-03 (Pendente)"
        ]),
        attentionTitle: "Pontos de Atenção",
        attentionBody: makeAttention(
          "Janela noturna confirmada 22h–04h; rádio de coordenação canal 4.",
          [
            "Cabo FO 12FO ainda em trânsito — ETA 16h.",
            "Risco de interferência com obra civil no POP Sul."
          ]
        ),
        helpLeftTitle: "Pedidos de ajuda",
        helpLeftList: makeList([
          "Solicitar escolta de segurança Vale para acesso noturno Y-018.",
          "Empréstimo de OTDR da equipe Network (turno B)."
        ]),
        helpRightTitle: "Atividades extras",
        helpRightList: makeList(["Atualizar mapa de FO no sharepoint da sonda."])
      }
    },
    {
      modelId: "d1",
      content: {
        executionTitle: "Programação PCM: D-1",
        executionList: makeList([
          "Finalizar instalação RRU Z-141 + comissionamento (Em progresso)",
          "Ajuste de azimute antena setorial site Y-021 (Pendente)",
          "Corte e emenda FO no POP Sul — 4 fusões (Pendente)",
          "Briefing D0 com times VPS + Vale + Sonda (16:30)"
        ]),
        attentionTitle: "Pontos de Atenção",
        attentionBody: makeAttention(
          "Ventos fortes previstos após 14h — protocolos de trabalho em altura obrigatórios.",
          [
            "Atraso logístico de jumpers ½\" para Y-021 — usar estoque X-03.",
            "Contagem de inventário de peças sobressalentes pendente (prioridade baixa)."
          ]
        ),
        helpLeftTitle: "Pedidos de ajuda",
        helpLeftList: makeList([
          "Suporte técnico Nível 2 Ericsson — alarme RET no Z-141.",
          "Confirmar presença do fiscal Vale no briefing das 16:30."
        ]),
        helpRightTitle: "Atividades extras",
        helpRightList: makeList(["Aprovação de acesso de terceiros ao site X-03."])
      }
    },
    {
      modelId: "d0",
      content: {
        executionTitle: "Programação PCM: D0",
        executionList: makeList([
          "Execução do plano D0 — sites Z-141, Y-021 e POP Sul",
          "Comissionamento final RRU Z-141 e liberação comercial (meta 12h)",
          "Ajuste de azimute Y-021 + validação drive-test setor 2",
          "Conclusão das 4 fusões FO no POP Sul e teste ponta-a-ponta",
          "Manutenção gerador X-03 (janela 09h–11h)",
          "Encerramento FMDS e registro de evidências no Report LTE"
        ]),
        attentionTitle: "Pontos de Atenção",
        attentionBody: makeAttention(
          "Foco do dia: programação PCM + pontos de atenção / pedidos de ajuda.",
          [
            "Clima: chuva isolada à tarde — priorizar altura pela manhã.",
            "Garantir rádio e checklist de içamento antes do primeiro lift."
          ]
        ),
        helpLeftTitle: "Pedidos de ajuda",
        helpLeftList: makeList([
          "Standby N2 Ericsson até 18h para Z-141.",
          "Disponibilizar 2 jumpers ½\" reserva no Y-021 até 08:30.",
          "Apoio Network para validação de VLAN management pós-fusão."
        ]),
        helpRightTitle: "Atividades extras",
        helpRightList: makeList(["Fotos de antes/depois para o Painel Geral."])
      }
    }
  ]
};

function toBase64Url(obj) {
  const json = JSON.stringify(obj);
  const b64 = Buffer.from(json, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

const token = toBase64Url(payload);
const url = `http://127.0.0.1:8766/#rlte=${token}`;
writeFileSync(new URL("./simulate-report-lte-url.txt", import.meta.url), url, "utf8");
writeFileSync(new URL("./simulate-report-lte-payload.json", import.meta.url), JSON.stringify(payload, null, 2), "utf8");

console.log("Pacote Report LTE (VPS · D-3 / D-2 / D-1 / D0)");
console.log(`  kind=${payload.kind} version=${payload.version} brand=${payload.brand}`);
console.log(`  team=${payload.team.label}`);
console.log(`  period=${payload.period.label}`);
console.log(`  cards=${payload.cards.map((c) => c.modelId).join(", ")}`);
console.log(`  tokenChars=${token.length}`);
console.log("");
console.log(url);

if (process.argv.includes("--open")) {
  const cmd = process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  spawn(cmd, args, { detached: true, stdio: "ignore" }).unref();
  console.log("\nAbrindo no navegador… confirme «Aplicar consolidado».");
}

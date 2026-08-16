#!/usr/bin/env bash
#
# VPS-FMDS-Editor — deploy para vps-fmds-editor.techartsolucoes.com.br
#
# Roda na SUA máquina (a que tem a chave privada e rota até o VPS).
# Idempotente: pode rodar quantas vezes quiser. Guarda backup e permite rollback.
#
#   ./deploy.sh                 → publica
#   ./deploy.sh --dry-run       → mostra o que mudaria, sem enviar
#   ./deploy.sh --rollback      → volta para o backup anterior
#
set -Eeuo pipefail

# ── Configuração ───────────────────────────────────────────────────────────
# Caminhos confirmados no servidor em 04/08/2026 via hPanel:
#   nginx (host, não Docker) → /etc/nginx/sites-available/vps-fmds-editor.techartsolucoes.com.br
#   root                     → /var/www/vps-fmds-editor.techartsolucoes.com.br/html
SSH_HOST="${SSH_HOST:-root@187.127.28.74}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_ROOT="${REMOTE_ROOT:-/var/www/vps-fmds-editor.techartsolucoes.com.br/html}"
REMOTE_BACKUPS="${REMOTE_BACKUPS:-/var/backups/vps-fmds-editor}"
DOMAIN="${DOMAIN:-vps-fmds-editor.techartsolucoes.com.br}"
KEEP_BACKUPS="${KEEP_BACKUPS:-5}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BOLD=$'\033[1m'; OFF=$'\033[0m'
log()  { printf '%s==>%s %s\n' "$BOLD" "$OFF" "$*"; }
ok()   { printf '%s  ✓%s %s\n' "$GREEN" "$OFF" "$*"; }
warn() { printf '%s  !%s %s\n' "$YELLOW" "$OFF" "$*"; }
die()  { printf '%s  ✗%s %s\n' "$RED" "$OFF" "$*" >&2; exit 1; }

SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
remote() { ssh "${SSH_OPTS[@]}" "$SSH_HOST" "$@"; }

MODE="deploy"
RSYNC_EXTRA=()
for arg in "$@"; do
  case "$arg" in
    --dry-run)  MODE="dry-run"; RSYNC_EXTRA+=(--dry-run --itemize-changes) ;;
    --rollback) MODE="rollback" ;;
    -h|--help)  sed -n '2,12p' "$0"; exit 0 ;;
    *) die "Opção desconhecida: $arg" ;;
  esac
done

# ── Pré-voo ────────────────────────────────────────────────────────────────
log "Verificando pré-requisitos locais"
command -v ssh >/dev/null || die "ssh não encontrado. Use o Git Bash ou instale openssh-client."
command -v tar >/dev/null || die "tar não encontrado."

# rsync é o ideal, mas não vem no Git Bash nem no Ubuntu mínimo do WSL.
# Sem ele, caímos para tar-sobre-ssh, que só depende de tar + ssh.
# TRANSFER=tar ./deploy.sh força o modo sem rsync (útil para testar).
if [[ -n "${TRANSFER:-}" ]]; then
  :
elif command -v rsync >/dev/null; then
  TRANSFER="rsync"
else
  TRANSFER="tar"
  warn "rsync ausente — usando tar sobre ssh (mesmo resultado, sem transferência incremental)."
fi
ok "Método de transferência: $TRANSFER"

# ── Localização da chave privada ───────────────────────────────────────────
# Armadilha do WSL: a chave costuma estar do lado Windows (/mnt/c/Users/<voce>/.ssh).
# O ssh RECUSA chave com permissão frouxa, e /mnt/c expõe tudo como 777 — por isso
# copiamos para o home do Linux com 600 antes de usar.
find_ssh_key() {
  local candidates=(
    "$SSH_KEY"
    "$HOME/.ssh/id_ed25519" "$HOME/.ssh/id_rsa"
    "/mnt/c/Users/$USER/.ssh/id_ed25519" "/mnt/c/Users/$USER/.ssh/id_rsa"
  )
  # Descobre o usuário do Windows quando rodando sob WSL
  if [[ -d /mnt/c/Users ]]; then
    local winuser
    winuser="$(cmd.exe /c 'echo %USERNAME%' 2>/dev/null | tr -d '\r\n' || true)"
    [[ -n "$winuser" ]] && candidates+=("/mnt/c/Users/$winuser/.ssh/id_ed25519" "/mnt/c/Users/$winuser/.ssh/id_rsa")
  fi
  local c
  for c in "${candidates[@]}"; do
    [[ -f "$c" ]] || continue
    if [[ "$c" == /mnt/* ]]; then
      # Em /mnt/* a permissão não é ajustável: copia para o home do Linux com 600.
      mkdir -p "$HOME/.ssh" && chmod 700 "$HOME/.ssh"
      cp -f "$c" "$HOME/.ssh/$(basename "$c")"
      chmod 600 "$HOME/.ssh/$(basename "$c")"
      warn "Chave copiada de $c para ~/.ssh (o ssh recusa chaves em /mnt/c por permissão 777)."
      echo "$HOME/.ssh/$(basename "$c")"
      return 0
    fi
    chmod 600 "$c" 2>/dev/null || true
    echo "$c"
    return 0
  done
  return 1
}

if ! SSH_KEY="$(find_ssh_key)"; then
  die "Chave privada SSH não encontrada.
     Procurei em ~/.ssh/ e em /mnt/c/Users/<voce>/.ssh/ (WSL).
     Rode com o caminho explícito:  SSH_KEY=/caminho/da/chave ./deploy.sh
     A chave que começa com 'ssh-ed25519 AAAA...' é a PÚBLICA — aqui é a PRIVADA
     (mesmo nome, sem a extensão .pub)."
fi
ok "Chave: $SSH_KEY"

[[ -f "$SOURCE_DIR/index.html" ]] || die "index.html não encontrado em $SOURCE_DIR"
ok "Origem: $SOURCE_DIR"

# Sintaxe do bundle antes de publicar — evita subir um app quebrado.
if command -v node >/dev/null; then
  log "Validando index.html e sw.js"
  node --check "$SOURCE_DIR/sw.js" || die "sw.js com erro de sintaxe."
  node -e '
    const fs=require("fs");
    const html=fs.readFileSync(process.argv[1],"utf8");
    const open=html.indexOf("\n  <script>\n");
    const close=html.indexOf("\n  </script>\n");
    if(open<0||close<0) { console.error("Bloco de script inline não localizado."); process.exit(1); }
    const js=html.slice(open+11, close);
    // Um "</script" dentro do JS encerra o bloco no parser HTML e quebra o app.
    if(js.includes("</script")) { console.error("Sequência </script dentro do JS inline."); process.exit(1); }
    new Function(js);
    const v1=(html.match(/APP_VERSION\s*=\s*"([^"]+)"/)||[])[1];
    const v2=(fs.readFileSync(process.argv[2],"utf8").match(/APP_VERSION\s*=\s*"([^"]+)"/)||[])[1];
    if(v1!==v2){ console.error(`APP_VERSION divergente: index=${v1} sw=${v2}`); process.exit(1); }
    console.log("  versão:", v1);
  ' "$SOURCE_DIR/index.html" "$SOURCE_DIR/sw.js" || die "Validação do index.html falhou."
  ok "Sintaxe e versões conferem"
else
  warn "node não encontrado — pulando validação de sintaxe."
fi

log "Testando acesso SSH a $SSH_HOST"
if remote "echo conectado" >/dev/null 2>&1; then
  ok "SSH ok"
elif [[ "$MODE" == "dry-run" && "$TRANSFER" == "tar" ]]; then
  # O dry-run em modo tar só lista arquivos locais — não precisa do servidor.
  warn "Sem conexão SSH; seguindo apenas com a listagem local."
else
  die "Não foi possível conectar. Confira SSH_HOST, SSH_KEY e firewall."
fi

# ── Rollback ───────────────────────────────────────────────────────────────
if [[ "$MODE" == "rollback" ]]; then
  log "Procurando backup mais recente"
  LAST="$(remote "ls -1d $REMOTE_BACKUPS/*/ 2>/dev/null | sort | tail -1" || true)"
  [[ -n "$LAST" ]] || die "Nenhum backup em $REMOTE_BACKUPS"
  log "Restaurando de $LAST"
  remote "rsync -a --delete '$LAST' '$REMOTE_ROOT/' && chown -R www-data:www-data '$REMOTE_ROOT'"
  remote "nginx -t && systemctl reload nginx"
  ok "Rollback concluído. Confira https://$DOMAIN/"
  exit 0
fi

# ── Backup ─────────────────────────────────────────────────────────────────
if [[ "$MODE" == "deploy" ]]; then
  log "Backup do conteúdo atual"
  remote "mkdir -p '$REMOTE_BACKUPS' '$REMOTE_ROOT'
          if [ -n \"\$(ls -A '$REMOTE_ROOT' 2>/dev/null)\" ]; then
            cp -a '$REMOTE_ROOT' '$REMOTE_BACKUPS/$STAMP'
            echo '    backup: $REMOTE_BACKUPS/$STAMP'
          else
            echo '    diretório vazio — sem backup'
          fi
          ls -1d '$REMOTE_BACKUPS'/*/ 2>/dev/null | sort | head -n -$KEEP_BACKUPS | xargs -r rm -rf"
  ok "Backup pronto"
fi

# ── Publicação ─────────────────────────────────────────────────────────────
# Tudo que NÃO deve ser servido publicamente. Documentação interna
# (CHANGELOG, relatórios) ficaria acessível por URL se subisse junto.
EXCLUDES=(.git .netlify node_modules backups deploy tests .cursor server.pid
          _audit_test.mjs netlify netlify.toml firebase.json .gitignore
          _headers database.rules.json iniciar-vps-live.cmd
          README.md CHANGELOG-2026-07-26.md FMDS-AO-VIVO.md
          RELATORIO-REVISAO-2026-07-26.md RELATORIO-VALIDACAO-v51.md)

log "Sincronizando arquivos ($MODE, via $TRANSFER)"

if [[ "$TRANSFER" == "rsync" ]]; then
  RS_EXC=()
  for e in "${EXCLUDES[@]}"; do RS_EXC+=(--exclude "$e"); done
  rsync -az --delete --human-readable \
    -e "ssh ${SSH_OPTS[*]}" \
    "${RSYNC_EXTRA[@]}" \
    "${RS_EXC[@]}" --exclude '*.log' --exclude '*.tmp.js' --exclude 'package*.json' \
    "$SOURCE_DIR/" "$SSH_HOST:$REMOTE_ROOT/"
else
  TAR_EXC=()
  for e in "${EXCLUDES[@]}"; do TAR_EXC+=(--exclude="$e"); done
  TAR_EXC+=(--exclude='*.log' --exclude='*.tmp.js' --exclude='package*.json')

  if [[ "$MODE" == "dry-run" ]]; then
    log "Arquivos que seriam enviados:"
    tar czf - -C "$SOURCE_DIR" "${TAR_EXC[@]}" . | tar tzf - | sed 's|^\./||' | grep -v '^$' | sort
  else
    # Envia para uma área de staging e só então troca — o site nunca fica
    # meio-publicado, e o diretório antigo vira .old para rollback imediato.
    STAGE="/tmp/fmds-stage-$STAMP"
    tar czf - -C "$SOURCE_DIR" "${TAR_EXC[@]}" . \
      | remote "mkdir -p '$STAGE' && tar xzf - -C '$STAGE' && echo '    extraído em $STAGE'"
    remote "test -f '$STAGE/index.html'" || die "Staging incompleto — nada foi trocado."
    remote "rm -rf '$REMOTE_ROOT.old'
            if [ -d '$REMOTE_ROOT' ]; then mv '$REMOTE_ROOT' '$REMOTE_ROOT.old'; fi
            mv '$STAGE' '$REMOTE_ROOT'"
    ok "Troca atômica concluída (anterior em $REMOTE_ROOT.old)"
  fi
fi

if [[ "$MODE" == "dry-run" ]]; then
  ok "Dry-run concluído — nada foi alterado no servidor."
  exit 0
fi

log "Ajustando permissões"
remote "chown -R www-data:www-data '$REMOTE_ROOT' && find '$REMOTE_ROOT' -type d -exec chmod 755 {} + && find '$REMOTE_ROOT' -type f -exec chmod 644 {} +"
ok "Permissões aplicadas"

log "Recarregando nginx"
remote "nginx -t" || die "nginx -t falhou — configuração inválida, nada foi recarregado."
remote "systemctl reload nginx"
ok "nginx recarregado"

# ── Verificação pós-deploy ─────────────────────────────────────────────────
log "Verificando a publicação"
sleep 2
STATUS="$(curl -sS -o /dev/null -w '%{http_code}' "https://$DOMAIN/" || echo 000)"
[[ "$STATUS" == "200" ]] && ok "HTTP $STATUS em https://$DOMAIN/" || warn "HTTP $STATUS — confira o nginx e o certificado."

VERSION_REMOTE="$(curl -sS "https://$DOMAIN/sw.js" | grep -o 'APP_VERSION = "[^"]*"' | head -1 || true)"
[[ -n "$VERSION_REMOTE" ]] && ok "sw.js publicado: $VERSION_REMOTE" || warn "Não foi possível ler a versão do sw.js remoto."

for header in content-security-policy x-content-type-options referrer-policy; do
  if curl -sSI "https://$DOMAIN/" | grep -qi "^$header:"; then
    ok "Cabeçalho $header presente"
  else
    warn "Cabeçalho $header AUSENTE — aplique deploy/nginx.conf"
  fi
done

printf '\n%sDeploy concluído.%s  Backup: %s/%s\n' "$BOLD" "$OFF" "$REMOTE_BACKUPS" "$STAMP"
printf 'Rollback: %s --rollback\n' "$0"
printf '\nNo navegador, abra Configurações → Checklist FMDS e confirme:\n'
printf '  • App e Service Worker na mesma versão\n'
printf '  • Firebase Realtime Database disponível\n'

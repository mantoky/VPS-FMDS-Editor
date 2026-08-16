# Deploy — VPS-FMDS-Editor

**Destino:** `https://vps-fmds-editor.techartsolucoes.com.br/`
**Servidor:** `root@187.127.28.74`
**Versão publicável:** `2026.08.04-v55-hardening`

---

## Por que você precisa rodar isto, e não eu

Duas coisas impedem o deploy a partir da sessão:

1. **Sem rota de rede.** O sandbox sai por um proxy com allowlist. `ssh` para
   `187.127.28.74:22` responde *Network is unreachable*, e `curl` no domínio
   volta `403` do proxy. Não é firewall do seu VPS — é o ambiente daqui.
2. **A chave enviada é a pública.** `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...` é o
   conteúdo de um `.pub`. Serve para *autorizar* um cliente no servidor, não para
   autenticar como cliente. A chave privada correspondente está na sua máquina e
   **não deve ser compartilhada** — nem comigo, nem em chat, nem em repositório.

Se um dia quiser que eu publique direto, o caminho é um MCP de deploy
(GitHub Actions, Netlify, Vercel, Render) com credencial própria — não a chave
SSH de root.

---

## Onde rodar

**Use o Git Bash.** É o caminho com menos atrito no Windows: o `$HOME` dele é
`C:\Users\robso`, então sua chave em `C:\Users\robso\.ssh\id_ed25519` é
encontrada sozinha e com a permissão certa.

1. Abra o **Explorador de Arquivos** na pasta `vps_fmds_live\deploy`
2. Clique com o botão direito num espaço vazio → **Open Git Bash here**
3. Rode:

```bash
./deploy.sh --dry-run      # lista o que subiria, sem tocar no servidor
./deploy.sh                # publica
```

### Se preferir o WSL

Funciona, mas tem duas armadilhas que o script agora resolve sozinho:

- Sua chave está do lado Windows (`/mnt/c/Users/robso/.ssh/`). O `ssh` **recusa**
  chave em `/mnt/c` porque lá tudo aparece como permissão 777. O script detecta
  isso e copia a chave para `~/.ssh` com `600` antes de usar.
- O Ubuntu do WSL costuma vir **sem `rsync`**. O script detecta e cai para
  `tar` sobre `ssh`, que só precisa de `tar` + `ssh`.

```bash
cd "/mnt/d/Desenvolvedor/APPs/VPS_Editor_outros/em desenvolvimento_used/VPS_FMDS_Editor_LIVE_LOCAL_REVIEW_oficial/vps_fmds_live/deploy"
./deploy.sh
```

### Variáveis úteis

```bash
SSH_KEY=/caminho/da/chave ./deploy.sh   # chave em local não padrão
TRANSFER=tar ./deploy.sh                # força o modo sem rsync
REMOTE_ROOT=/outro/caminho ./deploy.sh  # outro docroot
```

### Modo sem rsync: como a troca acontece

O pacote vai para `/tmp/fmds-stage-<timestamp>` no servidor, é conferido, e só
então o diretório é trocado por `mv`. O site nunca fica meio-publicado, e o
anterior vira `<docroot>.old` para rollback imediato.

### O que o `deploy.sh` faz

1. Valida `sw.js` e o script inline do `index.html` — inclusive a armadilha do
   `</script` dentro do JS, que quebra o app silenciosamente.
2. Confere que `APP_VERSION` bate entre `index.html` e `sw.js`.
3. Testa o SSH antes de tocar em qualquer coisa.
4. Copia o diretório atual para `/var/backups/vps-fmds-editor/<timestamp>`
   e mantém os 5 mais recentes.
5. `rsync --delete` para `/var/www/vps-fmds-editor`, excluindo `backups/`,
   `node_modules/`, `tests/`, `deploy/`, logs, `server.pid` e os arquivos
   específicos da Netlify.
6. Ajusta dono (`www-data`) e permissões (755/644).
7. `nginx -t` antes de recarregar — configuração inválida aborta sem derrubar o site.
8. Verifica HTTP 200, a versão do `sw.js` publicado e a presença dos cabeçalhos
   de segurança.

### Rollback

```bash
./deploy.sh --rollback
```

Restaura o backup mais recente e recarrega o nginx.

---

## Primeira vez no servidor

```bash
# 1. Autorizar sua chave (cole a PÚBLICA, a que você me enviou)
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@187.127.28.74

# 2. Criar os diretórios
ssh root@187.127.28.74 'mkdir -p /var/www/vps-fmds-editor /var/backups/vps-fmds-editor'

# 3. Instalar a configuração do nginx
scp deploy/nginx.conf root@187.127.28.74:/etc/nginx/sites-available/vps-fmds-editor
ssh root@187.127.28.74 '
  ln -sf ../sites-available/vps-fmds-editor /etc/nginx/sites-enabled/vps-fmds-editor
  nginx -t && systemctl reload nginx'

# 4. Certificado (se ainda não existir)
ssh root@187.127.28.74 'certbot --nginx -d vps-fmds-editor.techartsolucoes.com.br'
```

O DNS de `vps-fmds-editor.techartsolucoes.com.br` precisa apontar (A/AAAA) para
`187.127.28.74` antes do passo 4.

---

## Depois de publicar

### 1. Firebase

`firebase-config.js` ainda está com os placeholders (`COLE_AQUI`, `SEU_PROJETO`)
e `enabled: false`. **Enquanto isso, a sala FMDS funciona só localmente**
(BroadcastChannel, mesmo navegador) — não atravessa dispositivos.

Para ligar o multi-site:

1. Console do Firebase → Authentication → **Anonymous**: ativar.
2. Realtime Database: criar.
3. Publicar as regras:
   ```bash
   firebase deploy --only database
   ```
   (usa `database.rules.json`, que agora valida o formato do `roomId` e traz o
   modelo de acesso documentado no topo)
4. Preencher `firebase-config.js` e trocar `enabled` para `true`.

O `sw.js` agora serve `firebase-config.js` em network-first — trocar as
credenciais e recarregar passa a surtir efeito sem bumpar o `CACHE_NAME`.

### 2. Checklist FMDS no navegador

Configurações → **Checklist FMDS**. Confirme:

- App e Service Worker na mesma versão
- Firebase Realtime Database disponível *(antes esse item acusava falha sempre —
  era o bug do probe lendo a raiz)*
- Contexto seguro (HTTPS)

### 3. Teste manual dos pontos que mudaram

| O quê | Como | Esperado |
|---|---|---|
| HUD da apresentação | Iniciar apresentação → clicar **Próximo/Anterior/Sair** | Responde ao clique (antes: só teclado) |
| Motores de impressão | Exportar → PNG 16:9, PDF 16:9, PDF do deck | Idêntico ao de antes |
| Pacote FMDS | Exportar pacote → importar em outro navegador | Conteúdo e fotos preservados |
| Sala ao vivo | Abrir sala → conferir o código | 10 caracteres (era 6) |

---

## Ligar o JPEG no PDF do deck

`index.html`, perto do topo do script:

```js
const EXPORT_DECK_FORMAT = "png";   // troque para "jpeg"
const EXPORT_DECK_JPEG_QUALITY = 0.95;
```

PNG é o padrão e mantém o motor de impressão histórico byte-a-byte. `"jpeg"`
reduz o PDF do deck em ~5-10x. Os exports de cartão único não são afetados.

Ao trocar, **bumpe o `APP_VERSION` nos dois arquivos** (`index.html` e `sw.js`)
— o `deploy.sh` recusa publicar se divergirem.

---

## Testes

```bash
npm install jsdom          # uma vez
node tests/smoke.mjs .     # 37 verificações
```

Cobre: boot sem exceção, listeners do HUD, sanitização (preserva o baseline e
neutraliza 7 vetores de XSS), injeção de CSS, formato dos IDs de sala e
distribuição dos tokens, sincronia de versão e round-trip do pacote FMDS.

Vale rodar antes de todo deploy — foi ele que pegou o `</script` que eu mesmo
introduzi dentro de um comentário durante esta refatoração.

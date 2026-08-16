# FMDS ao vivo multi-site (Firebase)

Guia operacional para apresentar o VPS-FMDS-Editor em vários locais com **baixa latência** e **baixo volume de rede**.

## Princípio

| Antes do FMDS | Ao vivo |
|---|---|
| Pacote do deck (textos + fotos) distribuído uma vez | Só o **índice do slide** no Firebase |
| Cada site importa o pacote e renderiza local | Sem reenviar imagens a cada troca |

## Configurar Firebase (obrigatório para multi-site)

1. Crie um projeto em [Firebase Console](https://console.firebase.google.com)
2. **Authentication** → Sign-in method → ative **Anonymous**
3. **Realtime Database** → crie o banco → publique as regras de [`database.rules.json`](database.rules.json):

```bash
firebase deploy --only database
```

4. Em Project settings → Your apps → Web, copie a config para [`firebase-config.js`](firebase-config.js)
5. Defina `enabled: true` e salve
6. Publique o app (Netlify) com o `firebase-config.js` preenchido

Sem Firebase configurado, a sala cai no fallback **local** (BroadcastChannel / mesmo navegador).

## Checklist pré-FMDS

No app: **Apresentação → Checklist**.

1. Marcar os cartões com **Exibir**
2. **Exportar pacote** e enviar o JSON aos sites
3. Em cada site: **Importar pacote**
4. Confirmar armazenamento local abaixo de ~4,5 MB
5. Checklist: “Firebase Realtime Database disponível”
6. Testar **Abrir sala** → link espectador em outro aparelho

## Fluxo no dia

### Apresentador (HQ)

1. Confirmar pacote
2. **Abrir sala** (cria nó em `fmdsLiveRooms/{sala}` + auth anônima)
3. Enviar link de espectador
4. **Iniciar como apresentador** e avançar slides

### Cada site remoto

1. **Importar pacote**
2. Abrir link `?modo=view&sala=…&vt=…`
3. A tela segue o índice publicado no Firebase

## Segurança

- Escritas na sala: só o `presenterUid` (Firebase Anonymous Auth)
- Leitura pública do índice (token de espectador validado no cliente)
- HTTPS em produção
- **Nunca** gravar fotos/data-URLs no Realtime Database

## Arquivos

| Arquivo | Função |
|---|---|
| `firebase-config.js` | Credenciais Web (`enabled: true`) |
| `database.rules.json` | Regras RTDB |
| `firebase.json` | Deploy das regras |
| `index.html` | Pacote + sala + modos view/presenter |

## Build

`2026.07.29-v54-presentation-media`

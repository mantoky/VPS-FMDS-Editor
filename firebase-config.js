/**
 * Firebase — VPS-FMDS-Editor (canal FMDS ao vivo)
 *
 * 1. Crie um projeto em https://console.firebase.google.com
 * 2. Ative Authentication → Anonymous
 * 3. Ative Realtime Database (produção ou teste) e publique database.rules.json
 * 4. Em Project settings → Your apps → Web, copie a config abaixo
 * 5. Defina enabled: true
 *
 * Nunca grave fotos do deck no Realtime Database — só índice/metadados da sala.
 */
window.VPS_FIREBASE_CONFIG = {
  enabled: false,
  apiKey: "COLE_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO-default-rtdb.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000"
};

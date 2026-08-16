/**
 * LEGADO — canal de sala via Netlify Function.
 * Substituído por Firebase Realtime Database (v47).
 * Mantido só para referência; o app não chama mais este endpoint.
 */
exports.handler = async () => ({
  statusCode: 410,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  },
  body: JSON.stringify({
    error: "Canal /api/room descontinuado. Use Firebase Realtime Database (firebase-config.js)."
  })
});

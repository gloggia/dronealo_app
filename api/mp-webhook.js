/**
 * Stub para demo: Mercado Pago puede notificar aquí en producción.
 * Sin base de datos, solo registramos en logs de Vercel.
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  console.log("[mp-webhook demo]", req.method, typeof req.body === "object" ? JSON.stringify(req.body) : req.body);
  res.status(200).send("ok");
};

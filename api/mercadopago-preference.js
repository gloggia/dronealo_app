/**
 * Crea una preferencia de Checkout Pro vía API REST (sin SDK npm).
 * Vercel Node 18+ tiene fetch nativo: no requiere npm install local ni dependencias.
 */
module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token || String(token).trim() === "") {
    res.status(501).json({
      error: "no_config",
      message: "Definí MERCADOPAGO_ACCESS_TOKEN en Vercel (credenciales de prueba).",
    });
    return;
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch (e) {
    res.status(400).json({ error: "invalid_json" });
    return;
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "invalid_amount" });
    return;
  }

  const title = String(body.title || "Dronealo · pedido").slice(0, 120);
  const externalReference = String(body.external_reference || "").slice(0, 256) || undefined;
  const returnQuery = String(body.return_query || "").replace(/^\?/, "");
  const siteUrl = String(body.site_url || "").replace(/\/$/, "");

  let base = siteUrl;
  if (!base && process.env.VERCEL_URL) {
    base = "https://" + process.env.VERCEL_URL;
  }
  if (!base) {
    res.status(400).json({ error: "missing_site_url", message: "Falta site_url en el cuerpo del POST." });
    return;
  }

  const q = returnQuery ? "&" + returnQuery : "";
  const preferencePayload = {
    items: [
      {
        title,
        quantity: 1,
        currency_id: "ARS",
        unit_price: Math.round(amount),
      },
    ],
    external_reference: externalReference,
    back_urls: {
      success: `${base}/confirmacion.html?mp=success${q}`,
      failure: `${base}/confirmacion.html?mp=failure${q}`,
      pending: `${base}/confirmacion.html?mp=pending${q}`,
    },
    auto_return: "approved",
  };

  try {
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });

    const result = await mpRes.json().catch(function () {
      return {};
    });

    if (!mpRes.ok) {
      const msg =
        (result && result.message) ||
        (result && result.cause && JSON.stringify(result.cause)) ||
        "Error de Mercado Pago (" + mpRes.status + ")";
      res.status(502).json({ error: "mercadopago_error", message: String(msg) });
      return;
    }

    const initPoint =
      result.init_point ||
      result.sandbox_init_point ||
      (result.response && (result.response.init_point || result.response.sandbox_init_point));
    const prefId = result.id || (result.response && result.response.id);

    if (!initPoint) {
      res.status(502).json({ error: "no_init_point", message: "Respuesta inesperada de Mercado Pago." });
      return;
    }

    res.status(200).json({ init_point: initPoint, id: prefId });
  } catch (err) {
    const msg = err && err.message ? err.message : "mercadopago_error";
    res.status(502).json({ error: "mercadopago_error", message: msg });
  }
};

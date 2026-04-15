(function () {
  var panels = document.querySelectorAll(".step-panel");
  var dots = document.querySelectorAll(".step-dot");
  var current = 0;

  var tipo = document.getElementById("tipo");
  var precioDisplay = document.getElementById("precioDisplay");
  var pickedCategoryLabel = document.getElementById("pickedCategoryLabel");
  var precios = {
    foto: "$120.000",
    inspeccion: "$145.000",
    evento: "$180.000",
    agro: "$165.000",
    campo: "$165.000",
    construccion: "$155.000",
  };

  var preciosARS = {
    foto: 120000,
    inspeccion: 145000,
    evento: 180000,
    agro: 165000,
    campo: 165000,
    construccion: 155000,
  };

  var categoriaPorTipo = {
    foto: "Audiovisual · Foto y video aéreo",
    evento: "Audiovisual · Eventos",
    inspeccion: "Inspección técnica",
    agro: "Agro · Agricultura y campo",
    campo: "Agro · Agricultura y campo",
    construccion: "Otros · Obra y construcción",
  };

  var tiposValidos = { foto: 1, evento: 1, inspeccion: 1, agro: 1, construccion: 1, campo: 1 };

  function updatePrice() {
    if (tipo && precioDisplay && tipo.value && precios[tipo.value]) {
      precioDisplay.textContent = precios[tipo.value];
    }
  }

  function setTipoDesdeUrl() {
    var q = new URLSearchParams(window.location.search).get("tipo");
    if (q === "campo") q = "agro";
    if (!q || !tiposValidos[q]) {
      window.location.replace("elegir-categoria.html");
      return false;
    }
    if (tipo) tipo.value = q;
    if (pickedCategoryLabel && categoriaPorTipo[q]) {
      pickedCategoryLabel.innerHTML =
        '<strong style="color:var(--brand-blue-dark)">Categoría:</strong> ' + categoriaPorTipo[q];
    }
    updatePrice();
    return true;
  }

  if (!setTipoDesdeUrl()) return;

  function showStep(index) {
    current = Math.max(0, Math.min(index, panels.length - 1));
    panels.forEach(function (p, i) {
      p.classList.toggle("active", i === current);
    });
    dots.forEach(function (d, i) {
      d.classList.remove("active", "done");
      if (i < current) d.classList.add("done");
      if (i === current) d.classList.add("active");
    });
    if (current === 3) updatePrice();
  }

  function validatePanel(index) {
    var panel = panels[index];
    var fields = panel.querySelectorAll("input[required], select[required], textarea[required]");
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i].checkValidity()) {
        fields[i].reportValidity();
        return false;
      }
    }
    return true;
  }

  document.querySelectorAll(".btn-next").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!validatePanel(current)) return;
      showStep(current + 1);
    });
  });

  document.querySelectorAll(".btn-prev").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showStep(current - 1);
    });
  });

  var form = document.getElementById("flowForm");
  var refField = document.getElementById("refField");
  var payError = document.getElementById("payError");
  var btnMp = document.getElementById("btnPagarMp");
  var btnSimular = document.getElementById("btnSimularPago");

  function assignRef() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var code = "";
    for (var i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    var ref = "DA-" + code;
    if (refField) refField.value = ref;
    return ref;
  }

  function buildReturnQuery() {
    var fd = new FormData(form);
    var params = new URLSearchParams();
    fd.forEach(function (v, k) {
      if (k !== "acepto" && v !== "" && v !== null) params.set(k, v);
    });
    return params.toString();
  }

  function goConfirmacion(mpState) {
    var fd = new FormData(form);
    var params = new URLSearchParams();
    fd.forEach(function (v, k) {
      if (k !== "acepto" && v !== "" && v !== null) params.set(k, v);
    });
    if (mpState) params.set("mp", mpState);
    window.location.href = "confirmacion.html?" + params.toString();
  }

  function showPayErr(msg) {
    if (!payError) return;
    payError.textContent = msg;
    payError.hidden = false;
  }

  function clearPayErr() {
    if (!payError) return;
    payError.textContent = "";
    payError.hidden = true;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }

  function handlePay(mpMode) {
    clearPayErr();
    if (!validatePanel(3)) return;
    assignRef();
    var t = tipo && tipo.value;
    if (t === "campo") t = "agro";
    var amount = preciosARS[t] || 120000;
    var ref = refField && refField.value;
    var title = "Dronealo · pedido " + ref;

    if (mpMode === "simulated") {
      goConfirmacion("simulated");
      return;
    }

    if (btnMp) btnMp.disabled = true;
    var returnQuery = buildReturnQuery();

    fetch("/api/mercadopago-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amount,
        title: title,
        external_reference: ref,
        return_query: returnQuery,
        site_url: window.location.origin,
      }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, status: r.status, data: data };
        });
      })
      .then(function (out) {
        if (btnMp) btnMp.disabled = false;
        if (out.ok && out.data && out.data.init_point) {
          window.location.href = out.data.init_point;
          return;
        }
        var hint =
          (out.data && out.data.message) ||
          (out.data && out.data.error) ||
          "No se pudo iniciar el pago.";
        if (out.status === 501 || (out.data && out.data.error === "no_config")) {
          hint =
            "Mercado Pago no está configurado en el servidor (falta MERCADOPAGO_ACCESS_TOKEN en Vercel). Usá «Simular pago aprobado» para la demo.";
        }
        showPayErr(hint);
      })
      .catch(function () {
        if (btnMp) btnMp.disabled = false;
        showPayErr(
          "No hay conexión con el servidor de pagos (¿estás en archivo local?). Usá «Simular pago aprobado» o desplegá en Vercel."
        );
      });
  }

  if (btnMp) {
    btnMp.addEventListener("click", function () {
      handlePay("mp");
    });
  }
  if (btnSimular) {
    btnSimular.addEventListener("click", function () {
      handlePay("simulated");
    });
  }
})();

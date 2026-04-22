(function () {
  var P = window.DronealoPricingDemo;
  var A = window.DronealoAuthDemo;
  if (!P) return;

  var panels = document.querySelectorAll(".step-panel");
  var dots = document.querySelectorAll(".step-dot");
  var current = 0;

  var tipo = document.getElementById("tipo");
  var precioDisplay = document.getElementById("precioDisplay");
  var priceBreakdownEl = document.getElementById("priceBreakdown");
  var pickedCategoryLabel = document.getElementById("pickedCategoryLabel");
  var direccionInput = document.getElementById("direccion");
  var availBox = document.getElementById("availabilityBox");

  var categoriaPorTipo = {
    foto: "Audiovisual · Foto y video aéreo",
    evento: "Audiovisual · Eventos",
    inspeccion: "Inspección técnica",
    agro: "Agro · Agricultura y campo",
    campo: "Agro · Agricultura y campo",
    construccion: "Otros · Obra y construcción",
  };

  var tiposValidos = { foto: 1, evento: 1, inspeccion: 1, agro: 1, construccion: 1, campo: 1 };

  function setTipoDesdeUrl() {
    var q = new URLSearchParams(window.location.search).get("tipo");
    if (q === "campo") q = "agro";
    if (!q || !tiposValidos[q]) {
      window.location.replace("servicios.html");
      return false;
    }
    if (tipo) tipo.value = q;
    if (pickedCategoryLabel && categoriaPorTipo[q]) {
      pickedCategoryLabel.innerHTML =
        '<strong style="color:var(--brand-blue-dark)">Categoría:</strong> ' + categoriaPorTipo[q];
    }
    refreshPricingAndAvailability();
    return true;
  }

  if (!setTipoDesdeUrl()) return;

  function refreshPricingAndAvailability() {
    var t = tipo && tipo.value;
    if (t === "campo") t = "agro";
    var dir = direccionInput && direccionInput.value;
    var sig = P.availabilitySignals(dir, t);
    if (availBox) {
      if (!dir || !String(dir).trim()) {
        availBox.hidden = true;
      } else {
        availBox.hidden = false;
        availBox.innerHTML =
          '<p class="availability-strip__title">Disponibilidad en tu zona <span class="availability-strip__badge">simulación</span></p>' +
          '<p class="availability-strip__line"><strong>' +
          sig.pilots +
          "</strong> operadores con perfil compatible cerca de tu ubicación.</p>" +
          '<p class="availability-strip__line">' +
          sig.nextSlot +
          "</p>" +
          '<p class="availability-strip__meta">Asignación estimada: ~' +
          sig.etaMin +
          " min en condiciones típicas.</p>";
      }
    }

    var b = P.computeBreakdown(t, dir);
    if (precioDisplay) precioDisplay.textContent = P.formatARS(b.total);
    if (priceBreakdownEl) {
      priceBreakdownEl.innerHTML =
        '<div class="price-lines">' +
        '<div class="price-line"><span>' +
        b.baseLabel +
        "</span><span>" +
        P.formatARS(b.base) +
        "</span></div>" +
        (b.zona > 0
          ? '<div class="price-line"><span>' +
            b.zonaLabel +
            "</span><span>" +
            P.formatARS(b.zona) +
            "</span></div>"
          : "") +
        '<div class="price-line"><span>' +
        b.segmentLabel +
        "</span><span>× " +
        (b.segmentMult === 1 ? "1" : b.segmentMult.toFixed(2).replace(".", ",")) +
        "</span></div>" +
        "</div>";
    }
  }

  if (direccionInput) {
    direccionInput.addEventListener(
      "input",
      function () {
        refreshPricingAndAvailability();
      },
      { passive: true }
    );
  }

  function prefillUser() {
    if (!A) return;
    var s = A.getSession();
    if (!s) return;
    var nom = document.getElementById("nombre");
    var em = document.getElementById("email");
    var tel = document.getElementById("telefono");
    if (nom && !nom.value) {
      if (s.guest) {
        nom.placeholder = "Nombre y apellido para la orden";
      } else {
        nom.value = (s.nombre + " " + (s.apellido || "")).trim();
      }
    }
    if (em && !em.value) {
      if (s.guest) {
        em.placeholder = "Correo para la confirmación";
      } else {
        em.value = s.email;
      }
    }
    if (tel && !tel.value && s.telefono) tel.value = s.telefono;
  }

  prefillUser();

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
    if (current === 3) refreshPricingAndAvailability();
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

  function buildReturnQuery(mpState) {
    var fd = new FormData(form);
    var params = new URLSearchParams();
    fd.forEach(function (v, k) {
      if (k !== "acepto" && v !== "" && v !== null) params.set(k, v);
    });
    if (mpState) params.set("mp", mpState);

    var t = tipo && tipo.value;
    if (t === "campo") t = "agro";
    var dir = direccionInput && direccionInput.value;
    var b = P.computeBreakdown(t, dir);
    params.set("monto", String(b.total));
    params.set("segmento", P.getSegment());
    var sig = P.availabilitySignals(dir, t);
    params.set("eta", String(sig.etaMin != null ? sig.etaMin : ""));
    params.set("operadores", String(sig.pilots != null ? sig.pilots : ""));

    return params.toString();
  }

  function goConfirmacion(mpState) {
    window.location.href = "confirmacion.html?" + buildReturnQuery(mpState);
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
    var dir = direccionInput && direccionInput.value;
    var amount = P.computeBreakdown(t, dir).total;
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

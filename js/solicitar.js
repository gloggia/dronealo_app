(function () {
  var P = window.DronealoPricingDemo;
  var A = window.DronealoAuthDemo;
  if (!P) return;

  var panels = document.querySelectorAll(".step-panel");
  var dots = document.querySelectorAll(".step-dot");
  var current = 0;

  var tipo = document.getElementById("tipo");
  var precioEstimateDisplay = document.getElementById("precioEstimateDisplay");
  var precioEstimateHint = document.getElementById("precioEstimateHint");
  var priceBreakdownEstimate = document.getElementById("priceBreakdownEstimate");
  var priceBreakdownEl = document.getElementById("priceBreakdown");
  var resumenMeta = document.getElementById("resumenMeta");
  var pickedCategoryLabel = document.getElementById("pickedCategoryLabel");
  var direccionInput = document.getElementById("direccion");
  var fechaInput = document.getElementById("fecha");
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

  function getSelectedHoras() {
    var el = document.querySelector('input[name="duracionHoras"]:checked');
    return el ? Number(el.value) || 2 : 2;
  }

  function shortZona(dir) {
    var d = String(dir || "").trim();
    if (!d) return "Zona a confirmar";
    if (d.length > 28) return d.slice(0, 26) + "…";
    return d;
  }

  function formatFechaResumen(iso) {
    if (!iso) return "Fecha a confirmar";
    var parts = String(iso).split("-");
    if (parts.length !== 3) return iso;
    var y = Number(parts[0]);
    var m = Number(parts[1]) - 1;
    var day = Number(parts[2]);
    var months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    if (m >= 0 && m < 12) return day + " " + months[m];
    return iso;
  }

  function getBreakdown() {
    var t = tipo && tipo.value;
    if (t === "campo") t = "agro";
    var dir = direccionInput && direccionInput.value;
    return P.computeBreakdown(t, dir, getSelectedHoras());
  }

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

    var b = getBreakdown();

    if (precioEstimateDisplay) precioEstimateDisplay.textContent = P.formatARS(b.total);
    if (precioEstimateHint) precioEstimateHint.textContent = b.estimateHint;
    if (priceBreakdownEstimate) {
      priceBreakdownEstimate.innerHTML = P.renderPriceLinesHtml(b, { withTotal: false, withDiscount: false });
    }

    if (priceBreakdownEl) {
      priceBreakdownEl.innerHTML = P.renderPriceLinesHtml(b, { withTotal: true, withDiscount: true });
    }

    if (resumenMeta) {
      var fechaVal = fechaInput && fechaInput.value;
      resumenMeta.textContent =
        b.serviceTitle + " · " + shortZona(dir) + " · " + formatFechaResumen(fechaVal);
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

  document.querySelectorAll('input[name="duracionHoras"]').forEach(function (r) {
    r.addEventListener("change", function () {
      refreshPricingAndAvailability();
    });
  });

  if (fechaInput) {
    fechaInput.addEventListener("change", function () {
      refreshPricingAndAvailability();
    });
  }

  /** Sesión real (no invitado): datos tomados del login y bloqueados para no repetirlos. */
  function applySessionToContactFields() {
    if (!A) return;
    var s = A.getSession();
    var nom = document.getElementById("nombre");
    var em = document.getElementById("email");
    var tel = document.getElementById("telefono");
    if (!nom || !em) return;

    if (!s) {
      nom.removeAttribute("readonly");
      nom.classList.remove("input-from-session");
      em.removeAttribute("readonly");
      em.classList.remove("input-from-session");
      if (tel) {
        tel.removeAttribute("readonly");
        tel.classList.remove("input-from-session");
      }
      return;
    }

    if (s.guest === true) {
      nom.removeAttribute("readonly");
      nom.classList.remove("input-from-session");
      em.removeAttribute("readonly");
      em.classList.remove("input-from-session");
      if (tel) {
        tel.removeAttribute("readonly");
        tel.classList.remove("input-from-session");
      }
      var guestName = (s.nombre + " " + (s.apellido || "")).trim() || s.nombre || "";
      nom.value = guestName;
      em.value = s.email || "";
      nom.placeholder = "Nombre y apellido para la orden";
      em.placeholder = "Correo para la confirmación";
      if (tel) {
        tel.value = s.telefono && String(s.telefono).trim() ? String(s.telefono).trim() : "";
        tel.placeholder = "+54 9 ...";
      }
      return;
    }

    var fullName = (s.nombre + " " + (s.apellido || "")).trim();
    nom.value = fullName || s.nombre;
    nom.readOnly = true;
    nom.classList.add("input-from-session");

    em.value = s.email;
    em.readOnly = true;
    em.classList.add("input-from-session");

    if (tel) {
      if (s.telefono && String(s.telefono).trim()) {
        tel.value = s.telefono.trim();
        tel.readOnly = true;
        tel.classList.add("input-from-session");
      } else {
        tel.readOnly = false;
        tel.removeAttribute("readonly");
        tel.classList.remove("input-from-session");
        tel.placeholder = "Opcional si no cargaste uno al registrarte";
      }
    }
  }

  function updateContactStepHeading() {
    var panel = document.querySelector('.step-panel[data-panel="2"]');
    if (!panel || !A) return;
    var title = panel.querySelector(".step-title");
    var hint = panel.querySelector(".step-hint");
    var s = A.getSession();

    if (!s) {
      if (title) title.textContent = "Tus datos";
      if (hint) hint.textContent = "Los usamos para enviarte la confirmación y el enlace de pago.";
      return;
    }

    if (s.guest === true) {
      if (title) title.textContent = "Tus datos";
      if (hint) {
        hint.textContent =
          "Datos de invitado ya cargados; podés editarlos si querés usar otro nombre o correo para esta orden.";
      }
      return;
    }

    if (title) title.textContent = "Tu cuenta";
    if (hint) {
      hint.textContent =
        "Ya ingresaste con tu cuenta; usamos estos datos para la orden. Si necesitás otro contacto, cerrá sesión en Perfil y volvé a ingresar.";
    }
  }

  applySessionToContactFields();
  updateContactStepHeading();

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
    if (current === 2) {
      applySessionToContactFields();
      updateContactStepHeading();
    }
    refreshPricingAndAvailability();
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
    var b = P.computeBreakdown(t, dir, getSelectedHoras());
    params.set("monto", String(b.total));
    params.set("horas", String(getSelectedHoras()));
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
    var amount = P.computeBreakdown(t, dir, getSelectedHoras()).total;
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

(function () {
  var panels = document.querySelectorAll(".step-panel");
  var dots = document.querySelectorAll(".step-dot");
  var current = 0;

  var tipo = document.getElementById("tipo");
  var precioDisplay = document.getElementById("precioDisplay");
  var precios = {
    foto: "$120.000",
    inspeccion: "$145.000",
    evento: "$180.000",
    campo: "$165.000",
    construccion: "$155.000",
  };

  function updatePrice() {
    if (tipo && precioDisplay && tipo.value && precios[tipo.value]) {
      precioDisplay.textContent = precios[tipo.value];
    }
  }

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

  if (tipo) {
    tipo.addEventListener("change", updatePrice);
  }

  // ?tipo= desde inicio o catálogo
  (function prefillTipo() {
    var q = new URLSearchParams(window.location.search).get("tipo");
    if (tipo && q && tipo.querySelector('option[value="' + q + '"]')) {
      tipo.value = q;
      updatePrice();
    }
  })();

  var form = document.getElementById("flowForm");
  var refField = document.getElementById("refField");

  if (form && refField) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      var code = "";
      for (var i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      refField.value = "DA-" + code;

      var fd = new FormData(form);
      var params = new URLSearchParams();
      fd.forEach(function (v, k) {
        if (k !== "acepto" && v !== "" && v !== null) params.set(k, v);
      });

      window.location.href = "confirmacion.html?" + params.toString();
    });
  }
})();

(function () {
  var A = window.DronealoAuthDemo;
  if (!A) return;

  if (A.getSession()) {
    window.location.replace(A.loginReturnUrl());
    return;
  }

  var btnGuest = document.getElementById("btnGuest");
  if (btnGuest) {
    btnGuest.addEventListener("click", function () {
      A.loginAsGuest();
      window.location.href = A.loginReturnUrl();
    });
  }

  var steps = document.querySelectorAll(".onboarding-step");
  var btnBack = document.getElementById("onbBack");
  var pendingPhone = "";
  var pendingFlow = "phone";
  var pendingProvider = "phone";
  var isReturningUser = false;

  function showStep(id) {
    steps.forEach(function (el) {
      el.classList.toggle("active", el.getAttribute("data-step") === id);
    });
    if (btnBack) {
      var hideBack = id === "phone";
      btnBack.style.visibility = hideBack ? "hidden" : "visible";
      btnBack.setAttribute("aria-hidden", hideBack ? "true" : "false");
    }
  }

  function finishLogin(account) {
    A.setSession({
      email: account.email,
      nombre: account.nombre,
      apellido: account.apellido || "",
      telefono: account.telefono || "",
      authProvider: account.authProvider || "phone",
    });
    window.location.href = A.loginReturnUrl();
  }

  if (btnBack) {
    btnBack.addEventListener("click", function (e) {
      e.preventDefault();
      var visible = document.querySelector(".onboarding-step.active");
      var id = visible ? visible.getAttribute("data-step") : "phone";
      if (id === "sms") showStep("phone");
      else if (id === "password") {
        if (pendingFlow === "social") showStep("social");
        else showStep("sms");
      } else if (id === "profile") showStep("sms");
      else if (id === "social") showStep("phone");
    });
  }

  /* Teléfono */
  var phoneInput = document.getElementById("onbPhone");
  var terms = document.getElementById("onbTerms");
  var btnPhoneNext = document.getElementById("onbPhoneNext");

  function syncPhoneBtn() {
    var d = A.digitsLocal(phoneInput && phoneInput.value);
    var ok = d.length >= 10 && terms && terms.checked;
    if (btnPhoneNext) btnPhoneNext.disabled = !ok;
  }

  if (phoneInput) phoneInput.addEventListener("input", syncPhoneBtn);
  if (terms) terms.addEventListener("change", syncPhoneBtn);

  if (btnPhoneNext) {
    btnPhoneNext.addEventListener("click", function () {
      pendingFlow = "phone";
      pendingProvider = "phone";
      pendingPhone = A.normalizePhoneAR(phoneInput.value);
      isReturningUser = !!A.findAccountByPhone(pendingPhone);
      var hint = document.getElementById("onbSmsHint");
      if (hint) {
        hint.textContent = isReturningUser
          ? "Ingresá 6 dígitos (simulación). Después te pediremos la clave de tu cuenta en este dispositivo."
          : "Primera vez: ingresá 6 dígitos (simulación). Después completás tu perfil.";
      }
      var smsIn = document.getElementById("onbSmsCode");
      if (smsIn) smsIn.value = "";
      showStep("sms");
    });
  }

  /* SMS (solo flujo teléfono) */
  var btnSmsNext = document.getElementById("onbSmsNext");
  if (btnSmsNext) {
    btnSmsNext.addEventListener("click", function () {
      if (pendingFlow !== "phone") return;
      var code = document.getElementById("onbSmsCode");
      if (!code || !A.isValidSmsCode(code.value)) {
        code.setCustomValidity("Ingresá 6 dígitos");
        code.reportValidity();
        code.setCustomValidity("");
        return;
      }
      if (isReturningUser) showStep("password");
      else showStep("profile");
    });
  }

  /* Contraseña demo */
  var btnPassNext = document.getElementById("onbPassNext");
  if (btnPassNext) {
    btnPassNext.addEventListener("click", function () {
      var inp = document.getElementById("onbPassword");
      if (!inp || !A.verifyDemoPassword(inp.value)) {
        if (inp) {
          inp.setCustomValidity("Clave incorrecta para esta cuenta de prueba.");
          inp.reportValidity();
          inp.setCustomValidity("");
        }
        return;
      }
      var acc =
        pendingFlow === "phone"
          ? A.findAccountByPhone(pendingPhone)
          : A.findAccountByEmail(document.getElementById("socEmail").value.trim());
      if (acc) finishLogin(acc);
    });
  }

  /* Perfil nuevo (celular) */
  var btnProfileNext = document.getElementById("onbProfileNext");
  if (btnProfileNext) {
    btnProfileNext.addEventListener("click", function () {
      var nom = document.getElementById("profNombre");
      var ape = document.getElementById("profApellido");
      var em = document.getElementById("profEmail");
      if (!nom.checkValidity() || !ape.checkValidity() || !em.checkValidity()) {
        nom.reportValidity();
        return;
      }
      var row = {
        telefono: pendingPhone,
        email: em.value.trim(),
        nombre: nom.value.trim(),
        apellido: ape.value.trim(),
        authProvider: "phone",
      };
      A.saveAccount(row);
      finishLogin(row);
    });
  }

  /* Google / Facebook demo */
  function openSocial(provider) {
    pendingFlow = "social";
    pendingProvider = provider;
    pendingPhone = "";
    isReturningUser = false;
    var t = document.getElementById("socTitle");
    var b = document.getElementById("socBadge");
    if (t) t.textContent = provider === "google" ? "Continuar con Google" : "Continuar con Facebook";
    if (b) b.textContent = "Simulación · no es OAuth real";
    var nom = document.getElementById("socNombre");
    var ape = document.getElementById("socApellido");
    var em = document.getElementById("socEmail");
    if (provider === "google") {
      if (nom) nom.value = "Usuario";
      if (ape) ape.value = "Demo";
      if (em) em.value = "usuario.google.demo@dronealo.app";
    } else {
      if (nom) nom.value = "Usuario";
      if (ape) ape.value = "Demo";
      if (em) em.value = "usuario.facebook.demo@dronealo.app";
    }
    showStep("social");
  }

  var g = document.getElementById("onbGoogle");
  var f = document.getElementById("onbFacebook");
  if (g) g.addEventListener("click", function () { openSocial("google"); });
  if (f) f.addEventListener("click", function () { openSocial("facebook"); });

  var btnSocNext = document.getElementById("onbSocialNext");
  if (btnSocNext) {
    btnSocNext.addEventListener("click", function () {
      var nom = document.getElementById("socNombre");
      var ape = document.getElementById("socApellido");
      var em = document.getElementById("socEmail");
      if (!nom.checkValidity() || !ape.checkValidity() || !em.checkValidity()) {
        nom.reportValidity();
        return;
      }
      var email = em.value.trim().toLowerCase();
      var existing = A.findAccountByEmail(email);
      if (existing) {
        isReturningUser = true;
        showStep("password");
        var ph = document.getElementById("onbPassHint");
        if (ph) {
          ph.textContent = "Esta cuenta ya existe en esta demo. Ingresá la clave que usaste al registrarte.";
        }
        return;
      }
      var row = {
        telefono: "",
        email: em.value.trim(),
        nombre: nom.value.trim(),
        apellido: ape.value.trim(),
        authProvider: pendingProvider,
      };
      A.saveAccount(row);
      finishLogin(row);
    });
  }

  var flow = new URLSearchParams(window.location.search).get("flow");
  if (flow === "registro") {
    /* opcional: foco en teléfono */
    if (phoneInput) phoneInput.focus();
  }

  showStep("phone");
})();

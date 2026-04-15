(function () {
  var KEY = "dronealo_demo_session";
  var ACCOUNTS_KEY = "dronealo_demo_accounts";

  var DEMO_PASSWORD = "1234567";
  /** Código SMS de ejemplo en copy; también se acepta cualquier 6 dígitos. */
  var DEMO_SMS_CODE = "123456";

  function safeParse(json) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  /** Solo dígitos del número local (sin +54). */
  function digitsLocal(raw) {
    return String(raw || "").replace(/\D/g, "");
  }

  /** Clave única para Argentina en demo: +54 + dígitos que ingresó el usuario. */
  function normalizePhoneAR(localDigits) {
    var d = digitsLocal(localDigits);
    if (!d) return "";
    return "+54" + d;
  }

  function getAccounts() {
    var raw = localStorage.getItem(ACCOUNTS_KEY);
    var arr = safeParse(raw);
    return Array.isArray(arr) ? arr : [];
  }

  function saveAccount(account) {
    var tel = String(account.telefono || "").trim();
    var em = String(account.email || "")
      .trim()
      .toLowerCase();
    var list = getAccounts().filter(function (a) {
      if (tel && a.telefono === tel) return false;
      if (em && String(a.email || "")
        .toLowerCase() === em) return false;
      return true;
    });
    list.push({
      telefono: tel,
      email: em,
      nombre: String(account.nombre || "").trim(),
      apellido: String(account.apellido || "").trim(),
      authProvider: account.authProvider || "phone",
    });
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
  }

  function findAccountByPhone(telefonoNorm) {
    var t = String(telefonoNorm || "").trim();
    if (!t) return null;
    var list = getAccounts();
    for (var i = 0; i < list.length; i++) {
      if (list[i].telefono === t) return list[i];
    }
    return null;
  }

  function findAccountByEmail(email) {
    var em = String(email || "")
      .trim()
      .toLowerCase();
    if (!em) return null;
    var list = getAccounts();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].email || "").toLowerCase() === em) return list[i];
    }
    return null;
  }

  function verifyDemoPassword(pw) {
    return String(pw || "") === DEMO_PASSWORD;
  }

  /** Código SMS simulado: cualquier 6 dígitos (incluye 123456). */
  function isValidSmsCode(code) {
    return /^[0-9]{6}$/.test(String(code || "").trim());
  }

  function getSession() {
    var raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    var o = safeParse(raw);
    if (!o || typeof o.email !== "string" || typeof o.nombre !== "string") return null;
    if (!o.email.trim() || !o.nombre.trim()) return null;
    return {
      email: o.email.trim(),
      nombre: o.nombre.trim(),
      apellido: typeof o.apellido === "string" ? o.apellido.trim() : "",
      telefono: typeof o.telefono === "string" ? o.telefono.trim() : "",
      authProvider: o.authProvider || "phone",
    };
  }

  function setSession(session) {
    if (!session || !session.email || !session.nombre) return;
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        email: String(session.email).trim(),
        nombre: String(session.nombre).trim(),
        apellido: String(session.apellido || "").trim(),
        telefono: String(session.telefono || "").trim(),
        authProvider: session.authProvider || "phone",
      })
    );
  }

  function clearSession() {
    sessionStorage.removeItem(KEY);
  }

  function displayName(s) {
    if (!s) return "";
    var a = (s.nombre || "").trim();
    var b = (s.apellido || "").trim();
    return (a + " " + b).trim() || a;
  }

  function initials(session) {
    if (!session) return "?";
    if (typeof session === "string") {
      var p2 = session.trim().split(/\s+/);
      var a2 = (p2[0] && p2[0][0]) || "";
      var b2 = (p2[1] && p2[1][0]) || "";
      return (a2 + b2).toUpperCase() || "?";
    }
    var parts = displayName(session).split(/\s+/).filter(Boolean);
    var x = (parts[0] && parts[0][0]) || "";
    var y = (parts[1] && parts[1][0]) || "";
    return (x + y).toUpperCase() || "?";
  }

  function loginReturnUrl() {
    var q = new URLSearchParams(window.location.search).get("return");
    if (q && q.indexOf("http") !== 0 && q.indexOf("//") !== 0) {
      return q;
    }
    return "index.html";
  }

  function redirectToLogin() {
    var path = window.location.pathname || "";
    var base = path.replace(/[^/]+$/, "");
    var ret = path.split("/").pop() + window.location.search;
    window.location.href = (base || "") + "login.html?return=" + encodeURIComponent(ret);
  }

  window.DronealoAuthDemo = {
    KEY: KEY,
    ACCOUNTS_KEY: ACCOUNTS_KEY,
    DEMO_PASSWORD: DEMO_PASSWORD,
    DEMO_SMS_CODE: DEMO_SMS_CODE,
    getSession: getSession,
    setSession: setSession,
    clearSession: clearSession,
    initials: initials,
    displayName: displayName,
    loginReturnUrl: loginReturnUrl,
    redirectToLogin: redirectToLogin,
    normalizePhoneAR: normalizePhoneAR,
    digitsLocal: digitsLocal,
    getAccounts: getAccounts,
    saveAccount: saveAccount,
    findAccountByPhone: findAccountByPhone,
    findAccountByEmail: findAccountByEmail,
    verifyDemoPassword: verifyDemoPassword,
    isValidSmsCode: isValidSmsCode,
  };
})();

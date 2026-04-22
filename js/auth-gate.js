(function () {
  var path = window.location.pathname || "";
  var name = (path.split("/").pop() || "").split("?")[0].toLowerCase();

  var publicPages = {
    "login.html": true,
    "registro.html": true,
    "index.html": true,
    "servicios.html": true,
  };

  if (publicPages[name]) return;
  if (!window.DronealoAuthDemo) return;
  if (window.DronealoAuthDemo.getSession()) return;

  var file = path.split("/").pop() || "index.html";
  var ret = file + window.location.search;
  window.location.replace("login.html?return=" + encodeURIComponent(ret));
})();

(function () {
  var SEGMENT_KEY = "dronealo_segment";

  var preciosARS = {
    foto: 120000,
    inspeccion: 145000,
    evento: 180000,
    agro: 165000,
    campo: 165000,
    construccion: 155000,
  };

  var labelsTipo = {
    foto: "Servicio base (audiovisual estándar)",
    inspeccion: "Servicio base (inspección técnica)",
    evento: "Servicio base (eventos)",
    agro: "Servicio base (agro/campo)",
    campo: "Servicio base (agro/campo)",
    construccion: "Servicio base (obra/construcción)",
  };

  function getSegment() {
    try {
      var s = sessionStorage.getItem(SEGMENT_KEY);
      if (s === "b2b") return "b2b";
    } catch (e) {}
    return "b2c";
  }

  function setSegment(seg) {
    try {
      sessionStorage.setItem(SEGMENT_KEY, seg === "b2b" ? "b2b" : "b2c");
    } catch (e) {}
  }

  function hashStr(str) {
    var s = String(str || "");
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  /** Suplemento simulado por zona (según texto de dirección, estable por hash). */
  function zoneSupplement(direccion) {
    var d = String(direccion || "").trim();
    if (!d) return 0;
    var h = hashStr(d.toLowerCase());
    return 8000 + (h % 14) * 1500;
  }

  function segmentMultiplier() {
    return getSegment() === "b2b" ? 1.12 : 1;
  }

  function segmentLabel() {
    return getSegment() === "b2b" ? "Perfil empresa (prioridad de asignación)" : "Perfil particular";
  }

  function formatARS(n) {
    return (
      "$" +
      Math.round(n).toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  }

  /**
   * Señales simuladas estables por dirección + tipo.
   */
  function availabilitySignals(direccion, tipo) {
    var d = String(direccion || "").trim();
    var t = String(tipo || "foto");
    var seed = hashStr(d + "|" + t);
    if (!d) {
      return {
        pilots: null,
        etaMin: null,
        nextSlot: "Indicá una dirección para estimar disponibilidad.",
      };
    }
    var pilots = 4 + (seed % 11);
    var etaMin = 25 + (seed % 50);
    var busy = seed % 4 === 0;
    var nextSlot = busy
      ? "Alta demanda en la zona: próximo hueco estimado mañana 9:00–12:00 hs."
      : "Buena disponibilidad: asignación típica en menos de " + etaMin + " min.";
    return {
      pilots: pilots,
      etaMin: etaMin,
      nextSlot: nextSlot,
    };
  }

  function computeBreakdown(tipo, direccion) {
    var t = tipo === "campo" ? "agro" : tipo;
    var base = preciosARS[t] != null ? preciosARS[t] : 120000;
    var zona = zoneSupplement(direccion);
    var mult = segmentMultiplier();
    var sub = base + zona;
    var total = Math.round(sub * mult);
    return {
      tipo: t,
      base: base,
      baseLabel: labelsTipo[t] || labelsTipo.foto,
      zona: zona,
      zonaLabel: zona > 0 ? "Desplazamiento / zona (estimado)" : "Zona estándar (sin suplemento)",
      segment: getSegment(),
      segmentLabel: segmentLabel(),
      segmentMult: mult,
      subtotalSinSegmento: sub,
      total: total,
      includes:
        "Incluye sesión de vuelo de referencia (~45 min en sitio), operador verificado ANAC con seguro al día cuando corresponde, y entrega digital en alta definición. Permisos o zonas restringidas pueden requerir costo adicional (te avisamos antes de cobrar).",
    };
  }

  window.DronealoPricingDemo = {
    SEGMENT_KEY: SEGMENT_KEY,
    preciosARS: preciosARS,
    getSegment: getSegment,
    setSegment: setSegment,
    hashStr: hashStr,
    zoneSupplement: zoneSupplement,
    formatARS: formatARS,
    availabilitySignals: availabilitySignals,
    computeBreakdown: computeBreakdown,
  };
})();

(function () {
  var SEGMENT_KEY = "dronealo_segment";

  /** Tarifa 1ª hora y costo por hora adicional por tipo (ARS, demo). */
  var pricingByTipo = {
    foto: { base1h: 50000, extraHour: 40000, titulo: "Foto y video aéreo" },
    evento: { base1h: 75000, extraHour: 55000, titulo: "Cobertura de evento" },
    inspeccion: { base1h: 60000, extraHour: 42500, titulo: "Inspección técnica" },
    agro: { base1h: 65000, extraHour: 50000, titulo: "Agro y campo" },
    campo: { base1h: 65000, extraHour: 50000, titulo: "Agro y campo" },
    construccion: { base1h: 62000, extraHour: 46500, titulo: "Obra y construcción" },
  };

  var ENTREGA_HD = 10000;

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

  /** Desplazamiento estable por dirección (demo). */
  function travelAmount(direccion) {
    var d = String(direccion || "").trim();
    if (!d) return 20000;
    var h = hashStr(d.toLowerCase());
    return 15000 + (h % 11) * 2000;
  }

  function travelLabel(amount, direccion) {
    var d = String(direccion || "").trim();
    if (!d) return "Desplazamiento zona estándar";
    if (amount <= 22000) return "Desplazamiento zona estándar";
    return "Desplazamiento (estimado)";
  }

  function segmentMultiplier() {
    return getSegment() === "b2b" ? 1.12 : 1;
  }

  function segmentLabel() {
    return getSegment() === "b2b" ? "Ajuste perfil empresa" : "Perfil particular";
  }

  function firstOrderDiscount() {
    try {
      if (sessionStorage.getItem("dronealo_first_order_done") === "1") return 0;
    } catch (e) {}
    return 0;
  }

  function formatARS(n) {
    var v = Math.round(Math.abs(n));
    return (
      "$" +
      v.toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  }

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

  /**
   * horas: 1 | 2 | 3 | 4 (4 = 4+ hs en UI; se cotizan 3 hs adicionales como tope demo).
   */
  function computeBreakdown(tipo, direccion, horas) {
    var t = tipo === "campo" ? "agro" : tipo;
    var cfg = pricingByTipo[t] || pricingByTipo.foto;
    var h = Number(horas);
    if (!h || h < 1) h = 2;
    if (h > 4) h = 4;

    var extraHours = Math.max(0, h - 1);
    var base1h = cfg.base1h;
    var extraPerHour = cfg.extraHour;
    var lineaExtra = extraPerHour * extraHours;
    var travel = travelAmount(direccion);
    var travelLbl = travelLabel(travel, direccion);
    var hd = ENTREGA_HD;

    var subtotalServicio = base1h + lineaExtra + travel + hd;
    var mult = segmentMultiplier();
    var segmentExtra = mult > 1 ? Math.round(subtotalServicio * (mult - 1)) : 0;
    var subtotalConSegmento = subtotalServicio + segmentExtra;
    var discount = firstOrderDiscount();
    var total = Math.max(0, subtotalConSegmento - discount);

    var lines = [];
    lines.push({ label: "Tarifa base (1 hs)", amount: base1h, kind: "item" });
    if (extraHours > 0) {
      lines.push({
        label: "+ " + extraHours + " hs adicional" + (extraHours > 1 ? "es" : ""),
        amount: lineaExtra,
        kind: "item",
      });
    }
    lines.push({ label: travelLbl, amount: travel, kind: "item" });
    lines.push({ label: "Entrega digital HD", amount: hd, kind: "item" });
    if (segmentExtra > 0) {
      lines.push({ label: segmentLabel(), amount: segmentExtra, kind: "segment" });
    }

    return {
      tipo: t,
      serviceTitle: cfg.titulo,
      horas: h,
      lines: lines,
      base1h: base1h,
      lineaExtra: lineaExtra,
      travel: travel,
      travelLabel: travelLbl,
      entregaHD: hd,
      subtotalServicio: subtotalServicio,
      segmentMult: mult,
      segmentExtra: segmentExtra,
      discount: discount,
      discountLabel: "Descuento primer pedido",
      total: total,
      estimateHint:
        "estimado para " +
        h +
        (h === 1 ? " hora" : " horas") +
        ". El precio final se confirma según zona y duración real.",
    };
  }

  function renderPriceLinesHtml(b, options) {
    options = options || {};
    var withTotal = options.withTotal !== false;
    var withDiscount = options.withDiscount === true;

    var html = '<div class="price-lines">';
    b.lines.forEach(function (line) {
      var cls = "price-line";
      if (line.kind === "discount") cls += " price-line--discount";
      if (line.kind === "segment") cls += " price-line--segment";
      html +=
        '<div class="' +
        cls +
        '"><span>' +
        line.label +
        '</span><span class="price-line__amt">' +
        formatARS(line.amount) +
        "</span></div>";
    });
    if (withDiscount) {
      var disc = b.discount || 0;
      var discCls = "price-line price-line--discount";
      html +=
        '<div class="' +
        discCls +
        '"><span>' +
        b.discountLabel +
        '</span><span class="price-line__amt">-' +
        formatARS(disc) +
        "</span></div>";
    }
    if (withTotal) {
      html +=
        '<div class="price-total-row"><span>Total</span><span class="price-total-row__amt">' +
        formatARS(b.total) +
        "</span></div>";
    }
    html += "</div>";
    return html;
  }

  window.DronealoPricingDemo = {
    SEGMENT_KEY: SEGMENT_KEY,
    getSegment: getSegment,
    setSegment: setSegment,
    hashStr: hashStr,
    formatARS: formatARS,
    availabilitySignals: availabilitySignals,
    computeBreakdown: computeBreakdown,
    renderPriceLinesHtml: renderPriceLinesHtml,
    ENTREGA_HD: ENTREGA_HD,
  };
})();

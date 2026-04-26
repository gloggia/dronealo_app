(function () {
  const params = new URLSearchParams(window.location.search);
  const pedidoRef = params.get('pedido') || '—';
  const pilotoDisplay = params.get('piloto') ? decodeURIComponent(params.get('piloto')) : 'Carlos R.';
  const isMockValorado = params.get('valorado') === '1';
  const prefillStars = parseInt(params.get('stars') || '0', 10) || 0;
  const pilotAvg = parseFloat(params.get('avg') || '4.8');
  const pilotReviews = parseInt(params.get('reviews') || '127', 10);

  const formView = document.getElementById('valoracionFormView');
  const successView = document.getElementById('valoracionSuccessView');
  const mockView = document.getElementById('valoracionMockView');
  const questionEl = document.getElementById('valoracionQuestion');
  const refEl = document.getElementById('valoracionPedidoRef');
  const form = document.getElementById('valoracionForm');
  const starsWrap = document.getElementById('starRatingGroup');
  const ratingInput = document.getElementById('ratingValue');
  const ratingLevelText = document.getElementById('ratingLevelText');
  const ratingError = document.getElementById('ratingError');
  const tagsWrap = document.getElementById('ratingTagsGroup');
  const tagsInput = document.getElementById('selectedTagsValue');
  const successStarsRow = document.getElementById('successStarsRow');
  const successRatingText = document.getElementById('successRatingText');
  const successAverageText = document.getElementById('successAverageText');
  const skipBtn = document.getElementById('skipRatingBtn');

  const ratingLabels = {
    1: 'Muy malo',
    2: 'Mejorable',
    3: 'Aceptable',
    4: 'Muy bueno',
    5: 'Excelente',
  };

  function setView(which) {
    [formView, successView, mockView].forEach(function (el) {
      if (!el) return;
      el.hidden = el.dataset.view !== which;
    });
  }

  if (refEl) refEl.textContent = pedidoRef;
  if (!isMockValorado && questionEl) {
    questionEl.textContent = '¿Cómo fue tu vuelo con ' + pilotoDisplay + '?';
  }

  if (isMockValorado) {
    setView('mock');
    return;
  }

  setView('form');

  let currentRating = 0;
  const selectedTags = new Set();

  if (skipBtn) {
    skipBtn.href = 'pedidos.html';
  }

  function updateRatingLevel(value) {
    if (!ratingLevelText) return;
    ratingLevelText.textContent = value > 0 ? ratingLabels[value] : 'Seleccioná una calificación';
  }

  function paintStars(value) {
    const buttons = starsWrap ? starsWrap.querySelectorAll('[data-star]') : [];
    buttons.forEach(function (btn) {
      const n = parseInt(btn.getAttribute('data-star'), 10);
      const on = n <= value;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.classList.toggle('star-rating__btn--active', on);
    });
    if (ratingInput) ratingInput.value = value > 0 ? String(value) : '';
    updateRatingLevel(value);
  }

  function paintSuccessStars(value) {
    if (!successStarsRow) return;
    const fullStars = Math.max(0, Math.min(5, value));
    let html = '';
    for (let i = 0; i < fullStars; i += 1) html += '<span class="star-row__star">★</span>';
    successStarsRow.innerHTML = html;
  }

  function formatDecimal(value) {
    return value.toFixed(1).replace('.', ',');
  }

  function updateTagsInput() {
    if (!tagsInput) return;
    tagsInput.value = Array.from(selectedTags).join(', ');
  }

  if (starsWrap) {
    starsWrap.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-star]');
      if (!btn) return;
      currentRating = parseInt(btn.getAttribute('data-star'), 10);
      paintStars(currentRating);
      if (ratingError) ratingError.hidden = true;
    });

    starsWrap.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        currentRating = Math.min(5, currentRating + 1 || 1);
        paintStars(currentRating);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        currentRating = Math.max(1, (currentRating || 2) - 1);
        paintStars(currentRating);
      }
    });
  }

  if (tagsWrap) {
    tagsWrap.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-tag]');
      if (!btn) return;
      const tag = btn.getAttribute('data-tag');
      if (!tag) return;
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        btn.setAttribute('aria-pressed', 'false');
        btn.classList.remove('rating-tag-btn--active');
      } else {
        selectedTags.add(tag);
        btn.setAttribute('aria-pressed', 'true');
        btn.classList.add('rating-tag-btn--active');
      }
      updateTagsInput();
    });
  }

  if (prefillStars > 0) {
    currentRating = Math.max(1, Math.min(5, prefillStars));
    paintStars(currentRating);
  } else {
    updateRatingLevel(0);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!ratingInput || !ratingInput.value) {
        if (ratingError) ratingError.hidden = false;
        if (starsWrap) starsWrap.focus();
        return;
      }
      const sentRating = parseInt(ratingInput.value, 10);
      const newReviews = pilotReviews + 1;
      const newAvg = ((pilotAvg * pilotReviews) + sentRating) / newReviews;
      paintSuccessStars(sentRating);
      if (successRatingText) {
        successRatingText.textContent = sentRating + ' estrellas · ' + ratingLabels[sentRating];
      }
      if (successAverageText) {
        successAverageText.textContent = 'Nuevo promedio de ' + pilotoDisplay + ': ' + formatDecimal(newAvg) + ' (' + newReviews + ' reseñas)';
      }
      setView('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();

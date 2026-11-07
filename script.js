// --- STATE ---
const VALID_TABS = ['links', 'atrativos', 'parceiros', 'hospedagem', 'gastronomia', 'clima', 'rota'];
let windyLoaded = false;
let googleMapLoaded = false;

// 1. Tab Switching Logic with URL Hash Support
function switchTab(tabId, updateHistory = true) {
  if (!VALID_TABS.includes(tabId)) tabId = 'links';
  const activeContent = document.getElementById(`tab-${tabId}`);
  if (!activeContent) return;

  // Update URL hash without jumping
  if (updateHistory) {
    const newHash = tabId === 'links' ? window.location.pathname + window.location.search : `#${tabId}`;
    window.history.replaceState(null, '', newHash);
  }

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });
  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-selected', 'true');
  }

  // Update content visibility
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  activeContent.classList.add('active');

  // Update background lights
  VALID_TABS.forEach(bg => {
    const bgEl = document.getElementById(`bg-lights-${bg}`);
    if (bgEl) bgEl.classList.add('opacity-0');
  });
  const activeBg = document.getElementById(`bg-lights-${tabId}`);
  if (activeBg) activeBg.classList.remove('opacity-0');
  
  // Scroll to top
  const scrollArea = document.getElementById('main-scroll');
  if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });

  // Lazy load maps when their tabs are opened
  if (tabId === 'clima' && !windyLoaded) {
    updateWindyMap();
    windyLoaded = true;
  }
  if (tabId === 'rota' && !googleMapLoaded) {
    loadGoogleMap();
    googleMapLoaded = true;
  }
}

// Initialize tab from URL hash on page load / back-forward navigation
function handleHashRoute() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash && VALID_TABS.includes(hash)) {
    switchTab(hash, false);
  } else {
    switchTab('links', false);
  }
}
window.addEventListener('hashchange', handleHashRoute);
window.addEventListener('DOMContentLoaded', handleHashRoute);

// 2. Submenu Toggle (Site Oficial)
document.addEventListener('DOMContentLoaded', () => {
  const siteBtn = document.getElementById('site-oficial-btn');
  const siteSubmenu = document.getElementById('site-submenu');
  const siteArrow = document.getElementById('site-arrow');

  if (siteBtn && siteSubmenu && siteArrow) {
    siteBtn.addEventListener('click', () => {
      const isExpanded = siteBtn.getAttribute('aria-expanded') === 'true';
      siteBtn.setAttribute('aria-expanded', String(!isExpanded));
      siteSubmenu.setAttribute('aria-hidden', String(isExpanded));

      if (!isExpanded) {
        siteSubmenu.classList.remove('max-h-0', 'opacity-0', 'pointer-events-none', 'mt-0');
        siteSubmenu.classList.add('max-h-[500px]', 'opacity-100', 'pointer-events-auto', 'mt-2');
        siteArrow.classList.add('rotate-180');
      } else {
        siteSubmenu.classList.remove('max-h-[500px]', 'opacity-100', 'pointer-events-auto', 'mt-2');
        siteSubmenu.classList.add('max-h-0', 'opacity-0', 'pointer-events-none', 'mt-0');
        siteArrow.classList.remove('rotate-180');
      }
    });
  }
});

// 3. Modern Toast & Clipboard Logic
let toastTimeout = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  if (toastTimeout) clearTimeout(toastTimeout);
  toastMsg.textContent = message;
  toast.classList.remove('opacity-0', 'translate-y-3');
  toast.classList.add('opacity-100', 'translate-y-0');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-3');
  }, 2600);
}

async function copyText(text, successMessage) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
      return;
    } catch (_) {
      // Fall through to legacy copy
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast(successMessage);
  } catch (err) {
    showToast('Não foi possível copiar.');
  }
  document.body.removeChild(textarea);
}

function copyCoord() {
  copyText('-25.430564, -48.760243', 'Coordenadas copiadas!');
}

// 4. Share Logic
function shareProfile(title, text) {
  const shareUrl = window.location.href;
  if (navigator.share) {
    navigator.share({ title, text, url: shareUrl }).catch(() => {});
  } else {
    copyText(shareUrl, 'Link da página copiado!');
  }
}

// 5. Windy Map Logic (Lazy Loaded & Active State Highlighting)
let currentWindyOverlay = 'wind';
let currentWindyLat = -25.4283;
let currentWindyLon = -48.7119;

function updateWindyMap() {
  const mapContainer = document.getElementById('map-container');
  if (!mapContainer) return;
  const baseUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=12&product=ecmwf&level=surface&marker=true&detailLat=${currentWindyLat}&detailLon=${currentWindyLon}&lat=${currentWindyLat}&lon=${currentWindyLon}&overlay=${currentWindyOverlay}`;
  
  mapContainer.innerHTML = `<iframe title="Mapa Meteorológico Windy" width="100%" height="100%" src="${baseUrl}" frameborder="0" loading="lazy" class="absolute inset-0 w-full h-full"></iframe>`;
}

function changeWindyLayer(overlay, btnId) {
  currentWindyOverlay = overlay;
  ['layer-wind', 'layer-rain', 'layer-radar', 'layer-temp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('control-active', id === btnId);
  });
  updateWindyMap();
}

function changeWindyLocation(lat, lon, btnId) {
  currentWindyLat = lat;
  currentWindyLon = lon;
  ['loc-baia', 'loc-vale'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('control-active', id === btnId);
  });
  updateWindyMap();
  updateWeatherFavicon(lat, lon, false);
}

// 6. Google Map Lazy Load
function loadGoogleMap() {
  const mapContainer = document.getElementById('google-map-container');
  if (!mapContainer) return;
  mapContainer.innerHTML = `
    <iframe 
      title="Mapa de Como Chegar ao Vale do Gigante"
      width="100%" 
      height="100%" 
      src="https://maps.google.com/maps?q=-25.430564,-48.760243&t=&z=14&ie=UTF8&iwloc=&output=embed" 
      frameborder="0" 
      scrolling="no" 
      loading="lazy"
      marginheight="0" 
      marginwidth="0"
      class="absolute inset-0 w-full h-full saturate-[1.2] contrast-[1.08] filter">
    </iframe>
  `;
}

// 7. Live Weather Favicon & Status Updater (Open-Meteo API)
function classifyWeatherCode(wmoCode, isDay) {
  if ([95, 96, 99].includes(wmoCode)) {
    return { type: 'storm', label: 'Tempestade', border: '#f59e0b' };
  }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(wmoCode)) {
    return { type: 'rain', label: 'Chuva', border: '#38bdf8' };
  }
  if ([3, 45, 48].includes(wmoCode)) {
    return { type: 'cloudy', label: 'Nublado', border: '#94a3b8' };
  }
  if (wmoCode === 2) {
    return {
      type: isDay ? 'partly-cloudy' : 'clear-night',
      label: 'Parc. Nublado',
      border: '#34d399'
    };
  }
  if (isDay === 0) {
    return { type: 'clear-night', label: 'Céu Limpo', border: '#818cf8' };
  }
  return { type: 'clear-day', label: 'Sol / Céu Limpo', border: '#fbbf24' };
}

function drawWeatherFaviconDataUrl(weatherInfo, tempC) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCloud(cx, cy, scale, fillStyle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(-8, 4, 9, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(-1, -4, 10, Math.PI * 1.0, Math.PI * 1.85);
    ctx.arc(9, 2, 8, Math.PI * 1.3, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const bgGrad = ctx.createLinearGradient(0, 0, 64, 64);
  bgGrad.addColorStop(0, '#0f291e');
  bgGrad.addColorStop(1, '#07130e');
  roundRect(2, 2, 60, 60, 16);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = weatherInfo.border || '#34d399';
  ctx.stroke();

  const type = weatherInfo.type;

  if (type === 'clear-day') {
    const cx = 32, cy = 28, r = 11;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * (r + 4), cy + Math.sin(angle) * (r + 4));
      ctx.lineTo(cx + Math.cos(angle) * (r + 8), cy + Math.sin(angle) * (r + 8));
      ctx.stroke();
    }
    const sunGrad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, r);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'clear-night') {
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(31, 27, 12, 0.2 * Math.PI, 1.65 * Math.PI, false);
    ctx.arc(37, 22, 10, 1.55 * Math.PI, 0.35 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(46, 16, 2, 0, Math.PI * 2);
    ctx.arc(18, 17, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'partly-cloudy') {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(24, 21, 9, 0, Math.PI * 2);
    ctx.fill();
    drawCloud(35, 29, 1.15, '#e2e8f0');
  } else if (type === 'cloudy') {
    drawCloud(28, 22, 0.95, '#94a3b8');
    drawCloud(34, 29, 1.15, '#f1f5f9');
  } else if (type === 'rain') {
    drawCloud(32, 22, 1.15, '#cbd5e1');
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    [22, 32, 42].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x + 2, 34);
      ctx.lineTo(x - 2, 43);
      ctx.stroke();
    });
  } else if (type === 'storm') {
    drawCloud(32, 21, 1.15, '#94a3b8');
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(33, 28);
    ctx.lineTo(25, 38);
    ctx.lineTo(32, 38);
    ctx.lineTo(29, 47);
    ctx.lineTo(40, 35);
    ctx.lineTo(33, 35);
    ctx.closePath();
    ctx.fill();
  }

  if (typeof tempC === 'number' && !Number.isNaN(tempC)) {
    const tempText = `${Math.round(tempC)}°`;
    roundRect(14, 44, 36, 16, 6);
    ctx.fillStyle = 'rgba(4, 13, 9, 0.92)';
    ctx.fill();
    ctx.fillStyle = '#ecfdf5';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tempText, 32, 52.5);
  }

  return canvas.toDataURL('image/png');
}

async function updateWeatherFavicon(lat = -25.430564, lon = -48.760243, showFeedbackToast = false) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day,wind_speed_10m,precipitation&timezone=America%2FSao_Paulo`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Falha ao consultar Open-Meteo');
    const data = await response.json();

    if (!data || !data.current) return;
    const { temperature_2m, weather_code, is_day, wind_speed_10m } = data.current;
    const weatherInfo = classifyWeatherCode(weather_code, is_day);
    const faviconDataUrl = drawWeatherFaviconDataUrl(weatherInfo, temperature_2m);

    if (faviconDataUrl) {
      let faviconEl = document.getElementById('dynamic-favicon') || document.querySelector("link[rel*='icon']");
      if (!faviconEl) {
        faviconEl = document.createElement('link');
        faviconEl.id = 'dynamic-favicon';
        faviconEl.rel = 'icon';
        document.head.appendChild(faviconEl);
      }
      faviconEl.type = 'image/png';
      faviconEl.href = faviconDataUrl;

      const previewImg = document.getElementById('live-favicon-preview');
      if (previewImg) previewImg.src = faviconDataUrl;
    }

    const tempRounded = Math.round(temperature_2m);
    const windRounded = Math.round(wind_speed_10m);
    const summaryText = `${tempRounded}°C • ${weatherInfo.label} (${windRounded} km/h)`;

    const summaryEl = document.getElementById('live-weather-summary');
    if (summaryEl) summaryEl.textContent = summaryText;

    const homeBadge = document.getElementById('home-weather-live-badge');
    if (homeBadge) {
      homeBadge.textContent = `Agora em Antonina: ${summaryText}`;
      homeBadge.classList.remove('hidden');
    }

    document.title = `${tempRounded}°C ${weatherInfo.label} | Vale do Gigante - Antonina PR`;

    if (showFeedbackToast) {
      showToast(`Clima e favicon atualizados: ${summaryText}`);
    }
  } catch (err) {
    const summaryEl = document.getElementById('live-weather-summary');
    if (summaryEl) summaryEl.textContent = 'Clima ao vivo indisponível';
  }
}

function normalizeSearchText(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function filterAtrativos(rawQuery) {
  const query = normalizeSearchText(rawQuery);
  const items = document.querySelectorAll('#atrativos-list .atrativo-item');
  const clearBtn = document.getElementById('atrativos-search-clear');
  const emptyState = document.getElementById('atrativos-empty');

  if (clearBtn) {
    if (rawQuery && rawQuery.length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }

  let visibleCount = 0;
  items.forEach((item) => {
    const titleText = item.querySelector('.atrativo-title')?.textContent || '';
    const descText = item.querySelector('.atrativo-desc')?.textContent || '';
    const dataName = item.getAttribute('data-name') || '';
    const searchable = normalizeSearchText(`${titleText} ${descText} ${dataName}`);

    if (!query || searchable.includes(query)) {
      item.classList.remove('hidden');
      item.classList.add('flex');
      visibleCount++;
    } else {
      item.classList.add('hidden');
      item.classList.remove('flex');
    }
  });

  if (emptyState) {
    if (visibleCount === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
    }
  }
}

function clearAtrativosSearch() {
  const input = document.getElementById('atrativos-search');
  if (input) {
    input.value = '';
    filterAtrativos('');
    input.focus();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  updateWeatherFavicon(currentWindyLat, currentWindyLon, false);
  setInterval(() => {
    updateWeatherFavicon(currentWindyLat, currentWindyLon, false);
  }, 600000);
});

// Expose functions globally for inline onclick handlers
window.switchTab = switchTab;
window.copyCoord = copyCoord;
window.shareProfile = shareProfile;
window.changeWindyLayer = changeWindyLayer;
window.changeWindyLocation = changeWindyLocation;
window.updateWeatherFavicon = updateWeatherFavicon;
window.filterAtrativos = filterAtrativos;
window.clearAtrativosSearch = clearAtrativosSearch;



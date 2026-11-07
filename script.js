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

// Expose functions globally for inline onclick handlers
window.switchTab = switchTab;
window.copyCoord = copyCoord;
window.shareProfile = shareProfile;
window.changeWindyLayer = changeWindyLayer;
window.changeWindyLocation = changeWindyLocation;

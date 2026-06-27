'use strict';

// ================================
// LIVE CLOCK
// ================================
function updateClock() {
  const now    = new Date();
  const h      = String(now.getHours()).padStart(2, '0');
  const m      = String(now.getMinutes()).padStart(2, '0');
  const s      = String(now.getSeconds()).padStart(2, '0');
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const clockEl = document.getElementById('liveClock');
  const dateEl  = document.getElementById('liveDate');
  if (clockEl) clockEl.textContent = `${h}:${m}:${s}`;
  if (dateEl)  dateEl.textContent  = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`;
}

updateClock();
setInterval(updateClock, 1000);


// ================================
// ALERT STATE
// ================================
let alertsSent = 0;

function updateAlertCount() {
  const countEl        = document.getElementById('alertCount');
  const analyticEl     = document.getElementById('analyticAlertCount');
  const analyticBar    = document.getElementById('analyticBar');
  const analyticSub    = document.getElementById('analyticSub');
  const badgeEl        = document.getElementById('logBadge');

  if (countEl)     countEl.textContent     = alertsSent;
  if (analyticEl)  analyticEl.textContent  = alertsSent;
  if (badgeEl)     badgeEl.textContent     = `${alertsSent} alert${alertsSent !== 1 ? 's' : ''}`;
  if (analyticSub) analyticSub.textContent = alertsSent === 0 ? 'No alerts yet today' : `${alertsSent} broadcast${alertsSent !== 1 ? 's' : ''} today`;

  // Bar fills up to max ~60% at 10 alerts
  if (analyticBar) {
    const pct = Math.min(alertsSent * 6, 60);
    analyticBar.style.width = pct + '%';
  }
}


// ================================
// CHAR COUNTER
// ================================
const msgEl = document.getElementById('alertMessage');
const charEl = document.getElementById('charCount');
const MAX_CHARS = 300;

if (msgEl && charEl) {
  msgEl.addEventListener('input', () => {
    const len = msgEl.value.length;
    if (len > MAX_CHARS) msgEl.value = msgEl.value.slice(0, MAX_CHARS);
    charEl.textContent = msgEl.value.length;
    charEl.style.color = msgEl.value.length >= MAX_CHARS * 0.9 ? '#ef4444' : '';
  });
}


// ================================
// SEND ALERT
// ================================
function sendAlert() {
  const typeEl     = document.getElementById('alertType');
  const regionEl   = document.getElementById('alertRegion');
  const messageEl  = document.getElementById('alertMessage');
  const severityEl = document.querySelector('input[name="severity"]:checked');
  const btn        = document.getElementById('broadcastBtn');
  const log        = document.getElementById('alertLog');

  const type     = typeEl     ? typeEl.value.trim()     : '';
  const region   = regionEl   ? regionEl.value.trim()   : '';
  const message  = messageEl  ? messageEl.value.trim()  : '';
  const severity = severityEl ? severityEl.value        : 'Advisory';

  // Validation
  if (!region) {
    shakeField(regionEl);
    regionEl.focus();
    return;
  }
  if (!message) {
    shakeField(messageEl);
    messageEl.focus();
    return;
  }

  // Loading state
  btn.disabled = true;
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="animation:spin 0.8s linear infinite">
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.3"/>
      <path d="M12 3a9 9 0 019 9"/>
    </svg>
    Broadcasting…
  `;

  setTimeout(() => {
    // Remove empty state
    const emptyEl = log.querySelector('.alert-log-empty');
    if (emptyEl) emptyEl.remove();

    // Build entry
    const now      = new Date();
    const timeStr  = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const severityClass = severity.toLowerCase().replace(' ', '-');
    const dotClass = `dot-${severityClass}`;
    const sevClass = `sev-${severityClass}`;

    const entry    = document.createElement('div');
    entry.className = 'alert-entry';
    entry.innerHTML = `
      <div class="alert-entry-dot ${dotClass}"></div>
      <div class="alert-entry-body">
        <div class="alert-entry-top">
          <span class="alert-entry-type">${escapeHtml(type)}</span>
          <span class="alert-severity ${sevClass}">${severity.toUpperCase()}</span>
          ${region ? `<span class="alert-entry-region">— ${escapeHtml(region)}</span>` : ''}
        </div>
        <div class="alert-entry-msg">${escapeHtml(message)}</div>
        <div class="alert-entry-time">Broadcast at ${timeStr}</div>
      </div>
    `;

    log.prepend(entry);

    // Update counters
    alertsSent++;
    updateAlertCount();

    // Reset form
    if (regionEl)  regionEl.value  = '';
    if (messageEl) messageEl.value = '';
    if (charEl)    charEl.textContent = '0';

    // Reset button
    btn.disabled = false;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
      Initiate Broadcast
    `;

    // Success pulse on button
    btn.style.background = '#16a34a';
    btn.style.boxShadow  = '0 8px 24px rgba(34,197,94,0.4)';
    setTimeout(() => {
      btn.style.background = '';
      btn.style.boxShadow  = '';
    }, 1200);

    // Scroll to log
    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  }, 900);
}

function shakeField(el) {
  if (!el) return;
  el.style.borderColor = '#ef4444';
  el.style.animation   = 'shake 0.4s ease';
  setTimeout(() => {
    el.style.borderColor = '';
    el.style.animation   = '';
  }, 500);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}


// ================================
// SCROLL REVEAL
// ================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.section.reveal').forEach(s => revealObserver.observe(s));


// ================================
// ACTIVE NAV
// ================================
const navLinks  = document.querySelectorAll('.header-nav a');
const sections  = document.querySelectorAll('section[id]');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.35 });

sections.forEach(s => navObserver.observe(s));


// ================================
// CSS KEYFRAMES (injected)
// ================================
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    60%       { transform: translateX(6px); }
  }
  .header-nav a.active {
    color: #f1f5f9;
    background: rgba(255,255,255,0.07);
  }
`;
document.head.appendChild(style);

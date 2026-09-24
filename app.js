// ============================================
// BOOT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  fetch('config.json')
    .then(r => r.json())
    .then(config => init(config))
    .catch(err => {
      console.error('Impossible de charger config.json :', err);
    });

  // Nav testimonial buttons wired up independently of config load
  document.getElementById('testimonial-prev')?.addEventListener('click', () => stepTestimonial(-1));
  document.getElementById('testimonial-next')?.addEventListener('click', () => stepTestimonial(1));
});

function init(c) {
  applyAmbiance(c.ambiance);
  applyColors(c.colors || {});
  applyTheme(c.theme);
  applyContent(c);
  applySEO(c);
  renderStats(c.about?.stats || []);
  renderServices(c.services || []);
  renderCommitments(c.commitments || []);
  renderGallery(c.images?.gallery || []);
  renderTestimonials(c.testimonials || [], c.google_reviews || null);
  renderFAQ(c.faq || []);
  renderSocial(c.social || {});
  renderMaps(c.contact?.maps_embed_url || '');
  initScrollReveal();
  initNav();
  initContactForm(c);
  initLightbox();
  renderMobileCTABar(c);
  renderOpenStatus(c);
  document.getElementById('footer-year').textContent = new Date().getFullYear();
}

// Ambiance de métier : une feuille de style posée par-dessus le socle, qui
// redéfinit polices, angles et matières. Un couvreur et un salon de coiffure
// ne doivent pas avoir la même tête — c'est ce fichier qui fait la différence.
// Valeurs : artisan | restaurant | salon | commerce. Absent = socle seul.
function applyAmbiance(nom) {
  var connues = ['artisan', 'restaurant', 'salon', 'commerce'];
  var lien = document.getElementById('theme-metier');
  if (!lien || connues.indexOf(nom) === -1) return;
  lien.href = '/themes/' + nom + '.css';
}

// ============================================
// COLORS
// ============================================

function applyColors({ primary = '#E74C3C', secondary = '#2C3E50' }) {
  document.documentElement.style.setProperty('--brand-primary',   primary);
  document.documentElement.style.setProperty('--brand-secondary', secondary);
}

// Thème forcé : "dark" | "light" (sinon suit le mode de l'appareil).
// Ne retire jamais un data-theme déjà posé dans le HTML (anti-flash).
function applyTheme(theme) {
  if (theme === 'dark' || theme === 'light') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// ============================================
// CONTENT
// ============================================

function applyContent(c) {
  setText('site-name',          c.siteName);

  // Logo image dans la navbar (remplace le nom texte) si un logo est fourni
  if (c.images?.logo) {
    const brand = document.querySelector('.navbar-brand');
    if (brand) {
      const src = c.images.logo.startsWith('http') ? c.images.logo : `images/${c.images.logo}`;
      brand.innerHTML = `<img src="${src}" alt="${c.siteName || ''}" class="navbar-logo">`;
    }
  }

  setText('hero-badge',         c.badge || c.slogan);
  setText('hero-title',         c.hero?.title);
  setText('hero-subtitle',      c.hero?.subtitle);
  setText('hero-cta-primary',   c.hero?.cta_primary   || 'Nous Contacter');
  setText('hero-cta-secondary', c.hero?.cta_secondary || 'Nos Services');
  if (c.hero?.cta_primary_url) {
    const btn = document.getElementById('hero-cta-primary');
    if (btn) { btn.href = c.hero.cta_primary_url; btn.target = '_blank'; btn.rel = 'noopener'; }
  }
  if (c.hero?.cta_secondary_url) {
    const btn = document.getElementById('hero-cta-secondary');
    if (btn) { btn.href = c.hero.cta_secondary_url; btn.target = '_blank'; btn.rel = 'noopener'; }
  }
  setText('about-title',        c.about?.title || c.slogan);
  setText('about-description',  c.description);

  // About image or icon fallback
  if (c.images?.about) {
    applyAboutImage(c.images.about);
  }

  // Hero background image with dark overlay
  if (c.images?.hero) {
    applyHeroImage(c.images.hero);
  }

  // Navbar phone
  const navPhone     = document.getElementById('navbar-phone');
  const navPhoneText = document.getElementById('navbar-phone-text');
  const phoneNav     = c.contact?.phone || '';
  if (navPhone && phoneNav) {
    navPhone.href = `tel:${phoneNav.replace(/[\s.]/g, '')}`;
    if (navPhoneText) navPhoneText.textContent = phoneNav;
    navPhone.style.display = '';
  }

  // Hero tags
  const heroTags = document.getElementById('hero-tags');
  if (heroTags && c.hero?.tags?.length) {
    heroTags.innerHTML = c.hero.tags.map(tag =>
      `<span class="hero-tag">${tag}</span>`
    ).join('');
  }

  // Contact — liens cliquables
  const phone    = c.contact?.phone    || '';
  const phoneRaw = phone.replace(/[\s.]/g, '');
  const email    = c.contact?.email    || '';

  setHTML('contact-phone', phone ? `<a href="tel:${phoneRaw}">${phone}</a>` : '—');
  setHTML('contact-email', email ? `<a href="mailto:${email}">${email}</a>` : '—');
  const addr = c.contact?.address || '';
  const mapsUrl = addr ? `https://maps.google.com/?q=${encodeURIComponent(addr)}` : '';
  setHTML('contact-address', addr ? `<a href="${mapsUrl}" target="_blank" rel="noopener">${addr}</a>` : '—');
  setText('contact-hours',   c.contact?.hours   || '');

  // Footer
  setText('footer-name',        c.siteName);
  setText('footer-description', (c.description || '').slice(0, 120) + '…');
  setHTML('footer-address', addr ? `<a href="${mapsUrl}" target="_blank" rel="noopener" style="color:inherit;">${addr}</a>` : '');
  setHTML('footer-phone', phone ? `<a href="tel:${phoneRaw}">${phone}</a>` : '');
  setHTML('footer-email', email ? `<a href="mailto:${email}">${email}</a>` : '');
  setText('footer-copy-name',   c.siteName);

  // title set in applySEO()

  // Form overrides
  const f = c.form || {};
  if (f.title)    setText('contact-title',    f.title);
  if (f.subtitle) setText('contact-subtitle', f.subtitle);
  const msgArea  = document.getElementById('message');
  if (msgArea && f.message_placeholder) msgArea.placeholder = f.message_placeholder;
  const msgLabel = document.getElementById('contact-message-label');
  if (msgLabel && f.message_label) msgLabel.textContent = f.message_label + ' *';
  const submitBtn = document.getElementById('contact-submit-btn');
  if (submitBtn && f.button_text) {
    submitBtn.innerHTML = `<i class="${f.button_icon || 'fas fa-paper-plane'}"></i> ${f.button_text}`;
  }

  // Bouton flottant → WhatsApp ou RDV
  const btn = document.getElementById('float-btn');
  if (!btn) return;
  if (c.contact?.whatsapp) {
    btn.href = `https://wa.me/${c.contact.whatsapp}?text=Bonjour%2C%20je%20souhaite%20prendre%20rendez-vous.`;
    btn.target = '_blank';
    btn.rel    = 'noopener';
    btn.querySelector('i').className    = 'fab fa-whatsapp';
    btn.querySelector('span').textContent = 'WhatsApp';
  } else {
    btn.href = '#contact';
    btn.removeAttribute('target');
    btn.removeAttribute('rel');
    btn.querySelector('i').className    = 'fas fa-calendar-alt';
    btn.querySelector('span').textContent = 'Rendez-vous';
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '';
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function applyHeroImage(rawSrc) {
  const src  = rawSrc.startsWith('http') ? rawSrc : `images/${rawSrc}`;
  const hero = document.querySelector('.hero');
  if (!hero) return;
  hero.style.backgroundImage    = `linear-gradient(135deg, rgba(0,0,0,.60) 0%, rgba(0,0,0,.38) 100%), url('${src}')`;
  hero.style.backgroundSize     = 'cover';
  hero.style.backgroundPosition = 'center';
  const bg = hero.querySelector('.hero-bg');
  if (bg) bg.style.display = 'none';
}

function applyAboutImage(rawSrc) {
  const src     = rawSrc.startsWith('http') ? rawSrc : `images/${rawSrc}`;
  const wrapper = document.getElementById('about-image-wrapper');
  if (!wrapper) return;
  wrapper.innerHTML = `<img src="${src}" alt="Notre garage" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`;
}

// ============================================
// STATS
// ============================================

function renderStats(stats) {
  const el = document.getElementById('about-stats');
  if (!el) return;
  el.innerHTML = stats.map(s => `
    <div class="stat-item reveal">
      <div class="stat-number">${s.number}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join('');
}

// ============================================
// SERVICES
// ============================================

function renderServices(services) {
  const el = document.getElementById('services-grid');
  if (!el) return;
  el.innerHTML = services.map(s => `
    <div class="service-card reveal">
      <div class="service-icon"><i class="${s.icon}"></i></div>
      <h3>${s.title}</h3>
      <p>${s.description}</p>
    </div>
  `).join('');
}

// ============================================
// COMMITMENTS
// ============================================

const COMMITMENT_DEFAULTS = [
  { icon: 'fas fa-file-invoice', title: 'Devis gratuit',       description: 'Sans engagement, réponse sous 24h' },
  { icon: 'fas fa-clock',        title: 'Délais respectés',    description: 'Votre véhicule rendu à l\'heure convenue' },
  { icon: 'fas fa-shield-halved',title: 'Garantie 24 mois',    description: 'Sur toutes pièces et main d\'œuvre' },
  { icon: 'fas fa-tag',          title: 'Prix transparents',   description: 'Pas de mauvaise surprise sur la facture' }
];

function renderCommitments(commitments) {
  const el = document.getElementById('engagements-grid');
  if (!el) return;
  const items = commitments.length ? commitments : COMMITMENT_DEFAULTS;
  el.innerHTML = items.map(item => `
    <div class="commitment-item reveal">
      <div class="commitment-icon"><i class="${item.icon}"></i></div>
      <div class="commitment-text">
        <h4>${item.title}</h4>
        <p>${item.description}</p>
      </div>
    </div>
  `).join('');
}

// ============================================
// MOBILE CTA BAR
// ============================================

function renderMobileCTABar(c) {
  const phone    = c.contact?.phone    || '';
  const phoneRaw = phone.replace(/[\s.]/g, '');
  const wa       = c.contact?.whatsapp || '';

  const phoneBtn = document.getElementById('mobile-cta-phone');
  const waBtn    = document.getElementById('mobile-cta-wa');

  if (phoneBtn) phoneBtn.href = phone ? `tel:${phoneRaw}` : '#contact';
  if (waBtn)    waBtn.href    = wa
    ? `https://wa.me/${wa}?text=Bonjour%2C%20je%20souhaite%20prendre%20rendez-vous.`
    : '#contact';
}

// ============================================
// FAQ
// ============================================

function renderFAQ(faq) {
  const el = document.getElementById('faq-list');
  if (!el) return;
  if (!faq.length) {
    document.getElementById('faq')?.style.setProperty('display', 'none');
    return;
  }

  el.innerHTML = faq.map((item, i) => `
    <div class="faq-item reveal" data-faq="${i}">
      <button class="faq-question" aria-expanded="false">
        <span>${item.question}</span>
        <i class="fas fa-plus faq-icon"></i>
      </button>
      <div class="faq-answer" aria-hidden="true">
        <p>${item.answer}</p>
      </div>
    </div>
  `).join('');

  el.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      el.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        i.querySelector('.faq-answer').setAttribute('aria-hidden', 'true');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        item.querySelector('.faq-answer').setAttribute('aria-hidden', 'false');
      }
    });
  });
}

// ============================================
// OPEN STATUS
// ============================================

function renderOpenStatus(c) {
  const el = document.getElementById('hero-open-status');
  if (!el || !c.schedule?.length) return;

  const now     = new Date();
  const day     = now.getDay();
  const timeMin = now.getHours() * 60 + now.getMinutes();
  const toMin   = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const fmt     = s => s.replace(':', 'h');
  const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const slot = c.schedule.find(s => s.days.includes(day));

  if (slot && timeMin >= toMin(slot.open) && timeMin < toMin(slot.close)) {
    el.innerHTML = `<span class="open-badge open-badge--open"><i class="fas fa-circle"></i> Ouvert · jusqu'à ${fmt(slot.close)}</span>`;
    return;
  }

  let nextText = 'Contactez-nous';
  if (slot && timeMin < toMin(slot.open)) {
    nextText = `Ouvre à ${fmt(slot.open)}`;
  } else {
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      const s = c.schedule.find(s => s.days.includes(d));
      if (s) { nextText = `Ouvre ${DAY_NAMES[d]} à ${fmt(s.open)}`; break; }
    }
  }
  el.innerHTML = `<span class="open-badge open-badge--closed"><i class="fas fa-circle"></i> Fermé · ${nextText}</span>`;
}

// ============================================
// GALLERY
// ============================================

let galleryImages = [];

function renderGallery(filenames) {
  const el = document.getElementById('gallery-grid');
  if (!el) return;

  if (!filenames.length) {
    el.innerHTML = Array.from({ length: 6 }, (_, i) => `
      <div class="gallery-item reveal">
        <div class="gallery-placeholder">
          <i class="fas fa-camera"></i>
          <span>Photo ${i + 1}</span>
        </div>
      </div>
    `).join('');
    return;
  }

  galleryImages = filenames.map(f => ({
    src: f.startsWith('http') ? f : `images/${f}`,
    alt: f.split('/').pop().replace(/\.[^.]+$/, '').replace(/-/g, ' ')
  }));

  el.innerHTML = galleryImages.map((img, i) => `
    <div class="gallery-item reveal" data-index="${i}" role="button" tabindex="0" aria-label="Agrandir : ${img.alt}">
      <img src="${img.src}" alt="${img.alt}" loading="lazy"
           onerror="this.style.display='none';this.closest('.gallery-item').classList.add('gallery-item--missing')">
      <div class="gallery-item-overlay"><span>${img.alt}</span></div>
      <div class="gallery-item-zoom"><i class="fas fa-expand-alt"></i></div>
    </div>
  `).join('');

  // Zone cliquable au clic ET au clavier (Entrée/Espace) — une image de galerie
  // qui n'ouvre la visionneuse qu'à la souris est inatteignable au clavier seul.
  el.querySelectorAll('.gallery-item[data-index]').forEach(item => {
    const trigger = () => {
      if (!item.classList.contains('gallery-item--missing')) {
        openLightbox(+item.dataset.index);
      }
    };
    item.addEventListener('click', trigger);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger();
      }
    });
  });
}

// ============================================
// TESTIMONIALS
// ============================================

let testimonialIndex = 0;
let testimonialTimer = null;

const GOOGLE_LOGO_SVG = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="14" height="14" aria-hidden="true">
  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
</svg>`;

function renderTestimonials(testimonials, googleReviews) {
  const carousel = document.getElementById('testimonials-carousel');
  const dots     = document.getElementById('testimonial-dots');
  if (!carousel || !dots) return;

  testimonialIndex = 0;
  clearInterval(testimonialTimer);

  // Badge Google Reviews
  const badgeEl = document.getElementById('google-reviews-badge');
  if (badgeEl) {
    if (googleReviews?.url) {
      const full    = Math.floor(googleReviews.rating || 0);
      const hasHalf = (googleReviews.rating || 0) - full >= 0.5;
      const starsHtml = Array.from({ length: 5 }, (_, i) => {
        if (i < full)              return '<i class="fas fa-star"></i>';
        if (i === full && hasHalf) return '<i class="fas fa-star-half-alt"></i>';
        return '<i class="far fa-star"></i>';
      }).join('');

      badgeEl.innerHTML = `
        <a href="${googleReviews.url}" target="_blank" rel="noopener" class="google-badge">
          ${GOOGLE_LOGO_SVG}
          <span class="google-badge-stars">${starsHtml}</span>
          <span class="google-badge-score">${googleReviews.rating}</span>
          <span class="google-badge-sep">·</span>
          <span class="google-badge-count">${googleReviews.count} avis Google</span>
          <i class="fas fa-arrow-right google-badge-arrow"></i>
        </a>
      `;
      badgeEl.style.display = 'flex';
    } else {
      badgeEl.style.display = 'none';
    }
  }

  // Slides
  carousel.innerHTML = testimonials.map((t, i) => {
    const isGoogle = t.source === 'google';
    return `
      <div class="testimonial-item ${i === 0 ? 'active' : ''}">
        <div class="testimonial-card">
          <div class="testimonial-card-header">
            <div class="testimonial-stars">${stars(t.rating || 5)}</div>
            ${isGoogle ? `<span class="testimonial-google-badge">${GOOGLE_LOGO_SVG} Google</span>` : ''}
          </div>
          <p class="testimonial-text">"${t.text}"</p>
          <div class="testimonial-author">
            <div class="author-avatar"><i class="fas fa-user"></i></div>
            <div class="author-info">
              <h4>${t.author}</h4>
              <p>${t.role}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Dots — accessibles au clavier au même titre qu'à la souris (cf. galerie)
  dots.innerHTML = testimonials.map((_, i) =>
    `<span class="dot ${i === 0 ? 'active' : ''}" data-i="${i}" role="button" tabindex="0" aria-label="Avis ${i + 1} sur ${testimonials.length}"></span>`
  ).join('');

  dots.querySelectorAll('.dot').forEach(d => {
    d.addEventListener('click', () => goToTestimonial(+d.dataset.i));
    d.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToTestimonial(+d.dataset.i);
      }
    });
  });

  if (testimonials.length > 1) {
    testimonialTimer = setInterval(() => stepTestimonial(1), 5000);
  }
}

function stars(n) {
  return Array.from({ length: 5 }, (_, i) =>
    `<i class="${i < n ? 'fas' : 'far'} fa-star"></i>`
  ).join('');
}

function stepTestimonial(dir) {
  const items = document.querySelectorAll('.testimonial-item');
  const total = items.length;
  if (!total) return;
  items[testimonialIndex].classList.remove('active');
  document.querySelectorAll('.dot')[testimonialIndex]?.classList.remove('active');
  testimonialIndex = (testimonialIndex + dir + total) % total;
  items[testimonialIndex].classList.add('active');
  document.querySelectorAll('.dot')[testimonialIndex]?.classList.add('active');
  resetTestimonialTimer();
}

function goToTestimonial(i) {
  const items = document.querySelectorAll('.testimonial-item');
  if (!items.length) return;
  items[testimonialIndex].classList.remove('active');
  document.querySelectorAll('.dot')[testimonialIndex]?.classList.remove('active');
  testimonialIndex = i;
  items[i].classList.add('active');
  document.querySelectorAll('.dot')[i]?.classList.add('active');
  resetTestimonialTimer();
}

function resetTestimonialTimer() {
  if (!testimonialTimer) return;
  clearInterval(testimonialTimer);
  testimonialTimer = setInterval(() => stepTestimonial(1), 5000);
}

// ============================================
// SOCIAL LINKS
// ============================================

const SOCIAL_META = {
  facebook:  { icon: 'fab fa-facebook-f', label: 'Facebook' },
  instagram: { icon: 'fab fa-instagram',   label: 'Instagram' },
  linkedin:  { icon: 'fab fa-linkedin-in', label: 'LinkedIn' },
  twitter:   { icon: 'fab fa-x-twitter',  label: 'X' },
  youtube:   { icon: 'fab fa-youtube',     label: 'YouTube' },
  tiktok:    { icon: 'fab fa-tiktok',      label: 'TikTok' }
};

function renderSocial(social) {
  const el = document.getElementById('social-links');
  if (!el) return;
  el.innerHTML = Object.entries(social)
    .filter(([, url]) => url)
    .map(([net, url]) => {
      const m = SOCIAL_META[net] || { icon: 'fas fa-link', label: net };
      return `<a href="${url}" class="social-link" target="_blank" rel="noopener" aria-label="${m.label}">
        <i class="${m.icon}"></i>
      </a>`;
    }).join('');
}

// ============================================
// GOOGLE MAPS
// ============================================

function renderMaps(embedUrl) {
  const el = document.getElementById('contact-map');
  if (!el) return;
  if (!embedUrl) {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'block';
  el.innerHTML = `
    <iframe
      src="${embedUrl}"
      width="100%" height="100%"
      style="border:0;"
      allowfullscreen=""
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      title="Localisation du garage"
    ></iframe>
  `;
}

// ============================================
// LIGHTBOX
// ============================================

let lightboxIndex = 0;

function openLightbox(index) {
  lightboxIndex = index;
  const modal = document.getElementById('lightbox-modal');
  const img   = document.getElementById('lightbox-img');
  if (galleryImages[index]) {
    img.src = galleryImages[index].src;
    img.alt = galleryImages[index].alt;
  }
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.getElementById('lightbox-img').src = '';
}

function navLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + galleryImages.length) % galleryImages.length;
  const img = document.getElementById('lightbox-img');
  if (galleryImages[lightboxIndex]) {
    img.src = galleryImages[lightboxIndex].src;
    img.alt = galleryImages[lightboxIndex].alt;
  }
}

function initLightbox() {
  document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev')?.addEventListener('click',  () => navLightbox(-1));
  document.getElementById('lightbox-next')?.addEventListener('click',  () => navLightbox(1));
  document.getElementById('lightbox-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox-modal')?.classList.contains('active')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  navLightbox(-1);
    if (e.key === 'ArrowRight') navLightbox(1);
  });
}

// ============================================
// NAVIGATION
// ============================================

function initNav() {
  const toggle = document.getElementById('navbar-toggle');
  const menu   = document.getElementById('navbar-menu');

  toggle?.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('active');
    toggle.setAttribute('aria-label',
      menu.classList.contains('active') ? 'Fermer le menu' : 'Ouvrir le menu'
    );
  });

  menu?.querySelectorAll('.nav-link').forEach(link =>
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('active');
    })
  );

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = document.getElementById('header')?.offsetHeight || 72;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    });
  });

  // Active nav section tracking
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link[href^="#"]');
  const threshold = () => window.innerHeight * 0.35;

  function updateActiveNav() {
    let activeId = null;
    sections.forEach(s => {
      if (s.getBoundingClientRect().top <= threshold()) activeId = s.id;
    });
    navLinks.forEach(link =>
      link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`)
    );
  }

  window.addEventListener('scroll', () => {
    document.getElementById('header')?.classList.toggle('scrolled', window.scrollY > 80);
    updateActiveNav();
  }, { passive: true });

  updateActiveNav();
}

// ============================================
// SCROLL REVEAL
// ============================================

function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => {
    el.classList.remove('visible');
    observer.observe(el);
  });
}

// ============================================
// CONTACT FORM
// ============================================

function initContactForm(c) {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const ejs = c.emailjs;
  if (ejs?.public_key) {
    emailjs.init({ publicKey: ejs.public_key });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const phone   = document.getElementById('phone').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      notify('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify('Adresse email invalide.', 'error');
      return;
    }

    // Mode démo si pas de config EmailJS
    if (!ejs?.service_id) {
      notify('Message envoyé ! Nous vous répondrons rapidement.', 'success');
      form.reset();
      return;
    }

    const btn = form.querySelector('button[type=submit]');
    const btnOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours…';

    try {
      await emailjs.send(ejs.service_id, ejs.template_id, {
        site_name:   c.siteName,
        to_email:    c.contact?.form_email || c.contact?.email || '',
        from_name:   name,
        from_email:  email,
        reply_to:    email,
        phone:       phone || '—',
        message:     message,
        brand_color: c.colors?.primary   || '#2C3E50',
        brand_dark:  c.colors?.secondary || '#1a1a2e'
      });

      notify('Message envoyé ! Nous vous répondrons dans les plus brefs délais.', 'success');
      form.reset();
    } catch (err) {
      console.error('EmailJS error:', err);
      notify('Erreur lors de l\'envoi. Appelez-nous directement.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = btnOriginal;
    }
  });
}

// ============================================
// NOTIFICATIONS
// ============================================

// ============================================
// SEO — meta, Open Graph, JSON-LD LocalBusiness
// ============================================

function applySEO(c) {
  const contact = c.contact || {};
  const seo     = c.seo || {};

  // Parse address → street / zip / city
  const parts    = (contact.address || '').split(',');
  const street   = seo.street || (parts[0] || '').trim();
  const cityZip  = (parts[1] || '').trim();
  const zipMatch = cityZip.match(/(\d{5})\s+(.*)/);
  const zip      = seo.zip  || (zipMatch ? zipMatch[1] : '');
  const city     = seo.city || (zipMatch ? zipMatch[2] : cityZip);

  // Title
  document.title = c.siteName + (c.slogan ? ' — ' + c.slogan : '');

  // Meta description
  setMeta('name', 'description', c.description || c.slogan || '');

  // Open Graph
  setMeta('property', 'og:type',        'website');
  setMeta('property', 'og:locale',      'fr_FR');
  setMeta('property', 'og:title',       c.siteName + (c.slogan ? ' — ' + c.slogan : ''));
  setMeta('property', 'og:description', c.description || c.slogan || '');

  // JSON-LD LocalBusiness
  const phone = (contact.phone || '').replace(/[\s.]/g, '').replace(/^0/, '+33');
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  const schema = {
    '@context': 'https://schema.org',
    '@type':    seo.schema_type || 'LocalBusiness',
    name:        c.siteName,
    description: c.description || c.slogan || '',
    telephone:   phone,
    address: {
      '@type':          'PostalAddress',
      streetAddress:    street,
      addressLocality:  city,
      postalCode:       zip,
      addressCountry:   'FR'
    }
  };

  if (contact.email)   schema.email = contact.email;
  if (contact.hours)   schema.openingHours = contact.hours;
  if (seo.geo_lat && seo.geo_lng) {
    schema.geo = { '@type': 'GeoCoordinates', latitude: seo.geo_lat, longitude: seo.geo_lng };
  }
  if (c.schedule?.length) {
    schema.openingHoursSpecification = c.schedule.map(s => ({
      '@type':      'OpeningHoursSpecification',
      dayOfWeek:    s.days.map(d => dayNames[d]),
      opens:        s.open,
      closes:       s.close
    }));
  }
  if (c.services?.length) {
    schema.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: c.services.map(s => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title }
      }))
    };
  }

  const ldScript = document.createElement('script');
  ldScript.type = 'application/ld+json';
  ldScript.textContent = JSON.stringify(schema);
  document.head.appendChild(ldScript);

  // Footer mentions légales link
  const mentionsEl = document.getElementById('footer-mentions');
  if (mentionsEl) mentionsEl.href = 'mentions/';
}

function setMeta(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.content = content;
}

function notify(message, type = 'info') {
  document.querySelectorAll('.notification').forEach(n => n.remove());
  const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
  const el   = document.createElement('div');
  el.className = `notification notification--${type}`;
  // role="alert" interrompt le lecteur d'écran pour une erreur (annonce immédiate) ;
  // "status" reste poli pour une confirmation — sans ça, un envoi de formulaire raté
  // ne se voit que par la couleur, invisible à qui n'utilise pas d'écran.
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = `
    <i class="${icon}"></i>
    <p>${message}</p>
    <button class="notification-close" aria-label="Fermer"><i class="fas fa-times"></i></button>
  `;
  document.body.appendChild(el);

  const dismiss = () => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  };
  el.querySelector('.notification-close').addEventListener('click', dismiss);
  setTimeout(dismiss, 5000);
}

/* =========================================================
   Community Building Agency — shared behaviour
   Loaded by index.html, services.html, joincommunity.html
   ========================================================= */

// ======= SETTINGS (Google Apps Script Web App URL) =======
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwvO0OuGNYXB66K-bJdz1ZqUuZ_vxhk0VYnO1VVUV4gQYnGSNj15FxEjTXsoJ4cccXMEw/exec";

/* ---------- Mobile nav ---------- */
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

function setNav(open) {
  navToggle.classList.toggle('open', open);
  navLinks.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}

navToggle.addEventListener('click', () => {
  setNav(!navLinks.classList.contains('open'));
});

// Tapping a section link should close the menu it was opened from.
// .book-btn links are skipped — they open the consultation modal, which closes the nav itself.
navLinks.querySelectorAll('a:not(.book-btn)').forEach(link => {
  link.addEventListener('click', () => setNav(false));
});

/* ---------- Fade-in on scroll ---------- */
const faders = document.querySelectorAll('.fade-in, .fade-in-delayed');
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  },
  { threshold: 0.15 }
);
faders.forEach(el => observer.observe(el));

/* ---------- Year in footer ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Notice banner height ----------
   The banner keeps its type size at every width, so on a narrow phone it wraps
   to a second line. The sticky header sits below it and anchor offsets clear
   both, and those read --banner-h — so it has to track the real height rather
   than a hardcoded guess. */
const banner = document.querySelector('.dev-banner');
if (banner) {
  const syncBannerHeight = () =>
    document.documentElement.style.setProperty('--banner-h', banner.offsetHeight + 'px');
  syncBannerHeight();
  addEventListener('resize', syncBannerHeight);
}

/* ---------- Strategic framework accordion ----------
   Click/tap rather than hover, so it works the same on touch devices. Several
   can be open at once; aria-expanded carries the state for screen readers. */
document.querySelectorAll('.framework-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const item = toggle.closest('.framework-item');
    const isOpen = item.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
});

/* ---------- Community photo strip ----------
   Drifts like the CSS marquee, but can also be dragged, swiped or scrolled
   sideways on a trackpad, with a little inertia after a flick (the same feel
   as the globe). Adding .is-manual stops the CSS animation, which is what runs
   if this doesn't; its duration still sets the drift speed. The track holds two
   identical copies, so the offset wraps at the second copy's first photo. */
const photoStrip = document.querySelector('#community-photos .marquee');
if (photoStrip) {
  const track = photoStrip.querySelector('.marquee-track');
  const photos = track.querySelectorAll('img');
  const seam = photos[photos.length / 2];
  const loopSeconds = parseFloat(getComputedStyle(track).animationDuration);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FRICTION = 0.94;            // how quickly a flick slows down

  photoStrip.classList.add('is-manual');

  let offset = 0;                   // px moved along the strip
  let vel = 0;                      // px per frame left over from a drag
  let dragging = false;
  let lastX = 0;
  let lastMove = 0;
  let lastTime = 0;
  let running = false;
  let visible = false;

  function frame(now) {
    if (!running) return;
    // capped so a stalled frame doesn't make it jump
    const dt = Math.min(Math.max(now - lastTime, 0), 100) / 1000;
    lastTime = now;
    const loop = seam.offsetLeft;
    if (!dragging) {
      vel *= FRICTION;
      const drift = reduceMotion || !loopSeconds ? 0 : loop / loopSeconds * dt;
      // drift resumes once a flick has mostly died down
      offset += vel + (Math.abs(vel) < drift ? drift : 0);
    }
    if (loop > 0) offset = ((offset % loop) + loop) % loop;
    track.style.transform = `translateX(${-offset}px)`;
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || !visible) return;
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(frame);
  }

  photoStrip.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;     // leave right-click to the contextmenu handler
    dragging = true;
    lastX = e.clientX;
    vel = 0;
    photoStrip.setPointerCapture(e.pointerId);
    photoStrip.classList.add('is-dragging');
  });
  photoStrip.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    vel = lastX - e.clientX;        // dragging left moves it on, the way it drifts
    lastX = e.clientX;
    lastMove = e.timeStamp;
    offset += vel;
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    // holding still before letting go shouldn't fling it
    if (e.timeStamp - lastMove > 80) vel = 0;
    photoStrip.classList.remove('is-dragging');
  };
  photoStrip.addEventListener('pointerup', endDrag);
  photoStrip.addEventListener('pointercancel', endDrag);

  // sideways trackpad swipes; vertical scrolling is left to the page
  photoStrip.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    offset += e.deltaX;
    vel = 0;
  }, { passive: false });

  // discourage saving the photos (see the CSS note); blocking dragstart also
  // stops Firefox turning a mouse drag into dragging the image itself
  photoStrip.addEventListener('contextmenu', (e) => e.preventDefault());
  photoStrip.addEventListener('dragstart', (e) => e.preventDefault());

  // paused while scrolled out of view
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start(); else running = false;
  }).observe(photoStrip);
}

/* ---------- Consultation modal ----------
   Injected from here so the markup lives in one place rather than being
   duplicated across every page that has a "Book" button. */
document.body.insertAdjacentHTML('beforeend', `
  <div id="consultModal" class="modal" aria-hidden="true">
    <div class="modal-backdrop" data-close="true"></div>

    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="consultTitle">
      <button class="modal-close" type="button" aria-label="Close" data-close="true">&times;</button>

      <div class="modal-content">
        <div id="consultIntro">
          <p class="modal-eyebrow">Get started</p>
          <h2 id="consultTitle">Let's talk about your community.</h2>

          <p class="modal-body">
            Share a few details about your enquiry, and we'll get in touch within two business
            days to arrange your free 30-minute introductory consultation.
          </p>
        </div>

        <form id="consultForm" class="survey-form">
          <input type="hidden" name="formType" value="consultation">

          <label class="field">
            <span class="field-label">Full name *</span>
            <input type="text" name="name" required autocomplete="name" placeholder="Your full name" />
          </label>

          <label class="field">
            <span class="field-label">Email *</span>
            <input type="email" name="email" required autocomplete="email" placeholder="you@brand.com" />
          </label>

          <label class="field">
            <span class="field-label">Phone number *</span>
            <input type="tel" name="phone" required autocomplete="tel" placeholder="+44 7700 900000" />
          </label>

          <label class="field">
            <span class="field-label">Business or brand name *</span>
            <input type="text" name="brand" required autocomplete="organization" placeholder="Your business or brand" />
            <span class="field-hint">If you're enquiring as an individual, you can enter your personal or project name.</span>
          </label>

          <label class="field">
            <span class="field-label">Tell us briefly about your business or creative practice and what you'd like to discuss. *</span>
            <textarea name="about" rows="4" required></textarea>
          </label>

          <label class="field">
            <span class="field-label">What days and times would suit you for a call? *</span>
            <textarea name="availability" rows="3" required></textarea>
            <span class="field-hint">Please suggest a few options within the next two weeks and include your time zone.</span>
          </label>

          <label class="field">
            <span class="field-label">Website or social media <span class="field-optional">(optional)</span></span>
            <input type="text" name="website" placeholder="Website, Instagram or other profile" />
          </label>

          <fieldset class="field">
            <legend class="field-label">How did you hear about us? *</legend>
            <div class="radio-grid">
              <label><input type="radio" name="heardFrom" value="Search engine" required> Search engine</label>
              <label><input type="radio" name="heardFrom" value="Instagram"> Instagram</label>
              <label><input type="radio" name="heardFrom" value="CBA Community Event"> CBA Community Event</label>
              <label><input type="radio" name="heardFrom" value="CBA Showcase"> CBA Showcase</label>
              <label><input type="radio" name="heardFrom" value="Direct contact from CBA team"> Direct contact from CBA team</label>
              <label><input type="radio" name="heardFrom" value="Word of mouth"> Word of mouth</label>
              <label><input type="radio" name="heardFrom" value="Other"> Other</label>
            </div>
          </fieldset>

          <!-- revealed only when "Other" is picked; see syncHeardOther() below -->
          <label class="field" id="heardOtherField" hidden>
            <input type="text" name="heardFromOther" placeholder="Tell us where" aria-label="Where did you hear about us?" />
          </label>

          <label class="consent">
            <input type="checkbox" name="privacyConsent" value="yes" required>
            <span>
              I have read and acknowledge the <a href="privacypolicy.html" target="_blank" rel="noopener">Privacy Policy</a>. *
            </span>
          </label>

          <label class="consent">
            <input type="checkbox" name="marketingConsent" value="yes">
            <span>
              I'd like to receive occasional news, insights and updates from Community Building
              Agency. <span class="field-optional">(Optional)</span>
            </span>
          </label>

          <button class="btn-primary btn-full btn-large" type="submit">Request Free Consultation</button>
          <p id="consultStatus" class="form-status" aria-live="polite"></p>
        </form>

        <!-- Shown in place of the form after a successful submit -->
        <div id="consultConfirmation" class="confirmation" tabindex="-1" hidden>
          <span class="confirmation-icon" aria-hidden="true">✓</span>
          <h2>Thank you for your enquiry!</h2>
          <p class="lead">We've received your request for a free 30-minute introductory consultation.</p>
          <p class="lead">We'll be in touch via email within two business days to confirm your consultation time.</p>
          <p class="lead">In the meantime, feel free to follow us on Instagram to stay connected and see what we're up to.</p>
          <div class="social-actions">
            <a class="btn-primary" href="https://www.instagram.com/communitybuildingagency/" target="_blank" rel="noopener noreferrer">
              <img class="btn-icon" src="assets/instagram_icon.png" alt="" aria-hidden="true">
              Follow us on Instagram
            </a>
          </div>
          <p class="lead">
            We also have a growing Community for people in fashion, creative industries and
            business to connect and co-create. <a href="joincommunity.html">Explore and join here</a>.
          </p>
          <p class="lead">We look forward to learning more about you and your goals!</p>
        </div>
      </div>
    </div>
  </div>
`);

const modal = document.getElementById('consultModal');
const form = document.getElementById('consultForm');
const statusEl = document.getElementById('consultStatus');
const consultIntro = document.getElementById('consultIntro');
const consultConfirmation = document.getElementById('consultConfirmation');

/* Picking "Other" for how they heard about us reveals a free-text field. `required` is toggled
   with it — a required field that is hidden makes the form unsubmittable, since
   the browser cannot focus it to show the validation message.
   Used by both forms; returns the sync function, since form.reset() fires no
   change event and callers have to re-hide the field themselves. */
function wireOtherField(formEl, fieldEl) {
  const input = fieldEl.querySelector('input');

  function sync() {
    const picked = formEl.querySelector('[name="heardFrom"]:checked');
    const isOther = !!picked && picked.value === 'Other';
    fieldEl.hidden = !isOther;
    input.required = isOther;
    if (!isOther) input.value = '';
  }

  formEl.querySelectorAll('[name="heardFrom"]').forEach(radio => {
    radio.addEventListener('change', () => {
      sync();
      if (!fieldEl.hidden) input.focus();
    });
  });

  return sync;
}

const syncHeardOther = wireOtherField(form, document.getElementById('heardOtherField'));

function openModal() {
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setNav(false);
  const firstField = form.querySelector('textarea, input:not([type="hidden"])');
  if (firstField) firstField.focus();
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  statusEl.textContent = "";
  // form.reset() fires no change event, so re-hide the conditional field here
  syncHeardOther();
  // after a submit the confirmation is showing; put the form back for next time
  consultIntro.hidden = false;
  form.hidden = false;
  consultConfirmation.hidden = true;
}

/* Wires a dialog to the buttons that open it: click a trigger to open, click the
   backdrop or the × to close, Escape closes whichever dialog is currently open. */
function setupModal(modalEl, triggerSelector, eventLabel) {
  function open() {
    modalEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setNav(false);
    modalEl.querySelector('.modal-dialog').scrollTop = 0;
    const firstField = modalEl.querySelector('textarea, input:not([type="hidden"])');
    if (firstField) firstField.focus();
  }

  function close() {
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll(triggerSelector).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      open();
      if (typeof gtag === 'function') {
        gtag('event', 'modal_open', { event_category: 'engagement', event_label: eventLabel });
      }
    });
  });

  modalEl.addEventListener('click', (e) => {
    if (e.target && e.target.dataset && e.target.dataset.close === 'true') close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl.classList.contains('is-open')) close();
  });

  return { open, close };
}

// Consultation modal keeps its own close(), which also clears the status line
document.querySelectorAll('.book-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
    if (typeof gtag === 'function') {
      gtag('event', 'book_now_click', {
        event_category: 'engagement',
        event_label: 'Book Button -> Consultation Open'
      });
    }
  });
});

modal.addEventListener('click', (e) => {
  if (e.target && e.target.dataset && e.target.dataset.close === 'true') {
    closeModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
});

/* ---------- Form submission ----------
   Shared by the consultation modal and the Join Community form. Both post to the same
   Apps Script endpoint and carry a `formType` field so the two can be told apart
   in the sheet. */
function wireForm(formEl, statusNode, successMsg, onSuccess, delay = 900) {
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.includes("PASTE_YOUR_WEB_APP_URL_HERE")) {
      statusNode.textContent = "Please paste your Google Apps Script Web App URL into GOOGLE_APPS_SCRIPT_URL.";
      return;
    }

    const submitBtn = formEl.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    statusNode.textContent = "Submitting...";

    const fd = new FormData(formEl);
    fd.append("page", window.location.href);
    fd.append("submittedAt", new Date().toISOString());

    try {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        body: fd,
        mode: "no-cors"
      });

      statusNode.textContent = successMsg;

      if (typeof gtag === 'function') {
        gtag('event', 'form_submit', {
          event_category: 'engagement',
          event_label: fd.get('formType') || 'form'
        });
      }

      formEl.reset();
      if (onSuccess) setTimeout(onSuccess, delay);

    } catch (err) {
      console.error(err);
      statusNode.textContent = "Something went wrong. Please try again.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// On success the intro + form are replaced inside the dialog by the confirmation
wireForm(form, statusEl, "", () => {
  consultIntro.hidden = true;
  form.hidden = true;
  consultConfirmation.hidden = false;
  modal.querySelector('.modal-dialog').scrollTop = 0;
  consultConfirmation.focus();
}, 0);

// Join Community page: the sign-up form lives in its own modal, opened by the
// "Join the community" buttons. On success the intro + form are replaced inside
// the dialog by the confirmation message.
const joinModal = document.getElementById('joinModal');
if (joinModal) {
  setupModal(joinModal, '.join-btn', 'Join Button -> Sign-up Open');

  const joinForm = document.getElementById('joinForm');
  const syncJoinHeardOther = wireOtherField(joinForm, document.getElementById('joinHeardOtherField'));
  wireForm(joinForm, document.getElementById('joinStatus'), "", () => {
    syncJoinHeardOther();
    document.getElementById('joinIntro').hidden = true;
    joinForm.hidden = true;

    const confirmation = document.getElementById('joinConfirmation');
    confirmation.hidden = false;
    joinModal.querySelector('.modal-dialog').scrollTop = 0;
    confirmation.focus();
  }, 0);
}

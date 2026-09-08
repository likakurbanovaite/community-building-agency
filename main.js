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

/* ---------- Consultation modal ----------
   Injected from here so the markup lives in one place rather than being
   duplicated across every page that has a "Book" button. */
document.body.insertAdjacentHTML('beforeend', `
  <div id="consultModal" class="modal" aria-hidden="true">
    <div class="modal-backdrop" data-close="true"></div>

    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="consultTitle">
      <button class="modal-close" type="button" aria-label="Close" data-close="true">&times;</button>

      <div class="modal-content">
        <p class="modal-eyebrow">Get started</p>
        <h2 id="consultTitle">You're one step away.</h2>

        <p class="modal-body">
          Leave your details below and we'll get in touch within a week to schedule
          your free consultation.
        </p>

        <form id="consultForm" class="survey-form">
          <input type="hidden" name="formType" value="consultation">

          <label class="field">
            <span class="field-label">Name</span>
            <input type="text" name="name" required placeholder="Your name" />
          </label>

          <label class="field">
            <span class="field-label">Email</span>
            <input type="email" name="email" required placeholder="you@brand.com" />
          </label>

          <label class="field">
            <span class="field-label">Brand / business name</span>
            <input type="text" name="brand" required placeholder="Your brand" />
          </label>

          <fieldset class="field">
            <legend class="field-label">What best describes your role?</legend>
            <div class="radio-grid">
              <label><input type="radio" name="role" value="Founder" required> Founder</label>
              <label><input type="radio" name="role" value="Marketing / Community lead"> Marketing / Community lead</label>
              <label><input type="radio" name="role" value="Other"> Other</label>
            </div>
          </fieldset>

          <!-- revealed only when "Other" is picked; see syncRoleOther() below -->
          <label class="field" id="roleOtherField" hidden>
            <span class="field-label">Tell us your role</span>
            <input type="text" name="roleOther" placeholder="Your role" />
          </label>

          <label class="field">
            <span class="field-label">Website or Instagram <span class="field-optional">(optional)</span></span>
            <input type="text" name="website" placeholder="Optional" />
          </label>

          <label class="consent">
            <input type="checkbox" name="consent" value="yes" required>
            <span>
              I consent to my data being stored securely and used for communication purposes.
            </span>
          </label>

          <button class="btn-primary btn-full btn-large" type="submit">Submit</button>
          <p id="consultStatus" class="form-status" aria-live="polite"></p>
        </form>
      </div>
    </div>
  </div>
`);

const modal = document.getElementById('consultModal');
const form = document.getElementById('consultForm');
const statusEl = document.getElementById('consultStatus');

/* Picking "Other" for the role reveals a free-text field. `required` is toggled
   with it — a required field that is hidden makes the form unsubmittable, since
   the browser cannot focus it to show the validation message. */
const roleOtherField = document.getElementById('roleOtherField');
const roleOtherInput = roleOtherField.querySelector('input');

function syncRoleOther() {
  const picked = form.querySelector('[name="role"]:checked');
  const isOther = !!picked && picked.value === 'Other';
  roleOtherField.hidden = !isOther;
  roleOtherInput.required = isOther;
  if (!isOther) roleOtherInput.value = '';
}

form.querySelectorAll('[name="role"]').forEach(radio => {
  radio.addEventListener('change', () => {
    syncRoleOther();
    if (!roleOtherField.hidden) roleOtherInput.focus();
  });
});

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
  syncRoleOther();
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

wireForm(form, statusEl, "Thank you — submitted successfully.", closeModal);

// Join Community page: the sign-up form lives in its own modal, opened by the
// "Join the community" buttons. On success the intro + form are replaced inside
// the dialog by the confirmation message.
const joinModal = document.getElementById('joinModal');
if (joinModal) {
  setupModal(joinModal, '.join-btn', 'Join Button -> Sign-up Open');

  const joinForm = document.getElementById('joinForm');
  wireForm(joinForm, document.getElementById('joinStatus'), "", () => {
    document.getElementById('joinIntro').hidden = true;
    joinForm.hidden = true;

    const confirmation = document.getElementById('joinConfirmation');
    confirmation.hidden = false;
    joinModal.querySelector('.modal-dialog').scrollTop = 0;
    confirmation.focus();
  }, 0);
}

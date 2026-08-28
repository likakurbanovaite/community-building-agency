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
// .book-btn links are skipped — they open the survey modal, which closes the nav itself.
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

/* ---------- Survey modal ----------
   Injected from here so the markup lives in one place rather than being
   duplicated across every page that has a "Book" button. */
document.body.insertAdjacentHTML('beforeend', `
  <div id="surveyModal" class="modal" aria-hidden="true">
    <div class="modal-backdrop" data-close="true"></div>

    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="surveyTitle">
      <button class="modal-close" type="button" aria-label="Close survey" data-close="true">&times;</button>

      <div class="modal-content">
        <p class="modal-eyebrow">Quick survey</p>
        <h2 id="surveyTitle">You're early — and that's a good thing.</h2>

        <p class="modal-body">
          Community Building Agency is currently exploring a new way of supporting fashion businesses.
          The service is still taking shape. This page is an early prototype designed to understand what fashion brands actually need and whether this kind of support would be valuable.
        </p>

        <h3 class="modal-subtitle">What's Next?</h3>
        <p class="modal-body">
          By answering a few short questions, you'll help shape a service built around real challenges fashion businesses face.
          Early contributors will receive up to 50% discount as first clients when the business launches.
        </p>

        <form id="surveyForm" class="survey-form">
          <input type="hidden" name="formType" value="survey">

          <label class="field">
            <span class="field-label">1. What kind of fashion business do you run, and what is your role? How do you see the future of it?</span>
            <textarea name="q1" required rows="4" placeholder="Type your answer..."></textarea>
          </label>

          <label class="field">
            <span class="field-label">2. What are the biggest challenges your brand is facing at the moment? And what kind of support would be most helpful for your business at this stage?</span>
            <textarea name="q2" required rows="4" placeholder="Type your answer..."></textarea>
          </label>

          <label class="field">
            <span class="field-label">3. What would make you confident trying a new way to attract, retain and connect with customers? What might stop you?</span>
            <textarea name="q3" required rows="4" placeholder="Type your answer..."></textarea>
          </label>

          <fieldset class="field">
            <legend class="field-label">4. If a service helped you build a strong community, what monthly budget would feel realistic for you?</legend>
            <div class="radio-grid">
              <label><input type="radio" name="budget" value="£0–£200" required> £0–£200</label>
              <label><input type="radio" name="budget" value="£200–£500"> £200–£500</label>
              <label><input type="radio" name="budget" value="£500–£1,000"> £500–£1,000</label>
              <label><input type="radio" name="budget" value="£1,000–£2,000"> £1,000–£2,000</label>
              <label><input type="radio" name="budget" value="£2,000–£5,000"> £2,000–£5,000</label>
              <label><input type="radio" name="budget" value="£5,000–£10,000"> £5,000–£10,000</label>
              <label><input type="radio" name="budget" value="£10,000+"> £10,000+</label>
              <label><input type="radio" name="budget" value="Not sure yet"> Not sure yet</label>
            </div>
          </fieldset>

          <label class="consent">
            <input type="checkbox" name="consent" value="yes" required>
            <span>
              I confirm that I consent to my responses being used for research purposes only.
              All data will be stored securely and anonymised.
            </span>
          </label>

          <div class="divider"></div>

          <h3 class="modal-subtitle">Stay in the loop</h3>
          <p class="modal-body">
            If you'd like to be the first to hear when the business launches, please leave your email below.
            Early contributors will receive up to 50% discount as first clients when the business launches.
          </p>

          <label class="field">
            <span class="field-label">Email (optional)</span>
            <input type="email" name="email" placeholder="you@brand.com" />
          </label>

          <button class="btn-primary btn-full btn-large" type="submit">Submit</button>
          <p id="surveyStatus" class="form-status" aria-live="polite"></p>
        </form>
      </div>
    </div>
  </div>
`);

const modal = document.getElementById('surveyModal');
const form = document.getElementById('surveyForm');
const statusEl = document.getElementById('surveyStatus');

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
}

document.querySelectorAll('.book-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
    if (typeof gtag === 'function') {
      gtag('event', 'book_now_click', {
        event_category: 'engagement',
        event_label: 'Book Button -> Survey Open'
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
   Shared by the survey modal and the Join Community form. Both post to the same
   Apps Script endpoint and carry a `formType` field so the two can be told apart
   in the sheet. */
function wireForm(formEl, statusNode, successMsg, onSuccess) {
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
        gtag('event', 'survey_submit', {
          event_category: 'engagement',
          event_label: fd.get('formType') || 'Survey Submitted'
        });
      }

      formEl.reset();
      if (onSuccess) setTimeout(onSuccess, 900);

    } catch (err) {
      console.error(err);
      statusNode.textContent = "Something went wrong. Please try again.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

wireForm(form, statusEl, "Thank you — submitted successfully.", closeModal);

// Join Community page form, when present
const joinForm = document.getElementById('joinForm');
if (joinForm) {
  wireForm(
    joinForm,
    document.getElementById('joinStatus'),
    "Thank you — you're on the list. We'll be in touch soon."
  );
}

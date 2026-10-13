/**
 * Community Building Agency — form endpoint.
 *
 * Both site forms POST here. They are told apart by the `formType` field:
 *   consultation   — the "Book Free Consultation" modal  -> Consultation Requests tab
 *   join-community — the Join Community sign-up modal    -> Community tab
 *   anything else  — legacy survey submissions           -> Responses tab
 *
 * Each tab gets its own headers, written once on first use. After the row is
 * saved it emails you a notification and the submitter a confirmation.
 *
 * FIRST RUN: sending mail needs a permission the script didn't have before.
 * Open the editor, pick testEmail, hit Run once and approve the prompt,
 * otherwise every submission will log an authorisation error. Run testEmail
 * rather than doPost — doPost expects a request object it can't get from the
 * editor's Run button.
 *
 * After editing: Deploy > Manage deployments > (pencil) > Version: New version
 * > Deploy. Do NOT create a *new* deployment — that issues a different URL and
 * the site would keep posting to the old one.
 */

const OWNER_EMAIL = 'communitybuildingagency@gmail.com';
const FROM_NAME   = 'Community Building Agency';
const INSTAGRAM   = 'https://www.instagram.com/communitybuildingagency/';
const WHATSAPP    = 'https://chat.whatsapp.com/Grq3hVuVmsO8xMlrnB7Ls1';

const NOTIFY_OWNER      = true;   // email you on every submission
const SEND_CONFIRMATION = true;   // email the person who submitted

const TABS = {
  'consultation': {
    // new tab name: the old 'Consultations' tab keeps the previous form's columns
    sheet: 'Consultation Requests',
    label: 'consultation request',
    fields: ['submittedAt', 'page', 'name', 'email', 'phone', 'brand', 'about',
             'availability', 'website', 'heardFrom', 'heardFromOther',
             'privacyConsent', 'marketingConsent']
  },
  'join-community': {
    sheet: 'Community',
    label: 'community sign-up',
    fields: ['submittedAt', 'page', 'name', 'email', 'instagram', 'location',
             'ageRange', 'role', 'interests',
             'agreementConsent', 'contactConsent']
  },
  // fallback for the old survey, so historic rows keep their existing shape
  '': {
    sheet: 'Responses',
    label: 'survey response',
    fields: ['submittedAt', 'page', 'q1', 'q2', 'q3', 'budget', 'consent', 'email']
  }
};

function doPost(e) {
  // Hitting Run in the editor calls this with no request object. Say so plainly
  // instead of throwing a confusing TypeError on e.parameter.
  if (!e || !e.parameter) {
    console.log('doPost was run manually — there is no form data to process. ' +
                'Use testEmail() to check permissions; doPost only runs for real submissions.');
    return json({ ok: false, error: 'no request data' });
  }

  try {
    const type = (e.parameter.formType || '').trim();
    const config = TABS[type] || TABS[''];

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(config.sheet) || ss.insertSheet(config.sheet);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(config.fields);
    }

    const values = {};
    const row = config.fields.map(function (name) {
      let v;
      if (name === 'submittedAt') {
        v = e.parameter.submittedAt || new Date().toISOString();
      } else {
        // Checkbox groups (e.g. "interests") arrive as several values under one
        // name. e.parameter returns only the first, so read e.parameters instead.
        const all = e.parameters[name];
        v = (all && all.length > 1) ? all.join(', ') : (e.parameter[name] || '');
      }
      values[name] = v;
      return v;
    });

    sheet.appendRow(row);

    // Mail is best-effort: the row is already saved, so a mail failure (quota,
    // bad address) must never surface as a lost submission.
    if (NOTIFY_OWNER)      safely(function () { notifyOwner(config, values); });
    if (SEND_CONFIRMATION) safely(function () { confirmToSender(type, values); });

    return json({ ok: true });

  } catch (err) {
    // Surfaced in Executions, since the site posts no-cors and can't read this.
    console.error(err);
    return json({ ok: false, error: String(err) });
  }
}

/** Runs fn, logging rather than throwing. */
function safely(fn) {
  try { fn(); } catch (err) { console.error('mail step failed: ' + err); }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Plain-text summary of every captured field, sent to you. */
function notifyOwner(config, values) {
  const lines = config.fields
    .filter(function (f) { return f !== 'page'; })
    .map(function (f) { return f + ': ' + (values[f] || '—'); });

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'New ' + config.label + ' — ' + (values.name || values.email || 'no name'),
    body: 'A new ' + config.label + ' came in.\n\n' + lines.join('\n') +
          '\n\nPage: ' + (values.page || '—'),
    name: FROM_NAME,
    replyTo: values.email || OWNER_EMAIL
  });
}

/** Confirmation to whoever filled the form in. */
function confirmToSender(type, values) {
  const to = (values.email || '').trim();
  if (!to) return;

  const name = values.name || 'there';

  if (type === 'join-community') {
    sendWelcome(to, name);
  } else {
    sendConsultationEmail(to, name);
  }
}

/**
 * Confirmation for a free-consultation request. Plain text plus a matching
 * HTML version, so it looks consistent with the member welcome email.
 */
function sendConsultationEmail(to, name) {
  // the form asks for a full name; the greeting uses just the first word of it
  name = String(name).trim().split(/\s+/)[0] || 'there';

  const paras = [
    'Thank you for getting in touch with Community Building Agency!',

    'We’ve received your enquiry and will be in touch within two business days to ' +
    'arrange your free 30-minute introductory consultation.',

    'We look forward to learning more about your goals and exploring how we might be ' +
    'able to support you.'
  ];

  const signOff = ['Best wishes,', 'Lika Kurbanovaite', 'Founder | Community Building Agency'];

  const body =
    'Hi ' + name + ',\n\n' +
    paras.join('\n\n') + '\n\n' +
    signOff.join('\n');

  const htmlBody = htmlWrap(
    para('Hi ' + escapeHtml(name) + ',') +
    paras.map(para).join('') +
    para(signOff.join('<br>'))
  );

  MailApp.sendEmail({
    to: to,
    subject: 'Free Consultation Request Received | Community Building Agency',
    body: body,
    htmlBody: htmlBody,
    name: FROM_NAME,
    replyTo: OWNER_EMAIL
  });
}

/** Shared paragraph + container styling for the HTML emails. */
function para(t) {
  return '<p style="margin:0 0 16px">' + t + '</p>';
}

function htmlWrap(inner) {
  return '<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;' +
         'color:#1d2a62;max-width:560px;margin:0 auto;padding:8px">' + inner + '</div>';
}

/** Escapes text coming from the form before it goes into the HTML email. */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Welcome email for new community members. Sent as HTML so the two links read
 * as buttons, with a plain-text version for clients that refuse HTML.
 */
function sendWelcome(to, name) {
  const subject = 'Welcome to the CBA Community';

  const paras = [
    'Welcome to the CBA Community, we’re really happy to have you here.',
    'If you haven’t already, here’s where to go next:'
  ];

  const afterLinks = [
    'The WhatsApp group is where the community lives online. Updates, conversations, ' +
    'opportunities and connections all happen there, and it’s also where you’ll meet ' +
    'other members directly. Keep an eye on our Instagram too, so you don’t miss events ' +
    'and offline opportunities to meet everyone in person.',

    'Once you’re in the group, introduce yourself: your name, what you do and what ' +
    'you’re currently open to connecting around. It helps everyone get to know you, and ' +
    'it means people will think of you when the right opportunity comes up.',

    'Feel free to reach out to other members directly, just make sure to do it with ' +
    'respect and context, this community works best when people connect thoughtfully.',

    'A few things worth keeping in mind as you settle in:'
  ];

  const bullets = [
    'Come with a bit of generosity, share, support, offer help when you can, not just when you need something.',
    'Respect people’s time, work and boundaries.',
    'Credit others properly when you use or build on their ideas.',
    'This space works best when people show up to connect and contribute, not just to promote.'
  ];

  const closing =
    'We’re building this community together, and it’s still taking shape. If there’s ' +
    'something you’d love to see more of, an event, a type of conversation, a way for ' +
    'members to collaborate, tell us. Some of the best parts of this community so far ' +
    'came from members suggesting them first.';

  // ---- plain text ----
  const body =
    'Hi ' + name + ',\n\n' +
    paras.join('\n\n') + '\n\n' +
    'Join the WhatsApp Chat: ' + WHATSAPP + '\n' +
    'Follow us on Instagram: ' + INSTAGRAM + '\n\n' +
    afterLinks.join('\n\n') + '\n\n' +
    bullets.map(function (b) { return '- ' + b; }).join('\n') + '\n\n' +
    closing + '\n\n' +
    'Talk soon,\nCBA Community';

  // ---- html ----
  const btn = function (href, label, filled) {
    const style = filled
      ? 'background:#1d2a62;color:#ffffff;border:1px solid #1d2a62;'
      : 'background:#ffffff;color:#1d2a62;border:1px solid #d8dde8;';
    return '<a href="' + href + '" style="display:inline-block;padding:12px 24px;' +
           'margin:0 8px 10px 0;border-radius:999px;text-decoration:none;' +
           'font-weight:bold;font-size:15px;' + style + '">' + label + '</a>';
  };

  const htmlBody = htmlWrap(
    para('Hi ' + escapeHtml(name) + ',') +
    paras.map(para).join('') +
    '<p style="margin:0 0 20px">' +
      btn(WHATSAPP, 'Join the WhatsApp Chat', true) +
      btn(INSTAGRAM, 'Follow us on Instagram', false) +
    '</p>' +
    afterLinks.map(para).join('') +
    '<ul style="margin:0 0 16px;padding-left:20px">' +
      bullets.map(function (b) { return '<li style="margin-bottom:8px">' + b + '</li>'; }).join('') +
    '</ul>' +
    para(closing) +
    para('Talk soon,<br>CBA Community')
  );

  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: body,
    htmlBody: htmlBody,
    name: FROM_NAME,
    replyTo: OWNER_EMAIL
  });
}

/** Sends the member welcome email to yourself, to check how it looks. */
function testWelcome() {
  sendWelcome(OWNER_EMAIL, 'Lika');
  console.log('Welcome email sent to ' + OWNER_EMAIL);
}

/** Run this from the editor to check mail works and see your daily quota. */
function testEmail() {
  // Mail always sends from the account that authorised the script — not from
  // OWNER_EMAIL, which only says where notifications are delivered.
  console.log('Sending as: ' + Session.getEffectiveUser().getEmail());
  console.log('Remaining email quota today: ' + MailApp.getRemainingDailyQuota());
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'CBA form endpoint — test',
    body: 'If you are reading this, the script can send mail.',
    name: FROM_NAME
  });
}

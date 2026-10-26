/**
 * Community Building Agency — form endpoint.
 *
 * Both site forms POST here. They are told apart by the `formType` field:
 *   consultation   — the "Book Free Consultation" modal  -> Consultation Requests tab
 *   join-community — the Join Community sign-up modal    -> Community Members tab
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
// Instagram Community Chat invite. If this is ever emptied, the welcome email
// leaves that button out rather than sending a dead link.
const COMMUNITY_CHAT = 'https://ig.me/j/IQ9s54s2xTvygcPc/';

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
    // new tab name: 'Community' and 'Community Sign-ups' keep the earlier forms' columns
    sheet: 'Community Members',
    label: 'community sign-up',
    fields: ['submittedAt', 'page', 'name', 'email', 'instagram', 'phone',
             'whatsappSame', 'whatsapp', 'location', 'about', 'needHelp', 'canHelp',
             'heardFrom', 'heardFromOther',
             'agreementConsent', 'privacyConsent', 'contactConsent']
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
        // Checkbox groups arrive as several values under one
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
  const subject = 'Welcome to the CBA Community!';
  // the form asks for a full name; the greeting uses just the first word of it
  name = String(name).trim().split(/\s+/)[0] || 'there';

  const intro = [
    'Welcome to the CBA Community, we’re really happy to have you here!',
    'If you haven’t already, here’s where to go next:'
  ];

  // each link is followed by a line saying what it's for
  const links = [
    { href: COMMUNITY_CHAT, label: 'Join the Instagram Community Chat', filled: true,
      text: 'This is our main space to connect, chat, share ideas, knowledge and useful ' +
            'resources, ask for help, support and inspire each other, and discover new ' +
            'opportunities together. We’ll also add you to the chat using the Instagram ' +
            'handle you provided.' },
    { href: INSTAGRAM, label: 'Follow us on Instagram',
      text: 'Follow us to stay updated!' },
    { href: WHATSAPP, label: 'Join the WhatsApp Group',
      text: 'We also have an optional WhatsApp group for additional discussions and ' +
            'sharing resources.' }
  ].filter(function (l) { return l.href; });

  const introduceYourself =
    'Once you’re in the Community Chat, introduce yourself: your name, what you do, what ' +
    'you might need help with and how you could help others. It helps everyone get to ' +
    'know you, and it means people will think of you when the right opportunity comes up.';

  const values = [
    ['Generosity & Mutual Support',
     'Help each other when you can. Share your knowledge, time, ideas and encouragement ' +
     'without always expecting something in return.'],
    ['Understanding & Open-Mindedness',
     'Welcome different backgrounds, cultures and perspectives. Be curious, respectful ' +
     'and willing to understand each other.'],
    ['Collectivity & Initiative',
     'Bring forward your ideas, take action and support each other’s initiatives. ' +
     'Everyone has something valuable to contribute, and together we can achieve more.'],
    ['Making the World a Better Place',
     'Even small acts of kindness, support and understanding can make a difference. We ' +
     'hope to contribute to a more compassionate and connected world for humans.']
  ];

  const encourage = [
    'Ask for help and offer support when possible.',
    'Share ideas, knowledge, opportunities, useful resources and your own work.',
    'Take initiative and contribute to the Community.',
    'Respect people’s time, boundaries and creative work.',
    'Give credit to others for their ideas and contributions.'
  ];

  const dontAccept =
    'We don’t accept discrimination, harassment, bullying, spam, unsolicited sales ' +
    'messages, violations of privacy or taking credit for someone else’s work.';

  const closing = [
    'Remember, you’re always welcome to ask for help, including voluntary support with ' +
    'projects or opportunities you may not have a budget for. Everyone is free to decide ' +
    'whether and how they can help, and we ask members to respect those decisions.',

    'We’re building this community together, and it’s still taking shape. If there’s ' +
    'something you’d like to see happening in the Community, or if you’d like to ' +
    'collaborate with us, let us know!',

    'We want to keep communication open, so please feel free to reply to this email ' +
    'anytime, whether you have questions, feedback, need to correct your registration ' +
    'details, haven’t been added to the Community Chat or want to report something ' +
    'concerning within the Community. We’re always happy to hear from you!',

    'See you in the Community Chat!'
  ];

  const signOff = ['Best wishes,', 'Lika Kurbanovaite', 'Founder | Community Building Agency'];

  // ---- plain text ----
  const body =
    'Hi ' + name + ',\n\n' +
    intro.join('\n\n') + '\n\n' +
    links.map(function (l) { return l.label + ': ' + l.href + '\n' + l.text; }).join('\n\n') + '\n\n' +
    introduceYourself + '\n\n' +
    'OUR COMMUNITY CULTURE & VALUES\n\n' +
    values.map(function (v) { return '- ' + v[0] + ': ' + v[1]; }).join('\n') + '\n\n' +
    'A FEW COMMUNITY GUIDELINES\n\n' +
    'We encourage you to:\n' +
    encourage.map(function (e) { return '- ' + e; }).join('\n') + '\n\n' +
    dontAccept + '\n\n' +
    closing.join('\n\n') + '\n\n' +
    signOff.join('\n');

  // ---- html ----
  // all the copy above is plain text (it contains "&"), so it's escaped on the way in
  const p = function (t) { return para(escapeHtml(t)); };
  const h = function (t) {
    return '<h3 style="margin:28px 0 12px;font-size:18px;line-height:1.3;color:#1d2a62">' +
           escapeHtml(t) + '</h3>';
  };
  const list = function (items) {
    return '<ul style="margin:0 0 16px;padding-left:20px">' +
           items.map(function (i) { return '<li style="margin-bottom:8px">' + i + '</li>'; }).join('') +
           '</ul>';
  };
  const btn = function (href, label, filled) {
    const style = filled
      ? 'background:#1d2a62;color:#ffffff;border:1px solid #1d2a62;'
      : 'background:#ffffff;color:#1d2a62;border:1px solid #d8dde8;';
    return '<a href="' + href + '" style="display:inline-block;padding:12px 24px;' +
           'border-radius:999px;text-decoration:none;' +
           'font-weight:bold;font-size:15px;' + style + '">' + escapeHtml(label) + '</a>';
  };

  const htmlBody = htmlWrap(
    para('Hi ' + escapeHtml(name) + ',') +
    intro.map(p).join('') +
    links.map(function (l) {
      return '<p style="margin:20px 0 10px">' + btn(l.href, l.label, l.filled) + '</p>' + p(l.text);
    }).join('') +
    p(introduceYourself) +
    h('Our Community Culture & Values') +
    list(values.map(function (v) {
      return '<strong>' + escapeHtml(v[0]) + ':</strong> ' + escapeHtml(v[1]);
    })) +
    h('A Few Community Guidelines') +
    p('We encourage you to:') +
    list(encourage.map(escapeHtml)) +
    p(dontAccept) +
    closing.map(p).join('') +
    para(signOff.map(escapeHtml).join('<br>'))
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

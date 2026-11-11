/* =========================================================
   Community Building Agency — shared page layout
   The notice banner, navbar and footer, kept here once instead of copied
   into every page.

   Each page loads this with a plain <script src="src/js/layout.js"></script> right
   after <body> — deliberately not defer: it runs before the rest of the page
   is drawn, so the navbar is there from the first paint instead of popping
   in. main.js (deferred) runs afterwards and wires the menu and Book buttons.
   ========================================================= */

(function () {
  // which page this is: "services" for /services.html, and for /services too,
  // since GitHub Pages also serves pages without the .html
  const page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');
  const current = (name) => page === name ? ' aria-current="page"' : '';

  document.currentScript.insertAdjacentHTML('beforebegin', `
  <p class="dev-banner">
    <span>Under development</span>
    <span class="dev-banner-date">Last update: 13 Oct 2026</span>
  </p>

  <header class="site-header">
    <div class="container nav-inner">
      <a class="logo" href="index.html">
        <!-- empty alt: the text beside it already names the link, so screen
             readers would otherwise say "Community Building Agency" twice -->
        <img class="logo-mark" src="assets/cba/CBA_sphere.png" alt="">
        <span class="logo-text">Community Building Agency</span>
      </a>

      <nav class="nav-links" id="primary-nav">
        <a href="index.html"${current('index')}>About Us</a>
        <a href="services.html"${current('services')}>Services</a>
        <a href="joincommunity.html"${current('joincommunity')}>Our Community</a>
        <a href="#book" class="nav-cta book-btn">Book Free Consultation</a>
      </nav>

      <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false" aria-controls="primary-nav">
        <span></span><span></span>
      </button>
    </div>
  </header>`);

  // The footer goes after <main>, which hasn't been read yet at this point,
  // so it waits for the page to finish loading. Nobody sees it arrive: it's
  // at the bottom.
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('main').insertAdjacentHTML('afterend', `
  <footer class="footer">
    <div class="container footer-inner">
      <p class="footer-meta">© ${new Date().getFullYear()} Community Building Agency. All rights reserved. <span aria-hidden="true">·</span> <a href="communityguidelines.html">CBA Community Guidelines &amp; Terms of Participation</a> <span aria-hidden="true">·</span> <a href="privacypolicy.html">Privacy Policy</a></p>
    </div>
  </footer>`);
  });
})();

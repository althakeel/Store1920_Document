    const data = window.GUIDE_DATA;
    const pages = data.pages;
    const byId = Object.fromEntries(pages.map((page) => [page.id, page]));
    let currentPageId = 'welcome';

    function splitSentences(text) {
      return { first: String(text || ''), rest: '' };
    }

    function escapeHtml(value) {
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function renderTree(query) {
      const q = query.trim().toLowerCase();
      const tree = document.getElementById('tree');
      tree.innerHTML = data.groups.map((group) => {
        const links = group.pages.filter((page) => {
          if (!q) return true;
          const full = byId[page.id] || page;
          const blob = (full.title + ' ' + (full.summary || '') + ' ' + (full.controls || []).map((item) => (item.name || '') + ' ' + (item.text || item)).join(' ')).toLowerCase();
          return blob.includes(q) || group.name.toLowerCase().includes(q);
        }).map((page) => '<a class="page-link" data-id="' + page.id + '" href="#' + page.id + '">' + page.title + '</a>').join('');
        if (!links) return '';
        const open = Boolean(q) || group.pages.some((page) => page.id === currentPageId);
        return '<div class="group' + (open ? '' : ' collapsed') + '"><button type="button">' + group.name + '<span>▾</span></button><div class="links">' + links + '</div></div>';
      }).join('');
      tree.querySelectorAll('.group > button').forEach((button) => {
        button.addEventListener('click', () => button.parentElement.classList.toggle('collapsed'));
      });
      markActive();
    }

    function markActive() {
      document.querySelectorAll('.page-link').forEach((link) => {
        link.classList.toggle('active', link.dataset.id === currentPageId);
      });
      document.querySelectorAll('.group').forEach((group) => {
        if (group.querySelector('.page-link[data-id="' + currentPageId + '"]')) group.classList.remove('collapsed');
      });
    }

    function renderPage() {
      const hash = location.hash.slice(1);
      if (hash && !byId[hash]) {
        const target = document.getElementById(hash);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const page = byId[hash] || pages[0];
      currentPageId = page.id;
      const index = pages.findIndex((item) => item.id === page.id);
      const prev = pages[index - 1];
      const next = pages[index + 1];
      const controls = Array.isArray(page.controls) ? page.controls : [];
      const steps = page.steps || [];
      const fileName = 'screenshots/' + page.id + '.png?v=5';
      const where = '<div class="find"><div><span>Go to</span><span class="path">' + escapeHtml(page.path) + '</span></div>'
        + (page.clickTab ? '<div><span>Then choose</span>' + escapeHtml(page.clickTab) + '</div>' : '')
        + '</div>';
      const how = steps.length
        ? '<h2 id="howto">What to do</h2><ol class="steps">' + steps.map((step) => '<li>' + escapeHtml(step) + '</li>').join('') + '</ol>'
        : '';
      const settings = controls.length
        ? '<h2 id="settings">What you will see on the screen</h2>' + controls.map((item, i) => {
            const name = item.name || item;
            const bits = splitSentences(item.text || '');
            const extra = bits.rest ? '<p class="more">' + escapeHtml(bits.rest) + '</p>' : '';
            return '<article class="setting"><div class="setting-index">' + String(i + 1).padStart(2, '0') + '</div><div><h3>' + escapeHtml(name) + '</h3><p class="point">' + escapeHtml(bits.first) + '</p>' + extra + '</div></article>';
          }).join('')
        : '';
      const groupBlurbs = {
        'Account settings': 'Your login, the business, email, how customers pay, and who on the team can open each screen.',
        'Core': 'Home, categories, brands, suppliers, products, what you paid, and the labels on photos.',
        'Storefront': 'How the shop and the app home look: banners, header, blog, and pictures.',
        'Marketing': 'Offers, coupons, email, and who is buying, searching, or going quiet.',
        'Sales & Operations': 'Orders, pickup, delivery prices, returns, and the sales report.',
        'Warehouse': 'How many units you have, who changed a number, and an Excel download.',
        'Customers & Support': 'Customers, reviews, tickets, product emails, and contact messages.'
      };
      const cards = page.id === 'welcome'
        ? '<h2 id="sections">Start with a section</h2><div class="cards">' + data.groups.filter((group) => group.name !== 'Getting started').map((group) => {
            const first = group.pages[0];
            const blurb = groupBlurbs[group.name] || (group.pages.length + ' screens');
            return '<a class="card" href="#' + first.id + '"><b>' + escapeHtml(group.name) + '</b><span>' + escapeHtml(blurb) + '</span></a>';
          }).join('') + '</div>'
        : '';
      const shot = '<figure class="shot" id="screenshot"><img src="' + fileName + '" alt="' + escapeHtml(page.title) + '"><figcaption>This is the ' + escapeHtml(page.title) + ' screen.</figcaption><p class="shot-help">Screenshot is not in this folder yet.</p></figure>';
      const tip = page.tip ? '<div class="tip" id="tip"><strong>Heads up</strong>' + escapeHtml(page.tip) + '</div>' : '';
      const pager = '<div class="pager">'
        + (prev ? '<a href="#' + prev.id + '"><small>Previous</small><strong>' + escapeHtml(prev.title) + '</strong></a>' : '<span></span>')
        + (next ? '<a class="next" href="#' + next.id + '"><small>Next</small><strong>' + escapeHtml(next.title) + '</strong></a>' : '<span></span>')
        + '</div>';
      const pageBits = splitSentences(page.summary);
      const lead = '<p class="lead">' + escapeHtml(pageBits.first) + '</p>'
        + (pageBits.rest ? '<p class="more">' + escapeHtml(pageBits.rest) + '</p>' : '');
      document.getElementById('content').innerHTML = '<article class="sheet">'
        + '<p class="crumb"><a href="#welcome">Guide</a> / ' + escapeHtml(page.section || 'Guide') + '</p>'
        + '<p class="kicker">' + escapeHtml(page.section || 'Guide') + '</p>'
        + '<h1 id="overview">' + escapeHtml(page.title) + '</h1>'
        + lead
        + where
        + shot
        + (page.id === 'welcome' ? how + cards : how + settings)
        + tip
        + pager
        + '</article>';
      const image = document.querySelector('.shot img');
      if (image) {
        const showShot = () => image.parentElement.classList.add('ready');
        if (image.complete && image.naturalWidth > 0) showShot();
        else image.addEventListener('load', showShot);
      }
      const toc = [{ href: '#overview', label: 'Overview' }];
      if (page.id === 'welcome') toc.push({ href: '#sections', label: 'Sections' });
      else {
        if (steps.length) toc.push({ href: '#howto', label: 'What to do' });
        if (controls.length) toc.push({ href: '#settings', label: 'On the screen' });
      }
      toc.push({ href: '#screenshot', label: 'Screenshot' });
      if (page.tip) toc.push({ href: '#tip', label: 'Heads up' });
      document.getElementById('page-toc-links').innerHTML = toc.map((item) => '<a href="' + item.href + '">' + item.label + '</a>').join('');
      document.title = page.title + ' · Store1920 Documentation';
      markActive();
      window.scrollTo(0, 0);
      const active = document.querySelector('.page-link.active');
      if (active) active.scrollIntoView({ block: 'nearest' });
    }

    document.getElementById('search').addEventListener('input', (event) => renderTree(event.target.value));
    window.addEventListener('hashchange', renderPage);
    renderTree('');
    renderPage();
  
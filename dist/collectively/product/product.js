(() => {
  const body = document.body;
  const style = body.dataset.style;
  const view = body.dataset.view;
  const store = {
    get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, value); } catch {} }
  };

  function navigate(nextView) {
    if (window.parent !== window) {
      window.parent.postMessage({ source: 'collectively-product', style, view: nextView }, '*');
    } else {
      location.href = `${nextView}.html`;
    }
  }

  let toastTimer;
  function toast(message) {
    document.querySelector('.product-toast')?.remove();
    const el = document.createElement('div');
    el.className = 'product-toast';
    el.setAttribute('role', 'status');
    el.textContent = message;
    body.append(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 3200);
  }

  function interactive(el, action, label) {
    if (el.tagName !== 'A' && el.tagName !== 'BUTTON') {
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
      el.tabIndex = 0;
      if (label) el.setAttribute('aria-label', label);
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          action(event);
        }
      });
    }
    el.addEventListener('click', (event) => {
      event.preventDefault();
      action(event);
    });
  }

  function setupSidebar() {
    const side = document.querySelector('.side, .rail');
    const brand = side.querySelector('.brand');
    let toggle = side.querySelector('.tg');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.className = 'side-toggle';
      toggle.type = 'button';
      toggle.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4zM9 4v16m5-11-3 3 3 3"/></svg>';
      brand.append(toggle);
    }
    const key = `collectively-sidebar-${style}`;
    function setCollapsed(collapsed) {
      body.classList.toggle('is-collapsed', collapsed);
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
      toggle.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
      store.set(key, collapsed ? 'collapsed' : 'expanded');
    }
    setCollapsed(store.get(key) === 'collapsed' || (store.get(key) === null && matchMedia('(max-width: 820px)').matches));
    toggle.addEventListener('click', () => setCollapsed(!body.classList.contains('is-collapsed')));

    for (const item of side.querySelectorAll('.nav > a, .nav > .ni')) {
      const label = (item.querySelector('.t')?.textContent || item.textContent).trim().replace(/\s*\d+$/, '');
      const nextView = label === 'Dashboard' ? 'dashboard' : label === 'Unclaimed property' ? 'unclaimed' : null;
      item.title = label;
      item.setAttribute('aria-label', label);
      if (nextView) {
        if (item.tagName !== 'A') item.setAttribute('role', 'link');
        interactive(item, () => navigate(nextView), label);
      } else {
        interactive(item, () => toast(`${label} is outside this preview.`), label);
      }
    }
  }

  let activeDialog;
  function closeDialog() {
    if (!activeDialog) return;
    const restore = activeDialog.restore;
    activeDialog.el.remove();
    activeDialog = null;
    restore?.focus();
  }

  function openDialog({ title, description, confirm, onConfirm, field }) {
    closeDialog();
    const restore = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'product-dialog';
    overlay.setAttribute('role', 'presentation');
    overlay.innerHTML = '<div class="product-dialog-card" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title"><h2 id="product-dialog-title"></h2><p class="product-dialog-description"></p><p class="demo-note">This is a local prototype. No document or answer is submitted.</p><div class="product-dialog-field"></div><div class="product-dialog-actions"><button type="button" data-close>Cancel</button><button type="button" data-confirm></button></div></div>';
    overlay.querySelector('h2').textContent = title;
    overlay.querySelector('.product-dialog-description').textContent = description;
    overlay.querySelector('[data-confirm]').textContent = confirm;
    if (field) overlay.querySelector('.product-dialog-field').append(field);
    body.append(overlay);
    activeDialog = { el: overlay, restore };
    overlay.querySelector('[data-close]').addEventListener('click', closeDialog);
    overlay.querySelector('[data-confirm]').addEventListener('click', () => {
      if (onConfirm?.() === false) return;
      closeDialog();
    });
    overlay.addEventListener('click', (event) => { if (event.target === overlay) closeDialog(); });
    overlay.querySelector('[data-close]').focus();
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeDialog) { event.preventDefault(); closeDialog(); }
    if (event.key === 'Tab' && activeDialog) {
      const controls = [...activeDialog.el.querySelectorAll('button, select')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  function setupFilters() {
    const tabs = [...document.querySelectorAll('.fl > a, .flt > .fc')];
    const rows = [...document.querySelectorAll('.rows > .row')];
    if (!tabs.length || !rows.length) return;
    const host = rows[0].parentElement;
    const empty = document.createElement('p');
    empty.className = 'prototype-empty';
    empty.hidden = true;
    host.append(empty);
    tabs[0].parentElement.setAttribute('role', 'tablist');
    tabs.forEach((tab) => {
      const label = tab.textContent.trim().replace(/\s*\d+$/, '');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(tab.classList.contains('on')));
      if (tab.tagName !== 'A') tab.tabIndex = 0;
      function select() {
        tabs.forEach((item) => {
          item.classList.toggle('on', item === tab);
          item.setAttribute('aria-selected', String(item === tab));
        });
        let count = 0;
        rows.forEach((row) => {
          const visible = /^(All|Picked for me)/.test(label) || (label === 'Data breach' && /Cascade Telecom/i.test(row.textContent));
          row.hidden = !visible;
          if (visible) count++;
        });
        empty.hidden = count > 0;
        empty.textContent = `No action is needed in ${label.toLowerCase()} right now.`;
      }
      interactive(tab, select, label);
    });
  }

  function setupDashboardActions() {
    const rows = [...document.querySelectorAll('.rows > .row')];
    for (const row of rows) {
      const action = row.querySelector('.btn');
      if (!action) continue;
      if (/See what we found/i.test(action.textContent)) {
        interactive(action, () => navigate('unclaimed'), 'See Georgia unclaimed property');
      } else if (/Complete your questionnaire/i.test(action.textContent)) {
        interactive(action, () => {
          const label = document.createElement('label');
          label.textContent = 'Did your business use Cascade Telecom services from 2021 to 2023?';
          const select = document.createElement('select');
          select.innerHTML = '<option value="">Choose an answer</option><option value="yes">Yes</option><option value="no">No</option><option value="unsure">I’m not sure</option>';
          label.append(select);
          openDialog({
            title: 'Complete your questionnaire',
            description: 'One answer helps us check your eligibility for the Cascade Telecom settlement.',
            confirm: 'Save answer', field: label,
            onConfirm: () => {
              if (!select.value) { select.focus(); return false; }
              action.textContent = 'Answer saved';
              action.setAttribute('aria-disabled', 'true');
              action.style.pointerEvents = 'none';
              store.set(`collectively-questionnaire-${style}`, select.value);
              toast('Your answer was saved in this preview.');
            }
          });
        }, 'Complete Cascade Telecom questionnaire');
        if (store.get(`collectively-questionnaire-${style}`)) {
          action.textContent = 'Answer saved';
          action.setAttribute('aria-disabled', 'true');
          action.style.pointerEvents = 'none';
        }
      }
    }
  }

  function setupClaimActions() {
    const doc = [...document.querySelectorAll('.doc')].find((item) => item.querySelector('.btn'));
    if (!doc) return;
    const button = doc.querySelector('.btn');
    const key = `collectively-signed-${style}`;
    function markSigned() {
      const signedBadge = document.querySelector('.doc .sg, .doc .chip.g')?.cloneNode(true);
      if (signedBadge) {
        if (style === 'b') {
          doc.querySelector('.db')?.append(signedBadge);
          button.remove();
        } else {
          button.replaceWith(signedBadge);
        }
      }
      doc.classList.add('is-signed');
      const steps = [...document.querySelectorAll('.sb > .c, .stp > .sg')];
      if (steps[1]) { steps[1].classList.remove('cur'); steps[1].classList.add('done'); }
      if (steps[2]) { steps[2].classList.remove('todo'); steps[2].classList.add('cur'); }
      const heading = document.querySelector('.left h2, .sec h2');
      if (heading) heading.textContent = 'Documents signed';
      const note = document.querySelector('.note');
      if (note) note.textContent = 'Your documents are ready. The next step is filing your claim with Georgia.';
      const identity = document.querySelector('.doc.ph');
      if (identity) {
        identity.classList.remove('ph');
        const status = identity.querySelector('.mut');
        if (status) status.textContent = 'Ready for identity check';
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'prototype-identity-button';
        next.textContent = 'View requirements';
        identity.append(next);
        next.addEventListener('click', () => openDialog({
          title: 'Identity check',
          description: 'Georgia may ask for a photo ID before releasing your payment. In this preview, you can review the step without uploading an ID.',
          confirm: 'Got it'
        }));
      }
      store.set(key, 'yes');
    }
    if (store.get(key) === 'yes') markSigned();
    else interactive(button, () => {
      const title = doc.querySelector('.dt, .tx b')?.textContent.trim() || "Georgia's claim form";
      const description = doc.querySelector('.dd, .tx span')?.textContent.trim() || 'Review your claim details before signing.';
      openDialog({ title, description, confirm: 'Sign document', onConfirm: () => { markSigned(); toast('Document signed in this preview.'); } });
    }, 'Review and sign Georgia claim form');

    const arrows = [...document.querySelectorAll('.nbs .nb')];
    if (arrows[0]) interactive(arrows[0], () => navigate('dashboard'), 'Back to dashboard');
    if (arrows[1]) interactive(arrows[1], () => document.querySelector('.docs')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 'Go to documents');
  }

  setupSidebar();
  if (view === 'dashboard') { setupFilters(); setupDashboardActions(); }
  if (view === 'unclaimed') setupClaimActions();
})();

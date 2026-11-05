const DEMO_MODE = true;

(() => {
  if (DEMO_MODE) {
    const badge = document.createElement('div');
    badge.className = 'demo-badge';
    badge.textContent = 'ДЕМО-ВЕРСИЯ · КУБИК ДЗЕРЖИНСК';
    document.body.append(badge);
    document.addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && ['s', 'u', 'ы', 'г'].includes(event.key.toLowerCase())) event.preventDefault();
    }, true);
    // This is a demo deterrent, not server-side access control.
    const host = location.hostname.toLowerCase();
    const allowed = ['http:', 'https:'].includes(location.protocol) &&
      (['localhost', '127.0.0.1'].includes(host) || ['.vercel.app', '.netlify.app', '.github.io'].some(suffix => host.endsWith(suffix)));
    if (!allowed) {
      for (const element of document.querySelectorAll('header, main, footer')) element.inert = true;
      for (const type of ['click', 'auxclick', 'submit', 'drop', 'dragover', 'pointerdown', 'keydown']) {
        window.addEventListener(type, event => { event.preventDefault(); event.stopImmediatePropagation(); }, true);
      }
      badge.setAttribute('role', 'status');
      badge.textContent += ' · Интерактив доступен только на демо-домене';
      return;
    }
  }
  const root = document.querySelector('.contacts');
  if (!root) return;

  // Preliminary examples for screen two, not a confirmed workshop tariff.
  const services = {
    paint: { name: 'Покраска', unit: 'за деталь', items: [
      ['Бампер передний / задний', 4500, 'Подготовка, эмаль, защитный лак'], ['Крыло', 4500, 'Выравнивание, подготовка, окраска, лак'], ['Дверь', 4500, 'Подготовка поверхности, эмаль, лак'],
      ['Капот / Крыша', 5500, 'Подготовка плоскости, окраска, лак'], ['Порог / Арка', 4500, 'Подготовка, локальная окраска, лак'], ['Локальный окрас переходом', 3000, 'Подготовка, плавный переход, лак'],
    ] },
    polish: { name: 'Полировка', unit: 'за работу', items: [
      ['Полировка одной детали', 1000, 'Очистка, паста, финишный блеск'], ['Полировка кузова целиком', 12000, 'Очистка кузова, паста, финиш'],
      ['Глубокая полировка кузова', 18000, 'Абразивная обработка, финишная полировка'], ['Полировка двух фар', 2000, 'Очистка, шлифовка, финишная полировка'],
      ['Удаление локальной царапины', 1500, 'Осмотр, локальная обработка, полировка'], ['Нанесение защитного воска', 3000, 'Очистка, нанесение, финишная располировка'],
    ] },
    bodywork: { name: 'Кузовной ремонт', unit: 'за работу', items: [
      ['Ремонт бампера', 2500, 'Осмотр, восстановление формы, подготовка'], ['Рихтовка крыла', 3000, 'Осмотр, выравнивание, восстановление формы'], ['Рихтовка двери', 3500, 'Осмотр, рихтовка, подготовка поверхности'],
      ['Удаление вмятины без покраски', 2000, 'Осмотр, бережное выправление металла'], ['Замена порога', 8000, 'Демонтаж, подгонка, установка порога'], ['Ремонт колесной арки', 5000, 'Осмотр, восстановление металла, подготовка'],
    ] },
    frame: { name: 'Стапель', unit: 'за работу', items: [
      ['Проверка геометрии кузова', 3000, 'Контроль точек, замеры, диагностика'], ['Установка на стапель', 5000, 'Позиционирование, крепление, контроль кузова'],
      ['Вытяжка лонжерона', 10000, 'Замеры, вытяжка, контроль геометрии'], ['Восстановление проема двери', 8000, 'Замеры, восстановление, контроль проема'],
      ['Устранение перекоса кузова', 15000, 'Диагностика, правка, контроль геометрии'], ['Восстановление передней панели', 6000, 'Замеры, правка, восстановление формы'],
    ] },
  };
  const money = value => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
  const selected = new Map();
  const catalog = new Map();
  const photos = [];
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = root.querySelector('#price-panels');
  const itemList = root.querySelector('#estimate-items');
  const comment = root.querySelector('#car-comment');
  const email = root.querySelector('#estimate-email');
  const input = root.querySelector('#damage-photos');
  const previews = root.querySelector('#photo-previews');
  const photoError = root.querySelector('#photo-error');
  const drop = root.querySelector('#photo-drop');
  const toast = root.querySelector('#estimate-toast');
  const fallback = root.querySelector('#estimate-copy-fallback');
  let toastTimer;
  let copyPending = false;
  const icon = (paths, className = '') => `<svg class="estimate-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const closeIcon = icon('<path d="m7 7 10 10M17 7 7 17"/>');

  for (const [key, service] of Object.entries(services)) {
    const panel = document.createElement('div');
    panel.id = `price-${key}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${key}`);
    panel.hidden = key !== 'paint';
    panel.innerHTML = `<div class="price-heading"><h3>${service.name}</h3><span>${service.unit}</span></div><ul class="price-list"></ul>`;
    service.items.forEach(([name, price, description], index) => {
      const id = `${key}-${index}`;
      catalog.set(id, { name, price, service: service.name });
      const li = document.createElement('li');
      li.innerHTML = `<button class="price-row press" type="button" aria-pressed="false" data-item="${id}"><span class="price-indicator">${icon('<path d="m6 12 4 4 8-8"/>', 'price-check')}</span><span class="price-label"><span>${name}</span><small>${description}</small></span><span class="price-value">от ${money(price)}</span></button>`;
      panel.querySelector('ul').append(li);
    });
    panels.append(panel);
  }

  const tabIndicator = document.createElement('span');
  tabIndicator.className = 'estimate-tab-indicator';
  tabIndicator.setAttribute('aria-hidden', 'true');
  const tablist = root.querySelector('.estimate-tabs');
  tablist.prepend(tabIndicator);
  function positionTabIndicator() {
    const active = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
    tabIndicator.style.width = `${active.offsetWidth}px`;
    tabIndicator.style.height = `${active.offsetHeight}px`;
    tabIndicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
  }
  new ResizeObserver(positionTabIndicator).observe(tablist);
  document.fonts.ready.then(positionTabIndicator);
  positionTabIndicator();

  function activateTab(tab) {
    for (const candidate of tabs) {
      const active = candidate === tab;
      candidate.setAttribute('aria-selected', String(active));
      candidate.tabIndex = active ? 0 : -1;
      root.querySelector(`#${candidate.getAttribute('aria-controls')}`).hidden = !active;
    }
    positionTabIndicator();
    updateRequest();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.querySelector(`#${tab.getAttribute('aria-controls')}`).animate([{ opacity: .7 }, { opacity: 1 }], { duration: 160, easing: 'cubic-bezier(.2, 0, 0, 1)' });
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      activateTab(tabs[next]);
      tabs[next].focus();
    });
  });

  const total = () => [...selected.values()].reduce((sum, item) => sum + item.price, 0);
  function requestText() {
    return [
      'Здравствуйте! Хочу оценить ремонт в «Кубике».', '',
      ...(selected.size ? ['Выбранные работы:', ...[...selected.values()].map(item => `• ${item.service} — ${item.name}: от ${money(item.price)}`), '', `Ориентировочно: от ${money(total())}`] : [`Категория: ${services[tabs.find(tab => tab.getAttribute('aria-selected') === 'true').id.replace('tab-', '')].name}`, 'Работы пока не выбраны. Нужна оценка по фото.', 'Ориентировочно: после осмотра']),
      '', `Марка авто / комментарий: ${comment.value.trim() || 'не указаны'}`,
      '', `Прикреплено фото: ${photos.length} шт.${photos.length ? ' — отправлю следующим сообщением. Не забуду прикрепить выбранные файлы фото к письму или сообщению.' : ''}`,
      '', 'Понимаю, что точная стоимость определяется после осмотра.',
    ].join('\n');
  }
  function updateRequest() {
    const text = requestText();
    email.href = DEMO_MODE ? '#demo-request' : mailto(text);
    root.querySelector('#estimate-copy-text').value = text;
  }
  function mailto(text) {
    return `mailto:kubiku@inbox.ru?subject=${encodeURIComponent('Оценка кузовного ремонта — Кубик')}&body=${encodeURIComponent(text)}`;
  }
  function updateSelection() {
    for (const row of panels.querySelectorAll('[data-item]')) row.setAttribute('aria-pressed', String(selected.has(row.dataset.item)));
    root.querySelector('#estimate-empty').hidden = selected.size > 0;
    root.querySelector('#estimate-selected').hidden = selected.size === 0;
    root.querySelector('#estimate-count').textContent = `Выбрано: ${selected.size} ${new Intl.PluralRules('ru').select(selected.size) === 'one' ? 'позиция' : new Intl.PluralRules('ru').select(selected.size) === 'few' ? 'позиции' : 'позиций'}`;
    const price = root.querySelector('#estimate-total');
    const nextPrice = selected.size ? `от ${money(total())}` : '—';
    if (price.textContent !== nextPrice) {
      price.textContent = nextPrice;
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        price.getAnimations().forEach(animation => animation.cancel());
        price.animate([{ opacity: .45, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'cubic-bezier(.2, 0, 0, 1)' });
      }
    }
    itemList.replaceChildren();
    for (const [id, item] of selected) {
      const li = document.createElement('li');
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'estimate-chip press';
      remove.dataset.remove = id;
      remove.setAttribute('aria-label', `Убрать: ${item.service} — ${item.name}`);
      const label = document.createElement('span');
      label.textContent = item.name;
      remove.append(label);
      remove.insertAdjacentHTML('beforeend', closeIcon);
      li.append(remove);
      itemList.append(li);
    }
    updateRequest();
  }
  panels.addEventListener('click', event => {
    const row = event.target.closest('[data-item]');
    if (!row) return;
    if (selected.has(row.dataset.item)) selected.delete(row.dataset.item);
    else selected.set(row.dataset.item, catalog.get(row.dataset.item));
    updateSelection();
  });
  itemList.addEventListener('click', event => {
    const remove = event.target.closest('[data-remove]');
    if (!remove) return;
    const index = [...itemList.querySelectorAll('button')].indexOf(remove);
    selected.delete(remove.dataset.remove);
    updateSelection();
    const buttons = itemList.querySelectorAll('button');
    (buttons[Math.min(index, buttons.length - 1)] || tabs.find(tab => tab.getAttribute('aria-selected') === 'true')).focus();
  });
  comment.addEventListener('input', updateRequest);

  function showPhotoError(message) {
    photoError.textContent = message;
    photoError.hidden = !message;
  }
  function removePhoto(photo) {
    const index = photos.indexOf(photo);
    if (index < 0) return;
    URL.revokeObjectURL(photo.url);
    photos.splice(index, 1);
    photo.element.remove();
    previews.hidden = photos.length === 0;
    updateRequest();
  }
  function addPhotos(files) {
    const errors = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) { errors.push('Выберите изображения. Другие файлы не добавлены.'); continue; }
      if (!file.size || file.size > 20 * 1024 * 1024) { errors.push('Фото должно быть не пустым и не больше 20 МБ.'); continue; }
      if (photos.some(photo => photo.file.name === file.name && photo.file.size === file.size && photo.file.lastModified === file.lastModified)) continue;
      if (photos.length >= 3) { errors.push('Можно добавить до 3 фото. Удалите одно, чтобы выбрать другое.'); continue; }
      const photo = { file, url: URL.createObjectURL(file), element: document.createElement('li') };
      photo.element.className = 'photo-preview';
      const img = document.createElement('img');
      img.alt = `Фото повреждения: ${file.name}`;
      img.src = photo.url;
      img.addEventListener('error', () => {
        removePhoto(photo);
        showPhotoError(`Не удалось открыть «${file.name}». Выберите фото в JPG, PNG или WebP.`);
      }, { once: true });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'press';
      remove.setAttribute('aria-label', `Удалить фото: ${file.name}`);
      remove.innerHTML = closeIcon;
      remove.addEventListener('click', () => { removePhoto(photo); input.focus(); });
      photo.element.append(img, remove);
      photos.push(photo);
      previews.append(photo.element);
    }
    previews.hidden = photos.length === 0;
    showPhotoError([...new Set(errors)].join(' '));
    input.value = '';
    updateRequest();
  }
  input.addEventListener('change', () => addPhotos(input.files));
  const hasFiles = event => [...(event.dataTransfer?.types || [])].includes('Files');
  window.addEventListener('dragover', event => { if (hasFiles(event)) event.preventDefault(); });
  window.addEventListener('drop', event => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    delete drop.dataset.dragging;
  });
  drop.addEventListener('dragover', event => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    drop.dataset.dragging = '';
  });
  drop.addEventListener('dragleave', event => { if (!drop.contains(event.relatedTarget)) delete drop.dataset.dragging; });
  drop.addEventListener('drop', event => { if (hasFiles(event)) addPhotos(event.dataTransfer.files); });
  window.addEventListener('dragend', () => { delete drop.dataset.dragging; });

  function showToast(message, persistent = false) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    if (!persistent) toastTimer = setTimeout(() => { toast.hidden = true; }, 8000);
  }
  async function copyRequest(text) {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); return; } catch { /* Try local copy when clipboard permission is unavailable. */ }
    }
    const focused = document.activeElement;
    const field = document.createElement('textarea');
    field.value = text;
    field.className = 'estimate-sr-only';
    field.readOnly = true;
    root.append(field);
    let copied = false;
    try { field.select(); copied = document.execCommand('copy'); }
    finally { field.remove(); focused?.focus({ preventScroll: true }); }
    if (!copied) throw new Error('Clipboard unavailable');
  }
  const vk = root.querySelector('#estimate-vk');
  vk.href = DEMO_MODE ? '#demo-request' : 'https://vk.me/cubik_52';
  vk.removeAttribute('target');

  if (DEMO_MODE) {
    const dialog = document.createElement('dialog');
    dialog.className = 'demo-dialog';
    dialog.id = 'demo-request';
    dialog.setAttribute('aria-labelledby', 'demo-title');
    dialog.setAttribute('aria-describedby', 'demo-explanation');
    dialog.innerHTML = `<h2 id="demo-title">Предпросмотр заявки клиента (Демо-режим)</h2>
      <pre class="demo-request-text"></pre><div class="demo-photos" hidden></div>
      <p id="demo-explanation">В демонстрационной версии прямые переходы в диалог ВК и звонки отключены. После подключения сайта под ключ текст расчёта автоматически копируется и переводит клиента напрямую в ваш диалог vk.me/cubik_52 или почту kubiku@inbox.ru.</p>
      <form method="dialog"><button class="demo-close press" autofocus>Понятно, вернуться к сайту</button></form>`;
    document.body.append(dialog);
    function openPreview() {
      dialog.querySelector('.demo-request-text').textContent = requestText();
      const gallery = dialog.querySelector('.demo-photos');
      gallery.replaceChildren(...photos.map(photo => {
        const img = document.createElement('img');
        img.src = photo.url;
        img.alt = `Фото повреждения: ${photo.file.name}`;
        return img;
      }));
      gallery.hidden = photos.length === 0;
      if (!dialog.open) dialog.showModal();
      dialog.scrollTop = 0;
    }
    const contactLinks = [...document.querySelectorAll('a[href]')].filter(link => {
      const url = new URL(link.href);
      return ['tel:', 'mailto:'].includes(url.protocol) ||
        /(^|\.)(vk\.com|vk\.ru|vk\.me|t\.me|telegram\.me|wa\.me|whatsapp\.com|ok\.ru|instagram\.com|facebook\.com)$/.test(url.hostname) || link === vk || link === email;
    });
    for (const link of contactLinks) {
      link.href = '#demo-request';
      link.removeAttribute('target');
      link.setAttribute('aria-haspopup', 'dialog');
    }
    for (const type of ['click', 'auxclick']) document.addEventListener(type, event => {
      const link = event.target.closest('a');
      if (!contactLinks.includes(link)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openPreview();
    }, true);
    dialog.addEventListener('click', event => { if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    } });
    dialog.addEventListener('close', () => dialog.querySelector('.demo-photos').replaceChildren());
  }

  async function sendRequest(event) {
    event.preventDefault();
    if (DEMO_MODE || copyPending) return;
    copyPending = true;
    const text = requestText();
    const files = photos.map(photo => photo.file);
    const isEmail = event.currentTarget === email;
    // Start copying during the user gesture; a native file share also needs this gesture.
    const copying = copyRequest(text).then(() => true, () => false);
    let sharing;
    if (!isEmail && files.length && (navigator.userAgentData?.mobile || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))) {
      try {
        if (navigator.share && navigator.canShare?.({ files })) {
          sharing = navigator.share({ title: 'Оценка кузовного ремонта — Кубик', text, files })
            .then(() => 'shared', error => error.name === 'AbortError' ? 'cancelled' : 'failed');
        }
      } catch { /* Unsupported native sharing uses the VK dialog below. */ }
    }
    try {
      const copied = await copying;
      fallback.hidden = copied;
      if (!copied) {
        updateRequest();
        if (!fallback.querySelector('a')) {
          const manualLink = document.createElement('a');
          manualLink.className = 'estimate-action estimate-secondary press';
          manualLink.href = 'https://vk.me/cubik_52';
          manualLink.textContent = 'Открыть ВК после ручного копирования';
          fallback.append(manualLink);
        }
        showToast('Не удалось скопировать расчёт. Скопируйте текст в поле под кнопками и откройте ВК по ссылке под полем.', true);
      }
      const shared = sharing ? await sharing : null;
      if (shared === 'shared') { showToast('Текст расчёта и фото переданы в выбранное приложение.'); return; }
      if (shared === 'cancelled') { if (copied) showToast('Отправка отменена. Текст расчёта скопирован в буфер.'); return; }
      // Keep the manual text available if clipboard access was denied.
      if (!copied && !isEmail) return;
      if (isEmail) {
        if (copied) showToast('Текст расчёта скопирован. Прикрепите выбранные фото к письму.');
        location.href = mailto(text);
      } else {
        showToast('Текст расчёта скопирован в буфер! Вставьте его в диалог ВК и прикрепите выбранные фото');
        await new Promise(resolve => setTimeout(resolve, 900));
        location.assign('https://vk.me/cubik_52');
      }
    } finally { copyPending = false; }
  }
  vk.addEventListener('click', sendRequest);
  email.addEventListener('click', sendRequest);
  updateSelection();
})();

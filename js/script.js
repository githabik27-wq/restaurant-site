/* ============================================================
   «Застолье» — интуитивное поведение
   Шапка, мобильное меню, корзина доставки, бронирование, галерея
   ============================================================ */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $all = (sel) => Array.from(document.querySelectorAll(sel));

  /* ---------- Шапка: мобильное меню + скролл ---------- */
  const header = $('.header');
  const navToggle = $('.menu-toggle');
  const nav = $('.nav');

  function setNavOpen(open) {
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  }
  navToggle.addEventListener('click', () => setNavOpen(!nav.classList.contains('open')));
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !navToggle.contains(e.target)) {
      setNavOpen(false);
    }
  });

  function updateHeader() {
    header.classList.toggle('header--active', window.scrollY > 50);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  $all('.nav__link').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) { e.preventDefault(); return; }
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setNavOpen(false);
    });
  });

  /* ---------- Появление блоков при прокрутке ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('in', entry.isIntersecting));
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0.08 });
    $all('.reveal').forEach((el) => io.observe(el));
  } else {
    $all('.reveal').forEach((el) => el.classList.add('in'));
  }

  /* ---------- Меню: категории + фильтры (интуитивность) ---------- */
  const catBtns = $all('.cat-btn');
  const chips = $all('.chip');
  const dishesGrid = $('#dishes-grid');
  const emptyMsg = $('#dishes-grid__empty');

  function applyFilters() {
    const activeCat = catBtns.find((b) => b.classList.contains('active'))?.dataset.cat || 'all';
    const activeChip = chips.find((b) => b.classList.contains('active'))?.dataset.filter || null;
    let visible = 0;
    $all('.dish', dishesGrid).forEach((dish) => {
      const catOk = activeCat === 'all' || dish.dataset.cat === activeCat;
      const tags = (dish.dataset.tags || '').split(/\s+/).filter(Boolean);
      const chipOk = !activeChip || tags.includes(activeChip);
      dish.classList.toggle('hidden', !catOk || !chipOk);
      if (catOk && chipOk) visible++;
    });
    if (emptyMsg) emptyMsg.style.display = visible ? 'none' : 'flex';
  }

  catBtns.forEach((btn) => btn.addEventListener('click', () => {
    catBtns.forEach((b) => b.classList.toggle('active', b === btn));
    applyFilters();
  }));
  chips.forEach((btn) => btn.addEventListener('click', () => {
    chips.forEach((b) => b.classList.toggle('active', b === btn));
    applyFilters();
  }));
  applyFilters();

  /* ---------- Хиты меню: карусель ---------- */
  const track = $('#hits-track');
  const slides = $all('#hits-carousel .carousel__slide');
  const prevBtn = $('#hits-prev');
  const nextBtn = $('#hits-next');
  let carouselIdx = 0;
  function updateCarousel() {
    track.style.transform = `translateX(-${carouselIdx * 100}%)`;
    prevBtn.disabled = carouselIdx === 0;
    nextBtn.disabled = carouselIdx === slides.length - 1;
  }
  prevBtn.addEventListener('click', () => { if (carouselIdx > 0) { carouselIdx--; updateCarousel(); } });
  nextBtn.addEventListener('click', () => { if (carouselIdx < slides.length - 1) { carouselIdx++; updateCarousel(); } });
  updateCarousel();

  /* ---------- Корзина доставки ---------- */
  const cart = (() => {
    try { return JSON.parse(localStorage.getItem('zastoljeCart') || '[]'); } catch { return []; }
  })();
  const cartItemsEl = $('#cart-items');
  const cartTotalEl = $('#cart-total');
  const cartDeliveryEl = $('#cart-delivery');
  const cartAddressEl = $('#cart-address');
  const cartPayBtn = $('#cart-pay');
  const cartCountBadge = $('#cart-count');

  function calcDelivery(subtotal, address) {
    if (subtotal >= 1500) return 0;
    return address.trim() ? 350 : 0;
  }

  function updateTotals() {
    const subtotal = cart.reduce((s, item) => s + item.price * item.qty, 0);
    const address = cartAddressEl.value.trim();
    const delivery = calcDelivery(subtotal, address);
    if (!cart.length) {
      cartDeliveryEl.textContent = '';
    } else if (!address) {
      cartDeliveryEl.textContent = 'Введите адрес';
    } else {
      cartDeliveryEl.textContent = delivery ? `${delivery} ₽` : 'бесплатна';
    }
    cartTotalEl.textContent = `${subtotal + delivery} ₽`;
    cartPayBtn.disabled = !cart.length || !address;
  }

  function setBadge(n) { if (cartCountBadge) cartCountBadge.textContent = String(n); }

  function renderCart() {
    if (!cart.length) {
      cartItemsEl.innerHTML = '<p class="cart__empty">Корзина пуста — выберите блюда из меню.</p>';
      updateTotals();
      setBadge(0);
      return;
    }
    cartItemsEl.innerHTML = '';
    cart.forEach((item) => {
      const row = document.createElement('li');
      row.className = 'cart-item';
      const photoHtml = item.photo
        ? `<img src="${item.photo}" alt="${item.name}" loading="lazy">`
        : `<div class="cart-item__nophage">${(item.name || '?')[0]}</div>`;
      row.innerHTML = `
        ${photoHtml}
        <div class="cart-item__text">
          <span class="cart-item__name">${item.name}</span>
          <span class="cart-item__sub">${item.qty} × ${item.price} ₽</span>
        </div>
        <div class="cart-item__actions">
          <button class="qty-btn minus" aria-label="Меньше">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn plus" aria-label="Больше">+</button>
          <button class="qty-btn remove" aria-label="Удалить из корзины">✕</button>
        </div>`;
      row.querySelector('.minus').addEventListener('click', () => cartAdjust(item.id, -1));
      row.querySelector('.plus').addEventListener('click', () => cartAdjust(item.id, +1));
      row.querySelector('.remove').addEventListener('click', () => cartAdjust(item.id, -99));
      cartItemsEl.appendChild(row);
    });
    updateTotals();
    setBadge(cart.reduce((s, item) => s + item.qty, 0));
  }

  function cartAdjust(id, delta) {
    const idx = cart.findIndex((item) => item.id === id);
    if (idx < 0) return;
    if (delta === -99) cart.splice(idx, 1);
    else if (delta === -1 && cart[idx].qty <= 1) cart.splice(idx, 1);
    else cart[idx].qty += delta;
    saveCart();
    renderCart();
  }

  function saveCart() { localStorage.setItem('zastoljeCart', JSON.stringify(cart)); }

  cartAddressEl.addEventListener('input', updateTotals);

  cartPayBtn.addEventListener('click', () => {
    if (cartPayBtn.disabled) return;
    const address = cartAddressEl.value.trim();
    const subtotal = cart.reduce((s, item) => s + item.price * item.qty, 0);
    const delivery = calcDelivery(subtotal, address);
    const body = [
      'Заказ доставки — «Застолье»',
      `Адрес: ${address}`,
      `Дата и время заказа: ${new Date().toLocaleString('ru-RU')}`,
      ...cart.map((x) => `${x.name} — ${x.price} ₽ × ${x.qty}`),
      `Сумма: ${subtotal} ₽`,
      `Доставка: ${delivery ? `${delivery} ₽` : 'бесплатна'}`,
      `Итого: ${subtotal + delivery} ₽`,
    ].join('%0A');
    window.location.href = `mailto:hello@zastolje.ru?subject=Заказ доставки — Застолье&body=${body}`;
  });

  /* ---------- Кнопки «Добавить в корзину» (меню + хиты) ---------- */
  $all('.add-to-cart').forEach((btn) => {
    btn.addEventListener('click', () => {
      const host = btn.closest('.dish, .carousel-card');
      const name = host.querySelector('.dish__name, .carousel-card__name').textContent;
      const priceEl = host.querySelector('.dish__price, .carousel-card__price');
      const price = Number(priceEl ? priceEl.textContent.replace(/\D/g, '') : 0) || 0;
      const img = host.querySelector('.dish__media img, .carousel-card__media img');
      const photo = img ? img.getAttribute('src') : null;
      cart.push({ id: `cart-${Date.now()}-${cart.length}`, name, price, photo, qty: 1 });
      saveCart();
      renderCart();
      openModal('cart');
    });
  });

  renderCart();

  /* ---------- Модальные окна ---------- */
  const modals = {
    booking: $('#booking-modal'),
    cart: $('#cart-modal'),
    gallery: $('#gallery-modal'),
  };

  function openModal(name) { modals[name].classList.add('open'); document.body.classList.add('modal-open'); }
  function closeModal(name) { modals[name].classList.remove('open'); document.body.classList.remove('modal-open'); }

  $all('[data-open]').forEach((el) => el.addEventListener('click', () => openModal(el.dataset.open)));
  $all('[data-close]').forEach((el) => el.addEventListener('click', () => closeModal(el.dataset.close)));

  document.addEventListener('click', (e) => {
    if (e.target === modals.gallery && modals.gallery.classList.contains('open')) closeModal('gallery');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modals.booking.classList.contains('open')) closeModal('booking');
    if (modals.cart.classList.contains('open')) closeModal('cart');
    if (modals.gallery.classList.contains('open')) closeModal('gallery');
  });

  /* ---------- Бронирование ---------- */
  const bookingForm = $('#booking-form');
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = $('#b-date').value;
    const time = $('#b-time').value;
    const guests = $('#b-guests').value;
    const comment = $('#b-comment').value.trim();
    const lines = [
      'Заявка на бронь — «Застолье»',
      date ? `Дата: ${date}` : null,
      time ? `Время: ${time}` : null,
      `Гостей: ${guests}`,
      comment ? `Комментарий: ${comment}` : null,
      'Согласие на обработку персональных данных: получено',
    ].filter(Boolean);
    window.location.href = `mailto:hello@zastolje.ru?subject=Бронь стола — ${date || new Date().toLocaleDateString('ru-RU')}&body=${lines.join('%0A')}`;
    closeModal('booking');
  });

  /* ---------- Галерея (альбомы с переходами) ---------- */
  const GALLERY_ALBUMS = {
    atmosphere: ['assets/hero.jpg', 'assets/about.jpg', 'assets/gallery1.jpg', 'assets/gallery2.jpg'],
    chef: ['assets/chef.jpg'],
    signature: ['assets/signature.jpg'],
  };
  const galleryItems = $all('.gallery-item');
  let galleryAlbum = 'atmosphere';
  let galleryIdx = 0;
  const galleryImg = $('.gallery-modal__img');
  const galleryCounter = $('#gallery-counter');
  const galleryPrevBtn = $('#gallery-prev');
  const galleryNextBtn = $('#gallery-next');

  function updateGalleryPhoto() {
    const photos = GALLERY_ALBUMS[galleryAlbum];
    galleryImg.src = photos[galleryIdx];
    galleryImg.alt = 'Фотография ресторана «Застолье»';
    galleryCounter.textContent = `${galleryIdx + 1} / ${photos.length}`;
    galleryPrevBtn.disabled = galleryIdx === 0;
    galleryNextBtn.disabled = galleryIdx === photos.length - 1;
  }
  function openGallery(album) {
    galleryAlbum = album;
    galleryIdx = 0;
    updateGalleryPhoto();
    openModal('gallery');
  }
  galleryPrevBtn.addEventListener('click', () => { if (galleryIdx > 0) galleryIdx--; updateGalleryPhoto(); });
  galleryNextBtn.addEventListener('click', () => {
    const n = GALLERY_ALBUMS[galleryAlbum].length;
    if (galleryIdx < n - 1) galleryIdx++;
    updateGalleryPhoto();
  });
  galleryItems.forEach((item) => item.addEventListener('click', () => openGallery(item.dataset.album)));
})();

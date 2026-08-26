/**
 * Medi Smart - Interactive Staggered Drawer & Responsive Full-Display Menu
 */

export function initStaggeredMenu(wrapperElement, options = {}) {
  if (!wrapperElement) return { open: () => {}, close: () => {}, toggle: () => {} };
  const gsap = window.gsap;

  const {
    position = 'right',
    colors = ['#1d3557', '#5227FF', '#23d7c5'],
    accentColor = '#23d7c5',
    onMenuOpen,
    onMenuClose
  } = options;

  let isOpen = false;
  const panel = wrapperElement.querySelector('.staggered-menu-panel');
  const preLayersContainer = wrapperElement.querySelector('.sm-prelayers');
  const preLayers = preLayersContainer ? Array.from(preLayersContainer.querySelectorAll('.sm-prelayer')) : [];
  const toggleBtn = wrapperElement.querySelector('.sm-toggle') || document.querySelector('.sm-global-toggle');
  const textInner = wrapperElement.querySelector('.sm-toggle-textInner') || (toggleBtn ? toggleBtn.querySelector('.sm-toggle-textInner') : null);
  const icon = wrapperElement.querySelector('.sm-icon') || (toggleBtn ? toggleBtn.querySelector('.sm-icon') : null);
  const closeBtn = wrapperElement.querySelector('.sm-close-btn');

  const offscreen = position === 'left' ? -105 : 105;

  // Initial setup
  if (gsap) {
    gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
    if (preLayersContainer) gsap.set(preLayersContainer, { opacity: 1 });
  } else if (panel) {
    panel.style.transform = `translateX(${offscreen}%)`;
    panel.style.opacity = '0';
  }

  function openMenu() {
    isOpen = true;
    wrapperElement.setAttribute('data-open', 'true');
    document.body.classList.add('menu-drawer-open');
    if (onMenuOpen) onMenuOpen();

    if (gsap && panel) {
      // 1. Pre-layers stagger
      preLayers.forEach((layer, i) => {
        gsap.fromTo(layer, { xPercent: offscreen, opacity: 1 }, { xPercent: 0, duration: 0.4, ease: 'power4.out', delay: i * 0.05 });
      });

      // 2. Main panel entrance
      const panelDelay = preLayers.length ? preLayers.length * 0.05 + 0.04 : 0;
      gsap.fromTo(panel, { xPercent: offscreen, opacity: 1 }, { xPercent: 0, duration: 0.55, ease: 'power4.out', delay: panelDelay });

      // 3. Items stagger animation
      const items = panel.querySelectorAll('.sm-panel-itemLabel, .sm-menu-link');
      if (items.length) {
        gsap.fromTo(items, 
          { yPercent: 70, opacity: 0 }, 
          { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.035, delay: panelDelay + 0.08 }
        );
      }

      // 4. Button morph
      if (textInner) gsap.to(textInner, { yPercent: -50, duration: 0.35, ease: 'power3.out' });
      if (icon) gsap.to(icon, { rotate: 225, duration: 0.45, ease: 'power3.out' });
    } else if (panel) {
      panel.style.transform = 'translateX(0)';
      panel.style.opacity = '1';
    }
  }

  function closeMenu() {
    isOpen = false;
    wrapperElement.removeAttribute('data-open');
    document.body.classList.remove('menu-drawer-open');
    if (onMenuClose) onMenuClose();

    if (gsap && panel) {
      gsap.to([...preLayers, panel], {
        xPercent: offscreen,
        duration: 0.3,
        ease: 'power3.in',
        onComplete: () => {
          if (panel) gsap.set(panel, { opacity: 0 });
        }
      });

      if (textInner) gsap.to(textInner, { yPercent: 0, duration: 0.3, ease: 'power3.inOut' });
      if (icon) gsap.to(icon, { rotate: 0, duration: 0.3, ease: 'power3.inOut' });
    } else if (panel) {
      panel.style.transform = `translateX(${offscreen}%)`;
      panel.style.opacity = '0';
    }
  }

  function toggle() {
    if (isOpen) closeMenu();
    else openMenu();
  }

  if (toggleBtn) {
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      toggle();
    };
  }

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeMenu();
    };
  }

  // Close on click outside
  const handleClickOutside = (e) => {
    if (isOpen && panel && !panel.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
      closeMenu();
    }
  };

  // Keyboard shortcut: Escape to close
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeMenu();
    }
  };

  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);

  const controller = { open: openMenu, close: closeMenu, toggle, isOpen: () => isOpen };
  wrapperElement._sm = controller;
  window.__MEDI_MENU__ = controller;

  return () => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleKeyDown);
  };
}

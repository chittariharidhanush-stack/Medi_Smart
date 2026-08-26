const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255';
const MOBILE_BREAKPOINT = 768;

const defaultCardData = [
  {
    color: 'rgba(13, 27, 46, 0.85)',
    title: 'AI Consultation Summary',
    description: 'Instant clinical notes summary, key observations & follow-up reminders',
    label: '✨ Smart AI'
  },
  {
    color: 'rgba(13, 27, 46, 0.85)',
    title: 'Emergency SOS Broadcast',
    description: 'Instant GPS tracking broadcast & simulated SMS alerts to emergency contacts',
    label: '🚨 Emergency'
  },
  {
    color: 'rgba(13, 27, 46, 0.85)',
    title: 'WebRTC Video Consultation',
    description: 'HD live audio & video streaming with interactive call controls',
    label: '🎥 Telemedicine'
  },
  {
    color: 'rgba(13, 27, 46, 0.85)',
    title: 'Emergency Access QR Badge',
    description: 'Secure digital medical identity card & quick profile scanner modal',
    label: '💳 Health ID'
  },
  {
    color: 'rgba(13, 27, 46, 0.85)',
    title: 'Inclusive Accessibility',
    description: 'Speech synthesis for blind users & high contrast low-vision controls',
    label: '👁 Inclusive'
  },
  {
    color: 'rgba(13, 27, 46, 0.85)',
    title: 'Encrypted Records & Rx',
    description: 'Digital prescriptions, appointment schedules & medical history vault',
    label: '🛡 EHR Shield'
  }
];

export function initMagicBento(gridElement, options = {}) {
  if (!gridElement) return;
  const gsap = window.gsap;
  if (!gsap) {
    console.warn("GSAP library not loaded.");
    return;
  }

  const {
    enableSpotlight = true,
    enableBorderGlow = true,
    spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
    glowColor = DEFAULT_GLOW_COLOR,
    enableTilt = true,
    enableMagnetism = true,
    clickEffect = true,
    enableStars = true,
    particleCount = DEFAULT_PARTICLE_COUNT
  } = options;

  let spotlightEl = null;

  if (enableSpotlight) {
    spotlightEl = document.createElement('div');
    spotlightEl.className = 'global-spotlight';
    spotlightEl.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.18) 0%,
        rgba(${glowColor}, 0.09) 15%,
        rgba(${glowColor}, 0.04) 25%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlightEl);
  }

  const cards = gridElement.querySelectorAll('.magic-bento-card');

  const handleMouseMove = e => {
    const rect = gridElement.getBoundingClientRect();
    const isInside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

    if (!isInside) {
      if (spotlightEl) gsap.to(spotlightEl, { opacity: 0, duration: 0.3 });
      cards.forEach(card => card.style.setProperty('--glow-intensity', '0'));
      return;
    }

    if (spotlightEl) {
      gsap.to(spotlightEl, {
        left: e.clientX,
        top: e.clientY,
        opacity: 0.8,
        duration: 0.1
      });
    }

    cards.forEach(card => {
      const cardRect = card.getBoundingClientRect();
      const relativeX = ((e.clientX - cardRect.left) / cardRect.width) * 100;
      const relativeY = ((e.clientY - cardRect.top) / cardRect.height) * 100;

      const centerX = cardRect.left + cardRect.width / 2;
      const centerY = cardRect.top + cardRect.height / 2;
      const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);

      const intensity = Math.max(0, 1 - dist / spotlightRadius);
      card.style.setProperty('--glow-x', `${relativeX}%`);
      card.style.setProperty('--glow-y', `${relativeY}%`);
      card.style.setProperty('--glow-intensity', intensity.toString());
      card.style.setProperty('--glow-radius', `${spotlightRadius}px`);
    });
  };

  const handleMouseLeave = () => {
    if (spotlightEl) gsap.to(spotlightEl, { opacity: 0, duration: 0.3 });
    cards.forEach(card => card.style.setProperty('--glow-intensity', '0'));
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseleave', handleMouseLeave);

  // Bind card micro-interactions
  cards.forEach(card => {
    const handleCardMouseMove = e => {
      const cardRect = card.getBoundingClientRect();
      const x = e.clientX - cardRect.left;
      const y = e.clientY - cardRect.top;
      const centerX = cardRect.width / 2;
      const centerY = cardRect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        gsap.to(card, { rotateX, rotateY, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.04;
        const magnetY = (y - centerY) * 0.04;
        gsap.to(card, { x: magnetX, y: magnetY, duration: 0.3, ease: 'power2.out' });
      }
    };

    const handleCardMouseLeave = () => {
      if (enableTilt) gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' });
      if (enableMagnetism) gsap.to(card, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
    };

    const handleCardClick = e => {
      if (!clickEffect) return;
      const cardRect = card.getBoundingClientRect();
      const x = e.clientX - cardRect.left;
      const y = e.clientY - cardRect.top;

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.5) 0%, rgba(${glowColor}, 0.15) 40%, transparent 70%);
        left: ${x - 150}px;
        top: ${y - 150}px;
        pointer-events: none;
        z-index: 100;
      `;
      card.appendChild(ripple);
      gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1.5, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: () => ripple.remove() });
    };

    card.addEventListener('mousemove', handleCardMouseMove);
    card.addEventListener('mouseleave', handleCardMouseLeave);
    card.addEventListener('click', handleCardClick);
  });

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseleave', handleMouseLeave);
    if (spotlightEl && spotlightEl.parentNode) spotlightEl.parentNode.removeChild(spotlightEl);
  };
}

export default function MagicBento(props) {
  const React = window.React;
  const useRef = React.useRef;
  const useEffect = React.useEffect;

  const gridRef = useRef(null);
  const cardList = props?.cards || defaultCardData;

  useEffect(() => {
    const cleanup = initMagicBento(gridRef.current, props);
    return cleanup;
  }, []);

  return React.createElement('div', { className: 'card-grid bento-section', ref: gridRef },
    cardList.map((card, idx) =>
      React.createElement('div', {
        key: idx,
        className: `magic-bento-card ${props?.textAutoHide !== false ? 'magic-bento-card--text-autohide' : ''} ${props?.enableBorderGlow !== false ? 'magic-bento-card--border-glow' : ''}`,
        style: {
          backgroundColor: card.color || 'rgba(13, 27, 46, 0.85)',
          '--glow-color': props?.glowColor || DEFAULT_GLOW_COLOR
        }
      },
        React.createElement('div', { className: 'magic-bento-card__header' },
          React.createElement('div', { className: 'magic-bento-card__label' }, card.label)
        ),
        React.createElement('div', { className: 'magic-bento-card__content' },
          React.createElement('h2', { className: 'magic-bento-card__title' }, card.title),
          React.createElement('p', { className: 'magic-bento-card__description' }, card.description)
        )
      )
    )
  );
}

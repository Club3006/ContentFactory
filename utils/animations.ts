/**
 * Animation Utilities
 * 
 * CSS animation and spring physics helpers for macOS-style interactions
 */

/**
 * Spring physics easing curves (CSS cubic-bezier)
 */
export const springEasing = {
  // Gentle bounce - for general UI
  soft: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  
  // Medium bounce - for cards/panels
  medium: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // Strong bounce - for impactful actions
  strong: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  
  // macOS dock bounce
  dock: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
  
  // Smooth elastic (no overshoot)
  smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

/**
 * Duration presets (ms)
 */
export const durations = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  crawl: 800,
};

/**
 * Inertia/momentum scroll config
 */
export const inertiaConfig = {
  friction: 0.92, // 0-1, higher = more slide
  clamp: true,
  minVelocity: 0.5,
};

/**
 * Drag animation spring config
 */
export const dragSpringConfig = {
  tension: 300,
  friction: 30,
  mass: 1,
};

/**
 * CSS class helpers for animations
 */
export const animationClasses = {
  // Fade
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-200',
  
  // Scale
  scaleIn: 'animate-in zoom-in-95 duration-300',
  scaleOut: 'animate-out zoom-out-95 duration-200',
  
  // Slide
  slideUp: 'animate-in slide-in-from-bottom duration-300',
  slideDown: 'animate-in slide-in-from-top duration-300',
  slideLeft: 'animate-in slide-in-from-right duration-300',
  slideRight: 'animate-in slide-in-from-left duration-300',
  
  // Combined
  popIn: 'animate-in fade-in zoom-in-95 duration-300',
  popOut: 'animate-out fade-out zoom-out-95 duration-200',
};

/**
 * Generate spring transition CSS string
 */
export const springTransition = (
  properties: string[],
  duration: number = durations.normal,
  easing: keyof typeof springEasing = 'soft'
): string => {
  return properties
    .map(prop => `${prop} ${duration}ms ${springEasing[easing]}`)
    .join(', ');
};

/**
 * Haptic feedback helper (for devices that support it)
 */
export const haptic = {
  light: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  heavy: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },
};


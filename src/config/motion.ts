/** One source for native motion timings, distances, easing and viewport triggers. */
export const motion = {
  duration: {
    reveal: 560,
    heading: 540,
    image: 580,
    hero: 560,
    micro: 200,
    enter: 260,
    exit: 160,
    navigation: 340,
  },
  navigation: { settle: 110, resize: 150, anchorTimeout: 1800 },
  distance: { reveal: 16, heading: 12, image: 12, hero: 12, footer: 12 },
  stagger: 80,
  delayCap: 240,
  cinematic: {
    image: 24_000,
    light: 20_000,
    delay: 900,
    easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
    desktop: { start: 1.03, middle: 1.06, end: 1.09, x: '1.2%', y: '0.8%' },
    tablet: { start: 1.025, middle: 1.045, end: 1.065, x: '0.8%', y: '0.5%' },
    mobile: { start: 1.015, middle: 1.03, end: 1.045, x: '0.5%', y: '0.3%' },
  },
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  exitEasing: 'cubic-bezier(0.4, 0, 1, 1)',
  // Start just before first paint at the viewport edge. Already visible content never fades out.
  observer: { rootMargin: '0px 0px 24px 0px', threshold: 0 },
} as const;

export type MotionVariant =
  'reveal' | 'heading' | 'image' | 'hero' | 'hero-image' | 'fade' | 'footer';
export type MotionTransition = MotionVariant | 'enter' | 'exit' | 'feedback';

export function staggerDelay(index: number, step = 0): number {
  return Math.min(motion.delayCap, Math.max(0, index + step) * motion.stagger);
}

export function motionFrames(variant: MotionTransition): Keyframe[] {
  // LCP text and hero image stay fully painted throughout their entrance.
  if (variant === 'hero-image') return [{ transform: 'scale(1.008)' }, { transform: 'scale(1)' }];
  if (variant === 'hero')
    return [{ transform: `translateY(${motion.distance.hero}px)` }, { transform: 'none' }];
  if (variant === 'exit')
    return [
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: 'translateY(-8px)' },
    ];
  if (variant === 'feedback')
    return [
      { opacity: 1, transform: 'translateY(2px)' },
      { opacity: 1, transform: 'none' },
    ];
  const distance = variant === 'fade' ? 0 : variant === 'enter' ? 12 : motion.distance[variant];
  return [
    { opacity: 0, transform: `translateY(${distance}px)` },
    { opacity: 1, transform: 'none' },
  ];
}

export function motionDuration(variant: MotionTransition): number {
  if (variant === 'hero-image') return motion.duration.image;
  if (variant === 'feedback') return motion.duration.micro;
  if (variant === 'fade' || variant === 'footer') return motion.duration.reveal;
  return motion.duration[variant];
}

export const motionCssVariables = `:root{--motion-micro:${motion.duration.micro}ms;--motion-navigation:${motion.duration.navigation}ms;--motion-image:${motion.duration.image}ms;--motion-hero:${motion.duration.hero}ms;--motion-distance:${motion.distance.hero}px;--motion-step:${motion.stagger}ms;--motion-ease:${motion.easing}}`;

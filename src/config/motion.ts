/** One source for native motion timings, distances, easing and viewport triggers. */
export const motion = {
  duration: { reveal: 560, heading: 480, image: 680, hero: 600, micro: 180, enter: 260, exit: 160 },
  distance: { reveal: 20, heading: 12, image: 16, hero: 12 },
  stagger: 80,
  delayCap: 320,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  exitEasing: 'cubic-bezier(0.4, 0, 1, 1)',
  observer: { rootMargin: '0px 0px -24px 0px', threshold: 0.08 },
} as const;

export type MotionVariant = 'reveal' | 'heading' | 'image' | 'hero' | 'hero-image' | 'fade';
export type MotionTransition = MotionVariant | 'enter' | 'exit' | 'feedback';

export function staggerDelay(index: number, step = 0): number {
  return Math.min(motion.delayCap, Math.max(0, index + step) * motion.stagger);
}

export function motionFrames(variant: MotionTransition): Keyframe[] {
  // LCP text and hero image stay fully painted throughout their entrance.
  if (variant === 'hero-image') return [{ transform: 'scale(1.018)' }, { transform: 'scale(1)' }];
  if (variant === 'hero')
    return [{ transform: `translateY(${motion.distance.hero}px)` }, { transform: 'none' }];
  if (variant === 'exit')
    return [
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: 'translateY(-8px)' },
    ];
  if (variant === 'feedback')
    return [
      { opacity: 0.65, transform: 'translateY(4px)' },
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
  if (variant === 'fade') return motion.duration.reveal;
  return motion.duration[variant];
}

export const motionCssVariables = `:root{--motion-micro:${motion.duration.micro}ms;--motion-image:${motion.duration.image}ms;--motion-ease:${motion.easing}}`;

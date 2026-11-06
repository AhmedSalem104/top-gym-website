export const feedbackCategories = [
  'equipment',
  'cleanliness',
  'staff',
  'cardio',
  'suggestions',
  'other',
] as const;
export const feedbackLimits = {
  messageMin: 10,
  messageMax: 2000,
  nameMax: 80,
  emailMax: 254,
  bodyBytes: 16_384,
} as const;
export type FeedbackCategory = (typeof feedbackCategories)[number];

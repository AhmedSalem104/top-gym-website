import type { Localized } from '../config/business';
export type GymPhoto = {
  id: string;
  title: Localized;
  alt: Localized;
  category: 'strength' | 'cardio' | 'resistance';
};
export const gymPhotos: GymPhoto[] = [
  {
    id: 'chest-press',
    category: 'strength',
    title: { en: 'Chest press', ar: 'جهاز ضغط الصدر' },
    alt: {
      en: 'Black chest press machine on green turf at TOP GYM',
      ar: 'جهاز ضغط صدر أسود على أرضية عشب صناعي أخضر داخل توب جيم',
    },
  },
  {
    id: 'cardio-room',
    category: 'cardio',
    title: { en: 'The cardio area', ar: 'منطقة الكارديو' },
    alt: {
      en: 'Treadmills and cardio machines beside the windows at TOP GYM',
      ar: 'أجهزة مشي وكارديو بجوار النوافذ داخل توب جيم',
    },
  },
  {
    id: 'cable-machine',
    category: 'resistance',
    title: { en: 'Cable & resistance', ar: 'الكابل والمقاومة' },
    alt: {
      en: 'Black resistance machine beside a gold column and mirrors at TOP GYM',
      ar: 'جهاز مقاومة أسود بجوار عمود ذهبي ومرايا داخل توب جيم',
    },
  },
  {
    id: 'leg-machine',
    category: 'strength',
    title: { en: 'Lower-body training', ar: 'تدريب عضلات الرجلين' },
    alt: {
      en: 'Leg training machine against the dark gym wall at TOP GYM',
      ar: 'جهاز لتدريب الرجلين أمام حائط داكن داخل توب جيم',
    },
  },
  {
    id: 'leg-extension',
    category: 'resistance',
    title: { en: 'Leg extension', ar: 'جهاز تمديد الرجلين' },
    alt: {
      en: 'Leg extension machine on green turf beneath gold structural columns at TOP GYM',
      ar: 'جهاز تمديد الرجلين فوق العشب الصناعي وبجوار الأعمدة الذهبية داخل توب جيم',
    },
  },
];

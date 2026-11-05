export type Locale = 'ar' | 'en';
export type Localized = Record<Locale, string>;
export const durationIds = [
  'halfMonth',
  'month',
  'twoMonths',
  'quarter',
  'halfYear',
  'year',
] as const;
export type Duration = (typeof durationIds)[number];
export type Membership = {
  id: string;
  name: Localized;
  description: Localized;
  prices: Record<Duration, number>;
};
export type Credential = {
  id: string;
  title: Localized;
  issuer: string;
  date: string;
  image: string;
  approved: boolean;
};

// Sole source for business facts. Prices visually cross-checked against the supplied PDF.
export const business = {
  name: 'TOP GYM',
  defaultLocale: 'ar' as Locale,
  currency: 'EGP',
  timezone: 'Africa/Cairo',
  logo: '/media/top-gym-logo.webp',
  contacts: [
    {
      id: 'ahmed',
      name: { ar: 'أحمد', en: 'Ahmed' },
      display: '01015819700',
      phone: '+201015819700',
    },
    {
      id: 'karim',
      name: { ar: 'كريم', en: 'Karim' },
      display: '01005376843',
      phone: '+201005376843',
    },
  ],
  links: {
    facebook: 'https://www.facebook.com/share/1Dz61Wmkjc/?mibextid=wwXIfr',
    maps: 'https://maps.app.goo.gl/X6jyrHU7x6e5j8vv6?g_st=ic',
    whatsappGroup: 'https://chat.whatsapp.com/HYYB9EXYHv46YBFSLq5zSu?mode=gi_t',
  },
  whatsappGroupName: "Top Gym Master's",
  location: { address: null as Localized | null, coordinates: null },
  hours: {
    verified: false,
    // Monday=1 ... Sunday=0. 1440 is the following midnight, exclusive.
    days: [6, 0, 1, 2, 3, 4, 5].map((day) => ({
      day,
      opens: day === 5 ? 960 : 780,
      closes: day === 5 ? 1320 : 1440,
    })),
  },
  pricingSource: {
    date: '2026-11-05',
    verified: true,
    document: 'Official TOP GYM Membership and Pricing PDF',
  },
  memberships: [
    {
      id: 'gym',
      name: { ar: 'جيم فقط', en: 'Gym only' },
      description: {
        ar: 'اشتراك الجيم لأداء تمارين القوة والمقاومة.',
        en: 'Gym access for your strength and resistance training.',
      },
      prices: {
        halfMonth: 180,
        month: 350,
        twoMonths: 700,
        quarter: 1050,
        halfYear: 2100,
        year: 4200,
      },
    },
    {
      id: 'gym-cardio',
      name: { ar: 'جيم + كارديو', en: 'Gym + cardio' },
      description: {
        ar: 'اشتراك يجمع تمارين الجيم مع أجهزة الكارديو.',
        en: 'Combine your gym training with access to cardio equipment.',
      },
      prices: {
        halfMonth: 200,
        month: 400,
        twoMonths: 800,
        quarter: 1200,
        halfYear: 2400,
        year: 4800,
      },
    },
  ] satisfies Membership[],
  facilities: [
    {
      id: 'strength',
      image: 'chest-press',
      title: { ar: 'أجهزة القوة', en: 'Strength equipment' },
      text: {
        ar: 'أجهزة لتدريب عضلات الصدر والجزء العلوي، في مساحة مخصصة للتمرين.',
        en: 'Chest press and upper-body equipment in a dedicated training space.',
      },
    },
    {
      id: 'resistance',
      image: 'cable-machine',
      title: { ar: 'تمارين المقاومة', en: 'Resistance training' },
      text: {
        ar: 'أجهزة كابل وأجهزة للرجلين تساعدك على تنويع تمارين المقاومة.',
        en: 'Cable and leg machines for variety in your resistance sessions.',
      },
    },
    {
      id: 'cardio',
      image: 'cardio-room',
      title: { ar: 'منطقة الكارديو', en: 'Cardio area' },
      text: {
        ar: 'أجهزة مشي وكارديو لتكمل بها برنامجك التدريبي.',
        en: 'Treadmills and cardio equipment to complement your training.',
      },
    },
  ],
  trainer: {
    name: 'Ahmed AbdElhamid Salem AbdElhamid Salem',
    roleConfirmed: false,
    // Enhanced copies are held privately until original comparison / release approval.
    credentials: [] as Credential[],
  },
} as const;

export const publicCredentials = business.trainer.credentials.filter((item) => item.approved);

export const BRAND = {
  name: 'Shuppaa',
  tagline: 'Small business. Big-business habits.',
  handle: '@shuppaa',
  surveyMinutes: 3,
  pillars: [
    {
      icon: 'box',
      title: 'Document your stock',
      text: 'Know what came in, what went out and what is left, instead of keeping it all in your head.',
    },
    {
      icon: 'receipt',
      title: 'Keep proof of every sale',
      text: 'Digital receipts issued and kept on your phone. No printing, and no more payment disputes with nothing to show.',
    },
    {
      icon: 'link',
      title: 'Find your suppliers',
      text: 'Get connected to suppliers you can trust, whether you are just starting or already selling.',
    },
  ],
  problems: [
    'I sell, but I don’t really know my stock or my profit.',
    'A customer disputes a payment and I have no proof.',
    'Finding a supplier I can trust is stressful.',
  ],
} as const;

/** Sources offered in the admin "Share links" generator. */
export const SOURCE_PRESETS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'x', label: 'X (Twitter)' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'partner', label: 'Partners (founder / Alex / Fouad)' },
];

import type { Question, Settings } from '@/lib/types';

/**
 * Starter survey. It is written to test the campaign's working hypothesis:
 * stock tracking, receipts and supplier-finding are real problems for small sellers.
 * Admins can edit every question in the admin panel (Survey builder) — these are only the
 * defaults used until a custom version is saved to Firestore.
 */
export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q_audience',
    type: 'single',
    label: 'Are you a UNIMED student?',
    required: true,
    tag: 'unimed',
    options: ['Yes, I’m a UNIMED student', 'I’m a student somewhere else', 'I’m not a student'],
  },
  {
    id: 'q_stage',
    type: 'single',
    label: 'Which describes you best?',
    required: true,
    options: [
      'I run a business right now',
      'I sell a little on the side',
      'I want to start a business soon',
      'I’m just curious',
    ],
  },
  {
    id: 'q_products',
    type: 'multi',
    label: 'What do you sell, or plan to sell?',
    help: 'Pick all that apply.',
    required: true,
    options: ['Jewelry', 'Gadgets', 'Fashion', 'Cosmetics & beauty', 'Food', 'Not sure yet'],
    allowOther: true,
  },
  {
    id: 'q_channels',
    type: 'multi',
    label: 'Where do you sell or find customers?',
    required: true,
    options: ['Instagram', 'WhatsApp / DMs', 'TikTok', 'In person / on campus', 'Online marketplace'],
    allowOther: true,
  },
  {
    id: 'q_stock',
    type: 'single',
    label: 'How do you keep track of your stock today?',
    required: true,
    options: [
      'In my head',
      'In a notebook',
      'Phone notes or a spreadsheet',
      'An app or software',
      'I don’t track it',
    ],
  },
  {
    id: 'q_profit',
    type: 'rating',
    label: 'How sure are you about what you’ve actually earned (your profit)?',
    required: true,
    ratingLow: 'Not sure at all',
    ratingHigh: 'Completely sure',
  },
  {
    id: 'q_receipts',
    type: 'single',
    label: 'Do you give customers receipts?',
    required: true,
    options: ['Always', 'Sometimes', 'Rarely', 'Never'],
  },
  {
    id: 'q_dispute',
    type: 'yesno',
    label: 'Have you ever had a payment dispute, a return, or missing stock with no proof?',
    required: true,
  },
  {
    id: 'q_supplier',
    type: 'rating',
    label: 'How hard is it to find suppliers you can trust?',
    required: true,
    ratingLow: 'Very easy',
    ratingHigh: 'Very hard',
  },
  {
    id: 'q_feature',
    type: 'single',
    label: 'Which would help you most right now?',
    required: true,
    options: [
      'Keeping stock records',
      'Digital receipts',
      'Finding trusted suppliers',
      'A catalogue to show customers',
    ],
  },
  {
    id: 'q_challenge',
    type: 'longtext',
    label: 'What is the hardest part of running (or starting) your business?',
    help: 'In your own words. Honest answers help us build the right thing.',
    required: false,
  },
  {
    id: 'q_heard',
    type: 'single',
    label: 'How did you hear about Shuppaa?',
    required: true,
    tag: 'heard',
    options: [
      'Instagram',
      'X (Twitter)',
      'LinkedIn',
      'TikTok',
      'WhatsApp',
      'A student leader',
      'A friend',
    ],
    allowOther: true,
  },
];

export const DEFAULT_SETTINGS: Settings = {
  isOpen: true,
  responseTarget: 100,
  earlyAccessLimit: 100,
  surveyTitle: 'Help shape Shuppaa',
  surveyIntro:
    'Tell us how you run (or plan to run) your business. It takes about 3 minutes, and your answers decide what we build first.',
  campaignStart: new Date().toISOString().slice(0, 10),
};

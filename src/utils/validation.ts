import type { Contact } from '@/lib/types';

export type ContactErrors = Partial<Record<keyof Contact, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Checks name, phone and email (all required) and returns cleaned values plus any error messages. */
export function validateContact(input: Contact): { value: Contact; errors: ContactErrors; valid: boolean } {
  const name = input.name.trim().replace(/\s+/g, ' ');
  const email = input.email.trim().toLowerCase();
  // Keep a leading + and digits only (so "0801 234 5678" and "+234 801 234 5678" both work).
  const phone = input.phone.trim().replace(/(?!^\+)[^\d]/g, '');
  const digits = phone.replace(/\D/g, '');

  const errors: ContactErrors = {};
  if (name.length < 2 || !/\p{L}/u.test(name)) errors.name = 'Please enter your name.';
  if (!email) errors.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(email)) errors.email = 'That email address doesn’t look right.';
  if (!digits) errors.phone = 'Please enter your WhatsApp / phone number.';
  else if (digits.length < 10 || digits.length > 15) errors.phone = 'Enter a valid phone number (10 to 15 digits).';

  return { value: { name, phone, email }, errors, valid: Object.keys(errors).length === 0 };
}

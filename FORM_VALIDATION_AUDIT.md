# Shuppaa Survey — Form Validation & Submission Audit

## Changes in this pass
- Required answers are validated against the question type and current options, not only for non-empty values.
- Whitespace-only text and blank “Other” answers are rejected.
- Single-choice, yes/no, rating (integer 1–5), and multi-choice answers are checked for valid values.
- Multi-choice answers reject unknown values and duplicates.
- Honeypot-triggered submissions no longer display a false success screen.
- Contact details remain optional, but if a respondent enters a name without an email or phone number, the form asks for a usable contact method before claiming early access.
- Email and phone values are validated before submission; phone number accepts 7–15 digits after punctuation is removed.
- A synchronous ref guard prevents rapid duplicate submit clicks.
- Firestore REST `FAILED_PRECONDITION` is no longer automatically swallowed; it is treated as a duplicate only when the response message indicates an existing document.

## Deployment / Firestore checks still required
This environment did not have a complete Vite installation, so a production build could not be verified here. No live Firestore credentials or live-write test were available. Before announcing the form as production-ready:
1. Run `npm ci` and `npm run build`.
2. Publish `firestore.rules` to the same Firebase project configured by `VITE_FIREBASE_PROJECT_ID`.
3. Submit one test response and confirm one document appears under `responses`.
4. Confirm the document includes `answers`, `contact`, `source`, `isUnimed`, `heardFrom`, `durationSec`, and server-generated `createdAt`.
5. Test invalid required answers, blank “Other”, invalid email, invalid phone, offline submission, and retry after a network interruption.
6. Check the browser Network response for `documents:commit` if any submission fails.

## Important
Client-side validation improves data quality and UX but is not a substitute for server-side Firestore rules. Public Firestore submissions are subject to the published rules and Firebase project configuration.

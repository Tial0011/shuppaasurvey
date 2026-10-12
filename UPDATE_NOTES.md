# Shuppaa Survey update notes

## UX
- Clarified the homepage's primary action by giving “Take the survey” a directional icon and keeping “Admin login” visually secondary.
- Added responsive header action styles for narrow mobile screens so the two actions remain usable without overflowing.

## Submission reliability
- Added a synchronous submit lock to block rapid double-clicks before React has re-rendered.
- Revalidates required survey questions immediately before sending, including if survey configuration changes during a respondent's session.
- Preserves the stable response ID across retries, preventing duplicate response documents after an ambiguous timeout.
- Stops treating a `permission-denied` response after a timeout as proof of success. The UI now reports the error and lets the respondent retry safely.
- Only increments the public response counter when Firestore confirms a new response document was created, rather than on an already-existing response retry.
- Fixed “Submit another response” so it clears the completed marker and resets answers/contact fields and the response ID.
- Shows a readable error state on the admin Responses page when Firestore cannot load response data.

## Validation note
A production build could not be run in this environment because npm dependencies were not fully available in the local cache and registry installation timed out. Run `npm ci` and `npm run build` in an environment with registry access before deployment. Firebase project configuration and deployed Firestore rules should also be verified in the target environment.

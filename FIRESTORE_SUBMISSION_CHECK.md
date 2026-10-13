# Firestore submission verification

## Code review finding fixed
The REST submit handler previously treated both `ALREADY_EXISTS` and `FAILED_PRECONDITION` as proof that a response had already been saved. Only `ALREADY_EXISTS` reliably means the stable response document already exists. Other failed preconditions now surface as errors instead of showing a false success.

## How to pinpoint a live Firestore failure
1. Deploy the included `firestore.rules` to the Firebase project actually used by the site (`shuppaa-survey` unless the VITE_FIREBASE_PROJECT_ID override changes it).
2. Open the deployed site, press F12, and open **Network** and **Console**.
3. Submit a valid test survey.
4. Inspect the request ending in `documents:commit` and its response body.
   - `403 PERMISSION_DENIED`: the published rules don't allow the request, or rules were published to a different project.
   - `400 INVALID_ARGUMENT`: inspect the response body for a field/value mismatch.
   - `401/403` with API key/referrer wording: check the Google Cloud API key restrictions and that the Firestore API is enabled.
   - no request / network failure: inspect Console for blocked requests, connectivity, or an exception before the fetch.
5. In Firebase Console → Firestore Database → `responses`, verify the test document. The public client intentionally cannot read response documents.

## Important
The archive can be code-reviewed offline, but it cannot prove that the live Firebase project, deployed rules, API-key restrictions, and Netlify environment variables are correct. Do not share private service-account keys; the web API key is normally public and must be protected with appropriate API restrictions and Firestore rules.

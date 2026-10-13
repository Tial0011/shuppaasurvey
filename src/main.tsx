import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans';
import '@/lib/firebase';
import '@/styles/base.css';
import '@/styles/site.css';
import '@/styles/admin.css';
import App from './App';
import { CLEAR_BROWSER_DATA_ON_LOAD } from '@/config/app';
import { resetBrowserData } from '@/utils/resetBrowserData';

// Runs once per full page load, before anything reads from storage.
if (CLEAR_BROWSER_DATA_ON_LOAD) resetBrowserData();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

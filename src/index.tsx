import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { migrateSettings } from './services/SettingsMigration';
import { initSentry } from './config/sentry';

// Load only critical font weight synchronously
import '@fontsource/roboto/400.css';

// Lazy load other font weights after initial render
const loadFonts = () => {
  import('@fontsource/roboto/300.css');
  import('@fontsource/roboto/500.css');
  import('@fontsource/roboto/700.css');
};
if ('requestIdleCallback' in window) {
  requestIdleCallback(loadFonts);
} else {
  setTimeout(loadFonts, 100);
}

// Initialize Sentry monitoring
initSentry();

// Initialize Vercel Speed Insights
// injectSpeedInsights();

// Run migrations before render
migrateSettings();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

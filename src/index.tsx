import React from 'react';
import ReactDOM from 'react-dom/client';
// import { injectSpeedInsights } from '@vercel/speed-insights';
import App from './App';
import { migrateSettings } from './services/SettingsMigration';
import { initializeSentry } from './config/sentry';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

// Initialize Sentry monitoring
initializeSentry();

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

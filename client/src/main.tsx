import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* Mounted here (not inside App) so it tracks every view App renders,
          including the auth/verify screens App returns early for. Injects
          nothing in local dev - Vercel's own tracking script only loads
          when actually served from Vercel. */}
      <Analytics />
    </QueryClientProvider>
  </React.StrictMode>
);

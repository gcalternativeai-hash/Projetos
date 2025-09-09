import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import React from "react";

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    return (
      <div style={{ padding: 20, color: "red" }}>
        <h2>Ocorreu um erro</h2>
        <pre>{error.message}</pre>
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div>Carregando...</div>}>
      {children}
    </React.Suspense>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
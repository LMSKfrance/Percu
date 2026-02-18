import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './design-tokens.css';
import './styles/sulfur.css';
import './App.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

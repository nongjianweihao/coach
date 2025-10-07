import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { SeedInitializer } from './seed/SeedInitializer';
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <SeedInitializer>
        <App />
      </SeedInitializer>
    </HashRouter>
  </React.StrictMode>,
);

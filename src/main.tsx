import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { UserProvider } from './lib/UserContext';   // ← add this

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>          {/* ← wrap here */}
      <App />
    </UserProvider>
  </React.StrictMode>
);

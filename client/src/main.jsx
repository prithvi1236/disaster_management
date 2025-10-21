import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

// Global styles
import './styles/global.css';

// Component styles
import './styles/header.css';
import './styles/footer.css';
import './styles/card.css';

// Page styles
import './styles/landing.css';
import './styles/login.css';
import './styles/dashboard.css';
import './styles/statistics.css';
import './styles/profile.css';
import './styles/admin.css';
import './styles/coordinator.css';
import './styles/reports.css';
import './styles/campDetail.css';
import './styles/disasterDetail.css';
import './styles/disasterList.css';
import './styles/donationForm.css';
import './styles/notfound.css';

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

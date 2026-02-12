import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { HashRouter } from 'react-router-dom'
import { UserProvider } from './contexts/UserContext'
import { CoachProvider } from './contexts/CoachContext'
import { DataServiceProvider } from './contexts/DataServiceContext'

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);

  root.render(
    <HashRouter>
      <UserProvider>
        <CoachProvider>
          <DataServiceProvider>
            <App />
          </DataServiceProvider>
        </CoachProvider>
      </UserProvider>
    </HashRouter>
  );
} else {
  console.error("Root element not found!");
}

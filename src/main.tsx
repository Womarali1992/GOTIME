import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { HashRouter } from 'react-router-dom'
import { UserProvider } from './contexts/UserContext'
import DataProvider from './components/DataProvider'

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);

  root.render(
    <HashRouter>
      <UserProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </UserProvider>
    </HashRouter>
  );
} else {
  console.error("Root element not found!");
}

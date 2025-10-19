import React from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import Login from './components/views/Login';
import MainLayout from './components/layout/MainLayout';
import { useAppContext } from './contexts/AppContext';
import SelectKeyOverlay from './components/SelectKeyOverlay';

const App: React.FC = () => {
  const { user, apiKey, isAdmin } = useAppContext();
  
  // Show overlay only for non-admin users who haven't set an API key yet.
  const showOverlay = user && !apiKey && !isAdmin;

  return (
    <ErrorBoundary>
      <div className="w-screen h-screen overflow-hidden">
        {!user ? (
          <Login />
        ) : (
          <>
            {showOverlay && <SelectKeyOverlay />}
            <MainLayout />
          </>
        )}
      </div>
      <ToastContainer />
    </ErrorBoundary>
  );
};

export default App;

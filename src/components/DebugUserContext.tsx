import React from 'react';
import { useUser } from '@/contexts/UserContext';

const DebugUserContext: React.FC = () => {
  console.log('DebugUserContext rendering');
  
  try {
    const userContext = useUser();
    console.log('DebugUserContext - useUser successful:', userContext);
    return (
      <div style={{ padding: '10px', border: '1px solid red', margin: '10px' }}>
        <h3>Debug User Context</h3>
        <p>Current User: {userContext.currentUser?.email || 'null'}</p>
        <p>Is Authenticated: {userContext.isAuthenticated.toString()}</p>
      </div>
    );
  } catch (error) {
    console.error('DebugUserContext - useUser failed:', error);
    return (
      <div style={{ padding: '10px', border: '1px solid red', margin: '10px', backgroundColor: '#ffe6e6' }}>
        <h3>Debug User Context - ERROR</h3>
        <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
};

export default DebugUserContext;




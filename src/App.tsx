// src/App.tsx
import React, { useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator';
import { getDBConnection, createTables } from './database/database';

const App = () => {
  useEffect(() => {
    const initializeDB = async () => {
      try {
        const db = await getDBConnection();
        await createTables(db);
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initializeDB();
  }, []);

  return <AppNavigator />;
};

export default App;
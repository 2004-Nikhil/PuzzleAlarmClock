// src/App.tsx
import React, { useEffect, useState } from 'react';
import { NativeModules, AppState } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { getDBConnection, createTables } from './database/database';

const App = (props: { alarmId?: number }) => {
  const [initialAlarmId, setInitialAlarmId] = useState<number | undefined>(props.alarmId);

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

  useEffect(() => {
    // Handle app state changes for alarm scenarios
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && props.alarmId) {
        console.log('App became active with alarm ID:', props.alarmId);
        setInitialAlarmId(props.alarmId);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [props.alarmId]);

  // Update initialAlarmId if props change
  useEffect(() => {
    if (props.alarmId !== initialAlarmId) {
      setInitialAlarmId(props.alarmId);
    }
  }, [props.alarmId, initialAlarmId]);

  return <AppNavigator initialAlarmId={initialAlarmId} />;
};

export default App;
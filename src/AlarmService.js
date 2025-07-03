import React from 'react';
import { AppRegistry, NativeModules } from 'react-native';
import App from './App';
import { getDBConnection, getAlarms } from './database/database';

const { AlarmScheduler } = NativeModules;

const AlarmService = () => {
  let alarmCheckInterval = null;

  const startAlarmService = () => {
    console.log('Starting Alarm Service...');
    
    // Check alarms every minute
    alarmCheckInterval = setInterval(() => {
      checkAndTriggerAlarm();
    }, 60000); // Check every minute
    
    // Also check immediately
    checkAndTriggerAlarm();
  };

  const stopAlarmService = () => {
    if (alarmCheckInterval) {
      clearInterval(alarmCheckInterval);
      alarmCheckInterval = null;
    }
  };

  const checkAndTriggerAlarm = async () => {
    try {
      const db = await getDBConnection();
      const alarms = await getAlarms(db);
      
      const now = new Date();
      const currentTime = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Check each alarm
      for (const alarm of alarms) {
        if (!alarm.isEnabled) continue;
        
        // Check if alarm time matches current time
        if (alarm.time === currentTime) {
          // Check if today is in repeat days (if any)
          if (alarm.repeatDays.length === 0 || alarm.repeatDays.includes(currentDay)) {
            console.log(`Alarm triggered for ID: ${alarm.id}`);
            triggerAlarm(alarm);
            break; // Only trigger one alarm at a time
          }
        }
      }
    } catch (error) {
      console.error('Error checking alarms:', error);
    }
  };

  const triggerAlarm = (alarm) => {
    console.log('Triggering alarm:', alarm);
    
    // Start the native alarm service
    if (AlarmScheduler && AlarmScheduler.startAlarmService) {
      AlarmScheduler.startAlarmService(alarm.id);
    }
    
    // Reload the app to show the alarm screen
    reloadAppForAlarm(alarm.id);
  };

  const reloadAppForAlarm = (alarmId) => {
    console.log(`Reloading app for alarm ID: ${alarmId}`);
    
    // Update the app's initial props to show the alarm screen
    AppRegistry.registerComponent('PuzzleAlarmClock', () => {
      return (props) => <App {...props} alarmId={alarmId} />;
    });
    
    // If RNRestart is available, use it for a clean restart
    try {
      const RNRestart = require('react-native-restart').default;
      RNRestart.Restart();
    } catch (error) {
      console.log('RNRestart not available, using alternative method');
      // Alternative: Just re-render the app with alarm props
      // This might require additional navigation logic
    }
  };

  // Start the service when this module is loaded
  startAlarmService();

  return {
    startAlarmService,
    stopAlarmService,
    checkAndTriggerAlarm,
    triggerAlarm
  };
};

// Initialize the alarm service
const alarmServiceInstance = AlarmService();

// Register the main app component
AppRegistry.registerComponent('PuzzleAlarmClock', () => App);

export default alarmServiceInstance;
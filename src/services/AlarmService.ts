import React from 'react';
import { AppRegistry, NativeModules } from 'react-native';
import App from '../App';
import { getDBConnection, getAlarms, Alarm } from '../database/database';

interface IAlarmScheduler {
  startAlarmService(alarmId: number): void;
}

const { AlarmScheduler } = NativeModules as { AlarmScheduler: IAlarmScheduler };

interface AlarmServiceInterface {
  startAlarmService: () => void;
  stopAlarmService: () => void;
  checkAndTriggerAlarm: () => Promise<void>;
  triggerAlarm: (alarm: Alarm) => void;
}

declare global {
  // Extend the NodeJS.Global interface to include triggeringAlarmId
  // eslint-disable-next-line no-var
  var triggeringAlarmId: number | undefined;
}

const AlarmService = (): AlarmServiceInterface => {
  let alarmCheckInterval: ReturnType<typeof setInterval> | null = null;

  const startAlarmService = (): void => {
    console.log('Starting Alarm Service...');
    
    // Check alarms every minute
    alarmCheckInterval = setInterval(() => {
      checkAndTriggerAlarm();
    }, 60000); // Check every minute
    
    // Also check immediately
    checkAndTriggerAlarm();
  };

  const stopAlarmService = (): void => {
    if (alarmCheckInterval) {
      clearInterval(alarmCheckInterval);
      alarmCheckInterval = null;
    }
  };

  const checkAndTriggerAlarm = async (): Promise<void> => {
    try {
      const db = await getDBConnection();
      const alarms: Alarm[] = await getAlarms(db);
      
      const now = new Date();
      const currentTime: string = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
      const currentDay: number = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
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

  const triggerAlarm = (alarm: Alarm): void => {
    console.log('Triggering alarm:', alarm);
    
    // Start the native alarm service
    if (AlarmScheduler && AlarmScheduler.startAlarmService && alarm.id) {
      AlarmScheduler.startAlarmService(alarm.id);
    }
    
    // Reload the app to show the alarm screen
    if (alarm.id) {
      reloadAppForAlarm(alarm.id);
    }
  };

  const reloadAppForAlarm = (alarmId: number): void => {
    console.log(`Reloading app for alarm ID: ${alarmId}`);
    
    // Store the alarm ID in a way that the app can access it on restart
    // This could be AsyncStorage, a global state, or passed through native modules
    try {
      // If RNRestart is available, use it for a clean restart
      const RNRestart = require('react-native-restart').default;
      
      // Store alarm ID before restart so the app can pick it up
      globalThis.triggeringAlarmId = alarmId;
      
      RNRestart.Restart();
    } catch (error) {
      console.log('RNRestart not available, using alternative method');
      
      // Alternative: Use a global state or event emitter to trigger alarm screen
      globalThis.triggeringAlarmId = alarmId;
      
      // You might want to emit an event here that your main app component listens to
      // or use a navigation service to navigate to the alarm screen
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
const alarmServiceInstance: AlarmServiceInterface = AlarmService();

// Register the main app component
AppRegistry.registerComponent('PuzzleAlarmClock', () => App);

export default alarmServiceInstance;

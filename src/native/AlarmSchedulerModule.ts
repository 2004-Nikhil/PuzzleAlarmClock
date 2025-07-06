import { NativeModules } from 'react-native';

// Define the interface for our native module
interface IAlarmScheduler {
  setAlarm(alarmId: number, timestamp: number): void;
  cancelAlarm(alarmId: number): void;
  stopAlarmService(): void;
  scheduleWakeUpCheck(alarmId: number): void;
  cancelWakeUpCheck(alarmId: number): void;
  respondToWakeUpCheck(alarmId: number): void;
}

// Get the native module and cast it to our interface
const AlarmScheduler = NativeModules.AlarmScheduler as IAlarmScheduler;

// A helper function to calculate the next trigger timestamp
const getNextTriggerTimestamp = (time: string, repeatDays: number[]): number => {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  
  const nextTrigger = new Date();
  nextTrigger.setHours(hours, minutes, 0, 0);

  // If the time has already passed for today, start checking from tomorrow
  if (nextTrigger.getTime() <= now.getTime()) {
    nextTrigger.setDate(now.getDate() + 1);
  }

  // If the alarm repeats, find the next valid day
  if (repeatDays.length > 0) {
    while (!repeatDays.includes(nextTrigger.getDay())) {
      nextTrigger.setDate(nextTrigger.getDate() + 1);
    }
  }

  return nextTrigger.getTime();
};


export default {
  set: (alarmId: number, time: string, repeatDays: number[]) => {
    const timestamp = getNextTriggerTimestamp(time, repeatDays);
    console.log(`JS: Scheduling alarm ID ${alarmId} for ${new Date(timestamp)}`);
    AlarmScheduler.setAlarm(alarmId, timestamp);
  },
  cancel: (alarmId: number) => {
    console.log(`JS: Cancelling alarm ID ${alarmId}`);
    AlarmScheduler.cancelAlarm(alarmId);
  },
  stop: () => {
    console.log("JS: Stopping alarm service.");
    AlarmScheduler.stopAlarmService();
  },
  scheduleWakeUpCheck: (alarmId: number) => {
    console.log(`JS: Scheduling wake-up check for alarm ID ${alarmId}`);
    AlarmScheduler.scheduleWakeUpCheck(alarmId);
  },
  cancelWakeUpCheck: (alarmId: number) => {
    console.log(`JS: Cancelling wake-up check for alarm ID ${alarmId}`);
    AlarmScheduler.cancelWakeUpCheck(alarmId);
  },
  respondToWakeUpCheck: (alarmId: number) => {
    console.log(`JS: Responding to wake-up check for alarm ID ${alarmId}`);
    AlarmScheduler.respondToWakeUpCheck(alarmId);
  }
};
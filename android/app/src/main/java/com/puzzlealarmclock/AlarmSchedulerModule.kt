package com.puzzlealarmclock

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AlarmSchedulerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val alarmManager: AlarmManager
        get() = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    override fun getName(): String {
        return "AlarmScheduler" // This is the name used in JavaScript
    }

    // This method is exposed to React Native
    @ReactMethod
    fun setAlarm(alarmId: Int, timestamp: Double) {
        val triggerTime = timestamp.toLong()
        Log.d("AlarmSchedulerModule", "Setting alarm with ID $alarmId for timestamp $triggerTime")

        // This intent will be broadcasted when the alarm fires.
        val intent = Intent(reactContext, AlarmReceiver::class.java).apply {
            putExtra("ALARM_ID", alarmId) // Pass the alarm ID to the receiver
        }

        // We use a PendingIntent to give the AlarmManager permission to execute our Intent
        val pendingIntent = PendingIntent.getBroadcast(
            reactContext,
            alarmId, // Use the alarmId as the request code to uniquely identify this PendingIntent
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // setAlarmClock is designed specifically for alarms and is the most reliable.
        val alarmClockInfo = AlarmManager.AlarmClockInfo(triggerTime, pendingIntent)
        alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)

        Log.d("AlarmSchedulerModule", "Alarm has been set.")
    }
    
    @ReactMethod
    fun cancelAlarm(alarmId: Int) {
        Log.d("AlarmSchedulerModule", "Cancelling alarm with ID $alarmId")

        val intent = Intent(reactContext, AlarmReceiver::class.java)
        
        // To cancel an alarm, you must create a PendingIntent that is identical to the one you used to set it.
        val pendingIntent = PendingIntent.getBroadcast(
            reactContext,
            alarmId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        alarmManager.cancel(pendingIntent)
        Log.d("AlarmSchedulerModule", "Alarm cancelled.")
    }
    @ReactMethod
    fun stopAlarmService() {
        Log.d("AlarmSchedulerModule", "Stopping alarm service from React Native.")
        val serviceIntent = Intent(reactContext, AlarmService::class.java)
        reactContext.stopService(serviceIntent)
    }

    @ReactMethod
    fun scheduleWakeUpCheck(alarmId: Int) {
        Log.d("AlarmSchedulerModule", "Scheduling wake-up check for alarm ID $alarmId")
        
        // Schedule wake-up check for 4 minutes from now
        val wakeUpCheckTime = System.currentTimeMillis() + (4 * 60 * 1000) // 4 minutes
        
        val intent = Intent(reactContext, WakeUpCheckReceiver::class.java).apply {
            putExtra("ALARM_ID", alarmId)
            action = "WAKE_UP_CHECK"
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            reactContext,
            alarmId + 10000, // Use different request code to avoid conflicts
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            wakeUpCheckTime,
            pendingIntent
        )
        
        Log.d("AlarmSchedulerModule", "Wake-up check scheduled for ${wakeUpCheckTime} (${java.util.Date(wakeUpCheckTime)})")
    }

    @ReactMethod
    fun cancelWakeUpCheck(alarmId: Int) {
        Log.d("AlarmSchedulerModule", "Cancelling wake-up check for alarm ID $alarmId")
        
        // Cancel the wake-up check
        val intent = Intent(reactContext, WakeUpCheckReceiver::class.java).apply {
            action = "WAKE_UP_CHECK"
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            reactContext,
            alarmId + 10000,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        alarmManager.cancel(pendingIntent)
        Log.d("AlarmSchedulerModule", "Wake-up check cancelled")
    }

    @ReactMethod
    fun respondToWakeUpCheck(alarmId: Int) {
        Log.d("AlarmSchedulerModule", "User responded to wake-up check for alarm ID $alarmId")
        
        // Cancel the wake-up check
        cancelWakeUpCheck(alarmId)
        
        // Cancel any pending alarm re-trigger
        val intent = Intent(reactContext, AlarmReceiver::class.java).apply {
            action = "WAKE_UP_TIMEOUT"
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            reactContext,
            alarmId + 20000,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        alarmManager.cancel(pendingIntent)
        Log.d("AlarmSchedulerModule", "Wake-up timeout cancelled")
    }
}
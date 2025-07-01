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
}
package com.puzzlealarmclock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import android.app.NotificationManager

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return

        val alarmId = intent.getIntExtra("ALARM_ID", -1)
        val action = intent.action
        
        Log.d("AlarmReceiver", "Received action: $action for alarm ID: $alarmId")

        when (action) {
            "WAKE_UP_TIMEOUT" -> {
                Log.d("AlarmReceiver", "Wake-up timeout! Re-triggering alarm for ID: $alarmId")
                // Clear the wake-up notification
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.cancel(alarmId + 1000)
                
                // Re-trigger the alarm
                startAlarmService(context, alarmId)
            }
            else -> {
                // Original alarm trigger
                Log.d("AlarmReceiver", "ALARM RECEIVED! ID: $alarmId. Starting service.")
                startAlarmService(context, alarmId)
            }
        }
    }

    private fun startAlarmService(context: Context, alarmId: Int) {
        // Create an intent to start our AlarmService
        val serviceIntent = Intent(context, AlarmService::class.java).apply {
            putExtra("ALARM_ID", alarmId)
        }

        // On modern Android, we must start a foreground service
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
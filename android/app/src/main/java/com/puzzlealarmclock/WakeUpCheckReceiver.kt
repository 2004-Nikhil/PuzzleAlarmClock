package com.puzzlealarmclock

import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat

class WakeUpCheckReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return

        val alarmId = intent.getIntExtra("ALARM_ID", -1)
        val action = intent.action
        
        Log.d("WakeUpCheckReceiver", "Received action: $action for alarm ID: $alarmId")

        when (action) {
            "WAKE_UP_CHECK" -> {
                showWakeUpNotification(context, alarmId)
                scheduleWakeUpTimeout(context, alarmId)
            }
            "WAKE_UP_RESPONSE" -> {
                handleWakeUpResponse(context, alarmId)
            }
        }
    }

    private fun showWakeUpNotification(context: Context, alarmId: Int) {
        Log.d("WakeUpCheckReceiver", "Showing wake-up notification for alarm ID: $alarmId")
        
        // Create notification channel
        val channelId = "WAKE_UP_CHECK_CHANNEL"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Wake Up Check",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Channel for wake-up check notifications"
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
                setBypassDnd(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }

        // Create intent for "I'm Awake" response
        val responseIntent = Intent(context, WakeUpCheckReceiver::class.java).apply {
            action = "WAKE_UP_RESPONSE"
            putExtra("ALARM_ID", alarmId)
        }
        
        val responsePendingIntent = PendingIntent.getBroadcast(
            context,
            alarmId + 30000,
            responseIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Create full screen intent
        val fullScreenIntent = Intent(context, MainActivity::class.java).apply {
            putExtra("ALARM_ID", alarmId)
            putExtra("WAKE_UP_CHECK", true)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        
        val fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            alarmId + 36000,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Create notification with maximum visibility
        val notification = NotificationCompat.Builder(context, channelId)
            .setContentTitle("Are you awake?")
            .setContentText("Tap 'I'm Awake' or the alarm will ring again in 1 minute")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setOngoing(false)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .addAction(
                android.R.drawable.ic_dialog_info,
                "I'm Awake",
                responsePendingIntent
            )
            .setVibrate(longArrayOf(0, 500, 200, 500, 200, 500))
            .setLights(0xFF0000FF.toInt(), 1000, 1000)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .build()

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(alarmId + 1000, notification)
    }

    private fun scheduleWakeUpTimeout(context: Context, alarmId: Int) {
        Log.d("WakeUpCheckReceiver", "Scheduling wake-up timeout for alarm ID: $alarmId")
        
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val timeoutTime = System.currentTimeMillis() + (60 * 1000) // 1 minute
        
        val timeoutIntent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra("ALARM_ID", alarmId)
            action = "WAKE_UP_TIMEOUT"
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            alarmId + 20000,
            timeoutIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            timeoutTime,
            pendingIntent
        )
        
        Log.d("WakeUpCheckReceiver", "Wake-up timeout scheduled for $timeoutTime")
    }

    private fun handleWakeUpResponse(context: Context, alarmId: Int) {
        Log.d("WakeUpCheckReceiver", "User responded to wake-up check for alarm ID: $alarmId")
        
        // Cancel the wake-up timeout
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val timeoutIntent = Intent(context, AlarmReceiver::class.java).apply {
            action = "WAKE_UP_TIMEOUT"
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            alarmId + 20000,
            timeoutIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        alarmManager.cancel(pendingIntent)
        
        // Dismiss wake-up check notification
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(alarmId + 1000) // Wake-up check notification
        
        Log.d("WakeUpCheckReceiver", "Wake-up check completed successfully")
    }
}

package com.puzzlealarmclock

import android.app.*
import android.content.Context
import android.content.Intent
import android.media.MediaPlayer
import android.os.*
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat

class AlarmService : Service() {
    private lateinit var mediaPlayer: MediaPlayer
    private lateinit var vibrator: Vibrator
    private lateinit var wakeLock: PowerManager.WakeLock

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val alarmId = intent?.getIntExtra("ALARM_ID", -1) ?: -1
        Log.d("AlarmService", "Alarm Service started for ID: $alarmId")

        // 1. Acquire WakeLock to keep the CPU running
        wakeLock = (getSystemService(Context.POWER_SERVICE) as PowerManager).run {
            newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "PuzzleAlarmClock::WakeLock").apply {
                acquire(10*60*1000L /*10 minutes*/)
            }
        }

        // 2. Start Media Player
        mediaPlayer = MediaPlayer.create(this, Settings.System.DEFAULT_ALARM_ALERT_URI).apply {
            isLooping = true
            start()
        }

        // 3. Start Vibrator
        vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        val pattern = longArrayOf(0, 1000, 1000) // Vibrate for 1s, pause for 1s
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0))
        } else {
            @Suppress("DEPRECATION") // Suppress warning for older Android versions
            vibrator.vibrate(pattern, 0)
        }

        // 4. Create Notification Channel (for Android 8.0+)
        val channelId = "ALARM_SERVICE_CHANNEL"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId, 
                "Alarm Service", 
                NotificationManager.IMPORTANCE_HIGH
            )
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
        
        // 5. Create the persistent notification for the foreground service
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE)
        
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Alarm Ringing!")
            .setContentText("Wake up! Your alarm is ringing.")
            .setSmallIcon(R.mipmap.ic_launcher) // Default app icon
            .setContentIntent(pendingIntent)
            .build()
        
        // This is the command that actually starts the foreground service.
        startForeground(1, notification)

        // 6. Launch the React Native Activity's UI
        val activityIntent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra("ALARM_ID", alarmId)
        }
        startActivity(activityIntent)

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d("AlarmService", "Alarm Service being destroyed.")
        
        // Clean up resources
        mediaPlayer.stop()
        mediaPlayer.release()
        vibrator.cancel()
        if (wakeLock.isHeld) {
            wakeLock.release()
        }
    }
}
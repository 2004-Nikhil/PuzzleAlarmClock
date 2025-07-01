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
    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        try {
            val alarmId = intent?.getIntExtra("ALARM_ID", -1) ?: -1
            Log.d("AlarmService", "Alarm Service started for ID: $alarmId")

            // 1. Acquire WakeLock to keep the CPU running
            try {
                val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
                wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK, 
                    "PuzzleAlarmClock::WakeLock"
                ).apply {
                    acquire(10 * 60 * 1000L /*10 minutes*/)
                }
                Log.d("AlarmService", "WakeLock acquired")
            } catch (e: Exception) {
                Log.e("AlarmService", "Error acquiring wake lock: ${e.message}")
            }

            // 2. Start Media Player with comprehensive error handling
            try {
                mediaPlayer = MediaPlayer.create(this, Settings.System.DEFAULT_ALARM_ALERT_URI)
                if (mediaPlayer == null) {
                    Log.e("AlarmService", "Failed to create MediaPlayer with default alarm URI")
                    // Try fallback with notification sound
                    try {
                        mediaPlayer = MediaPlayer.create(this, Settings.System.DEFAULT_NOTIFICATION_URI)
                        if (mediaPlayer == null) {
                            Log.e("AlarmService", "Failed to create MediaPlayer with notification URI")
                            // Last resort - try with ringtone
                            mediaPlayer = MediaPlayer.create(this, Settings.System.DEFAULT_RINGTONE_URI)
                        }
                    } catch (fallbackException: Exception) {
                        Log.e("AlarmService", "Fallback MediaPlayer creation failed: ${fallbackException.message}")
                    }
                }

                mediaPlayer?.let { player ->
                    try {
                        player.isLooping = true
                        player.setOnErrorListener { mp, what, extra ->
                            Log.e("AlarmService", "MediaPlayer error: what=$what, extra=$extra")
                            false // Return false to trigger onCompletion
                        }
                        player.setOnCompletionListener {
                            Log.d("AlarmService", "MediaPlayer completed")
                        }
                        player.start()
                        Log.d("AlarmService", "MediaPlayer started successfully")
                    } catch (e: Exception) {
                        Log.e("AlarmService", "Error starting MediaPlayer: ${e.message}")
                        // Clean up failed MediaPlayer
                        try {
                            player.release()
                        } catch (releaseException: Exception) {
                            Log.e("AlarmService", "Error releasing failed MediaPlayer: ${releaseException.message}")
                        }
                        mediaPlayer = null
                    }
                } ?: Log.e("AlarmService", "MediaPlayer is null, no sound will play")
            } catch (e: Exception) {
                Log.e("AlarmService", "Error creating MediaPlayer: ${e.message}")
            }

            // 3. Start Vibrator with error handling
            try {
                vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                vibrator?.let { vib ->
                    if (vib.hasVibrator()) {
                        val pattern = longArrayOf(0, 1000, 1000)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            try {
                                val vibrationEffect = VibrationEffect.createWaveform(pattern, 0)
                                vib.vibrate(vibrationEffect)
                                Log.d("AlarmService", "Vibrator started (API 26+)")
                            } catch (e: Exception) {
                                Log.e("AlarmService", "Error starting vibrator (API 26+): ${e.message}")
                            }
                        } else {
                            try {
                                @Suppress("DEPRECATION")
                                vib.vibrate(pattern, 0)
                                Log.d("AlarmService", "Vibrator started (legacy)")
                            } catch (e: Exception) {
                                Log.e("AlarmService", "Error starting vibrator (legacy): ${e.message}")
                            }
                        }
                    } else {
                        Log.w("AlarmService", "Device does not have vibrator")
                    }
                } ?: Log.e("AlarmService", "Vibrator service not available")
            } catch (e: Exception) {
                Log.e("AlarmService", "Error getting vibrator service: ${e.message}")
            }

            // 4. Create Notification Channel (for Android 8.0+)
            val channelId = "ALARM_SERVICE_CHANNEL"
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val channel = NotificationChannel(
                        channelId,
                        "Alarm Service",
                        NotificationManager.IMPORTANCE_HIGH
                    ).apply {
                        description = "Channel for alarm notifications"
                        enableVibration(true)
                        setShowBadge(true)
                    }
                    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                    manager.createNotificationChannel(channel)
                    Log.d("AlarmService", "Notification channel created")
                }
            } catch (e: Exception) {
                Log.e("AlarmService", "Error creating notification channel: ${e.message}")
            }

            // 5. Create the persistent notification for the foreground service
            try {
                val notificationIntent = Intent(this, MainActivity::class.java).apply {
                    putExtra("ALARM_ID", alarmId)
                }
                val pendingIntent = PendingIntent.getActivity(
                    this, 
                    0, 
                    notificationIntent, 
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )

                val notification = NotificationCompat.Builder(this, channelId)
                    .setContentTitle("Alarm Ringing!")
                    .setContentText("Wake up! Your alarm is ringing.")
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm) // Use system alarm icon as fallback
                    .setContentIntent(pendingIntent)
                    .setAutoCancel(false)
                    .setOngoing(true)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setFullScreenIntent(pendingIntent, true)
                    .build()

                // Start foreground service
                startForeground(1, notification)
                Log.d("AlarmService", "Foreground service started")
            } catch (e: Exception) {
                Log.e("AlarmService", "Error creating notification: ${e.message}")
                // Try to start foreground with minimal notification
                try {
                    val minimalNotification = NotificationCompat.Builder(this, channelId)
                        .setContentTitle("Alarm")
                        .setContentText("Alarm is ringing")
                        .setSmallIcon(android.R.drawable.ic_dialog_alert)
                        .build()
                    startForeground(1, minimalNotification)
                    Log.d("AlarmService", "Minimal foreground service started")
                } catch (minimalException: Exception) {
                    Log.e("AlarmService", "Failed to start foreground service: ${minimalException.message}")
                }
            }

            // 6. Launch the React Native Activity's UI
            try {
                val activityIntent = Intent(this, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    putExtra("ALARM_ID", alarmId)
                }
                startActivity(activityIntent)
                Log.d("AlarmService", "Activity launched")
            } catch (e: Exception) {
                Log.e("AlarmService", "Error launching activity: ${e.message}")
            }

            return START_STICKY

        } catch (e: Exception) {
            Log.e("AlarmService", "Critical error in onStartCommand: ${e.message}")
            // Ensure we clean up on critical errors
            cleanupResources()
            return START_NOT_STICKY
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d("AlarmService", "Alarm Service being destroyed.")
        cleanupResources()
    }

    private fun cleanupResources() {
        Log.d("AlarmService", "Cleaning up resources...")

        // Clean up MediaPlayer
        try {
            mediaPlayer?.let { player ->
                if (player.isPlaying) {
                    player.stop()
                    Log.d("AlarmService", "MediaPlayer stopped")
                }
                player.release()
                Log.d("AlarmService", "MediaPlayer released")
            }
        } catch (e: Exception) {
            Log.e("AlarmService", "Error cleaning up MediaPlayer: ${e.message}")
        } finally {
            mediaPlayer = null
        }

        // Clean up Vibrator
        try {
            vibrator?.cancel()
            Log.d("AlarmService", "Vibrator cancelled")
        } catch (e: Exception) {
            Log.e("AlarmService", "Error cancelling vibrator: ${e.message}")
        } finally {
            vibrator = null
        }

        // Clean up WakeLock
        try {
            wakeLock?.let { lock ->
                if (lock.isHeld) {
                    lock.release()
                    Log.d("AlarmService", "WakeLock released")
                }
            }
        } catch (e: Exception) {
            Log.e("AlarmService", "Error releasing wake lock: ${e.message}")
        } finally {
            wakeLock = null
        }

        Log.d("AlarmService", "Resource cleanup completed")
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        Log.d("AlarmService", "Task removed - keeping service alive")
        // Don't stop the service when task is removed - alarm should keep ringing
    }

    override fun onLowMemory() {
        super.onLowMemory()
        Log.w("AlarmService", "Low memory warning received")
    }
}
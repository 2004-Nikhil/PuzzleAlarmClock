package com.puzzlealarmclock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AlarmReceiver : BroadcastReceiver() {
    
    // This method is called when the AlarmManager fires the alarm.
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return

        val alarmId = intent.getIntExtra("ALARM_ID", -1)
        Log.d("AlarmReceiver", "ALARM RECEIVED! ID: $alarmId")

        // TODO: Start the AlarmService from here
        // This service will play the sound and show the puzzle screen.
        
    }
}
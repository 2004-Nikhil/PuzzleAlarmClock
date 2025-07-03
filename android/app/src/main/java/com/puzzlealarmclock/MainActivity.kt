package com.puzzlealarmclock

import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "PuzzleAlarmClock"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
      // THIS IS THE METHOD WE ADD
      // It checks for our ALARM_ID from the intent and passes it as a launch property
      override fun getLaunchOptions(): Bundle? {
        val bundle = Bundle()
        val alarmId = intent.getIntExtra("ALARM_ID", -1)
        if (alarmId != -1) {
            bundle.putInt("alarmId", alarmId)
        }
        return bundle
      }
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Check if the app was launched by an alarm
    handleAlarmLaunch(intent)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
    
    // Handle alarm launch when app is already running
    intent?.let { handleAlarmLaunch(it) }
  }

  private fun handleAlarmLaunch(intent: Intent) {
    val alarmId = intent.getIntExtra("ALARM_ID", -1)
    val isAlarmReload = intent.getBooleanExtra("RELOAD_FOR_ALARM", false)
    
    if (alarmId != -1 && isAlarmReload) {
      Log.d("MainActivity", "App launched/reloaded for alarm ID: $alarmId")
      
      // Pass the alarm ID to React Native
      val bundle = Bundle().apply {
        putInt("alarmId", alarmId)
      }
      
      // You might need to update the React Native bridge to handle this
      // For now, we'll rely on the App component to handle the alarmId prop
    }
  }
}
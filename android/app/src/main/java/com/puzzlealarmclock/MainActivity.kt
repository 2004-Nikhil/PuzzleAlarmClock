package com.puzzlealarmclock

import android.os.Bundle // Import Bundle
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
}
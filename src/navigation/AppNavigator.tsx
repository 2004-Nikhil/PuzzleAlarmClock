// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AlarmListScreen from '../screens/AlarmListScreen';
import EditAlarmScreen from '../screens/EditAlarmScreen';

export type RootStackParamList = {
  AlarmList: undefined; // No params needed to go to the list
  EditAlarm: { alarmId?: number }; // Pass an alarmId when editing, or nothing for new
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="AlarmList"
          component={AlarmListScreen}
          options={{ title: 'My Alarms' }}
        />
        <Stack.Screen
          name="EditAlarm"
          component={EditAlarmScreen}
          options={{ title: 'Set Alarm' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AlarmListScreen from '../screens/AlarmListScreen';
import EditAlarmScreen from '../screens/EditAlarmScreen';
import AlarmRingingScreen from '../screens/AlarmRingingScreen';

export type RootStackParamList = {
  AlarmList: undefined; // No params needed to go to the list
  EditAlarm: { alarmId?: number }; // Pass an alarmId when editing, or nothing for new
  AlarmRinging: { alarmId: number }; // Pass the alarmId
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// We now accept the initial alarmId as a prop
interface AppNavigatorProps {
    initialAlarmId?: number;
}

const AppNavigator = ({ initialAlarmId }: AppNavigatorProps) => {
  // If we launched with an alarmId, start on the ringing screen. Otherwise, start on the list.
  const initialRouteName = initialAlarmId ? 'AlarmRinging' : 'AlarmList';

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen name="AlarmList" component={AlarmListScreen} options={{ title: 'My Alarms' }} />
        <Stack.Screen name="EditAlarm" component={EditAlarmScreen} options={{ title: 'Set Alarm' }} />
        <Stack.Screen
          name="AlarmRinging"
          component={AlarmRingingScreen}
          options={{ headerShown: false }} // The ringing screen is full-screen
          initialParams={{ alarmId: initialAlarmId }} // Pass the ID
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
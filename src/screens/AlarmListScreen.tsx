// src/screens/AlarmListScreen.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, FlatList, Switch, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDBConnection, getAlarms, updateAlarmEnabledStatus, Alarm } from '../database/database';
import AlarmScheduler from '../native/AlarmSchedulerModule';

type AlarmListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AlarmList'>;

// A simple component for rendering each alarm
const AlarmCard = ({ item, onToggle }: { item: Alarm; onToggle: (id: number, isEnabled: boolean) => void }) => {
    const navigation = useNavigation<AlarmListNavigationProp>();

    const handleToggle = (value: boolean) => {
        if (item.id) {
            onToggle(item.id, value);
        }
    };

    return (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('EditAlarm', { alarmId: item.id })}
        >
            <View>
                <Text style={styles.cardTime}>{item.time}</Text>
                <Text style={styles.cardLabel}>{item.label}</Text>
            </View>
            <Switch
                value={item.isEnabled}
                onValueChange={handleToggle}
            />
        </TouchableOpacity>
    );
};

const AlarmListScreen = () => {
  const navigation = useNavigation<AlarmListNavigationProp>();
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const handleToggleAlarm = async (alarmId: number, isEnabled: boolean) => {
    try {
      const db = await getDBConnection();
      await updateAlarmEnabledStatus(db, alarmId, isEnabled);
      
      // Update local state
      setAlarms(prevAlarms => 
        prevAlarms.map(alarm => 
          alarm.id === alarmId ? { ...alarm, isEnabled } : alarm
        )
      );

      // Find the alarm to get its details for scheduling
      const alarm = alarms.find(a => a.id === alarmId);
      if (alarm) {
        if (isEnabled) {
          // Schedule the alarm
          AlarmScheduler.set(alarmId, alarm.time, alarm.repeatDays);
          if (alarm.wakeUpCheck) {
            AlarmScheduler.scheduleWakeUpCheck(alarmId);
          }
        } else {
          // Cancel the alarm
          AlarmScheduler.cancel(alarmId);
          if (alarm.wakeUpCheck) {
            AlarmScheduler.cancelWakeUpCheck(alarmId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle alarm:', error);
    }
  };

  // useFocusEffect runs every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadAlarms = async () => {
        try {
          const db = await getDBConnection();
          const savedAlarms = await getAlarms(db);
          setAlarms(savedAlarms);
          console.log('Alarms loaded:', savedAlarms);
        } catch (error) {
          console.error('Failed to load alarms:', error);
        }
      };
      loadAlarms();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={alarms}
        keyExtractor={item => item.id!.toString()}
        renderItem={({ item }) => <AlarmCard item={item} onToggle={handleToggleAlarm} />}
        ListEmptyComponent={
            <Text style={styles.placeholderText}>No alarms set yet.</Text>
        }
      />
      <View style={styles.addButtonContainer}>
        <Button
          title="Add New Alarm"
          onPress={() => navigation.navigate('EditAlarm', {})}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButtonContainer: {
    padding: 16,
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  cardTime: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardLabel: {
    fontSize: 16,
    color: 'gray',
  },
});

export default AlarmListScreen;
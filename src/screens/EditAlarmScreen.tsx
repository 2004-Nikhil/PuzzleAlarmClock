import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  getDBConnection,
  getAlarmById,
  saveAlarm,
  updateAlarm,
  deleteAlarm,
  Alarm,
  ChallengeConfig,
  MemoryGameChallengeConfig
} from '../database/database';

import AlarmScheduler from '../native/AlarmSchedulerModule';

// Define the type for the route's params
type EditAlarmRouteProp = RouteProp<RootStackParamList, 'EditAlarm'>;

// Define the type for the navigation prop
type EditAlarmNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditAlarm'>;

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const EditAlarmScreen = () => {
  const navigation = useNavigation<EditAlarmNavigationProp>();
  const route = useRoute<EditAlarmRouteProp>();
  const alarmId = route.params?.alarmId;
  const isEditing = alarmId !== undefined;

  // --- STATE MANAGEMENT ---
  const [time, setTime] = useState(new Date());
  const [label, setLabel] = useState('');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [dismissMethod, setDismissMethod] = useState<'STANDARD' | 'MEMORY_GAME'>('STANDARD');
  const [wakeUpCheck, setWakeUpCheck] = useState(false);
  const [memoryGamePairs, setMemoryGamePairs] = useState(6);

  // --- DATA LOADING FOR EDIT MODE ---
  useEffect(() => {
    if (isEditing) {
      const loadAlarmData = async () => {
        try {
          const db = await getDBConnection();
          const fetchedAlarm = await getAlarmById(db, alarmId);
          if (fetchedAlarm) {
            // Time needs to be parsed back into a Date object
            const [hours, minutes] = fetchedAlarm.time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            
            setTime(date);
            setLabel(fetchedAlarm.label);
            setRepeatDays(fetchedAlarm.repeatDays);
            setDismissMethod(fetchedAlarm.challengeType);
            setWakeUpCheck(fetchedAlarm.wakeUpCheck);
            
            // Add logic to load memory game config
            if (fetchedAlarm.challengeType === 'MEMORY_GAME') {
              const config = fetchedAlarm.challengeConfig as MemoryGameChallengeConfig;
              setMemoryGamePairs(config.pairs || 6);
            }
          }
        } catch(error) {
            console.error(error);
        }
      };
      loadAlarmData();
    }
  }, [isEditing, alarmId]);

  // --- HANDLER FUNCTIONS ---

  const showTimepicker = () => {
    DateTimePickerAndroid.open({
      value: time,
      mode: 'time',
      is24Hour: true,
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          setTime(selectedDate);
        }
      },
    });
  };

  const toggleRepeatDay = (dayIndex: number) => {
    setRepeatDays(prevDays =>
      prevDays.includes(dayIndex)
        ? prevDays.filter(d => d !== dayIndex)
        : [...prevDays, dayIndex].sort()
    );
  };

  const handleSave = async () => {
    let config: ChallengeConfig = {};
    if (dismissMethod === 'MEMORY_GAME') {
      config = { pairs: memoryGamePairs };
    }
    
    const alarmData: Omit<Alarm, 'id'> = {
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      label,
      repeatDays,
      isEnabled: true,
      challengeType: dismissMethod,
      challengeConfig: config,
      wakeUpCheck,
    };

    try {
      const db = await getDBConnection();
      let currentAlarmId = alarmId;

      if (isEditing) {
          await updateAlarm(db, { ...alarmData, id: currentAlarmId });
      } else {
          const newId = await saveAlarm(db, alarmData);
          currentAlarmId = newId;
      }

      if (currentAlarmId) {
          AlarmScheduler.set(currentAlarmId, alarmData.time, alarmData.repeatDays);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save alarm:', error);
    }
  };
  
  const handleDelete = () => {
  Alert.alert(
    'Delete Alarm',
    'Are you sure you want to delete this alarm?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          if (!isEditing) return;
          try {
              const db = await getDBConnection();
              await deleteAlarm(db, alarmId);
              AlarmScheduler.cancel(alarmId);
              navigation.goBack();
          } catch (error) {
              console.error('Failed to delete alarm:', error);
          }
      }},
    ]
  );
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Time Picker */}
        <TouchableOpacity onPress={showTimepicker} style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>

        {/* Label Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Label</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Alarm name"
          />
        </View>

        {/* Repeat Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repeat</Text>
          <View style={styles.daysContainer}>
            {DAYS.map((day, index) => {
              const isSelected = repeatDays.includes(index);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                  onPress={() => toggleRepeatDay(index)}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dismiss Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dismiss Method</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                dismissMethod === 'STANDARD' && styles.optionButtonSelected,
              ]}
              onPress={() => setDismissMethod('STANDARD')}
            >
              <Text style={styles.optionText}>Standard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                dismissMethod === 'MEMORY_GAME' && styles.optionButtonSelected,
              ]}
              onPress={() => setDismissMethod('MEMORY_GAME')}
            >
              <Text style={styles.optionText}>Memory Game</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Challenge Configuration */}
        {dismissMethod === 'MEMORY_GAME' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Memory Game Configuration</Text>
            <View style={styles.inlineSetting}>
              <Text>Number of pairs:</Text>
              <TextInput
                style={styles.numericInput}
                value={String(memoryGamePairs)}
                onChangeText={text => setMemoryGamePairs(Number(text) || 6)}
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}

        {/* Wake-up Check */}
        <View style={[styles.section, styles.inlineSetting, styles.switchSection]}>
            <Text style={styles.sectionTitle}>Wake-Up Check</Text>
            <Switch
                value={wakeUpCheck}
                onValueChange={setWakeUpCheck}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={wakeUpCheck ? '#f5dd4b' : '#f4f3f4'}
            />
        </View>

      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <Button title="Save Alarm" onPress={handleSave} />
        {isEditing && (
          <View style={styles.deleteButtonContainer}>
            <Button title="Delete Alarm" color="#ff3b30" onPress={handleDelete} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f7',
  },
  timeContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  timeText: {
    fontSize: 64,
    fontWeight: '200',
  },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    height: 40,
    fontSize: 16,
    marginTop: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9e9eb',
  },
  dayButtonSelected: {
    backgroundColor: '#007aff',
  },
  dayText: {
    fontSize: 16,
    color: '#000',
  },
  dayTextSelected: {
    color: '#fff',
  },
  optionsContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e9e9eb',
    marginRight: 10,
  },
  optionButtonSelected: {
    backgroundColor: '#007aff',
  },
  optionText: {
    color: '#000',
  },
  inlineSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  switchSection: {
    borderBottomWidth: 0,
    paddingVertical: 4,
  },
  numericInput: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    width: 50,
    textAlign: 'center',
    fontSize: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  deleteButtonContainer: {
    marginTop: 10,
  }
});

export default EditAlarmScreen;
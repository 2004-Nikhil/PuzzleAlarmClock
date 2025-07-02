import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDBConnection, getAlarmById, Alarm, StepsChallengeConfig } from '../database/database';
import AlarmScheduler from '../native/AlarmSchedulerModule';
import StepChallenge from '../components/StepChallenge';

type AlarmRingingScreenRouteProp = RouteProp<RootStackParamList, 'AlarmRinging'>;

interface Props {
  route: AlarmRingingScreenRouteProp;
}

const AlarmRingingScreen = ({ route }: Props) => {
  const { alarmId } = route.params;
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlarm = async () => {
      try {
        const db = await getDBConnection();
        const fetchedAlarm = await getAlarmById(db, alarmId);
        if (fetchedAlarm) {
          setAlarm(fetchedAlarm);
        } else {
          console.error("Could not find alarm with ID:", alarmId);
          // If alarm not found, just stop the service to prevent orphan ringing
          handleDismiss();
        }
      } catch (error) {
        console.error("Error fetching alarm:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlarm();
  }, [alarmId]);

  const handleDismiss = () => {
    console.log("Dismissing alarm and stopping service...");
    // This is the crucial call to our native module to stop sound/vibration
    AlarmScheduler.stop();
  };

  const renderChallenge = () => {
    if (!alarm) return null;

    switch (alarm.challengeType) {
      case 'STEPS':
        const config = alarm.challengeConfig as StepsChallengeConfig;
        return (
          <StepChallenge
            requiredSteps={config.count}
            onChallengeComplete={handleDismiss}
          />
        );
      case 'STANDARD':
      default:
        // For a standard alarm, we'd have a simple dismiss button
        // For now, it will just be text.
        return (
            <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
                <Text style={styles.dismissButtonText}>Tap to Dismiss</Text>
            </TouchableOpacity>
        )
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.timeText}>{alarm?.time}</Text>
        <Text style={styles.labelText}>{alarm?.label || 'Alarm'}</Text>
      </View>
      <View style={styles.challengeContainer}>{renderChallenge()}</View>
    </View>
  );
};

// You need to add TouchableOpacity to the imports for the Standard dismiss
import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e', // A dark background for the alarm screen
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
  },
  labelText: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  challengeContainer: {
    flex: 3,
  },
  dismissButton: {
    alignSelf: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    backgroundColor: '#007aff',
    borderRadius: 30,
  },
  dismissButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  }
});

export default AlarmRingingScreen;
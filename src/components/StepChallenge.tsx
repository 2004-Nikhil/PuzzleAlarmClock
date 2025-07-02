import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Pedometer from 'react-native-pedometer';

interface StepChallengeProps {
  requiredSteps: number;
  onChallengeComplete: () => void;
}

const StepChallenge = ({ requiredSteps, onChallengeComplete }: StepChallengeProps) => {
  const [currentSteps, setCurrentSteps] = useState(0);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<string | null>(null);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    
    const startPedometer = async () => {
      try {
        const isAvailable = await Pedometer.isAvailable();
        setIsPedometerAvailable(String(isAvailable));

        if (isAvailable) {
          subscription = Pedometer.startPedometerUpdates(pedometerData => {
            // The step count resets each day, so we track the session's steps
            setCurrentSteps(prevSteps => prevSteps + 1);
          });
        }
      } catch (error) {
        setIsPedometerAvailable("Could not get status: " + error);
      }
    };

    startPedometer();

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (currentSteps >= requiredSteps) {
      onChallengeComplete();
    }
  }, [currentSteps, requiredSteps, onChallengeComplete]);

  if (!isPedometerAvailable) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Walk to Dismiss</Text>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{currentSteps}</Text>
        <Text style={styles.requiredText}>/ {requiredSteps} steps</Text>
      </View>
      <Text style={styles.instructions}>
        Start walking. The alarm will stop once you reach the goal.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
  },
  requiredText: {
    fontSize: 30,
    color: '#fff',
    marginLeft: 10,
  },
  instructions: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

export default StepChallenge;
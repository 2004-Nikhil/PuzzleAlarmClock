import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, Linking, Platform } from 'react-native';
import Pedometer from 'react-native-pedometer';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface StepChallengeProps {
  requiredSteps: number;
  onChallengeComplete: () => void;
}

const StepChallenge = ({ requiredSteps, onChallengeComplete }: StepChallengeProps) => {
  const [currentSteps, setCurrentSteps] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [initialSteps, setInitialSteps] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<{ remove: () => void } | null>(null);

  const startPedometer = useCallback(() => {
    console.log("Starting pedometer...");
    
    Pedometer.isAvailable()
      .then(isAvailable => {
        console.log("Pedometer available:", isAvailable);
        if (isAvailable) {
          // Get initial step count from today
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const now = new Date();
          
          // Get step count from start of day to establish baseline
          Pedometer.getStepCount({ startDate: startOfDay, endDate: now })
            .then(data => {
              console.log("Initial step count:", data.steps);
              setInitialSteps(data.steps);
              setCurrentSteps(0); // Reset challenge steps to 0
              
              // Start listening for updates
              const pedometerSubscription = Pedometer.startPedometerUpdates(pedometerData => {
                console.log("Pedometer update:", pedometerData);
                if (initialSteps !== null) {
                  // Calculate steps taken since challenge started
                  const stepsSinceStart = pedometerData.steps - initialSteps;
                  setCurrentSteps(Math.max(0, stepsSinceStart));
                }
              });
              
              setSubscription(pedometerSubscription);
            })
            .catch(error => {
              console.error("Error getting initial step count:", error);
              // Fallback: start with 0 and count relative steps
              setInitialSteps(0);
              setCurrentSteps(0);
              
              const pedometerSubscription = Pedometer.startPedometerUpdates(pedometerData => {
                console.log("Pedometer update (fallback):", pedometerData);
                // In fallback mode, just count each update as progress
                setCurrentSteps(prev => prev + 1);
              });
              
              setSubscription(pedometerSubscription);
            });
        } else {
          console.log("Pedometer not available");
          setPermissionStatus('unavailable');
        }
      })
      .catch(error => {
        console.error("Pedometer availability check failed:", error);
        setPermissionStatus(`Pedometer error: ${error}`);
      });
  }, [initialSteps]);

  const requestActivityPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      console.log("Not Android, setting permission to granted");
      setPermissionStatus(RESULTS.GRANTED);
      startPedometer();
      return;
    }

    try {
      const result = await request(PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION);
      console.log("Permission result:", result);
      setPermissionStatus(result);
      if (result === RESULTS.GRANTED) {
        console.log("Activity permission granted.");
        startPedometer();
      } else {
        console.log("Activity permission denied:", result);
      }
    } catch (error) {
      console.error("Error requesting activity permission:", error);
      setPermissionStatus('unavailable');
    }
  }, [startPedometer]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      console.log("Cleaning up pedometer subscription");
      if (subscription) {
        subscription.remove();
      }
    };
  }, [subscription]);
  
  useEffect(() => {
    requestActivityPermission();
  }, [requestActivityPermission]);

  useEffect(() => {
    console.log(`Current steps: ${currentSteps}, Required: ${requiredSteps}`);
    if (currentSteps >= requiredSteps && currentSteps > 0) {
      console.log("Challenge completed!");
      onChallengeComplete();
    }
  }, [currentSteps, requiredSteps, onChallengeComplete]);

  // Debug button for testing (remove in production)
  const addTestSteps = () => {
    setCurrentSteps(prev => prev + 5);
  };

  // UI for handling permissions
  if (permissionStatus !== RESULTS.GRANTED && permissionStatus !== 'granted') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Permission Required</Text>
        <Text style={styles.instructions}>
          This challenge needs permission to access your physical activity to count your steps.
        </Text>
        <Text style={styles.debugText}>Status: {permissionStatus}</Text>
        {permissionStatus === RESULTS.BLOCKED ? (
          <Button title="Open Settings" onPress={() => Linking.openSettings()} />
        ) : (
          <Button title="Grant Permission" onPress={requestActivityPermission} />
        )}
      </View>
    );
  }

  // Main UI when permission is granted
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
      
      {/* Debug section - remove in production */}
      <View style={styles.debugSection}>
        <Button title="Add 5 Test Steps" onPress={addTestSteps} />
        <Text style={styles.debugText}>
          Permission: {permissionStatus}
        </Text>
        <Text style={styles.debugText}>
          Initial Steps: {initialSteps}
        </Text>
      </View>
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
    marginBottom: 20,
  },
  debugSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
  },
  debugText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
});

export default StepChallenge;
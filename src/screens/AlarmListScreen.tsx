// src/screens/AlarmListScreen.tsx
import React from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type AlarmListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AlarmList'>;

const AlarmListScreen = () => {
  const navigation = useNavigation<AlarmListNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.placeholderText}>Your alarms will show up here.</Text>
        {/* We will replace this with a FlatList later */}
      </View>
      <Button
        title="Add New Alarm"
        onPress={() => navigation.navigate('EditAlarm', {})} // Pass empty object for new alarm
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 50,
  },
});

export default AlarmListScreen;
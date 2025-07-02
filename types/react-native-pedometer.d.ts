declare module 'react-native-pedometer' {

  // This defines the shape of the data object returned by the pedometer
  export interface PedometerData {
    /** The number of steps taken between the given dates. */
    steps: number;
    /** The distance in meters traveled between the given dates. */
    distance?: number;
    /** The start date of the measurement. */
    startDate: string;
    /** The end date of the measurement. */
    endDate: string;
  }
  
  // This defines the shape of the subscription object returned when listening for updates
  export interface Subscription {
    /** A function to remove the subscription. */
    remove: () => void;
  }

  // This defines the shape of the Pedometer default export
  interface PedometerAPI {
    /**
     * Determines if the pedometer is available on the device.
     * @returns A promise that resolves with a boolean.
     */
    isAvailable(): Promise<boolean>;

    /**
     * Starts listening for pedometer updates.
     * @param callback A function that is called with new pedometer data.
     * @returns A subscription object that can be used to stop listening.
     */
    startPedometerUpdates(callback: (data: PedometerData) => void): Subscription;

    /**
     * Retrieves the step count between two dates.
     * @param options An object with startDate and endDate.
     * @returns A promise that resolves with the pedometer data.
     */
    getStepCount(options: { startDate: Date; endDate: Date }): Promise<PedometerData>;
  }
  
  const Pedometer: PedometerAPI;
  
  export default Pedometer;
}
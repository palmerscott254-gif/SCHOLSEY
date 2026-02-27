import BackgroundGeolocation from 'react-native-background-geolocation';
import { store } from '../store';
import { updateLocation, addToOfflineQueue } from '../store/slices/locationSlice';
import ApiService from './ApiService';
import EncryptedStorage from 'react-native-encrypted-storage';

export class LocationService {
  private static isInitialized = false;

  static async initialize() {
    if (this.isInitialized) return;

    // Configure background geolocation
    await BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10, // meters
      stopTimeout: 5,
      debug: false,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      
      // Activity recognition
      activityRecognitionInterval: 10000,
      stopDetectionDelay: 5,
      
      // HTTP / SQLite config
      url: '', // We'll handle uploading manually
      autoSync: false,
      maxDaysToPersist: 7,
    });

    // Listen to location updates
    BackgroundGeolocation.onLocation(
      async (location) => {
        console.log('[LOCATION]', location);

        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          speed: location.coords.speed,
          heading: location.coords.heading,
          activity: location.activity.type,
          batteryLevel: location.battery.level * 100,
          recordedAt: location.timestamp,
        };

        // Update Redux store
        store.dispatch(updateLocation({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          timestamp: locationData.recordedAt,
        }));

        // Try to send to server
        try {
          await ApiService.updateLocation(locationData);
        } catch (error) {
          console.error('Failed to send location, adding to offline queue', error);
          // Store in offline queue
          store.dispatch(addToOfflineQueue(locationData));
          await this.saveToLocalStorage(locationData);
        }
      },
      (error) => {
        console.error('[LOCATION ERROR]', error);
      }
    );

    // Listen to connectivity changes
    BackgroundGeolocation.onConnectivityChange((event) => {
      console.log('[CONNECTIVITY]', event);
      if (event.connected) {
        this.syncOfflineLocations();
      }
    });

    this.isInitialized = true;
  }

  static async start() {
    const state = await BackgroundGeolocation.start();
    console.log('[START] success:', state);
    return state;
  }

  static async stop() {
    const state = await BackgroundGeolocation.stop();
    console.log('[STOP] success:', state);
    return state;
  }

  static async getCurrentPosition() {
    return BackgroundGeolocation.getCurrentPosition({
      timeout: 30,
      maximumAge: 5000,
      persist: true,
    });
  }

  private static async saveToLocalStorage(location: any) {
    try {
      const stored = await EncryptedStorage.getItem('offline_locations');
      const locations = stored ? JSON.parse(stored) : [];
      locations.push(location);
      
      // Keep max 1000 offline locations
      if (locations.length > 1000) {
        locations.splice(0, locations.length - 1000);
      }
      
      await EncryptedStorage.setItem('offline_locations', JSON.stringify(locations));
    } catch (error) {
      console.error('Failed to save location to local storage', error);
    }
  }

  static async syncOfflineLocations() {
    try {
      const stored = await EncryptedStorage.getItem('offline_locations');
      if (!stored) return;

      const locations = JSON.parse(stored);
      if (locations.length === 0) return;

      console.log(`Syncing ${locations.length} offline locations...`);

      // Send in batches of 50
      const batchSize = 50;
      for (let i = 0; i < locations.length; i += batchSize) {
        const batch = locations.slice(i, i + batchSize);
        await ApiService.batchUpdateLocation(batch);
      }

      // Clear offline storage after successful sync
      await EncryptedStorage.removeItem('offline_locations');
      console.log('Offline locations synced successfully');
    } catch (error) {
      console.error('Failed to sync offline locations', error);
    }
  }
}

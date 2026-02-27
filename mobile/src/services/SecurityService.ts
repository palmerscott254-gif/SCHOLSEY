import { Platform, Alert, Vibration } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Camera } from 'react-native-vision-camera';
import { accelerometer } from 'react-native-sensors';
import { store } from '../store';
import { addSecurityEvent, incrementFailedLogin } from '../store/slices/securitySlice';
import ApiService from './ApiService';
import { LocationService } from './LocationService';

export class SecurityService {
  private static motionThreshold = 2.5; // m/s²
  private static failedLoginThreshold = 3;
  private static isMonitoring = false;
  private static motionSubscription: any = null;

  static async initialize() {
    if (this.isMonitoring) return;

    this.startSecurityMonitoring();
    this.checkRootJailbreak();
    
    this.isMonitoring = true;
  }

  static async startSecurityMonitoring() {
    // Monitor motion/acceleration for unusual patterns
    this.motionSubscription = accelerometer.subscribe(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      
      if (magnitude > this.motionThreshold) {
        this.handleUnusualMotion(magnitude);
      }
    });
  }

  static stopSecurityMonitoring() {
    if (this.motionSubscription) {
      this.motionSubscription.unsubscribe();
      this.motionSubscription = null;
    }
    this.isMonitoring = false;
  }

  static async handleFailedLogin() {
    const state = store.getState();
    const currentAttempts = state.security.failedLoginAttempts + 1;

    store.dispatch(incrementFailedLogin());

    if (currentAttempts >= this.failedLoginThreshold) {
      console.log(`[SECURITY] ${currentAttempts} failed login attempts detected!`);
      
      // Capture photo silently
      const photoUri = await this.captureSilentPhoto();
      
      // Get current location
      const location = await LocationService.getCurrentPosition();
      
      // Report security event
      await this.reportSecurityEvent({
        eventType: 'failed_login',
        severity: 'high',
        description: `${currentAttempts} failed login attempts detected`,
        metadata: {
          attemptCount: currentAttempts,
          time: new Date().toISOString(),
        },
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        photoUri,
      });

      // Alert the user (unless in stealth mode)
      const deviceState = store.getState().device;
      if (!deviceState.settings.stealthMode) {
        Alert.alert(
          'Security Alert',
          'Multiple failed login attempts detected. Alert sent to dashboard.',
          [{ text: 'OK' }]
        );
      }
    }
  }

  static async handleSIMRemoval() {
    console.log('[SECURITY] SIM card removed!');
    
    const location = await LocationService.getCurrentPosition();
    
    await this.reportSecurityEvent({
      eventType: 'sim_removed',
      severity: 'critical',
      description: 'SIM card has been removed from device',
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    store.dispatch(addSecurityEvent({
      type: 'sim_removed',
      severity: 'critical',
      data: { timestamp: new Date().toISOString() },
    }));
  }

  static async handleAirplaneModeEnabled() {
    console.log('[SECURITY] Airplane mode enabled!');
    
    const location = await LocationService.getCurrentPosition();
    
    await this.reportSecurityEvent({
      eventType: 'airplane_mode',
      severity: 'high',
      description: 'Airplane mode has been enabled',
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    store.dispatch(addSecurityEvent({
      type: 'airplane_mode',
      severity: 'high',
      data: { timestamp: new Date().toISOString() },
    }));
  }

  static async handleUnusualMotion(magnitude: number) {
    console.log(`[SECURITY] Unusual motion detected: ${magnitude}`);
    
    // Debounce: only report once per minute
    const state = store.getState();
    const lastCheck = state.security.lastSecurityCheck;
    if (lastCheck) {
      const timeSinceLastCheck = Date.now() - new Date(lastCheck).getTime();
      if (timeSinceLastCheck < 60000) return; // Less than 1 minute
    }

    store.dispatch(addSecurityEvent({
      type: 'unusual_motion',
      severity: 'medium',
      data: { magnitude, timestamp: new Date().toISOString() },
    }));
  }

  static async handleEmergencyVoiceTrigger(phrase: string) {
    console.log('[SECURITY] Emergency voice phrase detected!');
    
    // Trigger alarm and location sharing
    Vibration.vibrate([500, 200, 500]);
    
    const location = await LocationService.getCurrentPosition();
    const photoUri = await this.captureSilentPhoto();
    
    await this.reportSecurityEvent({
      eventType: 'emergency_trigger',
      severity: 'critical',
      description: 'Emergency voice phrase activated',
      metadata: {
        phrase,
        timestamp: new Date().toISOString(),
      },
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      photoUri,
    });

    store.dispatch(addSecurityEvent({
      type: 'emergency_trigger',
      severity: 'critical',
      data: { phrase, timestamp: new Date().toISOString() },
    }));
  }

  private static async captureSilentPhoto(): Promise<string | null> {
    try {
      const cameraPermission = await Camera.requestCameraPermission();
      if (cameraPermission !== 'granted') {
        console.error('[SECURITY] Camera permission denied');
        return null;
      }

      const devices = await Camera.getAvailableCameraDevices();
      const frontCamera = devices.find(d => d.position === 'front');
      
      if (!frontCamera) {
        console.error('[SECURITY] Front camera not found');
        return null;
      }

      // TODO: Implement actual photo capture
      // This would require creating a camera component
      // For now, return a placeholder
      console.log('[SECURITY] Photo capture initiated...');
      return 'photo-uri-placeholder';
    } catch (error) {
      console.error('[SECURITY] Failed to capture photo:', error);
      return null;
    }
  }

  private static async checkRootJailbreak() {
    const isRooted = await DeviceInfo.isRooted();
    
    if (isRooted) {
      console.log('[SECURITY] Device is rooted/jailbroken!');
      
      store.dispatch(addSecurityEvent({
        type: 'root_detected',
        severity: 'critical',
        data: { timestamp: new Date().toISOString() },
      }));

      await this.reportSecurityEvent({
        eventType: 'root_detected',
        severity: 'critical',
        description: 'Device root/jailbreak detected',
      });
    }
  }

  private static async reportSecurityEvent(event: any) {
    try {
      await ApiService.reportSecurityEvent(event);
      console.log('[SECURITY] Event reported successfully');
    } catch (error) {
      console.error('[SECURITY] Failed to report event:', error);
      // Store locally for later sync
    }
  }

  static enableDecoyMode() {
    console.log('[SECURITY] Decoy mode enabled');
    // Show fake UI to mislead thief
    // This would be implemented in the UI layer
  }
}

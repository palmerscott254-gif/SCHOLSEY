import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class DevicesService {
  private readonly DEVICE_LIMITS = {
    free: 2,
    basic: 5,
    premium: 15,
    enterprise: 100,
  };

  private readonly PAIRING_CODE_LENGTH = 6;
  private readonly PAIRING_CODE_EXPIRY_MINUTES = 5;
  private readonly MAX_PAIRING_ATTEMPTS = 5;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  /**
   * Initiate device pairing process
   * Step 1: Device sends registration request with device info
   */
  async pairDevice(userId: string, data: {
    deviceName: string;
    deviceType: 'android' | 'ios';
    osVersion: string;
    appVersion: string;
    deviceModel: string;
    deviceUuid: string;
    publicKey: string;
  }) {
    // Enforce device limits based on subscription tier
    await this.enforceDeviceLimit(userId);

    // Check if device already paired to this user
    const existingOwned = await this.prisma.device.findFirst({
      where: {
        deviceUuid: data.deviceUuid,
        userId,
        deletedAt: null,
      },
    });

    if (existingOwned) {
      // Device re-pairing - allow update but keep existing data
      return this.repairDevice(existingOwned.id, data);
    }

    // Check if device is paired to another user
    const existingOther = await this.prisma.device.findFirst({
      where: {
        deviceUuid: data.deviceUuid,
        deletedAt: null,
      },
    });

    if (existingOther) {
      throw new BadRequestException(
        'Device already paired to another account. Please unpair it first.'
      );
    }

    // Validate device data
    this.validateDeviceData(data);

    // Generate secure pairing code
    const pairingCode = this.generatePairingCode();
    const pairingCodeHash = await this.hashPairingCode(pairingCode);

    // Create device record
    const device = await this.prisma.device.create({
      data: {
        userId,
        deviceName: data.deviceName,
        deviceType: data.deviceType,
        osVersion: data.osVersion,
        appVersion: data.appVersion,
        deviceModel: data.deviceModel,
        deviceUuid: data.deviceUuid,
        publicKey: data.publicKey,
        pairingCode: pairingCodeHash,
        pairingExpiresAt: new Date(
          Date.now() + this.PAIRING_CODE_EXPIRY_MINUTES * 60 * 1000
        ),
        isActive: false, // Not active until code verified
      },
    });

    // Initialize device status
    await this.prisma.deviceStatus.create({
      data: {
        deviceId: device.id,
        isOnline: false,
      },
    });

    // Store pairing attempt tracking in Redis
    await this.redisService.set(
      `pairing:attempts:${device.id}`,
      '0',
      this.PAIRING_CODE_EXPIRY_MINUTES * 60
    );

    // Log pairing initiation
    await this.logDeviceEvent(userId, device.id, 'PAIRING_INITIATED');

    return {
      deviceId: device.id,
      pairingCode, // Return plain code to display to user
      expiresAt: device.pairingExpiresAt,
      expiresIn: this.PAIRING_CODE_EXPIRY_MINUTES * 60, // seconds
      message: 'Device pairing initiated. Enter the pairing code on your device to complete setup.',
      instructions: [
        'Open the app on your device',
        `Enter the 6-digit code: ${pairingCode}`,
        `Code expires in ${this.PAIRING_CODE_EXPIRY_MINUTES} minutes`,
      ],
    };
  }

  /**
   * Verify pairing code and activate device
   * Step 2: Mobile app submits pairing code for verification
   */
  async verifyPairingCode(deviceId: string, pairingCode: string) {
    // Check rate limiting
    await this.checkPairingRateLimit(deviceId);

    const device = await this.prisma.device.findUnique({
      where: { id: deviceId, deletedAt: null },
      include: { user: true },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Check if already verified
    if (device.isActive && device.pairedAt) {
      return {
        success: true,
        verified: true,
        message: 'Device already verified and active',
        deviceId: device.id,
        userId: device.userId,
      };
    }

    // Check expiry
    if (device.pairingExpiresAt && device.pairingExpiresAt < new Date()) {
      throw new BadRequestException(
        'Pairing code expired. Please initiate pairing again.'
      );
    }

    // Verify code
    const isValid = await this.verifyPairingCodeHash(
      pairingCode,
      device.pairingCode
    );

    if (!isValid) {
      await this.incrementPairingAttempts(deviceId);
      throw new BadRequestException('Invalid pairing code');
    }

    // Activate device
    await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        isActive: true,
        pairedAt: new Date(),
        pairingCode: null, // Clear code after successful verification
        pairingExpiresAt: null,
      },
    });

    // Update device status to online
    await this.prisma.deviceStatus.update({
      where: { deviceId },
      data: {
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });

    // Clear rate limiting
    await this.redisService.del(`pairing:attempts:${deviceId}`);

    // Log successful pairing
    await this.logDeviceEvent(device.userId, deviceId, 'PAIRING_COMPLETED');

    // Create notification/alert
    await this.prisma.alert.create({
      data: {
        userId: device.userId,
        deviceId: device.id,
        alertType: 'device_paired',
        priority: 'info',
        title: 'New Device Paired',
        message: `${device.deviceName} (${device.deviceModel}) has been successfully paired to your account.`,
      },
    });

    return {
      success: true,
      verified: true,
      message: 'Device paired successfully',
      deviceId: device.id,
      userId: device.userId,
      deviceName: device.deviceName,
      user: {
        email: device.user.email,
        firstName: device.user.firstName,
        lastName: device.user.lastName,
      },
    };
  }

  /**
   * Handle device re-pairing scenario
   */
  private async repairDevice(deviceId: string, data: any) {
    // Generate new pairing code for verification
    const pairingCode = this.generatePairingCode();
    const pairingCodeHash = await this.hashPairingCode(pairingCode);

    // Update device with new info
    await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        deviceName: data.deviceName,
        osVersion: data.osVersion,
        appVersion: data.appVersion,
        deviceModel: data.deviceModel,
        publicKey: data.publicKey,
        pairingCode: pairingCodeHash,
        pairingExpiresAt: new Date(
          Date.now() + this.PAIRING_CODE_EXPIRY_MINUTES * 60 * 1000
        ),
        isActive: false,
      },
    });

    return {
      deviceId,
      pairingCode,
      expiresAt: new Date(Date.now() + this.PAIRING_CODE_EXPIRY_MINUTES * 60 * 1000),
      expiresIn: this.PAIRING_CODE_EXPIRY_MINUTES * 60,
      message: 'Device re-pairing initiated. Enter the new pairing code.',
    };
  }

  /**
   * Enforce device limits based on subscription tier
   */
  private async enforceDeviceLimit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        devices: {
          where: { deletedAt: null, isActive: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tier = user.subscriptionTier || 'free';
    const limit = this.DEVICE_LIMITS[tier] || this.DEVICE_LIMITS.free;

    if (user.devices.length >= limit) {
      throw new ForbiddenException(
        `Device limit reached. Your ${tier} plan allows up to ${limit} device(s). ` +
        'Please upgrade your subscription or unpair an existing device.'
      );
    }
  }

  /**
   * Validate device data before pairing
   */
  private validateDeviceData(data: any) {
    // Check app version compatibility
    const minVersion = '1.0.0';
    if (data.appVersion && this.compareVersions(data.appVersion, minVersion) < 0) {
      throw new BadRequestException(
        `App version ${data.appVersion} is outdated. Minimum required: ${minVersion}`
      );
    }

    // Validate device UUID format
    if (!/^[a-fA-F0-9-]{20,}$/.test(data.deviceUuid)) {
      throw new BadRequestException('Invalid device UUID format');
    }

    // Validate public key
    if (!data.publicKey || data.publicKey.length < 100) {
      throw new BadRequestException('Invalid public key');
    }
  }

  /**
   * Generate secure random pairing code
   */
  private generatePairingCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars
    let code = '';
    const bytes = crypto.randomBytes(this.PAIRING_CODE_LENGTH);
    
    for (let i = 0; i < this.PAIRING_CODE_LENGTH; i++) {
      code += characters[bytes[i] % characters.length];
    }
    
    return code;
  }

  /**
   * Hash pairing code for secure storage
   */
  private async hashPairingCode(code: string): Promise<string> {
    return crypto
      .createHash('sha256')
      .update(code + process.env.PAIRING_CODE_SALT || 'default-salt')
      .digest('hex');
  }

  /**
   * Verify pairing code against stored hash
   */
  private async verifyPairingCodeHash(
    code: string,
    hash: string
  ): Promise<boolean> {
    const computedHash = await this.hashPairingCode(code);
    return computedHash === hash;
  }

  /**
   * Check and enforce rate limiting on pairing attempts
   */
  private async checkPairingRateLimit(deviceId: string) {
    const key = `pairing:attempts:${deviceId}`;
    const attempts = parseInt((await this.redisService.get(key)) || '0');

    if (attempts >= this.MAX_PAIRING_ATTEMPTS) {
      throw new ForbiddenException(
        'Too many pairing attempts. Please initiate pairing again.'
      );
    }
  }

  /**
   * Increment pairing attempt counter
   */
  private async incrementPairingAttempts(deviceId: string) {
    const key = `pairing:attempts:${deviceId}`;
    const attempts = parseInt((await this.redisService.get(key)) || '0');
    await this.redisService.set(
      key,
      (attempts + 1).toString(),
      this.PAIRING_CODE_EXPIRY_MINUTES * 60
    );
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  /**
   * Log device-related events for audit trail
   */
  private async logDeviceEvent(
    userId: string,
    deviceId: string,
    eventType: string
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          deviceId,
          action: eventType,
        },
      });
    } catch (error) {
      console.error('Failed to log device event:', error);
    }
  }

  async getUserDevices(userId: string, includeInactive: boolean = false) {
    const devices = await this.prisma.device.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      devices: devices.map(device => ({
        id: device.id,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        osVersion: device.osVersion,
        deviceModel: device.deviceModel,
        isActive: device.isActive,
        isTrackingEnabled: device.isTrackingEnabled,
        stealthMode: device.stealthMode,
        pairedAt: device.pairedAt,
        status: device.status ? {
          isOnline: device.status.isOnline,
          lastSeenAt: device.status.lastSeenAt,
          batteryLevel: device.status.batteryLevel,
          isCharging: device.status.isCharging,
          networkType: device.status.networkType,
          currentLocation: device.status.currentLatitude && device.status.currentLongitude ? {
            latitude: device.status.currentLatitude,
            longitude: device.status.currentLongitude,
            updatedAt: device.status.locationUpdatedAt,
          } : null,
        } : null,
      })),
      total: devices.length,
    };
  }

  async getDeviceById(deviceId: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        userId,
        deletedAt: null,
      },
      include: {
        status: true,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return {
      id: device.id,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      osVersion: device.osVersion,
      appVersion: device.appVersion,
      deviceModel: device.deviceModel,
      isActive: device.isActive,
      isTrackingEnabled: device.isTrackingEnabled,
      stealthMode: device.stealthMode,
      pairedAt: device.pairedAt,
      createdAt: device.createdAt,
      settings: device.settings,
      status: device.status ? {
        isOnline: device.status.isOnline,
        lastSeenAt: device.status.lastSeenAt,
        batteryLevel: device.status.batteryLevel,
        isCharging: device.status.isCharging,
        networkType: device.status.networkType,
        simStatus: device.status.simStatus,
        airplaneMode: device.status.airplaneMode,
        isRootedJailbroken: device.status.isRootedJailbroken,
        currentLocation: device.status.currentLatitude && device.status.currentLongitude ? {
          latitude: device.status.currentLatitude,
          longitude: device.status.currentLongitude,
          accuracy: device.status.currentAccuracy,
          updatedAt: device.status.locationUpdatedAt,
        } : null,
      } : null,
    };
  }

  async updateDevice(deviceId: string, userId: string, data: Partial<{
    deviceName: string;
    isTrackingEnabled: boolean;
    stealthMode: boolean;
    settings: any;
  }>) {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId, deletedAt: null },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return this.prisma.device.update({
      where: { id: deviceId },
      data,
    });
  }

  async deleteDevice(deviceId: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId, deletedAt: null },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.prisma.device.update({
      where: { id: deviceId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Device unpaired successfully' };
  }

  async updateDeviceStatus(deviceId: string, status: Partial<{
    isOnline: boolean;
    batteryLevel: number;
    isCharging: boolean;
    networkType: string;
    simStatus: string;
    airplaneMode: boolean;
    isRootedJailbroken: boolean;
  }>) {
    return this.prisma.deviceStatus.update({
      where: { deviceId },
      data: {
        ...status,
        updatedAt: new Date(),
      },
    });
  }
}

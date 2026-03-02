import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DevicesService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async pairDevice(userId: string, data: {
    deviceName: string;
    deviceType: 'android' | 'ios';
    osVersion: string;
    appVersion: string;
    deviceModel: string;
    deviceUuid: string;
    publicKey: string;
  }) {
    // Check if device already paired
    const existing = await this.prisma.device.findFirst({
      where: {
        deviceUuid: data.deviceUuid,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Device already paired');
    }

    // Generate pairing code
    const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

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
        pairingCode,
        pairingExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        pairedAt: new Date(),
      },
    });

    // Initialize device status
    await this.prisma.deviceStatus.create({
      data: {
        deviceId: device.id,
      },
    });

    return {
      deviceId: device.id,
      pairingCode,
      expiresAt: device.pairingExpiresAt,
      // Note: Public key from device is stored; implement full TLS/SSL verification in production
      // The device must verify the server certificate presented here
      publicKeyReceived: true,
      message: 'Device pairing initiated. Use pairingCode for verification.',
    };
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

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TrackingService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async updateLocation(deviceId: string, data: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    activity?: string;
    batteryLevel?: number;
    recordedAt: Date;
  }) {
    // Update device status with current location
    await this.prisma.deviceStatus.update({
      where: { deviceId },
      data: {
        currentLatitude: data.latitude,
        currentLongitude: data.longitude,
        currentAccuracy: data.accuracy,
        locationUpdatedAt: data.recordedAt,
        batteryLevel: data.batteryLevel,
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });

    // Store in location history
    const location = await this.prisma.locationHistory.create({
      data: {
        deviceId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        altitude: data.altitude,
        speed: data.speed,
        heading: data.heading,
        activity: data.activity,
        batteryLevel: data.batteryLevel,
        recordedAt: data.recordedAt,
      },
    });

    // Publish to Redis for real-time updates
    await this.redisService.publish(`device:${deviceId}:location`, {
      deviceId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      batteryLevel: data.batteryLevel,
      timestamp: data.recordedAt,
    });

    return { success: true, locationId: location.id };
  }

  async batchUpdateLocations(deviceId: string, locations: Array<{
    latitude: number;
    longitude: number;
    accuracy: number;
    recordedAt: Date;
  }>) {
    const created = await this.prisma.locationHistory.createMany({
      data: locations.map(loc => ({
        deviceId,
        ...loc,
      })),
    });

    // Update device status with latest location
    const latest = locations.sort((a, b) => 
      b.recordedAt.getTime() - a.recordedAt.getTime()
    )[0];

    if (latest) {
      await this.prisma.deviceStatus.update({
        where: { deviceId },
        data: {
          currentLatitude: latest.latitude,
          currentLongitude: latest.longitude,
          currentAccuracy: latest.accuracy,
          locationUpdatedAt: latest.recordedAt,
          lastSeenAt: new Date(),
        },
      });
    }

    return {
      success: true,
      processed: locations.length,
      failed: 0,
    };
  }

  async getLocationHistory(
    deviceId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 1000,
    offset: number = 0,
  ) {
    const [locations, total] = await Promise.all([
      this.prisma.locationHistory.findMany({
        where: {
          deviceId,
          recordedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          recordedAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.locationHistory.count({
        where: {
          deviceId,
          recordedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    return {
      locations,
      total,
      hasMore: total > (offset + limit),
    };
  }

  async getCurrentLocation(deviceId: string) {
    const status = await this.prisma.deviceStatus.findUnique({
      where: { deviceId },
    });

    if (!status || !status.currentLatitude || !status.currentLongitude) {
      return null;
    }

    return {
      deviceId,
      latitude: status.currentLatitude,
      longitude: status.currentLongitude,
      accuracy: status.currentAccuracy,
      updatedAt: status.locationUpdatedAt,
      batteryLevel: status.batteryLevel,
      isOnline: status.isOnline,
    };
  }
}

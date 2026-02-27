import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  async reportEvent(
    deviceId: string,
    eventType: string,
    metadata: any,
    userId: string,
  ) {
    // Verify device ownership
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new Error('Device not found or access denied');
    }

    // Create security event
    const event = await this.prisma.securityEvent.create({
      data: {
        deviceId,
        eventType,
        severity: 'MEDIUM',
        description: `Security event: ${eventType}`,
      },
    });

    // Check if we need to create an alert based on event type
    const highSeverityEvents = [
      'FAILED_LOGIN_ATTEMPT',
      'SIM_CARD_REMOVED',
      'DEVICE_TAMPER',
      'UNAUTHORIZED_ACCESS',
    ];

    if (highSeverityEvents.includes(eventType)) {
      await this.prisma.alert.create({
        data: {
          userId,
          deviceId,
          alertType: eventType,
          priority: 'HIGH',
          title: this.getAlertTitle(eventType),
          message: this.getAlertMessage(eventType, metadata),
        },
      });
    }

    return {
      success: true,
      eventId: event.id,
    };
  }

  async getEvents(userId: string, filters: {
    deviceId?: string;
    eventType?: string;
    limit?: number;
  }) {
    const where: any = {
      device: {
        userId,
      },
    };

    if (filters.deviceId) {
      where.deviceId = filters.deviceId;
    }

    if (filters.eventType) {
      where.eventType = filters.eventType;
    }

    const events = await this.prisma.securityEvent.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      take: filters.limit || 50,
      include: {
        device: {
          select: {
            id: true,
            deviceName: true,
            deviceType: true,
          },
        },
      },
    });

    return {
      success: true,
      events,
      total: events.length,
    };
  }

  private getAlertTitle(eventType: string): string {
    const titles = {
      FAILED_LOGIN_ATTEMPT: 'Failed Login Attempts Detected',
      SIM_CARD_REMOVED: 'SIM Card Removed',
      DEVICE_TAMPER: 'Device Tampering Detected',
      UNAUTHORIZED_ACCESS: 'Unauthorized Access Attempt',
    };
    return titles[eventType] || 'Security Event';
  }

  private getAlertMessage(eventType: string, metadata: any): string {
    const messages = {
      FAILED_LOGIN_ATTEMPT: `Multiple failed login attempts detected (${metadata?.attempts || 'unknown'} attempts)`,
      SIM_CARD_REMOVED: 'The SIM card has been removed from the device',
      DEVICE_TAMPER: 'Suspicious device activity detected',
      UNAUTHORIZED_ACCESS: 'Unauthorized access attempt detected',
    };
    return messages[eventType] || 'A security event has been detected';
  }
}

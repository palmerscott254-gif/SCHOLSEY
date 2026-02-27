import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async getAlerts(userId: string, filters: {
    deviceId?: string;
    status?: string;
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

    if (filters.status) {
      if (filters.status === 'ACTIVE') {
        where.isRead = false;
        where.dismissed = false;
      } else if (filters.status === 'READ') {
        where.isRead = true;
      } else if (filters.status === 'DISMISSED') {
        where.dismissed = true;
      }
    }

    const alerts = await this.prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
      alerts,
      total: alerts.length,
    };
  }

  async getAlert(alertId: string, userId: string) {
    const alert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        device: {
          userId,
        },
      },
      include: {
        device: true,
      },
    });

    if (!alert) {
      throw new Error('Alert not found or access denied');
    }

    return {
      success: true,
      alert,
    };
  }

  async acknowledgeAlert(alertId: string, userId: string) {
    const alert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        device: {
          userId,
        },
      },
    });

    if (!alert) {
      throw new Error('Alert not found or access denied');
    }

    const updated = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      alert: updated,
    };
  }

  async dismissAlert(alertId: string, userId: string) {
    const alert = await this.prisma.alert.findFirst({
      where: {
        id: alertId,
        device: {
          userId,
        },
      },
    });

    if (!alert) {
      throw new Error('Alert not found or access denied');
    }

    const updated = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        dismissed: true,
        dismissedAt: new Date(),
      },
    });

    return {
      success: true,
      alert: updated,
    };
  }
}

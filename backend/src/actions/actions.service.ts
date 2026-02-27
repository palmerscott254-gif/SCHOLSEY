import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ActionsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async lockDevice(deviceId: string, userId: string) {
    // Verify device ownership
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new Error('Device not found or access denied');
    }

    // Create action record
    const action = await this.prisma.remoteAction.create({
      data: {
        deviceId,
        initiatedBy: userId,
        actionType: 'LOCK',
        status: 'pending',
      },
    });

    // Publish to Redis for device to receive
    await this.redisService.publish(`device:${deviceId}:action`, {
      actionId: action.id,
      actionType: 'LOCK',
      timestamp: new Date(),
    });

    return { success: true, actionId: action.id, status: 'pending' };
  }

  async triggerAlarm(deviceId: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new Error('Device not found or access denied');
    }

    const action = await this.prisma.remoteAction.create({
      data: {
        deviceId,
        initiatedBy: userId,
        actionType: 'ALARM',
        status: 'pending',
      },
    });

    await this.redisService.publish(`device:${deviceId}:action`, {
      actionId: action.id,
      actionType: 'ALARM',
      timestamp: new Date(),
    });

    return { success: true, actionId: action.id, status: 'pending' };
  }

  async locateDevice(deviceId: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new Error('Device not found or access denied');
    }

    const action = await this.prisma.remoteAction.create({
      data: {
        deviceId,
        initiatedBy: userId,
        actionType: 'LOCATE',
        status: 'pending',
      },
    });

    await this.redisService.publish(`device:${deviceId}:action`, {
      actionId: action.id,
      actionType: 'LOCATE',
      timestamp: new Date(),
    });

    return { success: true, actionId: action.id, status: 'pending' };
  }

  async wipeDevice(deviceId: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new Error('Device not found or access denied');
    }

    const action = await this.prisma.remoteAction.create({
      data: {
        deviceId,
        initiatedBy: userId,
        actionType: 'WIPE',
        status: 'pending',
      },
    });

    await this.redisService.publish(`device:${deviceId}:action`, {
      actionId: action.id,
      actionType: 'WIPE',
      timestamp: new Date(),
    });

    return { success: true, actionId: action.id, status: 'pending' };
  }

  async displayMessage(deviceId: string, message: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new Error('Device not found or access denied');
    }

    const action = await this.prisma.remoteAction.create({
      data: {
        deviceId,
        initiatedBy: userId,
        actionType: 'MESSAGE',
        status: 'pending',
        parameters: { message },
      },
    });

    await this.redisService.publish(`device:${deviceId}:action`, {
      actionId: action.id,
      actionType: 'MESSAGE',
      message,
      timestamp: new Date(),
    });

    return { success: true, actionId: action.id, status: 'pending' };
  }
}

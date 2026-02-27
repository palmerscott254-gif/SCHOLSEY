import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class DeviceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, { userId: string; deviceIds: Set<string> }>();

  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {
    this.initializeRedisSubscriptions();
  }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('auth')
  async handleAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token: string },
  ) {
    try {
      const payload = this.jwtService.verify(data.token);
      this.connectedClients.set(client.id, {
        userId: payload.sub,
        deviceIds: new Set(),
      });
      client.emit('auth_success', { message: 'Authenticated successfully' });
    } catch (error) {
      client.emit('auth_error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  @SubscribeMessage('subscribe_device')
  async handleSubscribeDevice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deviceId: string },
  ) {
    const clientData = this.connectedClients.get(client.id);
    if (!clientData) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    clientData.deviceIds.add(data.deviceId);
    await client.join(`device:${data.deviceId}`);
    client.emit('subscribed', { deviceId: data.deviceId });
  }

  @SubscribeMessage('unsubscribe_device')
  async handleUnsubscribeDevice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deviceId: string },
  ) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      clientData.deviceIds.delete(data.deviceId);
    }

    await client.leave(`device:${data.deviceId}`);
    client.emit('unsubscribed', { deviceId: data.deviceId });
  }

  // Emit location update to all subscribers
  emitLocationUpdate(deviceId: string, location: any) {
    this.server.to(`device:${deviceId}`).emit('location_update', {
      deviceId,
      ...location,
    });
  }

  // Emit security alert
  emitSecurityAlert(deviceId: string, alert: any) {
    this.server.to(`device:${deviceId}`).emit('security_alert', alert);
  }

  // Emit device status change
  emitDeviceStatusChange(deviceId: string, status: any) {
    this.server.to(`device:${deviceId}`).emit('device_status_change', {
      deviceId,
      status,
    });
  }

  // Emit action result
  emitActionResult(deviceId: string, result: any) {
    this.server.to(`device:${deviceId}`).emit('action_result', result);
  }

  private initializeRedisSubscriptions() {
    // Subscribe to location updates
    this.redisService.subscribe('device:*:location', (message) => {
      this.emitLocationUpdate(message.deviceId, message);
    });

    // Subscribe to security alerts
    this.redisService.subscribe('device:*:alert', (message) => {
      this.emitSecurityAlert(message.deviceId, message);
    });

    // Subscribe to status changes
    this.redisService.subscribe('device:*:status', (message) => {
      this.emitDeviceStatusChange(message.deviceId, message);
    });
  }
}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DeviceGateway } from './device.gateway';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    RedisModule,
  ],
  providers: [DeviceGateway],
})
export class GatewayModule {}

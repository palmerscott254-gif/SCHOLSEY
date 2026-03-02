import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { TrackingModule } from './tracking/tracking.module';
import { SecurityModule } from './security/security.module';
import { AlertsModule } from './alerts/alerts.module';
import { ActionsModule } from './actions/actions.module';
import { AiModule } from './ai/ai.module';
import { GatewayModule } from './gateway/gateway.module';

// Controllers
import { AppController } from './app.controller';

const enableBull = process.env.ENABLE_BULL === 'true';
const queueModules = enableBull
  ? [
      BullModule.forRootAsync({
        useFactory: () => ({
          redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
          },
        }),
      }),
    ]
  : [];

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Bull queue (optional in local/dev)
    ...queueModules,

    // Scheduler
    ScheduleModule.forRoot(),

    // Core modules
    PrismaModule,
    RedisModule,

    // Feature modules
    AuthModule,
    UsersModule,
    DevicesModule,
    TrackingModule,
    SecurityModule,
    AlertsModule,
    ActionsModule,
    AiModule,
    GatewayModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

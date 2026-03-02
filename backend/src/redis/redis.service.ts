import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private redisAvailable = false;
  private readonly redisRequired: boolean;

  constructor(private configService: ConfigService) {
    this.redisRequired = this.configService.get('REDIS_REQUIRED', 'false') === 'true';

    const redisConfig = {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (times: number) => {
        if (times > 5) {
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    this.client = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);
  }

  async onModuleInit() {
    this.registerClientEvents(this.client, 'Redis client');
    this.registerClientEvents(this.subscriber, 'Redis subscriber');
    this.registerClientEvents(this.publisher, 'Redis publisher');

    try {
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect(),
      ]);
      this.redisAvailable = true;
      console.log('✅ Redis connected');
    } catch (err) {
      this.redisAvailable = false;
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (this.redisRequired) {
        throw err;
      }
      console.warn(`⚠️ Redis unavailable. Running in degraded mode: ${errorMessage}`);
    }
  }

  async onModuleDestroy() {
    await this.safeQuit(this.client);
    await this.safeQuit(this.subscriber);
    await this.safeQuit(this.publisher);
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  getPublisher(): Redis {
    return this.publisher;
  }

  // Cache helpers
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.redisAvailable) return;
    const stringValue = JSON.stringify(value);
    try {
      if (ttl) {
        await this.client.setex(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      this.handleOperationError('set', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redisAvailable) return null;
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.handleOperationError('get', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redisAvailable) return;
    try {
      await this.client.del(key);
    } catch (error) {
      this.handleOperationError('del', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redisAvailable) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.handleOperationError('exists', error);
      return false;
    }
  }

  // Session management
  async setSession(sessionId: string, data: any, ttl: number): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttl);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Pub/Sub for real-time updates
  async publish(channel: string, message: any): Promise<void> {
    if (!this.redisAvailable) return;
    try {
      await this.publisher.publish(channel, JSON.stringify(message));
    } catch (error) {
      this.handleOperationError('publish', error);
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    if (!this.redisAvailable) return;
    try {
      if (channel.includes('*')) {
        await this.subscriber.psubscribe(channel);
        this.subscriber.on('pmessage', (pattern, ch, msg) => {
          if (pattern === channel) {
            callback(JSON.parse(msg));
          }
        });
      } else {
        await this.subscriber.subscribe(channel);
        this.subscriber.on('message', (ch, msg) => {
          if (ch === channel) {
            callback(JSON.parse(msg));
          }
        });
      }
    } catch (error) {
      this.handleOperationError('subscribe', error);
    }
  }

  // Rate limiting
  async incrementRateLimit(key: string, ttl: number): Promise<number> {
    if (!this.redisAvailable) return 0;
    try {
      const current = await this.client.incr(`ratelimit:${key}`);
      if (current === 1) {
        await this.client.expire(`ratelimit:${key}`, ttl);
      }
      return current;
    } catch (error) {
      this.handleOperationError('incrementRateLimit', error);
      return 0;
    }
  }

  async getRateLimit(key: string): Promise<number> {
    if (!this.redisAvailable) return 0;
    try {
      const count = await this.client.get(`ratelimit:${key}`);
      return count ? parseInt(count) : 0;
    } catch (error) {
      this.handleOperationError('getRateLimit', error);
      return 0;
    }
  }

  private registerClientEvents(redisClient: Redis, label: string) {
    redisClient.on('error', (err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (this.redisRequired) {
        console.error(`❌ ${label} error:`, err);
      } else {
        console.warn(`⚠️ ${label} error: ${errorMessage}`);
      }
    });

    redisClient.on('end', () => {
      this.redisAvailable = false;
    });

    redisClient.on('ready', () => {
      this.redisAvailable = true;
    });
  }

  private handleOperationError(operation: string, error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (this.redisRequired) {
      throw error;
    }
    this.redisAvailable = false;
    console.warn(`⚠️ Redis ${operation} failed, continuing without Redis: ${errorMessage}`);
  }

  private async safeQuit(redisClient: Redis) {
    try {
      if (redisClient.status === 'ready' || redisClient.status === 'connect' || redisClient.status === 'connecting') {
        await redisClient.quit();
      }
    } catch {
      redisClient.disconnect();
    }
  }
}

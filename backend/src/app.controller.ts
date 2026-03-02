import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: 'Device Tracker API',
      version: '1.0.0',
      status: 'running',
      documentation: '/api/docs',
      endpoints: {
        auth: '/v1/auth',
        devices: '/v1/devices',
        tracking: '/v1/tracking',
        security: '/v1/security',
        alerts: '/v1/alerts',
        actions: '/v1/actions',
        ai: '/v1/ai',
        users: '/v1/users',
      },
      message: 'Welcome to Device Tracker API. Visit /api/docs for full documentation.',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SecurityService } from './security.service';

@ApiTags('security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post('events')
  @ApiOperation({ summary: 'Report security event' })
  async reportEvent(
    @Body('deviceId') deviceId: string,
    @Body('eventType') eventType: string,
    @Body('metadata') metadata: any,
    @Req() req: any,
  ) {
    return this.securityService.reportEvent(deviceId, eventType, metadata, req.user.userId);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get security events' })
  @ApiQuery({ name: 'deviceId', required: false })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getEvents(
    @Req() req: any,
    @Query('deviceId') deviceId?: string,
    @Query('eventType') eventType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.securityService.getEvents(req.user.userId, {
      deviceId,
      eventType,
      limit: limit ? parseInt(limit) : 50,
    });
  }
}

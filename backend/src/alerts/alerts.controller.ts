import { Controller, Get, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AlertsService } from './alerts.service';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all alerts for user' })
  @ApiQuery({ name: 'deviceId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAlerts(
    @Req() req: any,
    @Query('deviceId') deviceId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.alertsService.getAlerts(req.user.userId, {
      deviceId,
      status,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  async getAlert(@Param('id') id: string, @Req() req: any) {
    return this.alertsService.getAlert(id, req.user.userId);
  }

  @Patch(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge alert' })
  async acknowledgeAlert(@Param('id') id: string, @Req() req: any) {
    return this.alertsService.acknowledgeAlert(id, req.user.userId);
  }

  @Patch(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss alert' })
  async dismissAlert(@Param('id') id: string, @Req() req: any) {
    return this.alertsService.dismissAlert(id, req.user.userId);
  }
}

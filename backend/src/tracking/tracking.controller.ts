import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrackingService } from './tracking.service';

@ApiTags('tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('location')
  @ApiOperation({ summary: 'Update device location' })
  async updateLocation(
    @Body('deviceId') deviceId: string,
    @Body() data: {
      latitude: number;
      longitude: number;
      accuracy: number;
      altitude?: number;
      speed?: number;
      heading?: number;
      activity?: string;
      batteryLevel?: number;
      recordedAt: string;
    },
    @Req() req: any,
  ) {
    return this.trackingService.updateLocation(deviceId, {
      ...data,
      recordedAt: new Date(data.recordedAt),
    });
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch update device locations' })
  async batchUpdateLocations(
    @Body('deviceId') deviceId: string,
    @Body('locations') locations: Array<{
      latitude: number;
      longitude: number;
      accuracy: number;
      recordedAt: string;
    }>,
    @Req() req: any,
  ) {
    return this.trackingService.batchUpdateLocations(
      deviceId,
      locations.map(loc => ({
        ...loc,
        recordedAt: new Date(loc.recordedAt),
      })),
    );
  }

  @Get(':deviceId/history')
  @ApiOperation({ summary: 'Get location history' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getLocationHistory(
    @Param('deviceId') deviceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const limitNum = limit ? parseInt(limit) : 100;

    return this.trackingService.getLocationHistory(
      deviceId,
      start,
      end,
      limitNum,
      0,
    );
  }

  @Get(':deviceId/current')
  @ApiOperation({ summary: 'Get current device location' })
  async getCurrentLocation(@Param('deviceId') deviceId: string, @Req() req: any) {
    return this.trackingService.getCurrentLocation(deviceId);
  }
}

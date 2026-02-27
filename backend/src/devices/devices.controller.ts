import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Post('pair')
  @ApiOperation({ summary: 'Pair a new device' })
  async pairDevice(
    @Request() req,
    @Body() body: {
      deviceName: string;
      deviceType: 'android' | 'ios';
      osVersion: string;
      appVersion: string;
      deviceModel: string;
      deviceUuid: string;
      publicKey: string;
    },
  ) {
    return this.devicesService.pairDevice(req.user.userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all paired devices' })
  async getDevices(
    @Request() req,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.devicesService.getUserDevices(req.user.userId, includeInactive);
  }

  @Get(':deviceId')
  @ApiOperation({ summary: 'Get device details' })
  async getDevice(@Request() req, @Param('deviceId') deviceId: string) {
    return this.devicesService.getDeviceById(deviceId, req.user.userId);
  }

  @Patch(':deviceId')
  @ApiOperation({ summary: 'Update device settings' })
  async updateDevice(
    @Request() req,
    @Param('deviceId') deviceId: string,
    @Body() body: {
      deviceName?: string;
      isTrackingEnabled?: boolean;
      stealthMode?: boolean;
      settings?: any;
    },
  ) {
    return this.devicesService.updateDevice(deviceId, req.user.userId, body);
  }

  @Delete(':deviceId')
  @ApiOperation({ summary: 'Unpair device' })
  async deleteDevice(@Request() req, @Param('deviceId') deviceId: string) {
    return this.devicesService.deleteDevice(deviceId, req.user.userId);
  }
}

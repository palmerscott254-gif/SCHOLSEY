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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PairDeviceDto, UpdateDeviceDto } from './dto/device.dto';

@ApiTags('devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Post('pair')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Pair a new device' })
  async pairDevice(@Request() req, @Body() pairDeviceDto: PairDeviceDto) {
    return this.devicesService.pairDevice(req.user.userId, pairDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all paired devices' })
  @ApiQuery({ name: 'includeInactive', required: false, type: 'boolean' })
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
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.updateDevice(deviceId, req.user.userId, updateDeviceDto);
  }

  @Delete(':deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unpair device' })
  async deleteDevice(@Request() req, @Param('deviceId') deviceId: string) {
    return this.devicesService.deleteDevice(deviceId, req.user.userId);
  }
}

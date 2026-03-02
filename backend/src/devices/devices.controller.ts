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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PairDeviceDto, UpdateDeviceDto, VerifyPairingCodeDto } from './dto/device.dto';

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Post('pair')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ 
    summary: 'Initiate device pairing',
    description: 'Step 1: Register device and receive pairing code to display to user'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Pairing initiated. Use the returned code for verification.' 
  })
  @ApiResponse({ status: 400, description: 'Invalid device data or device already paired' })
  @ApiResponse({ status: 403, description: 'Device limit reached for subscription tier' })
  async pairDevice(@Request() req, @Body() pairDeviceDto: PairDeviceDto) {
    return this.devicesService.pairDevice(req.user.userId, pairDeviceDto);
  }

  @Post('pair/:deviceId/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({ 
    summary: 'Verify pairing code',
    description: 'Step 2: Mobile app submits the 6-digit pairing code to complete device setup'
  })
  @ApiResponse({ status: 200, description: 'Pairing code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired pairing code' })
  @ApiResponse({ status: 403, description: 'Too many verification attempts' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async verifyPairingCode(
    @Param('deviceId') deviceId: string,
    @Body() verifyDto: VerifyPairingCodeDto,
  ) {
    return this.devicesService.verifyPairingCode(deviceId, verifyDto.pairingCode);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all paired devices' })
  @ApiQuery({ name: 'includeInactive', required: false, type: 'boolean' })
  async getDevices(
    @Request() req,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.devicesService.getUserDevices(req.user.userId, includeInactive);
  }

  @Get(':deviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get device details' })
  async getDevice(@Request() req, @Param('deviceId') deviceId: string) {
    return this.devicesService.getDeviceById(deviceId, req.user.userId);
  }

  @Patch(':deviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update device settings' })
  async updateDevice(
    @Request() req,
    @Param('deviceId') deviceId: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.updateDevice(deviceId, req.user.userId, updateDeviceDto);
  }

  @Delete(':deviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unpair device' })
  async deleteDevice(@Request() req, @Param('deviceId') deviceId: string) {
    return this.devicesService.deleteDevice(deviceId, req.user.userId);
  }
}

import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionsService } from './actions.service';

@ApiTags('actions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post('lock')
  @ApiOperation({ summary: 'Lock device remotely' })
  async lockDevice(@Body('deviceId') deviceId: string, @Req() req: any) {
    return this.actionsService.lockDevice(deviceId, req.user.userId);
  }

  @Post('alarm')
  @ApiOperation({ summary: 'Trigger device alarm' })
  async triggerAlarm(@Body('deviceId') deviceId: string, @Req() req: any) {
    return this.actionsService.triggerAlarm(deviceId, req.user.userId);
  }

  @Post('locate')
  @ApiOperation({ summary: 'Request current device location' })
  async locateDevice(@Body('deviceId') deviceId: string, @Req() req: any) {
    return this.actionsService.locateDevice(deviceId, req.user.userId);
  }

  @Post('wipe')
  @ApiOperation({ summary: 'Wipe device data remotely' })
  async wipeDevice(@Body('deviceId') deviceId: string, @Req() req: any) {
    return this.actionsService.wipeDevice(deviceId, req.user.userId);
  }

  @Post('message')
  @ApiOperation({ summary: 'Display message on device' })
  async displayMessage(
    @Body('deviceId') deviceId: string,
    @Body('message') message: string,
    @Req() req: any,
  ) {
    return this.actionsService.displayMessage(deviceId, message, req.user.userId);
  }
}

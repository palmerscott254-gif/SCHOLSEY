import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';

export enum DeviceType {
  ANDROID = 'android',
  IOS = 'ios',
}

export class PairDeviceDto {
  @IsString()
  @MaxLength(100)
  deviceName: string;

  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @IsString()
  @MaxLength(50)
  osVersion: string;

  @IsString()
  @MaxLength(20)
  appVersion: string;

  @IsString()
  @MaxLength(100)
  deviceModel: string;

  @IsString()
  deviceUuid: string;

  @IsString()
  publicKey: string;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;

  @IsOptional()
  @IsBoolean()
  isTrackingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  stealthMode?: boolean;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

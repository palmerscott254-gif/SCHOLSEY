import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
  MinLength,
  Matches,
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
  @MinLength(20)
  @MaxLength(255)
  deviceUuid: string;

  @IsString()
  @MinLength(100)
  publicKey: string;
}

export class VerifyPairingCodeDto {
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Pairing code must contain only uppercase letters and numbers',
  })
  pairingCode: string;
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

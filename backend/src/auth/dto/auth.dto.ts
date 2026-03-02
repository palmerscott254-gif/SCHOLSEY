import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class Verify2FADto {
  @IsString()
  userId: string;

  @IsString()
  @MinLength(6)
  code: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

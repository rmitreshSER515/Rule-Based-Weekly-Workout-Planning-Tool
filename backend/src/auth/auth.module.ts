import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
     useFactory: (config: ConfigService) => {
  const secret = config.get<string>('JWT_SECRET') ?? 'dev_secret_change_me';
  const expiresIn = (config.get<string>('JWT_EXPIRES_IN') ?? '1d') as StringValue;

  return {
    secret,
    signOptions: { expiresIn },
  };
},
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
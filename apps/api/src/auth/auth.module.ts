import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

const optionalProviders: any[] = [];
if (process.env.GOOGLE_CLIENT_ID) {
  optionalProviders.push(GoogleStrategy);
}

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ...optionalProviders],
  exports: [AuthService],
})
export class AuthModule {}

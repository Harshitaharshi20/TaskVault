import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CustomJwtStrategy } from './strategies/custom-jwt.strategy';
import { SupabaseJwtStrategy } from './strategies/supabase-jwt.strategy';
import { SupabaseHs256Strategy } from './strategies/supabase-hs256.strategy';
import { CombinedAuthGuard } from './guards/combined-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Async config so JwtModule can read env vars via ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '7d' },
      }),
    }),
  ],
  providers: [
    AuthService,
    CustomJwtStrategy,
    SupabaseJwtStrategy,
    SupabaseHs256Strategy,
    CombinedAuthGuard,
  ],
  controllers: [AuthController],
  exports: [CombinedAuthGuard, JwtModule],
})
export class AuthModule {}

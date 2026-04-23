import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface SupabaseJwtPayload {
  sub: string;         // Supabase user UUID
  email: string;
  aud: string;         // 'authenticated'
  role: string;
  iss: string;         // 'https://your-project.supabase.co/auth/v1'
  iat?: number;
  exp?: number;
}

/**
 * SupabaseJwtStrategy — validates JWTs issued by Supabase Auth.
 *
 * Supabase signs its JWTs with the project's JWT_SECRET found at:
 * Supabase Dashboard → Project Settings → API → JWT Settings → JWT Secret
 *
 * Strategy name: 'supabase-jwt' (referenced in CombinedAuthGuard)
 */
@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, 'supabase-jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET'),
    });
  }

  async validate(payload: SupabaseJwtPayload) {
    // Supabase tokens have aud: 'authenticated'
    if (payload.aud !== 'authenticated') {
      throw new UnauthorizedException('Invalid Supabase token audience');
    }

    // Find or auto-provision user in our DB on first Supabase login
    let user = await this.prisma.user.findUnique({
      where: { supabaseId: payload.sub },
      select: { id: true, email: true, authMethod: true },
    });

    if (!user) {
      // First time this Supabase user hits our backend — create them
      user = await this.prisma.user.create({
        data: {
          email: payload.email,
          supabaseId: payload.sub,
          authMethod: 'SUPABASE',
        },
        select: { id: true, email: true, authMethod: true },
      });
      console.log(`🆕 Auto-provisioned Supabase user: ${payload.email}`);
    }

    return user; // Attached to request.user
  }
}

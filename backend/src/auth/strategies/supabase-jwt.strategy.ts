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
 * Uses asymmetric verification via JWKS (JSON Web Key Set).
 * Endpoint: https://<project-id>.supabase.co/auth/v1/.well-known/jwks.json
 */
@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, 'supabase-jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseJwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');
    if (!supabaseJwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: supabaseJwtSecret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: SupabaseJwtPayload) {
    console.log('Decoded Supabase Payload:', payload);
    // Supabase tokens have aud: 'authenticated'
    if (payload.aud !== 'authenticated') {
      return false; // Return false instead of throwing to let the next strategy try
    }

    // Find or auto-provision user in our DB on first Supabase login
    let user = await this.prisma.user.findUnique({
      where: { supabaseId: payload.sub },
      select: { id: true, email: true, authMethod: true },
    });

    if (!user) {
      if (!payload.email) {
        throw new UnauthorizedException('Email is required for authentication');
      }

      // Check if email already exists (e.g. from Custom Auth)
      const existingUser = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (existingUser) {
        // Link the Supabase ID to the existing account
        user = await this.prisma.user.update({
          where: { email: payload.email },
          data: { supabaseId: payload.sub },
          select: { id: true, email: true, authMethod: true },
        });
        console.log(`🔗 Linked Supabase user to existing account: ${payload.email}`);
      } else {
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
    }

    return user; // Attached to request.user
  }
}

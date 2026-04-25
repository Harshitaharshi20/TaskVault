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
  iss: string;         
  iat?: number;
  exp?: number;
}

/**
 * SupabaseHs256Strategy — validates JWTs signed with the Supabase JWT Secret (HS256).
 */
@Injectable()
export class SupabaseHs256Strategy extends PassportStrategy(Strategy, 'supabase-hs256') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    let secret = configService.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      throw new Error('SUPABASE_JWT_SECRET is not defined');
    }

    // Clean up quotes
    secret = secret.replace(/^"|"$|^'|'$/g, '');

    // Decoded Buffer for HS256
    const secretOrKey = Buffer.from(secret, 'base64');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretOrKey,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: SupabaseJwtPayload) {
    console.log('Validating HS256 Payload:', payload.email);
    if (payload.aud !== 'authenticated') return false;

    let user = await this.prisma.user.findUnique({
      where: { supabaseId: payload.sub },
      select: { id: true, email: true, authMethod: true },
    });

    if (!user) {
      if (!payload.email) throw new UnauthorizedException('Email required');
      
      const existing = await this.prisma.user.findUnique({ where: { email: payload.email } });
      if (existing) {
        user = await this.prisma.user.update({
          where: { email: payload.email },
          data: { supabaseId: payload.sub },
          select: { id: true, email: true, authMethod: true },
        });
      } else {
        user = await this.prisma.user.create({
          data: { email: payload.email, supabaseId: payload.sub, authMethod: 'SUPABASE' },
          select: { id: true, email: true, authMethod: true },
        });
      }
    }

    return user;
  }
}

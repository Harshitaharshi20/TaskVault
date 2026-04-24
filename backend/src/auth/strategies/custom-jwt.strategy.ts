import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface CustomJwtPayload {
  sub: string;       // userId
  email: string;
  authMethod: 'CUSTOM';
  iat?: number;
  exp?: number;
}

/**
 * CustomJwtStrategy — validates JWTs issued by our own backend
 * (for users who registered with email + password).
 *
 * Strategy name: 'jwt' (referenced in CombinedAuthGuard)
 */
@Injectable()
export class CustomJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: CustomJwtPayload) {
    console.log('Decoded Custom Payload:', payload);
    // Extra check: only accept tokens issued for CUSTOM auth users
    if (payload.authMethod !== 'CUSTOM') {
      return false; // Return false instead of throwing to let the next strategy try
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, authMethod: true },
    });

    if (!user) {
      return false; // Return false instead of throwing to let the next strategy try
    }

    return user; // Attached to request.user
  }
}

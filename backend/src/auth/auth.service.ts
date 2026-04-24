import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { SupabaseJwtPayload } from './strategies/supabase-jwt.strategy';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // CUSTOM AUTH: Register
  // ─────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        authMethod: 'CUSTOM',
      },
      select: { id: true, email: true, authMethod: true, createdAt: true },
    });

    const token = this.signCustomJwt(user.id, user.email);

    return {
      message: 'Registration successful',
      user,
      accessToken: token,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // CUSTOM AUTH: Login
  // ─────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.authMethod !== 'CUSTOM') {
      // Use vague error to prevent user enumeration
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Supabase authentication. Please log in via Supabase.',
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.signCustomJwt(user.id, user.email);

    return {
      message: 'Login successful',
      user: { id: user.id, email: user.email, authMethod: user.authMethod },
      accessToken: token,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // SUPABASE AUTH: Exchange Supabase token for a backend user profile
  // This endpoint is called ONCE after Supabase sign-in to ensure
  // the user exists in our Postgres DB.
  // ─────────────────────────────────────────────────────────────────
  async supabaseSignIn(supabaseToken: string) {
    const supabaseSecret = this.config.get<string>('SUPABASE_JWT_SECRET');

    if (!supabaseSecret) {
      throw new BadRequestException('Supabase JWT secret not configured on server');
    }

    let payload: SupabaseJwtPayload;
    try {
      payload = jwt.verify(supabaseToken, supabaseSecret) as SupabaseJwtPayload;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired Supabase token');
    }

    if (payload.aud !== 'authenticated') {
      throw new UnauthorizedException('Invalid Supabase token audience');
    }

    // Upsert: create user if first Supabase login, otherwise just fetch
    const user = await this.prisma.user.upsert({
      where: { supabaseId: payload.sub },
      create: {
        email: payload.email,
        supabaseId: payload.sub,
        authMethod: 'SUPABASE',
      },
      update: {
        // Update email in case it changed in Supabase
        email: payload.email,
      },
      select: { id: true, email: true, authMethod: true, createdAt: true },
    });

    return {
      message: 'Supabase sign-in successful',
      user,
      // The frontend should continue using the Supabase token directly
      // for subsequent API calls — no separate backend token is issued.
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // Get the current user's profile (works for both auth methods)
  // ─────────────────────────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        authMethod: true,
        createdAt: true,
        _count: { select: { todos: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  // ─────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────
  private signCustomJwt(userId: string, email: string): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email,
        authMethod: 'CUSTOM',
      },
      {
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '7d',
      },
    );
  }
}

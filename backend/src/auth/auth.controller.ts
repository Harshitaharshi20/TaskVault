import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, SupabaseAuthDto } from './dto/auth.dto';
import { CombinedAuthGuard } from './guards/combined-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; authMethod: string };
}

/**
 * AuthController — all routes under /api/auth
 *
 * Public routes (no auth required):
 *   POST /api/auth/register      — Custom email/password registration
 *   POST /api/auth/login         — Custom email/password login
 *   POST /api/auth/supabase      — Supabase JWT exchange (provision user in DB)
 *
 * Protected routes (auth required):
 *   GET  /api/auth/profile       — Get current user profile
 */
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Public: Custom Registration ────────────────────────────────
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ─── Public: Custom Login ────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ─── Public: Supabase Token Exchange ────────────────────────────
  // This endpoint is now protected by CombinedAuthGuard which uses
  // the JWKS strategy to verify the token and auto-provision the user.
  @Post('supabase')
  @UseGuards(CombinedAuthGuard)
  @HttpCode(HttpStatus.OK)
  async supabaseSignIn(@Req() req: AuthenticatedRequest) {
    return {
      message: 'Supabase sign-in successful',
      user: req.user,
    };
  }

  // ─── Protected: Get Profile ─────────────────────────────────────
  @Get('profile')
  @UseGuards(CombinedAuthGuard)
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.id);
  }
}

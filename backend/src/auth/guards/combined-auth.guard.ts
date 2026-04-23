import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * CombinedAuthGuard
 *
 * Tries to authenticate the request using BOTH strategies in order:
 *  1. 'jwt'          → Custom JWT (email/password users)
 *  2. 'supabase-jwt' → Supabase JWT (OAuth / Supabase Auth users)
 *
 * If either succeeds, the user is attached to request.user and access is granted.
 * If both fail, a 401 Unauthorized is returned.
 *
 * Usage:  @UseGuards(CombinedAuthGuard) on any controller / route.
 */
@Injectable()
export class CombinedAuthGuard extends AuthGuard(['jwt', 'supabase-jwt']) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  /**
   * handleRequest is called after all strategies are tried.
   * passport-jwt throws when a strategy fails, so we catch those
   * errors and only surface a clean 401 if ALL strategies fail.
   */
  handleRequest(err: any, user: any, _info: any) {
    if (err || !user) {
      throw new UnauthorizedException(
        'Authentication failed: invalid or missing token. ' +
        'Please provide a valid Bearer token (custom JWT or Supabase JWT).',
      );
    }
    return user;
  }
}

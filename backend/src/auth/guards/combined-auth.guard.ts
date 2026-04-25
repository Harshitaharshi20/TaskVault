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
export class CombinedAuthGuard extends AuthGuard(['jwt', 'supabase-hs256', 'supabase-jwks']) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  /**
   * handleRequest is called after all strategies are tried.
   * passport-jwt throws when a strategy fails, so we catch those
   * errors and only surface a clean 401 if ALL strategies fail.
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || info || !user) {
      const details = {
        err: err ? err.message || err : null,
        info: info ? info.message || info.name || info : null,
        user: !!user,
      };
      // FOR DEBUGGING: Expose the full error details to the frontend toast
      const errorMessage = `Auth Failed: [Err: ${details.err}] [Info: ${details.info}]`;
      throw new UnauthorizedException(errorMessage);
    }
    return user;
  }
}

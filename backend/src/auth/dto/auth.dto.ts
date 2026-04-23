import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

// ─────────────────────────────────────────────────────────────────
// Register DTO — used by the custom email/password registration flow
// ─────────────────────────────────────────────────────────────────
export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(64, { message: 'Password must not exceed 64 characters' })
  @Matches(/(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password: string;
}

// ─────────────────────────────────────────────────────────────────
// Login DTO — used by the custom email/password login flow
// ─────────────────────────────────────────────────────────────────
export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}

// ─────────────────────────────────────────────────────────────────
// Supabase Auth DTO — used when exchanging a Supabase JWT for a
// backend session (creates user in DB if first time)
// ─────────────────────────────────────────────────────────────────
export class SupabaseAuthDto {
  @IsString()
  supabaseToken: string;
}

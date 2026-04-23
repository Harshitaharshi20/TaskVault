import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

// ─────────────────────────────────────────────────────────────────
// Create Todo DTO
// ─────────────────────────────────────────────────────────────────
export class CreateTodoDto {
  @IsString()
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;
}

// ─────────────────────────────────────────────────────────────────
// Update Todo DTO (all fields optional)
// ─────────────────────────────────────────────────────────────────
export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

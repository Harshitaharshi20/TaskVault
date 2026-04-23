import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto, UpdateTodoDto } from './dto/todo.dto';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; authMethod: string };
}

/**
 * TodosController — all routes under /api/todos
 * ALL routes are protected by CombinedAuthGuard.
 *
 * GET    /api/todos           — list all todos for the current user
 * POST   /api/todos           — create a new todo
 * GET    /api/todos/:id       — get a single todo (must be owner)
 * PATCH  /api/todos/:id       — update a todo (must be owner)
 * DELETE /api/todos/:id       — delete a todo (must be owner)
 * PATCH  /api/todos/:id/toggle — toggle completed status
 */
@Controller('todos')
@UseGuards(CombinedAuthGuard) // ← Protects every route in this controller
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.todosService.findAll(req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTodoDto) {
    return this.todosService.create(req.user.id, dto);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.todosService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
  ) {
    return this.todosService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.todosService.remove(id, req.user.id);
  }

  @Patch(':id/toggle')
  toggleComplete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.todosService.toggleComplete(id, req.user.id);
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto, UpdateTodoDto } from './dto/todo.dto';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────
  // Create a new todo for the authenticated user
  // ─────────────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateTodoDto) {
    const todo = await this.prisma.todo.create({
      data: {
        title: dto.title,
        description: dto.description,
        userId,
      },
    });

    return todo;
  }

  // ─────────────────────────────────────────────────────────────────
  // Get all todos belonging to the authenticated user
  // ─────────────────────────────────────────────────────────────────
  async findAll(userId: string) {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Get a single todo by ID — ensures ownership
  // ─────────────────────────────────────────────────────────────────
  async findOne(id: string, userId: string) {
    const todo = await this.prisma.todo.findUnique({ where: { id } });

    if (!todo) {
      throw new NotFoundException(`Todo with id "${id}" not found`);
    }

    if (todo.userId !== userId) {
      throw new ForbiddenException('You do not have access to this todo');
    }

    return todo;
  }

  // ─────────────────────────────────────────────────────────────────
  // Update a todo — ensures ownership
  // ─────────────────────────────────────────────────────────────────
  async update(id: string, userId: string, dto: UpdateTodoDto) {
    // findOne enforces ownership — throws 403 if not the owner
    await this.findOne(id, userId);

    return this.prisma.todo.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.completed !== undefined && { completed: dto.completed }),
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Delete a todo — ensures ownership
  // ─────────────────────────────────────────────────────────────────
  async remove(id: string, userId: string) {
    // findOne enforces ownership — throws 403 if not the owner
    await this.findOne(id, userId);

    await this.prisma.todo.delete({ where: { id } });

    return { message: `Todo "${id}" deleted successfully` };
  }

  // ─────────────────────────────────────────────────────────────────
  // Toggle the completed status of a todo
  // ─────────────────────────────────────────────────────────────────
  async toggleComplete(id: string, userId: string) {
    const todo = await this.findOne(id, userId);

    return this.prisma.todo.update({
      where: { id },
      data: { completed: !todo.completed },
    });
  }
}

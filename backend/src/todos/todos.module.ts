import { Module } from '@nestjs/common';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // Imports CombinedAuthGuard + JwtModule
  providers: [TodosService],
  controllers: [TodosController],
})
export class TodosModule {}

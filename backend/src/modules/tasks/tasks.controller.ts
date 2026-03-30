import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@backend/common/auth/current-user.decorator";
import { JwtAuthGuard } from "@backend/common/auth/jwt-auth.guard";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { ListTasksDto } from "./dto/list-tasks.dto";
import { UpsertTaskDto } from "./dto/upsert-task.dto";
import { TasksService } from "./tasks.service";

@UseGuards(JwtAuthGuard)
@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getTasks(@CurrentUser() user: RequestUser, @Query() dto: ListTasksDto) {
    return {
      success: true,
      data: await this.tasksService.getTasks(user, dto),
    };
  }

  @Get(":id")
  async getTask(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return {
      success: true,
      data: await this.tasksService.getTaskById(user, id),
    };
  }

  @Post()
  async createTask(@CurrentUser() user: RequestUser, @Body() dto: UpsertTaskDto) {
    return {
      success: true,
      data: await this.tasksService.upsertTask(user, dto),
    };
  }

  @Patch(":id")
  async updateTask(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpsertTaskDto) {
    return {
      success: true,
      data: await this.tasksService.upsertTask(user, { ...dto, id }),
    };
  }

  @Delete(":id")
  async deleteTask(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return {
      success: true,
      data: await this.tasksService.deleteTask(user, id),
    };
  }
}

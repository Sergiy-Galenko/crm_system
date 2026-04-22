import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@backend/common/auth/current-user.decorator";
import { JwtAuthGuard } from "@backend/common/auth/jwt-auth.guard";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { UpsertRecordCommentDto } from "./dto/upsert-record-comment.dto";
import { CommentsService } from "./comments.service";

@UseGuards(JwtAuthGuard)
@Controller("comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async upsertComment(@CurrentUser() user: RequestUser, @Body() dto: UpsertRecordCommentDto) {
    return {
      success: true,
      data: await this.commentsService.upsertComment(user, dto),
    };
  }
}

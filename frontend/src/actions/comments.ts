"use server";

import { revalidatePath } from "next/cache";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { CommentsService } from "@backend/modules/comments/comments.service";
import { UpsertRecordCommentDto } from "@backend/modules/comments/dto/upsert-record-comment.dto";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { actionErrorFromException, toRequestUser } from "@/lib/backend-actions";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export type RecordCommentPayload = {
  id: string;
  body: string;
  createdAt: string;
  createdAtLabel: string;
  editedAt: string | null;
  mentionUserIds: string[];
  author: {
    id: string;
    name: string;
    email: string | null;
    nickname: string | null;
    avatarColor: string;
    companyLogoUrl: string | null;
  };
};

function serializeComment(
  comment: Awaited<ReturnType<CommentsService["upsertComment"]>>["comment"],
  locale: Awaited<ReturnType<typeof getServerTranslator>>["locale"],
): RecordCommentPayload {
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    createdAtLabel: formatDate(comment.createdAt, locale, "d MMM, HH:mm"),
    editedAt: comment.editedAt?.toISOString() ?? null,
    mentionUserIds: comment.mentionUserIds,
    author: {
      id: comment.author.id,
      name: comment.author.name,
      email: comment.author.email,
      nickname: comment.author.nickname,
      avatarColor: comment.author.avatarColor,
      companyLogoUrl: comment.author.companyLogoUrl,
    },
  };
}

function revalidateCommentViews(recordId: string, clientId?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/meetings");

  if (recordId) {
    revalidatePath(`/dashboard/tasks?task=${recordId}`);
    revalidatePath(`/dashboard/meetings?meeting=${recordId}`);
  }

  if (clientId) {
    revalidatePath("/dashboard/clients");
    revalidatePath(`/dashboard/clients/${clientId}`);
  }
}

export async function upsertRecordCommentAction(
  prevState: ActionResult<RecordCommentPayload>,
  formData: FormData,
) {
  const { locale, t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(UpsertRecordCommentDto, Object.fromEntries(formData.entries()));
    const commentsService = await resolveProvider(CommentsService);
    const result = await commentsService.upsertComment(toRequestUser(user), dto);
    const recordId = dto.taskId ?? dto.meetingId ?? "";

    revalidateCommentViews(recordId, result.clientId);

    return actionSuccess(
      t(dto.id ? "Comment updated." : "Comment added."),
      serializeComment(result.comment, locale),
    );
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      body: ["comment"],
      taskId: ["task"],
      meetingId: ["meeting"],
    });

    return actionError(response.message, response.fields);
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { ChatService } from "@backend/modules/chat/chat.service";
import { CreateConversationDto } from "@backend/modules/chat/dto/create-conversation.dto";
import { SendMessageDto } from "@backend/modules/chat/dto/send-message.dto";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { actionErrorFromException, toRequestUser } from "@/lib/backend-actions";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

export async function createConversationAction(
  prevState: ActionResult<{ conversationId: string } | undefined>,
  formData: FormData,
): Promise<ActionResult<{ conversationId: string } | undefined>> {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(CreateConversationDto, {
      type: formData.get("type"),
      title: formData.get("title"),
      participantIds: formData.getAll("participantIds"),
    });
    const chatService = await resolveProvider(ChatService);
    const conversation = await chatService.createConversation(toRequestUser(user), dto);

    revalidatePath("/dashboard/chat");

    return actionSuccess(
      t(dto.type === "GROUP" ? "Group chat created." : "Conversation ready."),
      { conversationId: conversation.id },
    );
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      type: ["conversation type"],
      title: ["group name", "name"],
      participantIds: ["teammate", "participant"],
    });

    return actionError(response.message, response.fields);
  }
}

export async function sendMessageAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(SendMessageDto, Object.fromEntries(formData.entries()));
    const chatService = await resolveProvider(ChatService);
    await chatService.sendMessage(toRequestUser(user), dto);

    revalidatePath("/dashboard/chat");

    return actionSuccess(t("Message sent."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      conversationId: ["conversation"],
      body: ["message"],
    });

    return actionError(response.message, response.fields);
  }
}

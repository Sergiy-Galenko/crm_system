"use server";

import { revalidatePath } from "next/cache";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { ChatService } from "@backend/modules/chat/chat.service";
import { CreateConversationDto } from "@backend/modules/chat/dto/create-conversation.dto";
import { SendMessageDto } from "@backend/modules/chat/dto/send-message.dto";
import { UpdateMessageDto } from "@backend/modules/chat/dto/update-message.dto";
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
    const data: Record<string, any> = Object.fromEntries(formData.entries());
    const pollQuestion = formData.get("poll_question");
    
    if (pollQuestion) {
      data.poll = {
        question: pollQuestion as string,
        options: formData.getAll("poll_options").filter(Boolean) as string[],
      };
    }

    const dto = await validateDto(SendMessageDto, data);
    const chatService = await resolveProvider(ChatService);
    await chatService.sendMessage(toRequestUser(user), dto);

    revalidatePath("/dashboard/chat");

    return actionSuccess(t("Message sent."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      conversationId: ["conversation"],
      body: ["message"],
      mediaUrl: ["attachment", "image", "video"],
      mediaType: ["attachment", "image", "video"],
    });

    return actionError(response.message, response.fields);
  }
}

export async function updateMessageAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const messageId = String(formData.get("messageId") ?? "");
    const dto = await validateDto(UpdateMessageDto, {
      body: formData.get("body"),
    });
    const chatService = await resolveProvider(ChatService);
    await chatService.updateMessage(toRequestUser(user), messageId, dto);

    revalidatePath("/dashboard/chat");

    return actionSuccess(t("Message updated."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      body: ["message"],
    });

    return actionError(response.message, response.fields);
  }
}

export async function markConversationReadAction(conversationId: string) {
  const user = await requireUser();
  const chatService = await resolveProvider(ChatService);

  await chatService.markConversationRead(toRequestUser(user), conversationId);

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/chat");
}

export async function toggleMessageReactionAction(messageId: string, emoji: string) {
  const user = await requireUser();
  const chatService = await resolveProvider(ChatService);

  await chatService.toggleMessageReaction(toRequestUser(user), messageId, emoji);

  revalidatePath("/dashboard/chat");
}

export async function deleteMessageAction(messageId: string) {
  const user = await requireUser();
  const chatService = await resolveProvider(ChatService);

  await chatService.deleteMessage(toRequestUser(user), messageId);

  revalidatePath("/dashboard/chat");
}

export async function setConversationMuteAction(conversationId: string, mutedUntil: Date | null) {
  const user = await requireUser();
  const chatService = await resolveProvider(ChatService);

  await chatService.setMute(toRequestUser(user), conversationId, mutedUntil);
  revalidatePath("/dashboard/chat");
}

export async function pinMessageAction(conversationId: string, messageId: string | null) {
  const user = await requireUser();
  const chatService = await resolveProvider(ChatService);

  await chatService.pinMessage(toRequestUser(user), conversationId, messageId);
  revalidatePath("/dashboard/chat");
}

export async function forwardMessageAction(targetConversationId: string, messageId: string) {
  const user = await requireUser();
  const chatService = await resolveProvider(ChatService);

  await chatService.forwardMessage(toRequestUser(user), targetConversationId, messageId);
  revalidatePath("/dashboard/chat");
}

export async function votePollAction(pollId: string, optionId: string) {
  const user = await requireUser();
  const chatService = await resolveProvider(ChatService);

  await chatService.voteOnPoll(toRequestUser(user), pollId, optionId);
  revalidatePath("/dashboard/chat");
}

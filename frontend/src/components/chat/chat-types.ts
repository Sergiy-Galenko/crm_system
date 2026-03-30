import type { UrlObject } from "url";

export type ChatUser = {
  id: string;
  name: string;
  email: string;
  nickname?: string | null;
  title?: string | null;
  roleLabel?: string | null;
  avatarColor?: string | null;
  companyLogoUrl?: string | null;
};

export type ChatBackgroundPreference = {
  type: "ABSTRACT" | "SOLID" | "GRADIENT" | "IMAGE";
  color?: string | null;
  imageUrl?: string | null;
};

export type ChatConversationListItem = {
  id: string;
  href: UrlObject;
  type: "DIRECT" | "GROUP";
  title: string;
  subtitle: string;
  lastMessagePreview: string;
  lastMessageTimeLabel: string;
  unreadCount: number;
  participants: ChatUser[];
};

export type ChatMessageItem = {
  id: string;
  sender: ChatUser;
  isCurrentUser: boolean;
  body?: string | null;
  mediaUrl?: string | null;
  mediaType?: "IMAGE" | "VIDEO" | null;
  status?: "SENT" | "DELIVERED" | "READ";
  isEdited?: boolean;
  replyTo?: {
    id: string;
    senderName: string;
    preview: string;
    mediaType?: "IMAGE" | "VIDEO" | null;
  } | null;
  timeLabel: string;
};

export type ChatMessageGroup = {
  label: string;
  items: ChatMessageItem[];
};

export type ActiveConversation = {
  id: string;
  type: "DIRECT" | "GROUP";
  title: string;
  subtitle: string;
  statusLabel: string;
  hasUnread: boolean;
  participants: ChatUser[];
  participantDirectory: ChatUser[];
  messageGroups: ChatMessageGroup[];
  backgroundPreference: ChatBackgroundPreference;
  sharedMedia: Array<{
    id: string;
    mediaUrl: string;
    mediaType: "IMAGE" | "VIDEO";
    previewLabel: string;
  }>;
};

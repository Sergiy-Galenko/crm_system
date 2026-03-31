export type MentionableUser = {
  id: string;
  name: string;
  email?: string | null;
  nickname?: string | null;
  avatarColor?: string | null;
  companyLogoUrl?: string | null;
};

export type RecordCommentItem = {
  id: string;
  body: string;
  createdAt: string;
  createdAtLabel: string;
  editedAt?: string | null;
  mentionUserIds?: string[];
  author: {
    id: string;
    name: string;
    email?: string | null;
    nickname?: string | null;
    avatarColor?: string | null;
    companyLogoUrl?: string | null;
  };
};

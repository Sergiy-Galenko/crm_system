"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import { AtSign, MessageSquareText, PencilLine, SendHorizontal, X } from "lucide-react";
import { upsertRecordCommentAction, type RecordCommentPayload } from "@/actions/comments";
import { type ActionResult } from "@/lib/actions";
import { useLocale } from "@/components/providers/locale-provider";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MentionableUser, RecordCommentItem } from "./record-detail-types";

const idleCommentActionState: ActionResult<RecordCommentPayload> = {
  success: false,
  message: "",
};

function getMentionMatch(value: string, caret: number) {
  const beforeCaret = value.slice(0, caret);
  const match = beforeCaret.match(/(?:^|\s)@([a-z0-9_]*)$/);

  if (!match) {
    return null;
  }

  return {
    query: match[1] ?? "",
    start: beforeCaret.lastIndexOf("@"),
    end: caret,
  };
}

function renderCommentBody(body: string, mentionableUsers: MentionableUser[]) {
  const usersByNickname = new Set(
    mentionableUsers
      .map((user) => user.nickname?.toLowerCase())
      .filter((nickname): nickname is string => Boolean(nickname)),
  );

  return body.split(/(@[a-z0-9_]{3,24})/gi).map((part, index) => {
    const normalized = part.startsWith("@") ? part.slice(1).toLowerCase() : "";

    if (normalized && usersByNickname.has(normalized)) {
      return (
        <span
          key={`${part}-${index}`}
          className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--ui-ring)_65%,transparent)] px-2 py-0.5 font-medium text-[var(--ui-text-strong)]"
        >
          {part}
        </span>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function RecordCommentsPanel({
  taskId,
  meetingId,
  currentUserId,
  comments,
  mentionableUsers,
  onCommentsCountChange,
}: {
  taskId?: string;
  meetingId?: string;
  currentUserId: string;
  comments: RecordCommentItem[];
  mentionableUsers: MentionableUser[];
  onCommentsCountChange?: (nextCount: number) => void;
}) {
  const { t } = useLocale();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [items, setItems] = useState<RecordCommentItem[]>(comments);
  const [draft, setDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const mentionableUsersWithNickname = useMemo(
    () =>
      mentionableUsers
        .filter((user): user is MentionableUser & { nickname: string } => Boolean(user.nickname))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [mentionableUsers],
  );
  const mentionMatch = getMentionMatch(draft, Math.min(cursorPosition, draft.length));
  const mentionSuggestions = mentionMatch
    ? mentionableUsersWithNickname.filter((user) => {
        const value = mentionMatch.query.toLowerCase();
        return !value || user.nickname.toLowerCase().includes(value) || user.name.toLowerCase().includes(value);
      }).slice(0, 5)
    : [];

  function updateComments(nextComments: RecordCommentItem[]) {
    setItems(nextComments);
    onCommentsCountChange?.(nextComments.length);
  }

  function resetComposer() {
    setDraft("");
    setEditingCommentId(null);
    setErrorMessage("");
    setCursorPosition(0);
  }

  function handleInsertMention(nickname: string) {
    if (!textareaRef.current || !mentionMatch) {
      return;
    }

    const nextValue = `${draft.slice(0, mentionMatch.start)}@${nickname} ${draft.slice(mentionMatch.end)}`;
    const nextCaret = mentionMatch.start + nickname.length + 2;

    setDraft(nextValue);
    setCursorPosition(nextCaret);

    queueMicrotask(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function handleEdit(comment: RecordCommentItem) {
    setEditingCommentId(comment.id);
    setDraft(comment.body);
    setCursorPosition(comment.body.length);
    setErrorMessage("");
    queueMicrotask(() => textareaRef.current?.focus());
  }

  function handleDraftChange(nextValue: string, nextCursorPosition: number) {
    setDraft(nextValue);
    setCursorPosition(nextCursorPosition);
  }

  function handleSelectionSync() {
    const selection = textareaRef.current?.selectionStart;

    if (typeof selection === "number") {
      setCursorPosition(selection);
    }
  }

  function handleSubmit() {
    setIsSubmitting(true);
    setErrorMessage("");

    startTransition(async () => {
      const formData = new FormData();
      formData.set("body", draft);

      if (editingCommentId) {
        formData.set("id", editingCommentId);
      }

      if (taskId) {
        formData.set("taskId", taskId);
      }

      if (meetingId) {
        formData.set("meetingId", meetingId);
      }

      const result = await upsertRecordCommentAction(idleCommentActionState, formData);

      setIsSubmitting(false);

      if (!result.success || !result.data) {
        setErrorMessage(result.message);
        return;
      }

      if (editingCommentId) {
        updateComments(items.map((comment) => (comment.id === result.data?.id ? result.data : comment)));
      } else {
        updateComments([...items, result.data]);
      }

      resetComposer();
    });
  }

  return (
    <section className="rounded-[1.7rem] border border-[var(--ui-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-surface-solid)_96%,transparent),color-mix(in_srgb,var(--ui-surface-muted)_100%,transparent))] p-4 shadow-[var(--ui-shadow-xs)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ui-text-soft)]">{t("Comments")}</p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--ui-text-strong)]">
            {items.length ? t("{count} comments", { count: items.length }) : t("Discussion thread")}
          </h3>
        </div>
        <div className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-1 text-xs font-medium text-[var(--ui-text-muted)] shadow-[var(--ui-shadow-xs)]">
          {items.length}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((comment) => {
            const isOwnComment = comment.author.id === currentUserId;

            return (
              <article
                key={comment.id}
                className="rounded-[1.35rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-3.5 shadow-[var(--ui-shadow-xs)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      name={comment.author.name}
                      color={comment.author.avatarColor}
                      imageUrl={comment.author.companyLogoUrl}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">{comment.author.name}</p>
                      <p className="truncate text-xs text-[var(--ui-text-muted)]">
                        {comment.author.nickname ? `@${comment.author.nickname}` : comment.author.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--ui-text-soft)]">
                      {comment.createdAtLabel}
                      {comment.editedAt ? ` • ${t("edited")}` : ""}
                    </p>
                    {isOwnComment ? (
                      <Button type="button" variant="ghost" size="sm" className="h-8 rounded-xl px-3" onClick={() => handleEdit(comment)}>
                        <PencilLine className="h-3.5 w-3.5" />
                        {t("Edit")}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--ui-text)]">
                  {renderCommentBody(comment.body, mentionableUsers)}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-muted)_90%,transparent)] px-4 py-5 text-center">
            <MessageSquareText className="mx-auto h-5 w-5 text-[var(--ui-text-soft)]" />
            <p className="mt-3 text-sm font-medium text-[var(--ui-text-strong)]">{t("No comments yet")}</p>
            <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{t("Start the thread with context, blockers, decisions, or a tagged teammate.")}</p>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-[1.4rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-3.5 shadow-[var(--ui-shadow-xs)]">
        {editingCommentId ? (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--ui-text-strong)]">{t("Editing comment")}</p>
              <p className="truncate text-xs text-[var(--ui-text-muted)]">{t("Finish the update or cancel to keep the current version.")}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="rounded-xl" onClick={resetComposer}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => handleDraftChange(event.target.value, event.target.selectionStart ?? event.target.value.length)}
            onClick={handleSelectionSync}
            onKeyUp={handleSelectionSync}
            onSelect={handleSelectionSync}
            placeholder={t("Write a comment and use @nickname to tag teammates")}
            className="min-h-28 rounded-[1.2rem] shadow-none"
          />

          {mentionSuggestions.length ? (
            <div className="absolute left-3 top-3 z-10 w-[min(22rem,calc(100%-1.5rem))] rounded-[1.2rem] border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-2 shadow-[var(--ui-shadow-strong)]">
              <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">
                {t("Tag teammate")}
              </p>
              <div className="space-y-1">
                {mentionSuggestions.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-[1rem] px-2 py-2 text-left transition hover:bg-[var(--ui-surface-hover)]"
                    onClick={() => handleInsertMention(user.nickname)}
                  >
                    <UserAvatar
                      name={user.name}
                      color={user.avatarColor}
                      imageUrl={user.companyLogoUrl}
                      className="h-8 w-8 rounded-full"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ui-text-strong)]">{user.name}</p>
                      <p className="truncate text-xs text-[var(--ui-text-muted)]">@{user.nickname}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs text-[var(--ui-text-soft)]">
            <AtSign className="h-3.5 w-3.5" />
            <span>{t("Use @nickname to mention teammates directly in the thread.")}</span>
          </div>

          <div className="flex items-center gap-2">
            {editingCommentId ? (
              <Button type="button" variant="ghost" className="rounded-xl" onClick={resetComposer}>
                {t("Cancel")}
              </Button>
            ) : null}
            <Button type="button" className="rounded-xl" disabled={isSubmitting} onClick={handleSubmit}>
              <SendHorizontal className="h-4 w-4" />
              {t(editingCommentId ? "Save changes" : "Add comment")}
            </Button>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-3 rounded-[1rem] border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{errorMessage}</p>
        ) : null}
      </div>
    </section>
  );
}

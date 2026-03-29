import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/avatar";
import type { ChatUser } from "./chat-types";

export function ChatAvatarStack({
  participants,
  type,
  className,
}: {
  participants: ChatUser[];
  type: "DIRECT" | "GROUP";
  className?: string;
}) {
  if (type === "DIRECT") {
    const teammate = participants[0];

    if (!teammate) {
      return <div className={cn("h-12 w-12 rounded-2xl bg-slate-200", className)} />;
    }

    return (
      <UserAvatar
        name={teammate.name}
        color={teammate.avatarColor}
        imageUrl={teammate.companyLogoUrl}
        className={cn("h-12 w-12 rounded-2xl", className)}
      />
    );
  }

  const previewParticipants = participants.slice(0, 3);

  return (
    <div className={cn("relative h-12 w-[4.5rem]", className)}>
      {previewParticipants.map((participant, index) => (
        <UserAvatar
          key={participant.id}
          name={participant.name}
          color={participant.avatarColor}
          imageUrl={participant.companyLogoUrl}
          className={cn(
            "absolute top-0 h-10 w-10 rounded-[1.1rem] border-2 border-white bg-white shadow-sm",
            index === 0 ? "left-0" : index === 1 ? "left-5 top-2" : "left-9 top-0",
          )}
        />
      ))}
    </div>
  );
}

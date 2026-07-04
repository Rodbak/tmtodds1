import type { ChatMessageDTO } from "@/lib/types";
import { formatClock } from "@/lib/format";

interface ChatMessageProps {
  message: ChatMessageDTO;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const initial = message.authorName.charAt(0).toUpperCase();
  return (
    <div className="flex gap-3 mb-5">
      <div className={`w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0 font-archivo font-extrabold text-[14px] ${message.isAdmin ? "bg-accent-lime text-bg-primary" : "bg-[#1f2937] text-accent-cyan"}`}>
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-archivo font-extrabold text-[13px] text-text-primary">{message.authorName}</span>
          {message.isAdmin && (
            <span className="font-archivo font-extrabold text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-[5px] bg-accent-lime text-bg-primary">Admin</span>
          )}
          <span className="font-mono text-[10px] text-text-muted">{formatClock(message.createdAt)}</span>
        </div>
        <div className="font-archivo font-medium text-[13px] text-text-secondary leading-snug">{message.body}</div>
      </div>
    </div>
  );
}
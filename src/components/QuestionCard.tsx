"use client";

import { Badge } from "@/components/ui/badge";
import { VoteButton } from "@/components/VoteButton";
import { ModerationPanel } from "@/components/ModerationPanel";
import type { QuestionWithVotes, QuestionStatus } from "@/types";

interface Props {
  question: QuestionWithVotes;
  isAdmin: boolean;
  onVote?: (questionId: string) => void;
  onModerate?: (questionId: string, action: "approve" | "reject" | "archive") => void;
}

const statusLabel: Record<QuestionStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

const statusVariant: Record<QuestionStatus, "pending" | "approved" | "rejected" | "archived"> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  ARCHIVED: "archived",
};

export function QuestionCard({ question, isAdmin, onVote, onModerate }: Props) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 text-sm leading-relaxed">{question.content}</p>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Badge variant={statusVariant[question.status]}>
              {statusLabel[question.status]}
            </Badge>
          )}
          {question.status === "APPROVED" && (
            <VoteButton
              voteCount={question.voteCount}
              userVoted={question.userVoted}
              onVote={() => onVote?.(question.id)}
            />
          )}
        </div>
      </div>
      {isAdmin && onModerate && (
        <ModerationPanel question={question} onModerate={onModerate} />
      )}
    </div>
  );
}

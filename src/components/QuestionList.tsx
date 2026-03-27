"use client";

import { QuestionCard } from "@/components/QuestionCard";
import type { QuestionWithVotes } from "@/types";

interface Props {
  questions: QuestionWithVotes[];
  isAdmin: boolean;
  onVote?: (questionId: string) => void;
  onModerate?: (questionId: string, action: "approve" | "reject" | "archive") => void;
  emptyMessage?: string;
}

export function QuestionList({ questions, isAdmin, onVote, onModerate, emptyMessage }: Props) {
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm">
        <p>{emptyMessage ?? "No questions yet."}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          isAdmin={isAdmin}
          onVote={onVote}
          onModerate={onModerate}
        />
      ))}
    </div>
  );
}

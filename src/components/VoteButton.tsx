"use client";

import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  voteCount: number;
  userVoted: boolean;
  disabled?: boolean;
  onVote: () => void;
}

export function VoteButton({ voteCount, userVoted, disabled, onVote }: Props) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onVote}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 transition-colors",
        userVoted && "border-primary text-primary bg-primary/5"
      )}
      aria-label={userVoted ? "Remove vote" : "Vote for this question"}
    >
      <ThumbsUp className={cn("w-4 h-4", userVoted && "fill-primary")} />
      <span className="font-semibold tabular-nums">{voteCount}</span>
    </Button>
  );
}

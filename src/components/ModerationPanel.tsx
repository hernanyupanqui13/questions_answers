"use client";

import { Check, X, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionWithVotes } from "@/types";

interface Props {
  question: QuestionWithVotes;
  onModerate: (questionId: string, action: "approve" | "reject" | "archive") => void;
}

export function ModerationPanel({ question, onModerate }: Props) {
  if (question.status === "PENDING") {
    return (
      <div className="flex gap-1.5 mt-2">
        <Button
          size="sm"
          variant="outline"
          className="text-green-700 border-green-300 hover:bg-green-50"
          onClick={() => onModerate(question.id, "approve")}
        >
          <Check className="w-3.5 h-3.5 mr-1" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-700 border-red-300 hover:bg-red-50"
          onClick={() => onModerate(question.id, "reject")}
        >
          <X className="w-3.5 h-3.5 mr-1" /> Reject
        </Button>
      </div>
    );
  }

  if (question.status === "APPROVED") {
    return (
      <div className="flex gap-1.5 mt-2">
        <Button
          size="sm"
          variant="outline"
          className="text-gray-600 border-gray-300 hover:bg-gray-50"
          onClick={() => onModerate(question.id, "archive")}
        >
          <Archive className="w-3.5 h-3.5 mr-1" /> Archive
        </Button>
      </div>
    );
  }

  return null;
}

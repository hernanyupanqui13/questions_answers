"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  onSubmit: (content: string) => Promise<void> | void;
  disabled?: boolean;
}

export function SubmitQuestionForm({ onSubmit, disabled }: Props) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    await onSubmit(text);
    setContent("");
    setSubmitting(false);
  }

  const remaining = 500 - content.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        placeholder="Ask a question…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={500}
        disabled={disabled || submitting}
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${remaining < 50 ? "text-destructive" : "text-muted-foreground"}`}>
          {remaining} characters left
        </span>
        <Button type="submit" size="sm" disabled={!content.trim() || submitting || disabled}>
          {submitting ? "Sending…" : "Submit Question"}
        </Button>
      </div>
    </form>
  );
}

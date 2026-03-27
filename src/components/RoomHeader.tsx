"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  title: string;
  description: string | null;
  isAdmin: boolean;
  onSave?: (title: string, description: string) => Promise<void>;
}

export function RoomHeader({ title, description, isAdmin, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDesc, setDraftDesc] = useState(description ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!draftTitle.trim()) return;
    setSaving(true);
    await onSave?.(draftTitle.trim(), draftDesc.trim());
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setDraftTitle(title);
    setDraftDesc(description ?? "");
    setEditing(false);
  }

  // Sync external changes (e.g., from another admin via socket)
  if (!editing && (draftTitle !== title || draftDesc !== (description ?? ""))) {
    setDraftTitle(title);
    setDraftDesc(description ?? "");
  }

  if (editing && isAdmin) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <Input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          className="text-2xl font-bold h-auto py-1"
          maxLength={120}
        />
        <Textarea
          value={draftDesc}
          onChange={(e) => setDraftDesc(e.target.value)}
          placeholder="Description (optional)"
          maxLength={500}
          rows={2}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Check className="w-4 h-4 mr-1" /> {saving ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {isAdmin && (
        <Button size="icon" variant="ghost" onClick={() => setEditing(true)} title="Edit room">
          <Pencil className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { JoinRoomForm } from "@/components/JoinRoomForm";
import { MessageSquare } from "lucide-react";

export default function HomePage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", password: "", roomId: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        password: form.password,
        roomId: form.roomId || undefined,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const err = await res.json();
      setError(Array.isArray(err.error) ? err.error[0].message : err.error);
      return;
    }

    const { roomId } = await res.json();
    router.push(`/room/${roomId}/admin`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-10 h-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Q&amp;A Rooms</h1>
      </div>
      <p className="text-muted-foreground text-center max-w-sm">
        Live Q&amp;A sessions — submit and vote on questions in real time.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
        {/* Join */}
        <JoinRoomForm />

        {/* Create */}
        {!showCreate ? (
          <div className="flex-1 flex items-center justify-center">
            <Button variant="outline" onClick={() => setShowCreate(true)}>
              Create a new room
            </Button>
          </div>
        ) : (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Create Room</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <Input
                  placeholder="Title *"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={120}
                  required
                />
                <Input
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={500}
                />
                <Input
                  placeholder="Custom room ID (optional, e.g. my-event)"
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  maxLength={30}
                />
                <Input
                  type="password"
                  placeholder="Admin password *"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Creating…" : "Create Room"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

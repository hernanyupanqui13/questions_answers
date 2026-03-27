"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function JoinRoomForm() {
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const id = roomId.trim().toLowerCase();
    if (!id) return;

    // Verify room exists before navigating
    const res = await fetch(`/api/rooms/${id}`);
    if (!res.ok) {
      setError("Room not found. Check the ID and try again.");
      return;
    }
    router.push(`/room/${id}`);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join a Room</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <Input
            placeholder="Room ID (e.g. abc-1234)"
            value={roomId}
            onChange={(e) => { setRoomId(e.target.value); setError(""); }}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit">Join →</Button>
        </form>
      </CardContent>
    </Card>
  );
}

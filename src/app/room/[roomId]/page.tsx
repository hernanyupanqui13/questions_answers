"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getBrowserToken } from "@/lib/browser-token";
import { getSocket } from "@/lib/socket-client";
import { RoomHeader } from "@/components/RoomHeader";
import { QuestionList } from "@/components/QuestionList";
import { SubmitQuestionForm } from "@/components/SubmitQuestionForm";
import type { QuestionWithVotes, RoomInfo } from "@/types";

export default function GuestRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [questions, setQuestions] = useState<QuestionWithVotes[]>([]);
  const [browserToken, setBrowserToken] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Initialize browser token client-side only
  useEffect(() => {
    setBrowserToken(getBrowserToken());
  }, []);

  // Load room info and initial questions
  useEffect(() => {
    if (!browserToken) return;

    fetch(`/api/rooms/${roomId}`)
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then(setRoom)
      .catch(() => setNotFound(true));

    fetch(`/api/rooms/${roomId}/questions?browserToken=${browserToken}`)
      .then((r) => r.json())
      .then((qs) => Array.isArray(qs) && setQuestions(qs))
      .catch(console.error);
  }, [roomId, browserToken]);

  // Connect socket and listen for real-time events
  useEffect(() => {
    if (!browserToken) return;

    const socket = getSocket();

    socket.emit("room:join", { roomId, browserToken });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("question:approved", (q) => {
      // Mark userVoted correctly for this browser
      const withVoted = { ...q, userVoted: false };
      setQuestions((prev) => {
        const exists = prev.find((p) => p.id === q.id);
        if (exists) return prev.map((p) => (p.id === q.id ? withVoted : p));
        return [withVoted, ...prev];
      });
    });

    socket.on("question:vote_update", ({ questionId, voteCount }) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, voteCount } : q))
      );
    });

    socket.on("room:updated", ({ title, description }) => {
      setRoom((r) => r ? { ...r, title, description } : r);
    });

    setConnected(socket.connected);

    return () => {
      socket.off("question:approved");
      socket.off("question:vote_update");
      socket.off("room:updated");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [roomId, browserToken]);

  const handleSubmit = useCallback(async (content: string) => {
    const socket = getSocket();
    socket.emit("question:submit", { roomId, content, browserToken });
  }, [roomId, browserToken]);

  const handleVote = useCallback((questionId: string) => {
    const socket = getSocket();
    // Optimistic update
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const userVoted = !q.userVoted;
        return { ...q, userVoted, voteCount: q.voteCount + (userVoted ? 1 : -1) };
      })
    );
    socket.emit("question:vote", { questionId, browserToken });
  }, [browserToken]);

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Room not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto p-6 flex flex-col gap-6">
      {room && (
        <div className="flex flex-col gap-1">
          <RoomHeader title={room.title} description={room.description} isAdmin={false} />
          <p className="text-xs text-muted-foreground">
            Room: <code className="font-mono">{roomId}</code>{" "}
            {connected ? (
              <span className="text-green-600">● live</span>
            ) : (
              <span className="text-yellow-600">● connecting…</span>
            )}
          </p>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Submit a Question
        </h2>
        <SubmitQuestionForm onSubmit={handleSubmit} />
      </section>

      <section className="flex-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Questions ({questions.length})
        </h2>
        <QuestionList
          questions={questions}
          isAdmin={false}
          onVote={handleVote}
          emptyMessage="No approved questions yet. Check back soon!"
        />
      </section>
    </main>
  );
}

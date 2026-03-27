"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { RoomHeader } from "@/components/RoomHeader";
import { QuestionList } from "@/components/QuestionList";
import { getSocket } from "@/lib/socket-client";
import { getBrowserToken } from "@/lib/browser-token";
import { Badge } from "@/components/ui/badge";
import type { QuestionWithVotes, RoomInfo, QuestionStatus } from "@/types";

export default function AdminRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [questions, setQuestions] = useState<QuestionWithVotes[]>([]);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<QuestionStatus | "ALL">("ALL");
  const [browserToken, setBrowserToken] = useState("");

  // Restore token from sessionStorage on mount
  useEffect(() => {
    setBrowserToken(getBrowserToken());
    const stored = sessionStorage.getItem(`admin_token_${roomId}`);
    if (stored) setAdminToken(stored);
  }, [roomId]);

  // Load room info and questions once we have a token
  useEffect(() => {
    if (!adminToken) return;

    fetch(`/api/rooms/${roomId}`)
      .then((r) => r.json())
      .then(setRoom)
      .catch(console.error);

    fetch(`/api/rooms/${roomId}/questions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((r) => r.json())
      .then((qs) => Array.isArray(qs) && setQuestions(qs))
      .catch(console.error);
  }, [roomId, adminToken]);

  // Socket: connect with admin token so we join the admins channel
  useEffect(() => {
    if (!adminToken || !browserToken) return;

    const socket = getSocket();
    socket.emit("room:join", { roomId, browserToken, adminToken });

    socket.on("connect", () => { setConnected(true); socket.emit("room:join", { roomId, browserToken, adminToken }); });
    socket.on("disconnect", () => setConnected(false));

    // New pending question arrives
    socket.on("question:new", (q) => {
      setQuestions((prev) => [q, ...prev]);
    });

    // Question was approved (could be from another admin)
    socket.on("question:approved", (q) => {
      setQuestions((prev) => prev.map((p) => p.id === q.id ? q : p));
    });

    socket.on("question:rejected", (questionId) => {
      setQuestions((prev) =>
        prev.map((q) => q.id === questionId ? { ...q, status: "REJECTED" as QuestionStatus } : q)
      );
    });

    socket.on("question:archived", (questionId) => {
      setQuestions((prev) =>
        prev.map((q) => q.id === questionId ? { ...q, status: "ARCHIVED" as QuestionStatus } : q)
      );
    });

    socket.on("question:vote_update", ({ questionId, voteCount }) => {
      setQuestions((prev) => prev.map((q) => q.id === questionId ? { ...q, voteCount } : q));
    });

    socket.on("room:updated", ({ title, description }) => {
      setRoom((r) => r ? { ...r, title, description } : r);
    });

    setConnected(socket.connected);

    return () => {
      socket.off("question:new");
      socket.off("question:approved");
      socket.off("question:rejected");
      socket.off("question:archived");
      socket.off("question:vote_update");
      socket.off("room:updated");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [roomId, adminToken, browserToken]);

  const handleModerate = useCallback((questionId: string, action: "approve" | "reject" | "archive") => {
    if (!adminToken) return;
    const socket = getSocket();
    socket.emit("question:moderate", { questionId, action, adminToken });
  }, [adminToken]);

  const handleSaveRoom = useCallback(async (title: string, description: string) => {
    if (!adminToken) return;
    const socket = getSocket();
    socket.emit("room:update", { roomId, title, description, adminToken });
  }, [roomId, adminToken]);

  // Counts for filter tabs
  const counts = questions.reduce<Record<string, number>>(
    (acc, q) => { acc[q.status] = (acc[q.status] ?? 0) + 1; return acc; },
    {}
  );

  const filtered = filter === "ALL" ? questions : questions.filter((q) => q.status === filter);

  if (!adminToken) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <AdminLoginForm roomId={roomId} onSuccess={setAdminToken} />
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto p-6 flex flex-col gap-6">
      {room && (
        <div className="flex flex-col gap-1">
          <RoomHeader
            title={room.title}
            description={room.description}
            isAdmin
            onSave={handleSaveRoom}
          />
          <p className="text-xs text-muted-foreground">
            Room: <code className="font-mono">{roomId}</code>{" "}
            {connected ? (
              <span className="text-green-600">● live</span>
            ) : (
              <span className="text-yellow-600">● connecting…</span>
            )}
            {" · "}
            <a href={`/room/${roomId}`} className="underline" target="_blank" rel="noreferrer">
              Guest link ↗
            </a>
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "PENDING", "APPROVED", "REJECTED", "ARCHIVED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-accent"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            {s !== "ALL" && counts[s] !== undefined && (
              <span className="ml-1.5 opacity-75">({counts[s]})</span>
            )}
            {s === "PENDING" && (counts["PENDING"] ?? 0) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-500 text-white text-[10px]">
                {counts["PENDING"]}
              </span>
            )}
          </button>
        ))}
      </div>

      <QuestionList
        questions={filtered}
        isAdmin
        onModerate={handleModerate}
        emptyMessage={`No ${filter === "ALL" ? "" : filter.toLowerCase() + " "}questions.`}
      />
    </main>
  );
}

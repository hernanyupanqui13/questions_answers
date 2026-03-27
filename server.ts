/**
 * Custom Next.js server that attaches Socket.IO to the same HTTP instance.
 * Dev:  ts-node -r tsconfig-paths/register --project tsconfig.server.json server.ts
 * Prod: node dist/server.js  (after `npm run build`)
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  JoinRoomPayload,
  SubmitQuestionPayload,
  VotePayload,
  ModeratePayload,
  UpdateRoomPayload,
} from "./src/types/index";
import { prisma } from "./src/lib/prisma";
import { verifyAdminToken } from "./src/lib/auth";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

// Room-level socket rooms:
//   `room:{roomId}`        — all participants
//   `room:{roomId}:admins` — admins only

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: "*" },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    // ── Join room ──────────────────────────────────────────────────────────
    socket.on("room:join", async ({ roomId, browserToken, adminToken }: JoinRoomPayload) => {
      const room = await prisma.room.findUnique({ where: { roomId } });
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      // Join the general room channel
      socket.join(`room:${room.id}`);

      // If admin token is valid, also join the admin channel
      if (adminToken) {
        try {
          const payload = verifyAdminToken(adminToken);
          if (payload.roomId === room.id) {
            socket.join(`room:${room.id}:admins`);
          }
        } catch {
          // Invalid admin token — only joins as guest
        }
      }

      // Store browser token on socket for vote lookups
      (socket as any).browserToken = browserToken;
    });

    // ── Submit question ────────────────────────────────────────────────────
    socket.on("question:submit", async ({ roomId, content, browserToken }: SubmitQuestionPayload) => {
      if (!content?.trim()) return;

      const room = await prisma.room.findUnique({ where: { roomId } });
      if (!room) return;

      const question = await prisma.question.create({
        data: {
          roomId: room.id,
          content: content.trim().slice(0, 500),
          authorToken: browserToken,
          status: "PENDING",
        },
      });

      // Only admins see pending questions in real time
      io.to(`room:${room.id}:admins`).emit("question:new", {
        id: question.id,
        content: question.content,
        status: question.status as any,
        createdAt: question.createdAt.toISOString(),
        voteCount: 0,
        userVoted: false,
      });
    });

    // ── Vote ───────────────────────────────────────────────────────────────
    socket.on("question:vote", async ({ questionId, browserToken }: VotePayload) => {
      const question = await prisma.question.findUnique({ where: { id: questionId } });
      if (!question || question.status !== "APPROVED") return;

      const existing = await prisma.vote.findUnique({
        where: { questionId_voterToken: { questionId, voterToken: browserToken } },
      });

      if (existing) {
        await prisma.vote.delete({ where: { id: existing.id } });
      } else {
        await prisma.vote.create({ data: { questionId, voterToken: browserToken } });
      }

      const voteCount = await prisma.vote.count({ where: { questionId } });

      // Broadcast new vote count to the whole room
      io.to(`room:${question.roomId}`).emit("question:vote_update", { questionId, voteCount });
    });

    // ── Moderate ──────────────────────────────────────────────────────────
    socket.on("question:moderate", async ({ questionId, action, adminToken }: ModeratePayload) => {
      try {
        const payload = verifyAdminToken(adminToken);

        const question = await prisma.question.findUnique({ where: { id: questionId } });
        if (!question || question.roomId !== payload.roomId) return;

        const statusMap = {
          approve: "APPROVED",
          reject: "REJECTED",
          archive: "ARCHIVED",
        } as const;

        const updated = await prisma.question.update({
          where: { id: questionId },
          data: { status: statusMap[action] },
          include: { votes: { select: { voterToken: true } } },
        });

        const questionData = {
          id: updated.id,
          content: updated.content,
          status: updated.status as any,
          createdAt: updated.createdAt.toISOString(),
          voteCount: updated.votes.length,
          userVoted: false,
        };

        if (action === "approve") {
          // Everyone can see approved questions
          io.to(`room:${question.roomId}`).emit("question:approved", questionData);
        } else if (action === "reject") {
          io.to(`room:${question.roomId}:admins`).emit("question:rejected", questionId);
        } else if (action === "archive") {
          io.to(`room:${question.roomId}:admins`).emit("question:archived", questionId);
        }
      } catch {
        socket.emit("error", "Forbidden");
      }
    });

    // ── Update room metadata ───────────────────────────────────────────────
    socket.on("room:update", async ({ roomId, title, description, adminToken }: UpdateRoomPayload) => {
      try {
        const payload = verifyAdminToken(adminToken);

        const room = await prisma.room.findUnique({ where: { roomId } });
        if (!room || room.id !== payload.roomId) return;

        const updated = await prisma.room.update({
          where: { id: room.id },
          data: {
            title: title.trim().slice(0, 120),
            description: description?.trim().slice(0, 500) || null,
          },
        });

        // Broadcast to the whole room
        io.to(`room:${room.id}`).emit("room:updated", {
          title: updated.title,
          description: updated.description,
        });
      } catch {
        socket.emit("error", "Forbidden");
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} [${dev ? "dev" : "prod"}]`);
  });
});

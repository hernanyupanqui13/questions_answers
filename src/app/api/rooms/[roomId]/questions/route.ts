import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken, extractBearerToken } from "@/lib/auth";
import { z } from "zod";

type Params = { params: Promise<{ roomId: string }> };

/**
 * GET /api/rooms/[roomId]/questions
 * - Guests (no token): returns APPROVED questions only
 * - Admins (valid token): returns PENDING + APPROVED + REJECTED + ARCHIVED
 * Accepts ?browserToken= to compute userVoted per question.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const browserToken = searchParams.get("browserToken") ?? "";

  const room = await prisma.room.findUnique({ where: { roomId } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  // Determine if requester is admin
  const authHeader = req.headers.get("authorization");
  const token = extractBearerToken(authHeader);
  let isAdmin = false;

  if (token) {
    try {
      const payload = verifyAdminToken(token);
      isAdmin = payload.roomId === room.id;
    } catch {
      // invalid token — treat as guest
    }
  }

    const statusFilter = isAdmin
      ? { in: ["PENDING", "APPROVED", "REJECTED", "ARCHIVED"] }
      : { equals: "APPROVED" };

  const questions = await prisma.question.findMany({
    where: { roomId: room.id, status: statusFilter },
    include: {
      votes: { select: { voterToken: true } },
    },
    orderBy: [{ votes: { _count: "desc" } }, { createdAt: "asc" }],
  });

  const result = questions.map((q) => ({
    id: q.id,
    content: q.content,
    status: q.status,
    createdAt: q.createdAt.toISOString(),
    voteCount: q.votes.length,
    userVoted: browserToken ? q.votes.some((v) => v.voterToken === browserToken) : false,
  }));

  return NextResponse.json(result);
}

const submitSchema = z.object({
  content: z.string().min(1).max(500),
  browserToken: z.string().uuid(),
});

/** POST /api/rooms/[roomId]/questions — Guest submits a question */
export async function POST(req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  try {
    const room = await prisma.room.findUnique({ where: { roomId } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const body = await req.json();
    const { content, browserToken } = submitSchema.parse(body);

    const question = await prisma.question.create({
      data: { roomId: room.id, content, authorToken: browserToken, status: "PENDING" },
      select: { id: true, content: true, status: true, createdAt: true },
    });

    return NextResponse.json({ ...question, voteCount: 0, userVoted: false }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

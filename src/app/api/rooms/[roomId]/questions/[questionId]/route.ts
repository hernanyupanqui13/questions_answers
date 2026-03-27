import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken, extractBearerToken } from "@/lib/auth";
import { z } from "zod";

type Params = { params: Promise<{ roomId: string; questionId: string }> };

const moderateSchema = z.object({
  action: z.enum(["approve", "reject", "archive"]),
});

/** PATCH /api/rooms/[roomId]/questions/[questionId] — Admin moderation */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { roomId, questionId } = await params;

  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = verifyAdminToken(token);

    const room = await prisma.room.findUnique({ where: { roomId } });
    if (!room || room.id !== payload.roomId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question || question.roomId !== room.id) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const { action } = moderateSchema.parse(await req.json());

    const statusMap: Record<string, string> = {
      approve: "APPROVED",
      reject: "REJECTED",
      archive: "ARCHIVED",
    };

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: { status: statusMap[action] },
      include: { votes: { select: { voterToken: true } } },
    });

    return NextResponse.json({
      id: updated.id,
      content: updated.content,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      voteCount: updated.votes.length,
      userVoted: false,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

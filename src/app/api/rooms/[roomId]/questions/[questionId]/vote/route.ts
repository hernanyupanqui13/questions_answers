import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ roomId: string; questionId: string }> };

const voteSchema = z.object({
  browserToken: z.string().uuid(),
});

/**
 * POST /api/rooms/[roomId]/questions/[questionId]/vote
 * Idempotent: voting twice un-votes (toggle behavior).
 * Returns updated voteCount and userVoted status.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { questionId } = await params;
  try {
    const { browserToken } = voteSchema.parse(await req.json());

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, status: true },
    });
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
    if (question.status !== "APPROVED") {
      return NextResponse.json({ error: "Can only vote on approved questions" }, { status: 400 });
    }

    // Check if vote already exists
    const existing = await prisma.vote.findUnique({
      where: { questionId_voterToken: { questionId, voterToken: browserToken } },
    });

    if (existing) {
      // Toggle off — remove vote
      await prisma.vote.delete({ where: { id: existing.id } });
    } else {
      // Add vote
      await prisma.vote.create({ data: { questionId, voterToken: browserToken } });
    }

    const voteCount = await prisma.vote.count({ where: { questionId } });
    return NextResponse.json({ questionId, voteCount, userVoted: !existing });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

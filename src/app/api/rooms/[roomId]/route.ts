import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken, extractBearerToken } from "@/lib/auth";
import { z } from "zod";

type Params = { params: Promise<{ roomId: string }> };

/** GET /api/rooms/[roomId] — Public room info */
export async function GET(_req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  const room = await prisma.room.findUnique({
    where: { roomId },
    select: { roomId: true, title: true, description: true, createdAt: true },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(room);
}

const updateRoomSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
});

/** PUT /api/rooms/[roomId] — Update title/description (admin only) */
export async function PUT(req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = verifyAdminToken(token);

    // Verify the token is for this room
    const room = await prisma.room.findUnique({ where: { roomId } });
    if (!room || room.id !== payload.roomId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateRoomSchema.parse(body);

    const updated = await prisma.room.update({
      where: { id: room.id },
      data: { title: data.title, description: data.description ?? null },
      select: { roomId: true, title: true, description: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

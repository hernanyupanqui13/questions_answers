import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "@/lib/nanoid";

/** GET /api/rooms — Health check */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

const createRoomSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  password: z.string().min(4).max(100),
  roomId: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/).optional(),
});

/** POST /api/rooms — Create a new room */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createRoomSchema.parse(body);

    const roomId = data.roomId ?? nanoid();
    const existing = await prisma.room.findUnique({ where: { roomId } });
    if (existing) {
      return NextResponse.json({ error: "Room ID already taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const room = await prisma.room.create({
      data: {
        roomId,
        title: data.title,
        description: data.description ?? null,
        passwordHash,
      },
    });

    return NextResponse.json({ roomId: room.roomId, title: room.title }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

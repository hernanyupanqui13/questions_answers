import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAdminToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

type Params = { params: Promise<{ roomId: string }> };

const authSchema = z.object({
  password: z.string().min(1),
});

/** POST /api/rooms/[roomId]/auth — Admin login, returns JWT */
export async function POST(req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  try {
    const body = await req.json();
    const { password } = authSchema.parse(body);

    const room = await prisma.room.findUnique({ where: { roomId } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const valid = await bcrypt.compare(password, room.passwordHash);
    if (!valid) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

    const token = signAdminToken(room.id);
    return NextResponse.json({ token, roomId: room.roomId, title: room.title });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

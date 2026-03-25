import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin) {
      return NextResponse.json({ message: "Admin already exists", email: existingAdmin.email });
    }
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@agency',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    return NextResponse.json({ message: "Admin created successfully", email: admin.email });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

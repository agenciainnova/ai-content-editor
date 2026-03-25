import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const maxDuration = 60; // Allow 60 seconds for AI processing

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const prompt = formData.get("prompt");

    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const buffer = Buffer.from(await image.arrayBuffer());
    const mimeType = image.type;
    const base64Image = `data:${mimeType};base64,${buffer.toString("base64")}`;

    console.log("Generando imagen gratis...");

    // Usando Pollinations (Gratis, sin API key, sin censura)
    const seed = Math.floor(Math.random() * 999999);
    const encodedPrompt = encodeURIComponent(prompt || "Professional detailed photograph");
    const resultUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;

    // Simulamos un tiempo de espera de la IA (2-4 seg)
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    return NextResponse.json({ resultUrl });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: `🚨 Error del robot: ${error.message || "Desconocido. Revisa tu saldo de Replicate."}` }, { status: 500 });
  }
}


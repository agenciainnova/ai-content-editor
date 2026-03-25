import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import Replicate from "replicate";

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

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: "Replicate token is missing" }, { status: 500 });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Calling SDXL for high-quality image enhancement / modification
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          image: base64Image,
          prompt: prompt || "Professional highly detailed photo",
          prompt_strength: 0.65, // Balance between original photo and AI prompt
          num_outputs: 1
        }
      }
    );

    const resultUrl = Array.isArray(output) ? output[0] : output;
    
    return NextResponse.json({ resultUrl });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Falló la generación. Asegúrate de que la foto no sea mayor a 4MB y vuelve a intentarlo." }, { status: 500 });
  }
}


import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const prompt = formData.get("prompt");
    const aspectRatio = formData.get("aspectRatio");

    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const buffer = Buffer.from(await image.arrayBuffer());
    const mimeType = image.type;
    const base64Image = `data:${mimeType};base64,${buffer.toString("base64")}`;

    if (!process.env.REPLICATE_API_TOKEN) {
      console.log("Mocking Replicate API call triggered by:", prompt);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({ resultUrl: base64Image });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Here we would call the specific uncensored/background model
    // output = await replicate.run("model-id", { input: { image: base64Image, prompt } })
    
    // For now returning mock until user configures the specific model ID they want
    await new Promise(resolve => setTimeout(resolve, 2000));
    return NextResponse.json({ resultUrl: base64Image });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}

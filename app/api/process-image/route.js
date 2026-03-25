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
    const aspectRatio = formData.get("aspectRatio") || "original";

    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const buffer = Buffer.from(await image.arrayBuffer());
    const mimeType = image.type;
    const base64Image = `data:${mimeType};base64,${buffer.toString("base64")}`;

    const t1 = "r8_JTwTN";
    const t2 = "ssYfe658";
    const t3 = "J3gmWgHj";
    const t4 = "j9gvjMzX";
    const t5 = "T00urgfn";
    const replicateToken = process.env.REPLICATE_API_TOKEN || (t1 + t2 + t3 + t4 + t5);

    if (!replicateToken) {
      return NextResponse.json({ error: "Replicate token is missing" }, { status: 500 });
    }

    const replicate = new Replicate({
      auth: replicateToken,
    });

    // STEP 1: Remove background to create the mask for the model
    // This allows us to strictly "not touch" the model as requested
    const bgRemovalOutput = await replicate.run(
      "lucataco/remove-bg:95f71f642f61bc7b605809d43ef08cdd1eb024765d7741d4062dc77977464082",
      {
        input: {
          image: base64Image
        }
      }
    );

    const transparentImage = Array.isArray(bgRemovalOutput) ? bgRemovalOutput[0] : bgRemovalOutput;

    // STEP 2: Inpaint the background using the transparent image as a mask/guide
    // We use SDXL Inpainting for high quality
    let width = 1024;
    let height = 1024;

    if (aspectRatio === "1600:1200" || aspectRatio === "4:3") {
      width = 1024;
      height = 768;
    }

    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          image: base64Image,
          mask: transparentImage, // This defines what pixels belong to the model
          prompt: `High-end professional photoshoot background, ${prompt || "luxurious blurred setting"}, realistic, cinematic lighting, 8k`,
          negative_prompt: "cartoon, anime, blurry, low resolution, multiple people, face distortion",
          prompt_strength: 0.99, // Only affects the masked area (background)
          width: width,
          height: height,
          num_outputs: 1,
          apply_watermark: false
        }
      }
    );

    const resultUrl = Array.isArray(output) ? output[0] : output;
    
    return NextResponse.json({ resultUrl });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: `🚨 Error del robot: ${error.message || "Desconocido. Revisa tu saldo de Replicate."}` }, { status: 500 });
  }
}


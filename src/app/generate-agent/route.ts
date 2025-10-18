import { NextResponse } from "next/server";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs"; // Gemini SDK needs Node runtime

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { videoId } = await req.json();
    if (!videoId) {
      return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
    }
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json({ error: "Missing YOUTUBE_API_KEY" }, { status: 500 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    // --- Step 1: Fetch YouTube comments (limit 100)
    const yt = await axios.get("https://www.googleapis.com/youtube/v3/commentThreads", {
      params: {
        part: "snippet",
        videoId,
        maxResults: 100, // API max is 100
        key: process.env.YOUTUBE_API_KEY,
        order: "relevance",
        textFormat: "plainText",
      },
    });

    const comments: string[] = (yt.data.items || []).map(
      (item: any) => item?.snippet?.topLevelComment?.snippet?.textOriginal ?? ""
    ).filter(Boolean);

    // --- Step 2: Call Gemini to synthesize a persona
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are a marketing assistant. Based on the following YouTube comments, generate a synthetic user persona that represents the typical commenter. Include estimated age group, tone, interests, and a sample comment.

      Comments:
      ${comments.slice(0, 20).map((c, i) => `${i + 1}. ${c}`).join("\n")}

      Respond in STRICT JSON with fields:
      {
        "name": "string",
        "age": "string",
        "tone": "string",
        "interests": ["string", "..."],
        "sampleComment": "string"
      }
      Return ONLY JSON.
      `.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();

    console.log("Gemini JSON (raw):", text);

    let agent: any;
    try {
      agent = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Gemini response was not JSON", raw: text }, { status: 502 });
    }

    return NextResponse.json({ agent });
  } catch (err: any) {
    const msg = err?.response?.data || err?.message || "Unknown error";
    console.error("generate-agent error:", msg);
    return NextResponse.json({ error: "Failed to generate agent", details: msg }, { status: 500 });
  }
}
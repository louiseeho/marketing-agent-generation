import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

type Turn = [user: string, bot: string | null];
type Persona = { name: string; age: string | number; tone: string; interests: string[] };

export async function POST(req: Request) {
  try {
    const body = await req.json() as { 
      persona: Persona; 
      history: Turn[]; 
      temperature?: number;
      responseStyle?: string;
    };
    const { persona, history, temperature = 0.7, responseStyle = "casual" } = body || {};
    if (!persona || !history?.length) {
      return NextResponse.json({ error: "Missing persona or history" }, { status: 400 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Convert your [user, bot] tuples into Gemini chat history
    // Skip the very last user message (we'll send it as the new prompt)
    const pastTurns = history.slice(0, -1);
    const geminiHistory = pastTurns.flatMap(([user, bot]) => {
      const arr: any[] = [];
      if (user) arr.push({ role: "user", parts: [{ text: user }] });
      if (bot)  arr.push({ role: "model", parts: [{ text: bot }] });
      return arr;
    });

    const lastUserMsg = history[history.length - 1]?.[0] ?? "";

    // Build style instruction based on responseStyle setting
    let styleInstruction = "";
    switch (responseStyle) {
      case "formal":
        styleInstruction = "Use a formal, professional tone. Be polite and respectful.";
        break;
      case "emoji-heavy":
        styleInstruction = "Use lots of emojis and expressive language. Be enthusiastic and animated.";
        break;
      case "concise":
        styleInstruction = "Keep responses very short and to-the-point. Be brief and direct.";
        break;
      case "casual":
      default:
        styleInstruction = "Speak informally and reply like you would in YouTube comments. Keep replies concise but specific.";
        break;
    }

    const systemPrompt = `You're a persona named ${persona.name}, a ${persona.age}-year-old who is ${persona.tone}. You're interested in ${persona.interests.join(", ")}. ${styleInstruction}`;

    const chat = await model.startChat({
      history: geminiHistory,
      generationConfig: { temperature: Math.max(0, Math.min(2, temperature)) },
    });

    const result = await chat.sendMessage(`${systemPrompt}\n\n${lastUserMsg}`);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("chat-with-agent error:", err?.message || err);
    return NextResponse.json({ error: "Failed to chat with agent" }, { status: 500 });
  }
}
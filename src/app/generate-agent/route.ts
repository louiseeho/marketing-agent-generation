import { NextResponse } from "next/server";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs"; // Gemini SDK needs Node runtime

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function fetchComments(videoId: string, apiKey: string, maxResults: number = 100, order: string = "relevance"): Promise<string[]> {
  const res = await axios.get("https://www.googleapis.com/youtube/v3/commentThreads", {
    params: {
      part: "snippet",
      videoId,
      maxResults: Math.max(10, Math.min(500, maxResults)),
      order: order === "time" ? "time" : "relevance",
      textFormat: "plainText",
      key: apiKey,
    },
  });

  return (res.data.items || [])
    .map((i: any) => i?.snippet?.topLevelComment?.snippet?.textOriginal ?? "")
    .filter(Boolean);
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      mode = "automatic", 
      videoId, 
      videos, 
      commentCount = 100, 
      commentSort = "relevance",
      relatedVideosCount = 5,
      keywordSensitivity = 50,
    } = body;

    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json({ error: "Missing YOUTUBE_API_KEY" }, { status: 500 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    let finalSample: string[] = [];

    if (mode === "manual" && videos && Array.isArray(videos)) {
      // Manual mode: use provided videos with weights
      console.log("Manual mode: processing videos with weights", videos);

      const allVideoComments: Array<{ videoId: string; comments: string[]; weight: number }> = [];

      // Fetch comments from all videos
      for (const video of videos) {
        if (!video.videoId || !video.weight) continue;
        try {
          const comments = await fetchComments(video.videoId, process.env.YOUTUBE_API_KEY, commentCount, commentSort);
          allVideoComments.push({
            videoId: video.videoId,
            comments: Array.from(new Set(comments)), // Remove duplicates
            weight: video.weight,
          });
        } catch (err: any) {
          console.warn(`Failed to fetch comments for video ${video.videoId}:`, err.message);
        }
      }

      if (allVideoComments.length === 0) {
        return NextResponse.json({ error: "No valid videos provided" }, { status: 400 });
      }

      // Weight comments based on provided weights
      const weightedComments: string[] = [];
      for (const { comments, weight } of allVideoComments) {
        const numComments = Math.round((weight / 100) * 100); // Scale to 100 total comments
        const sampled = shuffleArray(comments).slice(0, numComments);
        weightedComments.push(...sampled);
      }

      finalSample = shuffleArray(weightedComments).slice(0, 100);
    } else {
      // Automatic mode: original logic
      if (!videoId) {
        return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
      }

      // --- Step 1: Fetch YouTube comments (limit 100)
      const allComments: string[] = [];

      // Step 1a: Comments from main video
      const mainComments = await fetchComments(videoId, process.env.YOUTUBE_API_KEY, commentCount, commentSort);
      allComments.push(...mainComments);

      console.log("Fetching related videos for videoId:", videoId, typeof videoId);

      // Step 1a.5: Fetch video title
      const videoMeta = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          part: "snippet",
          id: videoId,
          key: process.env.YOUTUBE_API_KEY,
        },
      });

      const videoTitle = videoMeta.data?.items?.[0]?.snippet?.title || "";

      // Step 1b: Generate keyword search query using Gemini
      const keywordModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

      // Adjust prompt based on keyword sensitivity
      let sensitivityInstruction = "";
      if (keywordSensitivity <= 33) {
        // Narrow: Focus on exact topic
        sensitivityInstruction = "Focus on extracting keywords that are **very specific to the exact topic and content** of this video. Prioritize keywords that match the precise subject matter, avoiding broader themes. The goal is to find videos that are nearly identical in topic.";
      } else if (keywordSensitivity >= 67) {
        // Broad: More diverse, related topics
        sensitivityInstruction = "Extract keywords that capture **broader themes, related topics, and diverse content** that viewers of this video might also enjoy. Think about adjacent topics, similar genres, and related interests. The goal is to find videos that are thematically related but may cover different aspects or perspectives.";
      } else {
        // Balanced: Current behavior
        sensitivityInstruction = "These videos could be related by **topic, tone, genre, audience, or creator style**. Your goal is to capture the *core themes, community interests, and format* that define the viewing experience — not just literal details from the video. Think about what types of content YouTube would recommend to viewers who liked this, even if those videos aren't exactly on the same topic.";
      }

      const keywordPrompt = `
    You are a YouTube recommendation strategist. Based on the following video title and comments, extract 5 to 7 concise keywords or short phrases that would help surface *similar videos* on YouTube.

    ${sensitivityInstruction}

    Title: "${videoTitle}"

    Comments:
    ${allComments.slice(0, 20).map((c, i) => `${i + 1}. ${c}`).join("\n")}

    Return a JSON array of strings. Do NOT include any explanation.
    `.trim();

      const keywordResult = await keywordModel.generateContent(keywordPrompt);
      const keywordsText = keywordResult.response.text().replace(/```json|```/g, "").trim();
      let keywords: string[] = [];

      try {
        keywords = JSON.parse(keywordsText);
      } catch {
        return NextResponse.json({ error: "Gemini keyword response was not JSON", raw: keywordsText }, { status: 502 });
      }

      console.log("Extracted keywords for video search:", keywords);

      // Step 1c: Use keywords to search for related videos
      const keywordQuery = keywords.join(" ");

      const searchResults = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
          part: "snippet",
          q: keywordQuery,
          type: "video",
          maxResults: Math.max(1, Math.min(20, relatedVideosCount)),
          key: process.env.YOUTUBE_API_KEY,
        },
      });

      const relatedVideoIds = searchResults.data.items.map((item: any) => item.id.videoId);

      console.log("Related video IDs from keyword query:", relatedVideoIds);

      // Step 1d: Fetch comments from keyword-based related videos
      const relatedComments: string[] = [];
      for (const relId of relatedVideoIds) {
        try {
          const comments = await fetchComments(relId, process.env.YOUTUBE_API_KEY, commentCount, commentSort);
          relatedComments.push(...comments);
          allComments.push(...comments);
        } catch (err: any) {
          console.warn(`Failed to fetch comments for related video ${relId}:`, err.message);
        }
      }

      const uniqueMain = Array.from(new Set(mainComments));
      const uniqueRelated = Array.from(new Set(relatedComments));
      const mainSample = shuffleArray(uniqueMain).slice(0, 100); // prioritize main
      const relatedSample = shuffleArray(uniqueRelated).slice(0, 100); // some related
      const combinedSample = [...mainSample, ...relatedSample];
      finalSample = shuffleArray(combinedSample).slice(0, 100); // final mix
    }

    // --- Step 2: Call Gemini to synthesize a persona
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are a marketing assistant. Based on the following YouTube comments, generate a synthetic user persona that represents the typical commenter. Include estimated age group, tone, interests, and a sample comment.

      Comments:
      ${finalSample.slice(0, 30).map((c, i) => `${i + 1}. ${c}`).join("\n")}

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
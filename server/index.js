import express from "express";
import cors from "cors";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function fetchRedditThread(url) {
  try {
    const jsonUrl = url.replace(/\/$/, "") + ".json?limit=100";

    const response = await axios.get(jsonUrl, {
      headers: {
        "User-Agent": "RedditSummarizer/1.0",
      },
    });
    const data = response.data;
    const post = data[0].data.children[0].data;
    const comments = data[1].data.children;

    const postData = {
      title: post.title,
      selftext: post.selftext || "",
      score: post.score,
      num_comments: post.num_comments,
      created_utc: post.created_utc,
      subreddit: post.subreddit,
      author: post.author,
      url: post.url,
      permalink: post.permalink,
      domain: post.domain,
      is_self: post.is_self,
    };

    const topComments = comments
      .filter(
        (comment) =>
          comment.data.body &&
          comment.data.body !== "[deleted]" &&
          comment.data.body !== "[removed]"
      )
      .slice(0, 20)
      .map((comment) => ({
        body: comment.data.body,
        score: comment.data.score,
        author: comment.data.author,
        created_utc: comment.data.created_utc,
      }));

    return {
      post: postData,
      comments: topComments,
    };
  } catch (error) {
    console.error("Error fetching Reddit data:", error);
    throw new Error("Failed to fetch Reddit thread");
  }
}

async function generateSummary(postData, comments) {
  try {
    const commentsText = comments
      .map((comment) => `Comment (${comment.score} upvotes): ${comment.body}`)
      .join("\n\n");

    const prompt = `
        Analyze this Reddit thread and provide a comprehensive summary:
ORIGINAL POST:
Title: ${postData.title}
Content: ${postData.selftext || "No text content"}
Subreddit: r/${postData.subreddit}
Score: ${postData.score} upvotes

TOP COMMENTS:
${commentsText}

Please provide:
1. MAIN SUMMARY (2-3 sentences about the post and overall discussion)
2. KEY POINTS (2-3 bullet points of main arguments/ideas)
3. POPULAR OPINIONS (2 points what most people seem to agree on)
4. CONTROVERSIAL TAKES (1-2 points of opposing viewpoints or debated points)
5. OVERALL SENTIMENT (positive/negative/neutral and why 1-2 points)

Keep it very concise but informative. It should be quick to read.
        `;
    const response = await ai.models.generateContent(
      {
        model: "gemini-2.5-flash-lite",
        contents: prompt,
      }
    );
    console.log("Gemini response:", JSON.stringify(response, null, 2));

    return response.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Failed to generate AI summary");
  }
}

app.post("/api/summarize", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.includes("reddit.com")) {
      return res.status(400).json({ error: "Invalid Reddit URL" });
    }

    console.log("Fetching Reddit thread:", url);
    const redditData = await fetchRedditThread(url);

    console.log("Generating AI summary...");
    const summary = await generateSummary(redditData.post, redditData.comments);

    res.json({
      success: true,
      data: {
        post: redditData.post,
        summary: summary,
        commentsAnalyzed: redditData.comments.length,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Reddit Summarizer API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const apiKey = process.env.DEEPSEEK_API_KEY;

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
2. KEY POINTS (3-5 bullet points of main arguments/ideas)
3. POPULAR OPINIONS (what most people seem to agree on)
4. CONTROVERSIAL TAKES (opposing viewpoints or debated points)
5. OVERALL SENTIMENT (positive/negative/neutral and why)

Keep it concise but informative.
        `;
    const completion = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3-0324:free",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );
    const result = await completion.json();
    console.log("OpenAI response:", JSON.stringify(result, null, 2));

    return result.choices[0].message.content;
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

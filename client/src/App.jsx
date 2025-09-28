import { useState, useEffect } from "react";
import { Search, Loader2, Sparkles, TrendingUp } from "lucide-react";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  function parseSummary(summaryStr) {
  const sections = {};
  // Define possible headers (case-insensitive)
  const headers = [
    "MAIN SUMMARY",
    "KEY POINTS",
    "POPULAR OPINIONS",
    "CONTROVERSIAL TAKES",
    "OVERALL SENTIMENT",
  ];

  let currentHeader = null;
  let currentContent = [];

  // Split lines to process each separately
  const lines = summaryStr.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  lines.forEach((line) => {
    const matchedHeader = headers.find(
      (h) => line.toUpperCase().startsWith(h.toUpperCase())
    );

    if (matchedHeader) {
      // Save previous section
      if (currentHeader) {
        sections[currentHeader] = currentContent.join(" ").trim();
      }
      currentHeader = matchedHeader;
      currentContent = [line.replace(new RegExp(`^${matchedHeader}`, "i"), "").trim()];
    } else {
      currentContent.push(line);
    }
  });

  // Save last section
  if (currentHeader) {
    sections[currentHeader] = currentContent.join(" ").trim();
  } else {
    sections["Summary"] = currentContent.join(" ").trim();
  }

  // Convert bullet points starting with * to array
  Object.keys(sections).forEach((key) => {
    if (sections[key].includes("*")) {
      const bullets = sections[key]
        .split("*")
        .map((b) => b.replace(/\*\*/g, "").trim())
        .filter(Boolean);
      sections[key] = bullets;
    } else {
      sections[key] = sections[key].replace(/\*\*/g, "").trim();
    }
  });

  return sections;
}


  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a Reddit URL");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://localhost:5000/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize thread");
      }

      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) =>
    new Date(timestamp * 1000).toLocaleDateString();

  const formatSummary = (summary) => {
    const sections = summary.split(/\d+\.\s*/);
    return sections.filter((section) => section.trim().length > 0);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-700 via-black to-slate-700 relative overflow-hidden">
      <div className="relative z-10 mx-auto px-6 py-8">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-1000 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span className="text-white/90 text-sm font-medium">
              TL;DR Maker
            </span>
          </div>

          <h1 className="text-7xl font-black bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-6 tracking-tight">
            Reddit Thread
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Summarizer
            </span>
          </h1>

          <p className="text-xl text-white/70 max-w-xl mx-auto leading-relaxed">
            Transform lengthy Reddit discussions into concise, intelligent
            summaries with the power of AI
          </p>
        </div>
        {/* Input Form */}
        <div
          className={`transition-all duration-1000 delay-200 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="w-full mx-auto bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-4 mb-10 max-w-4xl hover:bg-white/15 transition-all duration-500">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Input */}
              <div className="relative group">
                <label
                  htmlFor="url"
                  className="block text-white/90 font-semibold mb-3 ml-14"
                >
                  Reddit Thread URL
                </label>

                <div className="relative w-full max-w-3xl mx-auto">
                  {/* Search icon inside input */}
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />

                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.reddit.com/r/example/comments/..."
                    disabled={loading}
                    className="w-full bg-white/20 backdrop-blur-sm text-white placeholder-white/50 pl-12 pr-4 py-3 rounded-2xl border border-white/30 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300 group-hover:bg-white/25"
                  />

                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`min-w-30 relative overflow-hidden bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold text-lg !rounded-full py-5 px-10 shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] group ${
                    loading ? "cursor-wait" : "cursor-pointer"
                  }`}
                >
                  <div className="absolute rounded-full inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex justify-center items-center gap-4">
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-6 w-6" />
                        <span className="animate-pulse">
                          Analyzing Thread...
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                        <span>Summarize Thread</span>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="relative overflow-hidden bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-5 text-red-200 animate-[slideIn_0.3s_ease-out]">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10"></div>
                  <div className="relative font-medium">{error}</div>
                </div>
              )}
            </form>
          </div>
        </div>
        {/* Results */}
        {result && (
          <div className="space-y-8 animate-[fadeInUp_0.8s_ease-out]">
            {" "}
            {/* Thread Info */}{" "}
            <section className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-500 hover:shadow-2xl">
              {" "}
              <h2 className="text-3xl font-bold text-white mb-4">
                {" "}
                {result.post.title}{" "}
              </h2>{" "}
              {result.post.selftext && (
                <p className="text-white/80 leading-relaxed mb-6">
                  {" "}
                  {result.post.selftext.length > 250
                    ? result.post.selftext.substring(0, 250) + "..."
                    : result.post.selftext}{" "}
                </p>
              )}{" "}
              <div className="flex flex-wrap gap-4 text-sm text-white/70">
                {" "}
                <span>👤 u/{result.post.author}</span>{" "}
                <span>📌 r/{result.post.subreddit}</span>{" "}
                <span>👍 {result.post.score} upvotes</span>{" "}
                <span>💬 {result.post.num_comments} comments</span>{" "}
                <span>⏰ {formatDate(result.post.created_utc)}</span>{" "}
              </div>{" "}
            </section>{" "}
            {/* AI Summary */}
            {/* Dynamic AI Summary */}
            <section className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-500 hover:shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
                AI Summary
              </h2>

              <div className="space-y-8 text-white/90 leading-relaxed">
                {Object.entries(parseSummary(result.summary)).map(
                  ([section, content], idx) => (
                    <div key={idx}>
                      <h3 className="text-2xl font-semibold text-purple-300 mb-3">
                        {section}
                      </h3>
                      {Array.isArray(content) ? (
                        <div className="list-disc list-inside space-y-2">
                          {content.map((point, i) => (
                            <div key={i}>{point.trim()}</div>
                          ))}
                        </div>
                      ) : (
                        <p>{content.trim()}</p>
                      )}
                    </div>
                  )
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

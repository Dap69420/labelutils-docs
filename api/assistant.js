const DEFAULT_MODEL = "Meta-Llama-3.3-70B-Instruct";
const DEFAULT_ENDPOINT = "https://api.sambanova.ai/v1/chat/completions";

async function readJson(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  if (req.body && typeof req.body === "string") {
    return JSON.parse(req.body);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function normalizeContext(context) {
  if (!Array.isArray(context)) {
    return "";
  }

  return context
    .slice(0, 5)
    .map((item, index) => {
      const title = String(item.title || `Doc ${index + 1}`).slice(0, 120);
      const href = String(item.href || "/").slice(0, 120);
      const text = String(item.text || "").replace(/\s+/g, " ").slice(0, 1400);
      return `Source ${index + 1}: ${title} (${href})\n${text}`;
    })
    .join("\n\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Use POST." });
    return;
  }

  const apiKey = process.env.SAMBANOVA_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Assistant is not configured. Add SAMBANOVA_API_KEY in Vercel." });
    return;
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch {
    res.status(400).json({ error: "Invalid JSON body." });
    return;
  }

  const question = String(payload.question || "").trim();
  if (!question) {
    res.status(400).json({ error: "Question is required." });
    return;
  }

  const context = normalizeContext(payload.context);
  const endpoint = process.env.SAMBANOVA_API_BASE_URL || DEFAULT_ENDPOINT;
  const model = process.env.SAMBANOVA_MODEL || DEFAULT_MODEL;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You are the LabelUtils docs assistant. Answer only from the provided docs context. Be concise, practical, and mention exact commands when useful. If the docs do not contain the answer, say you are not sure and suggest checking the full docs or contacting support.",
          },
          {
            role: "user",
            content: `Docs context:\n${context || "No matching docs were found."}\n\nQuestion: ${question}`,
          },
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      res.status(response.status).json({
        error: data.error?.message || data.message || "SambaNova request failed.",
      });
      return;
    }

    const answer = data.choices?.[0]?.message?.content || data.output_text || "";
    res.status(200).json({ answer: answer.trim() || "I could not find a useful answer in the docs." });
  } catch {
    res.status(500).json({ error: "Assistant request failed." });
  }
}

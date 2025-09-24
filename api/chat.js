function setCors(req, res) {
  const origin = req.headers.origin || "null"; // file:// requests usually send Origin: null
  const allowed = ["null", "https://si-ai-support.vercel.app"]; // adjust if your domain changes

  const allow = allowed.includes(origin) ? origin : "null";

  res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end(); // Handle CORS preflight
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages, ...rest } = req.body || {};

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        ...rest
      })
    });

    const text = await upstream.text();
    const status = upstream.status;

    try {
      return res.status(status).json(JSON.parse(text));
    } catch {
      return res.status(status).json({ raw: text });
    }
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}


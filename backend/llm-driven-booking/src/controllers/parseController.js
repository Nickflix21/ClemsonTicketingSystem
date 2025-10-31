import fetch from "node-fetch";

// helper function to find the closest match
function findClosestEvent(userEvent, eventList) {
  if (!userEvent || !eventList.length) return "Unknown Event";

  // normalize: lowercase, remove punctuation and parentheses
  const normalize = (str) =>
    str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

  const user = normalize(userEvent);

  let bestMatch = "Unknown Event";
  let highestScore = 0;

  for (const event of eventList) {
    const candidate = normalize(event);

    // token overlap score
    const userWords = user.split(/\s+/);
    const candWords = candidate.split(/\s+/);

    const matches = userWords.filter((w) => candWords.includes(w)).length;
    const score = matches / Math.max(userWords.length, candWords.length);

    if (score > highestScore) {
      highestScore = score;
      bestMatch = event;
    }
  }

  // if at least 1 keyword overlaps or 40% similarity, consider it matched
  return highestScore >= 0.4 ? bestMatch : "Unknown Event";
}


export const parseController = async (req, res) => {
  try {
    const { text } = req.body;

    // 1️⃣ Fetch events dynamically
    const eventRes = await fetch("http://localhost:6001/api/events");
    const eventData = await eventRes.json();
    const eventNames = eventData.map((e) => e.name);

    // 2️⃣ Build LLM prompt
    const prompt = `
You are a natural language parser for the Clemson University ticket booking chatbot.

Available events:
${eventNames.map((e) => `- ${e}`).join("\n")}

Extract user intent ("propose_booking", "show_events", or "other"),
event name (if possible), and number of tickets (default 1).

Respond with **only JSON**, for example:
{
  "intent": "propose_booking",
  "event": "Clemson Football Hate Watch",
  "tickets": 2
}

User: ${text}
`;

    // 3️Query Ollama
    const result = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1:latest",
        prompt,
        stream: false,
      }),
    });

    const data = await result.json();
    let responseText = data.response?.trim() || "";
    console.log("LLM raw output:", responseText);

  
    // 4️Extract valid JSON from model output
    // Clean response text: remove comments, trailing commas, etc.
    let cleaned = responseText
      .replace(/\/\/.*$/gm, "")       // remove JS-style comments
      .replace(/,\s*}/g, "}")         // remove trailing commas before }
      .replace(/,\s*]/g, "]")         // remove trailing commas before ]
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    let parsed;

    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.error("JSON parse failed:", err);
        console.warn("Raw (cleaned) text was:", cleaned);
        parsed = { intent: "other", event: "Unknown Event", tickets: 1 };
      }
    } else {
      console.warn("No JSON found in LLM output:", cleaned);
      parsed = { intent: "other", event: "Unknown Event", tickets: 1 };
    }

    // 5️Apply fuzzy matching to correct event name
    if (parsed.event === "Unknown Event" || !eventNames.includes(parsed.event)) {
      const corrected = findClosestEvent(parsed.event || text, eventNames);
      parsed.event = corrected;
    }

    // 6️Ensure tickets default to 1
    if (!parsed.tickets || parsed.tickets <= 0) parsed.tickets = 1;

    return res.json(parsed);
  } catch (err) {
    console.error("Parse error:", err);
    return res
      .status(500)
      .json({ error: "Failed to parse natural language input." });
  }
};

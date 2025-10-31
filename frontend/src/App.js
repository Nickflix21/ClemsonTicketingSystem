import React, { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const eventsRef = useRef([]);
  const [pendingBooking, setPendingBooking] = useState(null);
  const bookingRef = useRef(pendingBooking);

useEffect(() => {
  bookingRef.current = pendingBooking;
}, [pendingBooking]);

  // --------------------------------------------------------
  // Fetch events from backend (client-service)
  // --------------------------------------------------------
  useEffect(() => {
    fetch("http://localhost:6001/api/events")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch events");
        return res.json();
      })
      .then((data) => {
        setEvents(data);
        eventsRef.current = data;

        console.log("Events fetched from backend:", data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
        setLoading(false);
      });
  }, []);

  // --------------------------------------------------------
  // Ticket purchase
  // --------------------------------------------------------
  const buyTicket = async (id, name) => {
    try {
      const res = await fetch(
        `http://localhost:6001/api/events/${id}/purchase`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: 1 }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Purchase failed");
      }

      alert(`Ticket purchased for: ${name}`);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, tickets: (e.tickets ?? 0) - 1 } : e
        )
      );
    } catch (err) {
      console.error("Error purchasing ticket:", err);
      alert(`${err.message}`);
    }
  };

  // --------------------------------------------------------
  // Voice interaction + LLM integration
  // --------------------------------------------------------
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  const initVoiceAssistant = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const micBtn = document.getElementById("mic-btn");
    const beep = document.getElementById("beep-sound");
    const chatWindow = document.getElementById("chat-window");

    if (!micBtn || !chatWindow) {
      console.warn("Voice elements not found yet — retrying...");
      setTimeout(initVoiceAssistant, 300); // retry after render
      return;
    }

    micBtn.addEventListener("click", () => {
      if (beep) {
        beep.currentTime = 0;
        beep.play().catch(() => console.warn("Beep sound failed to play."));
      }
      setTimeout(() => recognition.start(), 400);
    });

    recognition.addEventListener("result", async (event) => {
      const text = event.results[0][0].transcript;

      const msg = document.createElement("div");
      msg.className = "user-msg";
      msg.textContent = text;
      chatWindow.appendChild(msg);

      await sendToLLM(text, chatWindow);
    });

    recognition.addEventListener("speechend", () => recognition.stop());
    recognition.addEventListener("error", (e) =>
      console.error("Speech error:", e.error)
    );
  };

  // Run setup after short delay to ensure DOM loaded
  setTimeout(initVoiceAssistant, 500);
}, []);


  // --------------------------------------------------------
  // Sends recognized speech text to LLM backend and handles reply
  // --------------------------------------------------------
const sendToLLM = async (text, chatWindow) => {
  try {
    // Handle confirmation keywords first
    if (bookingRef.current) {
      const response = text.toLowerCase();
      const current = bookingRef.current; // always the latest booking info

      console.log("DEBUG - current bookingRef:", bookingRef.current);
      console.log("DEBUG - all events fetched from DB:", events);

      if (response.includes("yes")) {
        const current = bookingRef.current;
        console.log("Booking confirmation detected. Looking for:", current.event);

        // Normalize both sides
        const normalize = (str) =>
          str
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, "")
            .replace(/\s+/g, " ")
            .trim();

        const normalizedTarget = normalize(current.event);
        console.log("🔎 Normalized target:", normalizedTarget);

        // Print available events
        console.log("Available events:");
        events.forEach((e, i) => console.log(`  [${i}] ${normalize(e.name)}`));

        // Try to find best match
        let bestMatch = null;
        let highestScore = 0;

        for (const e of events) {
          const normalizedEvent = normalize(e.name);
          // simple similarity: count matching words
          const targetWords = new Set(normalizedTarget.split(" "));
          const eventWords = new Set(normalizedEvent.split(" "));
          const intersection = [...targetWords].filter((w) =>
            eventWords.has(w)
          ).length;
          const union = new Set([...targetWords, ...eventWords]).size;
          const score = intersection / union;

          if (score > highestScore) {
            highestScore = score;
            bestMatch = e;
          }
        }

        console.log("Best match:", bestMatch?.name, "score:", highestScore);

        if (!bestMatch || highestScore < 0.25) {
          speakResponse(
            "Sorry, I couldn’t find that event to complete the booking."
          );
          const failMsg = document.createElement("div");
          failMsg.className = "bot-msg";
          failMsg.textContent = "Could not find the event. Please try again.";
          chatWindow.appendChild(failMsg);
          setPendingBooking(null);
          return;
        }

        // Proceed with booking
        const res = await fetch(
          `http://localhost:6001/api/events/${bestMatch.id}/purchase`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: current.tickets }),
          }
        );

        if (res.ok) {
          speakResponse(`Your tickets for ${bestMatch.name} have been booked.`);
          const successMsg = document.createElement("div");
          successMsg.className = "bot-msg";
          successMsg.textContent = `Successfully booked ${current.tickets} ticket(s) for ${bestMatch.name}!`;
          chatWindow.appendChild(successMsg);
        } else {
          speakResponse("Sorry, I couldn’t complete the booking.");
        }

        setPendingBooking(null);
        return;
      }
    }

    // Normal LLM request
    const res = await fetch("http://localhost:6101/api/llm/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error("LLM backend not responding");
    const data = await res.json();

    const reply = document.createElement("div");
    reply.className = "bot-msg";

    if (data.intent === "propose_booking") {
      reply.textContent = `I found ${data.event} with ${data.tickets} ticket(s). Would you like to confirm this booking?`;
      chatWindow.appendChild(reply);
      speakResponse(reply.textContent);
      setPendingBooking({ event: data.event, tickets: data.tickets }); // stores booking info
    } else if (data.intent === "show_events") {
      reply.textContent = "Here are the available events on campus.";
      chatWindow.appendChild(reply);
      speakResponse(reply.textContent);
    } else {
      reply.textContent = `You said: "${text}"`;
      chatWindow.appendChild(reply);
      speakResponse(`You said ${text}`);
    }
  } catch (err) {
    console.error("LLM error:", err);
    const failMsg = document.createElement("div");
    failMsg.className = "bot-msg";
    failMsg.textContent = "Sorry, I could not reach the LLM service.";
    chatWindow.appendChild(failMsg);
    speakResponse(failMsg.textContent);
  }
};




  // --------------------------------------------------------
  // Text-to-Speech (clear, slower for accessibility)
  // --------------------------------------------------------
  const speakResponse = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // --------------------------------------------------------
  // Loading & empty states
  // --------------------------------------------------------
  if (loading) return <h2>Loading events...</h2>;
  if (!events.length) return <h2>No events found.</h2>;

  // --------------------------------------------------------
  // Render UI
  // --------------------------------------------------------
  return (
    <main className="App">
      <h1 tabIndex="0">Clemson Campus Events</h1>

      {/* Voice Interface Section */}
      <div id="voice-interface">
        <h3>Voice Assistant</h3>
        <div id="chat-window" aria-live="polite"></div>
        <button id="mic-btn" className="mic-btn">
          🎤 Speak
        </button>
        <audio id="beep-sound" src="beep.mp3" preload="auto"></audio>
      </div>

      {/* Event list */}
      <ul>
        {events.map((event) => {
          const available = event.tickets ?? 0;
          return (
            <li key={event.id}>
              <article aria-label={`Event: ${event.name}`} tabIndex="0">
                <h2>{event.name}</h2>
                <p>Date: {event.date}</p>
                <p>Tickets available: {available}</p>
                <button
                  onClick={() => buyTicket(event.id, event.name)}
                  disabled={available <= 0}
                  aria-disabled={available <= 0}
                  aria-label={
                    available > 0
                      ? `Buy ticket for ${event.name}`
                      : `${event.name} is sold out`
                  }
                  style={{
                    outline:
                      available > 0 ? "2px solid orange" : "2px solid purple",
                  }}
                >
                  {available > 0
                    ? `Buy Ticket for ${event.name}`
                    : "Sold Out"}
                </button>
              </article>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default App;

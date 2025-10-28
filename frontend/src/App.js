import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch events from backend
  useEffect(() => {
    fetch('http://localhost:6001/api/events')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
      })
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching events:', err);
        setLoading(false);
      });
  }, []);

  // Ticket purchase
  const buyTicket = async (id, name) => {
    try {
      const res = await fetch(`http://localhost:6001/api/events/${id}/purchase`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Purchase failed');
      }

      alert(`Ticket purchased for: ${name}`);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, tickets: (e.tickets ?? 0) - 1 } : e
        )
      );
    } catch (err) {
      console.error('Error purchasing ticket:', err);
      alert(`${err.message}`);
    }
  };

  // -----------------------------
  // 🔊 Voice Interaction Section
  // -----------------------------
  useEffect(() => {
    window.SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!window.SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser.');
      return;
    }

    const recognition = new window.SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const micBtn = document.getElementById('mic-btn');
    const beep = document.getElementById('beep-sound');
    const chatWindow = document.getElementById('chat-window');

    if (!micBtn) return;

    micBtn.addEventListener('click', () => {
      beep.play();
      setTimeout(() => recognition.start(), 400);
    });

    recognition.addEventListener('result', (event) => {
      const text = event.results[0][0].transcript;

      const msg = document.createElement('div');
      msg.className = 'user-msg';
      msg.textContent = text;
      chatWindow.appendChild(msg);

      // Optional: interpret or forward to backend LLM
      handleVoiceCommand(text);
    });

    recognition.addEventListener('speechend', () => recognition.stop());
    recognition.addEventListener('error', (e) => console.error('Speech error:', e.error));

    const handleVoiceCommand = (text) => {
      const reply = document.createElement('div');
      reply.className = 'bot-msg';

      // Simple keyword demo
      if (text.toLowerCase().includes('show events')) {
        reply.textContent = 'Displaying available events below.';
        chatWindow.appendChild(reply);
        speak('Displaying available events below.');
      } else if (text.toLowerCase().includes('buy')) {
        reply.textContent = 'To purchase, select the Buy Ticket button for your event.';
        chatWindow.appendChild(reply);
        speak('To purchase, select the Buy Ticket button for your event.');
      } else {
        reply.textContent = `You said: "${text}"`;
        chatWindow.appendChild(reply);
        speak(`You said ${text}`);
      }
    };

    const speak = (text) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    };
  }, []);
  // -----------------------------

  // Loading & empty states
  if (loading) return <h2>Loading events...</h2>;
  if (!events.length) return <h2>No events found.</h2>;

  return (
    <main className="App">
      <h1 tabIndex="0">Clemson Campus Events</h1>

      {/* Voice Interface Section */}
      <div id="voice-interface">
        <h3>Voice Assistant</h3>
        <div id="chat-window" aria-live="polite"></div>
        <button id="mic-btn">Speak</button>
        <audio id="beep-sound" src="beep.mp3" preload="auto"></audio>
      </div>

      {/* Existing event list */}
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
                    outline: available > 0 ? '2px solid orange' : '2px solid purple',
                  }}
                >
                  {available > 0 ? `Buy Ticket for ${event.name}` : 'Sold Out'}
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

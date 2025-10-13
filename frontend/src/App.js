import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <h2>Loading events...</h2>;

  if (!events.length) return <h2>No events found.</h2>;

  return (
    <main className="App">
      <h1 tabIndex="0">Clemson Campus Events</h1>
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
                  aria-label={ // Aria labels
                    available > 0
                      ? `Buy ticket for ${event.name}`
                      : `${event.name} is sold out`
                  }
                  style={{
                    outline: available > 0 ? '2px solid orange' : '2px solid purple', // Visible focus indicators
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

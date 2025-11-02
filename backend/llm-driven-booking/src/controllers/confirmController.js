import dotenv from "dotenv";
dotenv.config();

const CLIENT_BASE = process.env.CLIENT_BASE || "http://localhost:6001";

/**
 * Purpose: Confirms the user’s booking by forwarding the request to the
 *          client-service and returning the result
 * Input: Client_base - strinf, the base URL of the client-service
 *        JSON object, the event id and the number of tickets
 * Ouput: JSON confirmation or error message depending on transaction success
 */
export async function confirmController(req, res) {
  try {
    const { eventId, tickets } = req.body || {};

    if (!eventId || !Number.isInteger(tickets) || tickets <= 0) {
      return res
        .status(400)
        .json({ error: "eventId (int) and tickets (int > 0) are required." });
    }

    // Send booking request to the client-service
    const purchaseUrl = `${CLIENT_BASE}/api/events/${eventId}/purchase`;
    console.log(`Calling ${purchaseUrl} to confirm ${tickets} tickets...`);

    const response = await fetch(purchaseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: tickets }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Purchase failed:", text);
      return res.status(response.status).json({ error: "Ticket purchase failed." });
    }

    const data = await response.json();
    console.log("Booking confirmed:", data);

    res.json({
      ok: true,
      eventId,
      purchased: data.purchased,
      remainingTickets: data.remainingTickets,
    });
  } catch (err) {
    console.error("Confirm booking error:", err);
    res.status(500).json({ error: "Failed to confirm booking." });
  }
}

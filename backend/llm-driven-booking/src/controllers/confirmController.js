/**
 * confirmController.js
 * Purpose:
 *   Handles confirmed bookings by calling the client-service purchase endpoint.
 */

import dotenv from "dotenv";
dotenv.config();

const CLIENT_BASE = process.env.CLIENT_BASE || "http://localhost:6001";

/**
 * POST /api/llm/confirm
 * Body: { eventId: 1, tickets: 2 }
 * Output: confirmation result or error message
 */
export async function confirmController(req, res) {
  try {
    const { eventId, tickets } = req.body || {};

    if (!eventId || !Number.isInteger(tickets) || tickets <= 0) {
      return res
        .status(400)
        .json({ error: "eventId (int) and tickets (int > 0) are required." });
    }

    // 🔗 Send booking request to the client-service
    const purchaseUrl = `${CLIENT_BASE}/api/events/${eventId}/purchase`;
    console.log(`➡️ Calling ${purchaseUrl} to confirm ${tickets} tickets...`);

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
    console.log("✅ Booking confirmed:", data);

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

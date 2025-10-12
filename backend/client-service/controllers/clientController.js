import { getAllEvents, purchaseTicket } from "../models/clientModel.js";

// Handles the GET /api/event request
export async function listEvents(_req, res) {
  try {
    // Fetch all the rows in the database
    const events = await getAllEvents();
    // Sends a generic successful response with the events as JSON
    return res.status(200).json({ events });
  } catch (err) {
    // Handles any errors that occur during the request
    console.error(err);
    // Sends a generic error response with the events as JSON
    return res.status(500).json({ error: "Server error" });
  }
}

// Handles the POST /api/events/:id/purchase request
export async function purchase(req, res) {
  // Reads the id from the URL parameter
  const id = Number(req.params.id);
  // Validates the id
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid event id" });
  }
  try {
    // Calls the model function to decrement the ticket count
    const result = await purchaseTicket(id);
    // If the purchase was not successful, return the appropriate error response
    if (!result.ok) {
        return res.status(result.code).json({ error: result.error });
    }
    return res.status(200).json({ message: "Purchase successful", event: result.event });
  } catch (err) {
    console.error(err);
    // Sends a generic error response with the events as JSON
    return res.status(500).json({ error: "Server error" });
  }
}

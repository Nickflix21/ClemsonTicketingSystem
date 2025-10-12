import express from "express";
import { listEvents, purchase } from "../controllers/clientController.js";

// Create a router and define routes
const router = express.Router();
// Route to list all events
router.get("/events", listEvents);
// Route to purchase a ticket for an event
router.post("/events/:id/purchase", purchase);
// Export the router so it can mount it to /api
export default router;

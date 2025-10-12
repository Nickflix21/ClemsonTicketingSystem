import express from "express";
import clientRoutes from "./routes/clientRoutes.js";

// Initialize the Express application
const app = express();
// Sets the port for the client service
const PORT = 6001;

// Parse JSON request bodies
app.use(express.json());
// Use the client routes for API endpoints
app.use("/api", clientRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Client service running on http://localhost:${PORT}`);
});

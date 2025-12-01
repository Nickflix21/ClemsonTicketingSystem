import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { parseController } from "./controllers/parseController.js";
import { confirmController } from "./controllers/confirmController.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// LLM endpoints
app.post("/api/llm/parse", parseController);
app.post("/api/llm/confirm", confirmController);

/**
 * Purpose: Launches the LLM-driven booking microservice on the specified port
 * Input: None
 * Ouput: Active Express server and console confirmation message
 */
const PORT = parseInt(process.env.PORT, 10) || 6101;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`llm-driven-booking listening on ${PORT}`);
});

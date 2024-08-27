/** @format */

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

// Initialize the Google Generative AI instance with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

export default genAI;

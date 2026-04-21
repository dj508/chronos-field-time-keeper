/**
 * ZenTask AI Reminder - Gemini Service
 * Handles AI-powered task parsing and daily inspiration
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Priority, Category } from "../types";

/**
 * Initialize Google GenAI client with API key from environment
 */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Parse natural language task input using AI
 * @param input - Natural language description of the task
 * @returns Parsed task details or null if parsing fails
 */
export const parseSmartTask = async (input: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse the following natural language task input and extract details: "${input}". 
      Assume today is ${new Date().toISOString()}. 
      Return the data in the requested JSON schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            dueDate: { type: Type.STRING, description: "ISO 8601 string" },
            priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
            category: { type: Type.STRING, enum: ["Work", "Personal", "Home", "Health", "Finance", "Other"] }
          },
          propertyOrdering: ["title", "description", "dueDate", "priority", "category"]
        }
      }
    });

    const jsonStr = response.text?.trim();
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch (error) {
    console.error("AI Parsing Error:", error);
    return null;
  }
};

/**
 * Get daily motivational message based on task count
 * @param taskCount - Number of tasks for the day
 * @returns Motivational message
 */
export const getDailyInspiration = async (taskCount: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user has ${taskCount} tasks for today. Give a short, one-sentence motivational booster and a quick productivity tip. Keep it professional and calming.`,
    });
    return response.text || "Stay focused and mindful today.";
  } catch (error) {
    return "Stay focused and mindful today.";
  }
};

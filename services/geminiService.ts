import { GoogleGenAI, Type } from "@google/genai";
import { RockAnalysis } from "../types.ts";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const identifyRock = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<RockAnalysis> => {
  try {
    const base64Data = base64Image.split(',')[1];
    
    // Schema definition for structured output
    const schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Common name of the rock or mineral" },
        scientificName: { type: Type.STRING, description: "Scientific or chemical name" },
        description: { type: Type.STRING, description: "A brief, interesting description of the mineral (max 2-3 sentences)" },
        economicValue: { 
          type: Type.STRING, 
          enum: ["Low", "Moderate", "High", "Very High"],
          description: "Potential economic value rating"
        },
        economicDetails: { type: Type.STRING, description: "Explanation of why it has this value (e.g. industrial use, gemstone, ore)" },
        containsPreciousMetals: { type: Type.BOOLEAN, description: "Does it traditionally contain or indicate gold, silver, copper, etc?" },
        associatedMetals: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "List of metals often found with this rock (e.g. Gold, Silver, Copper, Iron)"
        },
        confidence: {
          type: Type.NUMBER,
          description: "Confidence score of the identification between 0 and 100 based on visual clarity and distinct features."
        },
        alternatives: {
          type: Type.ARRAY,
          description: "Two other rocks this might be if the identification is wrong",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING, description: "Brief distinction why it looks similar but is different" },
              wikiUrl: { type: Type.STRING, description: "Full Wikipedia URL for this alternative" }
            }
          }
        }
      },
      required: ["name", "scientificName", "description", "economicValue", "economicDetails", "containsPreciousMetals", "associatedMetals", "alternatives", "confidence"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Analyze this image. Identify the rock or mineral. Provide economic assessment, confidence score (0-100), and list if it is associated with precious metals. If uncertain, provide the most likely candidate and then 2 alternatives."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4 // Lower temperature for more factual analysis
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as RockAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};
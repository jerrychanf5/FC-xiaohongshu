import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to get model appropriate for task
const getTextModel = () => "gemini-2.5-flash";

export const generateListingContent = async (
  imageBase64: string,
  sellingPoints: string,
  persona: string,
  targetAudience: string,
  strategies: string[]
): Promise<GeneratedContent[]> => {
  
  // Fallback if no strategies selected
  const activeStrategies = strategies.length > 0 ? strategies : ['智能推荐', '痛点刺激法', '场景化描述'];
  
  const prompt = `
    You are an expert real estate marketing copywriter for "Xiaohongshu" (Little Red Book).
    
    Context:
    - User Role/Persona: "${persona ? persona : 'Professional Agent'}".
    - Target Audience: "${targetAudience ? targetAudience : 'General home buyers'}".
    - Property Selling Points: "${sellingPoints}".
    
    Task:
    Analyze the image and selling points. Then, generate ${activeStrategies.length} DISTINCT content variations.
    Each variation must be based on one of the following Creative Strategies:
    ${activeStrategies.map((s, i) => `${i+1}. ${s}`).join('\n')}
    
    For EACH strategy, provide:
    1. A viral Title (using [] for emphasis).
    2. An engaging Post Body (Simplified Chinese with emojis).
    3. A specific "Cover Design Suggestion" telling the user how to design the image based on this strategy (e.g., "Use bold red text", "Focus on the window view").
    4. Relevant Tags.
    5. A Hex Color.
    6. 3 Short Visual Tags for the cover. CRITICAL: Max 3 tags, each tag MUST be 6 characters or less.

    CRITICAL: All output text MUST be in Simplified Chinese (简体中文).
    Output Format: JSON Array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: getTextModel(),
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(',')[1]
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              strategy: { type: Type.STRING, description: "The name of the strategy used (e.g., 'Digital Contrast')." },
              title: { type: Type.STRING, description: "Short viral title with [] emphasis." },
              content: { type: Type.STRING, description: "Full caption." },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedColor: { type: Type.STRING },
              sellingPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 3 short visual tags (max 6 chars each)." },
              coverAdvice: { type: Type.STRING, description: "Specific advice on how to style the cover image for this strategy." }
            },
            required: ["strategy", "title", "content", "tags", "suggestedColor", "sellingPoints", "coverAdvice"]
          }
        }
      }
    });

    if (response.text) {
      const results = JSON.parse(response.text) as GeneratedContent[];
      // Add simple IDs for keying
      return results.map((r, i) => ({ ...r, id: `gen_${Date.now()}_${i}` }));
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const regenerateListingContent = async (
  currentContent: GeneratedContent,
  feedback: string,
  imageBase64: string
): Promise<GeneratedContent> => {
  const prompt = `
    User wants to modify the previous real estate content based on this feedback: "${feedback}".
    
    Current Strategy: ${currentContent.strategy}
    Previous Title: ${currentContent.title}
    Previous Content: ${currentContent.content}
    
    Please optimize the content, title, and cover advice to address the user's feedback while maintaining the style.
    Ensure "sellingPoints" (Visual Tags) are concise: Max 3 tags, each tag MAX 6 characters.
    
    CRITICAL: All output text MUST be in Simplified Chinese (简体中文).
    Return a single JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: getTextModel(),
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(',')[1]
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategy: { type: Type.STRING },
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedColor: { type: Type.STRING },
            sellingPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 3 short visual tags (max 6 chars each)." },
            coverAdvice: { type: Type.STRING }
          },
          required: ["strategy", "title", "content", "tags", "suggestedColor", "sellingPoints", "coverAdvice"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text) as GeneratedContent;
      return { ...result, id: currentContent.id }; // Maintain ID
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
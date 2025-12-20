
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserPersona, FeedbackRating } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const scrapeAndTranscribe = async (url: string): Promise<string> => {
  const ai = getAI();
  const isSocial = /instagram\.com|tiktok\.com|twitter\.com|x\.com/.test(url);
  
  const promptText = isSocial 
    ? `Analyze this social media URL: ${url}. Use Google Search to find the post caption, the creator's name, the date, and any significant context. Provide a comprehensive "transcript" of the post's content and its visual description if possible.`
    : `Please use search to find the full content of this URL: ${url}. Provide a detailed transcript or summary of the article or page, focusing on key facts, figures, and the author's main arguments.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: promptText }] },
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No content returned from search.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.map((c: any) => c.web?.uri).filter(Boolean);
    const uniqueSources = Array.from(new Set(sources));
    const sourceList = uniqueSources.length > 0 ? `\n\nVerified Sources:\n${uniqueSources.join('\n')}` : "";
    
    return text + sourceList;
  } catch (error) {
    console.error("Gemini Scrape Error:", error);
    throw new Error("The content engine failed to reach the target URL.");
  }
};

export const rewriteContent = async (
  originalContent: string, 
  persona: UserPersona, 
  targetPlatform: string,
  pastFeedback: FeedbackRating[] = []
): Promise<string> => {
  const ai = getAI();
  const feedbackContext = pastFeedback.length > 0 ? `\nLEARNING FROM PAST FEEDBACK: ${pastFeedback.join(', ')}.` : "";

  const promptText = `
    REWRITE TASK
    Platform: ${targetPlatform}
    Identity Name: ${persona.name}
    Business Context: ${persona.businessInfo}
    Tone: ${persona.tone}
    Key Facts: ${persona.facts}
    Key Figures: ${persona.figures}
    Audience: ${persona.targetAudience}
    Branding/Visual Context: ${persona.branding}
    ${feedbackContext}
    Original Content: ${originalContent}
    Instructions: Rewrite for the platform strictly adhering to the tone and facts.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [{ text: promptText }] },
  });
  return response.text || "Failed to rewrite content.";
};

export const parseQuestionnaire = async (fileContent: string): Promise<Partial<UserPersona>> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Parse the following Identity Questionnaire and extract it into a structured JSON persona profile.
    
    Content:
    ${fileContent}
    
    Required JSON Schema:
    - name: Profile display name
    - businessInfo: Detailed summary of what the business does and user's role
    - branding: Summary of logo, visual identity, colors
    - tone: Primary communication style/voice (e.g. Visionary, Analyst, Edgy)
    - facts: Key company truths/mission
    - figures: Important statistics or success metrics
    - targetAudience: Who the content is for
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          businessInfo: { type: Type.STRING },
          branding: { type: Type.STRING },
          tone: { type: Type.STRING },
          facts: { type: Type.STRING },
          figures: { type: Type.STRING },
          targetAudience: { type: Type.STRING }
        },
        required: ["name", "businessInfo", "branding", "tone", "facts", "figures", "targetAudience"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const refineContent = async (
  currentContent: string,
  feedback: string,
  persona: UserPersona
): Promise<string> => {
  const ai = getAI();
  const promptText = `
    REFINEMENT TASK
    Current Draft: "${currentContent}"
    User Feedback: "${feedback}"
    Identity Constraints: Tone is ${persona.tone}, target is ${persona.targetAudience}.
    Instructions: Update the current draft based on the user feedback. Maintain the core identity.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [{ text: promptText }] },
  });
  return response.text || currentContent;
};

export const generateVisual = async (prompt: string, aspectRatio: "1:1" | "16:9" | "9:16"): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio } }
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  throw new Error("No image generated");
};

export const refineVisual = async (originalPrompt: string, feedback: string, aspectRatio: "1:1" | "16:9" | "9:16"): Promise<string> => {
  const ai = getAI();
  const updatedPrompt = `Modify the previous visual idea based on this feedback: "${feedback}". Original context: ${originalPrompt}`;
  return generateVisual(updatedPrompt, aspectRatio);
};

export const chatAssistant = async (history: { role: 'user' | 'model', parts: { text: string }[] }[]): Promise<string> => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are a helpful creative assistant in a high-end modern content workstation."
    }
  });
  const lastMsg = history[history.length - 1].parts[0].text;
  const response = await chat.sendMessage({ message: lastMsg });
  return response.text || "I'm sorry, I couldn't process that.";
};


import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserPersona, FeedbackRating } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) {
    console.warn("WARNING: No API Key detected. Ensure GEMINI_API_KEY or API_KEY is set in your .env.local file.");
  }
  return new GoogleGenerativeAI(apiKey);
};

export const scrapeAndTranscribe = async (url: string): Promise<string> => {
  const genAI = getAI();
  const isSocial = /instagram\.com|tiktok\.com|twitter\.com|x\.com/.test(url);

  const promptText = isSocial
    ? `Analyze this social media URL: ${url}. Use Google Search to find the post caption, the creator's name, the date, and any significant context. Provide a comprehensive "transcript" of the post's content and its visual description if possible.`
    : `Please use search to find the full content of this URL: ${url}. Provide a detailed transcript or summary of the article or page, focusing on key facts, figures, and the author's main arguments.`;

  // Helper to attempt generation with a specific config
  const attemptGen = async (modelName: string, tools: any[] | undefined) => {
    console.log(`Attempting ingestion with model: ${modelName}, tools: ${!!tools}`);
    const model = genAI.getGenerativeModel({ model: modelName, tools });
    const result = await model.generateContent(promptText);
    return result.response;
  };

  try {
    let response;

    // Strategy 1: gemini-1.5-flash with standard googleSearch (most stable)
    try {
      response = await attemptGen('gemini-1.5-flash', [{ googleSearch: {} } as any]);
    } catch (e) {
      console.warn('Strategy 1 failed:', e);
      // Strategy 2: gemini-1.5-flash-002 (specific version)
      try {
        response = await attemptGen('gemini-1.5-flash-002', [{ googleSearch: {} } as any]);
      } catch (e2) {
        console.warn('Strategy 2 failed:', e2);
        // Strategy 3: gemini-2.0-flash-exp (experimental, robust connectivity but specific tool needs)
        // Using no tools as a last resort fallback to at least get a simulated response is better than a crash
        // But we prefer tools.
        try {
          // Try experimental Dynamic Retrieval tool syntax
          response = await attemptGen('gemini-2.0-flash-exp', [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "mode_dynamic", dynamicThreshold: 0.6 } } } as any]);
        } catch (e3) {
          console.warn('Strategy 3 failed:', e3);
          // FINAL ATTEMPT: No tools, just raw analysis (might hallucinate but keeps app alive)
          response = await attemptGen('gemini-1.5-flash', undefined);
        }
      }
    }

    if (!response) throw new Error("All ingestion strategies exhausted.");

    const text = response.text();
    const grounding = response.candidates?.[0]?.groundingMetadata;
    const chunks = (grounding as any)?.groundingChunks || [];
    const sources = chunks.map((c: any) => c.web?.uri).filter(Boolean);
    const uniqueSources = Array.from(new Set(sources));
    const sourceList = uniqueSources.length > 0 ? `\n\nVerified Sources:\n${uniqueSources.join('\n')}` : "";

    return text + sourceList;
  } catch (error) {
    console.error("Gemini Scrape Error:", error);
    throw new Error("The content engine failed to reach the target URL. Error: " + (error as Error).message);
  }
};

export const rewriteContent = async (
  originalContent: string,
  persona: UserPersona,
  targetPlatform: string,
  pastFeedback: FeedbackRating[] = []
): Promise<string> => {
  const genAI = getAI();
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

  // Fallback chain for rewrite as well
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(promptText);
    return result.response.text();
  } catch (e) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(promptText);
    return result.response.text();
  }
};

export const parseQuestionnaire = async (fileContent: string): Promise<Partial<UserPersona>> => {
  const genAI = getAI();
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash', // Using flash for speed/reliability on JSON
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const prompt = `Parse the following Identity Questionnaire and extract it into a structured JSON persona profile.
    
    Content:
    ${fileContent}
    
    Required JSON Schema (return ONLY raw JSON):
    {
      "name": "Profile display name",
      "businessInfo": "Detailed summary of what the business does and user's role",
      "branding": "Summary of logo, visual identity, colors",
      "tone": "Primary communication style/voice (e.g. Visionary, Analyst, Edgy)",
      "facts": "Key company truths/mission",
      "figures": "Important statistics or success metrics",
      "targetAudience": "Who the content is for"
    }
    `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};

export const refineContent = async (
  currentContent: string,
  feedback: string,
  persona: UserPersona
): Promise<string> => {
  const genAI = getAI();
  const promptText = `
    REFINEMENT TASK
    Current Draft: "${currentContent}"
    User Feedback: "${feedback}"
    Identity Constraints: Tone is ${persona.tone}, target is ${persona.targetAudience}.
    Instructions: Update the current draft based on the user feedback. Maintain the core identity.
  `;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const result = await model.generateContent(promptText);
  return result.response.text();
};

export const generateVisual = async (prompt: string, aspectRatio: "1:1" | "16:9" | "9:16"): Promise<string> => {
  return Promise.resolve("Visual generation requires Imagen-specific configuration. (Prompt captured: " + prompt + ")");
};

export const refineVisual = async (originalPrompt: string, feedback: string, aspectRatio: "1:1" | "16:9" | "9:16"): Promise<string> => {
  return generateVisual(`${originalPrompt} + ${feedback}`, aspectRatio);
};

export const chatAssistant = async (history: { role: 'user' | 'model', parts: { text: string }[] }[]): Promise<string> => {
  const genAI = getAI();
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: "You are a helpful creative assistant in a high-end modern content workstation."
  });

  const lastMsg = history[history.length - 1].parts[0].text;

  const chat = model.startChat({
    history: history.slice(0, -1).map(h => ({
      role: h.role,
      parts: h.parts
    }))
  });

  const result = await chat.sendMessage(lastMsg);
  return result.response.text();
};

export const generatePodcastTitle = async (
  transcript: string,
  guest?: string,
  episodeNumber?: string,
  platform?: string
): Promise<string> => {
  const genAI = getAI();
  // Using gemini-2.0-flash-exp for creativity and speed
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  let platformInstruction = "";
  if (platform) {
    if (platform === 'YouTube') platformInstruction = "- Optimized for YouTube: High CTR, emotional hook or clear value proposition. Max 60 chars optimal.";
    if (platform === 'Instagram') platformInstruction = "- Optimized for Instagram: Short, punchy, meme-style or aesthetic hook. Emoji friendly.";
    if (platform === 'LinkedIn') platformInstruction = "- Optimized for LinkedIn: Professional, insight-driven, 'thought leader' style. clear value for business.";
    if (platform === 'X') platformInstruction = "- Optimized for X (Twitter): Thread hook style, controversial or surprising statement. Short.";
  }

  const prompt = `
      EXTRACT & TITLE GENERATION
      Task: Generate a catchy, punchy podcast episode title (6-12 words).
      ${platform ? `Target Platform: ${platform}` : ''}
      
      Context:
      Episode #: ${episodeNumber || 'N/A'}
      Guest: ${guest || 'N/A'}
      
      Transcript/Content Excerpt:
      ${transcript.slice(0, 5000)}... (truncated for brevity)
      
      Requirements:
      - 6 to 12 words long.
      - Style: Factual, Catchy, and Viral (High CTR but honest).
      - Punchy, clear topic promise.
      - NO clickbait (e.g. avoided "You won't believe").
      - If guest is known, can include their name naturally.
      - Return ONLY the title text. No quotes.
      - Make it distinct from previous attempts if any.
      ${platformInstruction}
    `;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

export const analyzeIntentAndIssues = async (
  content: string,
  persona?: UserPersona
): Promise<string> => {
  const genAI = getAI();
  // Use gemini-2.0-flash-exp (same as generatePodcastTitle which works)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const personaContext = persona 
    ? `Target Audience Context: ${persona.targetAudience}
    Business Context: ${persona.businessInfo}`
    : '';

  const prompt = `
    Analyze the following content transcript/caption.
    Identify the underlying INTENT of the creator and the ISSUES/PAIN POINTS they are addressing for their audience.
    ${personaContext ? `\n    ${personaContext}` : ''}

    Content:
    ${content}

    Task:
    Generate 5 concise, actionable bullet points that extract the key insights, intent, and issues from this content.
    Focus on the "Why" and the "What Next". Use the "Intent / Issues" framework.
    ${personaContext ? 'Tailor the insights to the target audience and business context provided above.' : 'Make the insights broadly applicable and actionable.'}
    
    Output Format:
    - Point 1
    - Point 2
    - Point 3
    - Point 4
    - Point 5
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const extractNotableQuotes = async (
  transcript: string,
  guest?: string
): Promise<string> => {
  const genAI = getAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `
    NOTABLE QUOTE EXTRACTION
    
    You are an expert content strategist analyzing a podcast transcript. Your task is to identify 3 POWERFUL, QUOTABLE moments that could be expanded into standalone content pieces.

    ${guest ? `Guest: ${guest}` : ''}
    
    Transcript:
    ${transcript.slice(0, 8000)}
    
    SELECTION CRITERIA:
    - Look for statements that are bold, insightful, or counterintuitive
    - Prioritize quotes with emotional impact or "aha moment" potential
    - Choose quotes that could spark discussion or controversy
    - Select quotes that represent key insights or unique perspectives
    - Find quotes that would work well as social media posts, article headlines, or video clips
    
    FORMAT REQUIREMENTS:
    - Extract the EXACT quote as spoken (clean up filler words like "um", "uh" if needed)
    - Keep quotes between 1-3 sentences
    - Each quote should be self-contained and understandable without context
    
    OUTPUT FORMAT:
    Quote 1: "[Exact quote here]"
    
    Quote 2: "[Exact quote here]"
    
    Quote 3: "[Exact quote here]"
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const synthesizeContent = async (
  seedQuote: string,
  contextSources: string,
  platform: string,
  persona?: UserPersona | null
): Promise<string> => {
  const genAI = getAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const personaContext = persona ? `
    BRAND VOICE:
    - Tone: ${persona.tone}
    - Target Audience: ${persona.targetAudience}
    - Business Context: ${persona.businessInfo}
    - Key Facts: ${persona.facts}
    - Key Figures: ${persona.figures}
  ` : '';

  const platformGuidelines: Record<string, string> = {
    'LinkedIn': `
      - Start with a KILLER first line (8-12 words max). Make it provocative or insight-driven.
      - Keep it concise (150-250 words).
      - Use short paragraphs (1-2 sentences max).
      - Include data points or "receipts" from the context sources.
      - End with a question or CTA to drive comments.
      - NO hashtags. NO emojis.
      - Professional but punchy tone.
    `,
    'YouTube': `
      - Create a script hook that grabs attention in first 5 seconds.
      - Reference the quote as the central thesis.
      - Include data points from context sources as supporting evidence.
      - Structure: Hook → Problem → Quote/Insight → Data → Call to Action
      - Conversational, energetic tone.
      - 200-400 words.
    `,
    'Instagram': `
      - Punchy, scroll-stopping first line.
      - Break into short, digestible chunks.
      - Use the quote as the centerpiece.
      - Back up with one key data point.
      - End with engagement question.
      - 100-150 words max.
      - Can include relevant emojis sparingly.
    `,
    'Twitter/X': `
      - Thread format: 3-5 tweets.
      - First tweet is the hook (use the quote or provocative statement).
      - Following tweets provide context and data.
      - Last tweet is CTA or question.
      - Each tweet under 280 characters.
      - No hashtags in thread body.
    `
  };

  const prompt = `
    CONTENT SYNTHESIS TASK
    
    You are an expert content strategist. Your job is to synthesize a powerful piece of content using a seed quote and supporting context sources.
    
    SEED QUOTE (This is the central thesis/hook):
    "${seedQuote}"
    
    CONTEXT SOURCES (Use these to add data, credibility, and depth):
    ${contextSources || 'No additional context provided.'}
    
    ${personaContext}
    
    TARGET PLATFORM: ${platform}
    
    PLATFORM-SPECIFIC GUIDELINES:
    ${platformGuidelines[platform] || 'Create professional, engaging content.'}
    
    SYNTHESIS REQUIREMENTS:
    1. The seed quote should be the central hook or thesis
    2. Weave in relevant data/insights from context sources naturally
    3. Make it feel like expert analysis, not AI-generated
    4. Match the platform's native content style
    5. Include at least one specific data point or fact from context
    6. End with engagement driver (question, CTA, or provocative statement)
    
    Generate the content now:
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

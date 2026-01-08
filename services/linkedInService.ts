import { GoogleGenerativeAI } from "@google/generative-ai";

const getAI = () => {
    const apiKey = process.env.API_KEY || '';
    return new GoogleGenerativeAI(apiKey);
};

export async function generateLinkedInPost(transcriptText: string, userDNA?: any): Promise<string> {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are an expert LinkedIn content strategist specializing in Private Lending and Real Estate Investment.

YOUR MISSION: Transform the following podcast transcript into a VIRAL LinkedIn post.

CONTEXT:
- Niche: Private Lending for Real Estate Investors (Single-Family, Multifamily, DSCR, Ground-up Construction)
- Goal: Thought leadership, engagement, lead generation
- Tone: Expert, Direct, Data-backed

RULES:
1. Start with a KILLER first line (8-12 words max). Make it provocative or insight-driven.
2. Keep it concise (150-250 words).
3. Use short paragraphs (1-2 sentences max).
4. Include 1-2 data points or "receipts" if available in the transcript.
5. End with a question or CTA to drive comments.
6. NO hashtags. NO emojis.

TRANSCRIPT:
${transcriptText.substring(0, 3000)}

Generate the LinkedIn post now:`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

export async function generateLinkedInArticle(transcriptText: string, userDNA?: any): Promise<{ title: string; content: string }> {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are an expert LinkedIn content strategist specializing in Private Lending and Real Estate Investment.

YOUR MISSION: Transform the following podcast transcript into a COMPREHENSIVE LinkedIn Article.

CONTEXT:
- Niche: Private Lending for Real Estate Investors (Single-Family, Multifamily, DSCR, Ground-up Construction)
- Goal: Authority building, deep insights, lead magnets
- Tone: Expert, Professional, Insightful

RULES:
1. Create a compelling TITLE (60-80 characters, optimized for clicks).
2. Structure:
   - Introduction (Hook the reader)
   - 3-5 Key Insights (Use ## for section headers)
   - Conclusion with CTA
3. Length: 800-1200 words.
4. Use data and specific examples from the transcript.
5. Professional formatting (Markdown).

TRANSCRIPT:
${transcriptText.substring(0, 5000)}

Generate the article in the following JSON format:
{
  "title": "Your Article Title Here",
  "content": "Full markdown content here"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Try to parse JSON, fallback to simple parsing
    try {
        const parsed = JSON.parse(responseText);
        return parsed;
    } catch {
        // Fallback: extract title and content manually
        const titleMatch = responseText.match(/"title":\s*"([^"]+)"/);
        const contentMatch = responseText.match(/"content":\s*"([^"]+)"/s);
        return {
            title: titleMatch ? titleMatch[1] : "Untitled Article",
            content: contentMatch ? contentMatch[1].replace(/\\n/g, '\n') : responseText
        };
    }
}

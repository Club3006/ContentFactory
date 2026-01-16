# Environment Setup Instructions

## Create .env File

Create a file named `.env` in the root directory (`/Users/cgf_air/Documents/Cursor/ContentFactory/.env`) with the following content:

```bash
# OpenAI API Key (for Whisper voice transcription)
VITE_OPENAI_API_KEY=your-openai-key-here

# Apify API Token (for web scraping)
VITE_APIFY_API_TOKEN=your-apify-token-here

# Gemini API Key (optional)
VITE_GEMINI_API_KEY=your-gemini-key-here
```

## Quick Setup via Terminal

Run this command in your terminal:

```bash
cd /Users/cgf_air/Documents/Cursor/ContentFactory

cat > .env << 'EOF'
# OpenAI API Key (for Whisper voice transcription)
VITE_OPENAI_API_KEY=your-openai-key-here

# Apify API Token (for web scraping)
VITE_APIFY_API_TOKEN=your-apify-token-here

# Gemini API Key (optional)
VITE_GEMINI_API_KEY=your-gemini-key-here
EOF
```

## Verify Setup

After creating the `.env` file, restart your dev server:

```bash
npm run dev
```

## Security Note

✅ The `.env` file is now in `.gitignore` and will NOT be committed to git.
✅ Your API keys are safe and local to your machine.

## What Each Key Does

### VITE_OPENAI_API_KEY
- **Used for**: Voice transcription in ScraperPro (microphone button)
- **Service**: OpenAI Whisper API
- **Cost**: $0.006 per minute of audio
- **Status**: ✅ Already added!

### VITE_APIFY_API_TOKEN
- **Used for**: Web scraping (URLs from YouTube, Instagram, LinkedIn, Twitter, etc.)
- **Service**: Apify actors
- **Get it**: https://console.apify.com/account/integrations
- **Status**: ⏳ Add your token when ready

### VITE_GEMINI_API_KEY
- **Used for**: AI content generation (optional)
- **Service**: Google Gemini
- **Get it**: https://makersuite.google.com/app/apikey
- **Status**: ⏳ Optional - add if needed

---

**Last Updated**: January 16, 2026


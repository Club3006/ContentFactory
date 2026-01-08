# Content Factory PRO

A high-performance content generation engine inspired by 1990s MacOS aesthetics. Powered by the Google Gemini API (Gemini 3 Pro and Gemini 2.5 Flash Image).

## Features
- **Neural Ingestion**: Paste URLs (Instagram, YouTube, Articles) to generate deep-context transcripts using Google Search grounding.
- **Riff Vault**: Log paragraph-style ideas and "riffs" directly into a persistent database.
- **Multi-Identity Calibration**: Upload custom identity files to define tone, branding, facts, and target audiences.
- **Production Lab**: Transform source material into platform-ready assets for Instagram, LinkedIn, and YouTube.
- **Visual Synthesis**: Generate high-fidelity visual assets using the NanoBanana (Gemini 2.5 Flash Image) model.
- **Iterative Refinement**: Chat-based refinement of both text and visual outputs.

## Tech Stack
- **AI Engine**: @google/genai (Gemini 3 Pro Preview / Gemini 2.5 Flash Image)
- **Frontend**: React 19, Tailwind CSS
- **Design System**: 1990s Retro-Futurist (MacOS Classic)
- **Deployment Ready**: Standard ES6 Module structure

## Setup
1. Clone the repository.
2. Ensure `process.env.API_KEY` is configured with a valid Google Gemini API Key.
3. Open `index.html` in a modern browser.

## Data Persistence
All data is stored in the browser's `localStorage`. Use the "Export Neural State" feature in Settings to download backups of your vault and identities.

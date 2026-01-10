
// Browser-compatible Apify Service using Fetch API
// Removing apify-client as it depends on Node.js 'events' module

// Support both old process.env and new import.meta.env patterns
// Vite config maps these from .env.local
const getApifyToken = (): string => {
  const token = 
    import.meta.env.VITE_APIFY_API_TOKEN || 
    (typeof process !== 'undefined' && process.env?.APIFY_API_TOKEN) ||
    '';
    
  if (!token) {
    console.warn("Missing APIFY_API_TOKEN. Please set it in .env.local");
  }
  return token;
};

export interface TranscriptResult {
    url: string;
    transcriptText: string;
    contentType: 'html' | 'pdf' | 'other';
    title?: string;
    author?: string;
}

export const fetchTranscript = async (url: string): Promise<TranscriptResult> => {
    // Determine Actor ID
    // Using 'apify/website-content-crawler' (actorId: a4b5Zq152Q58) or similar.
    // Let's use 'apify/website-content-crawler' -> username~actorname mapping can be tricky in API V2 paths if not using ID.
    // 'apify/website-content-crawler' is safe.

    // We will use the 'run-sync-get-dataset-items' convenience endpoint if possible, 
    // BUT that is for existing runs.

    // Better flow for browser:
    // 1. POST /acts/apify~website-content-crawler/runs?token=...&waitForFinish=120
    // 2. Extract defaultDatasetId from response
    // 3. GET /datasets/[id]/items?token=...

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    // Choose actor based on content type
    const APIFY_TOKEN = getApifyToken();
    if (!APIFY_TOKEN) {
        throw new Error("Apify API token not configured. Please set VITE_APIFY_API_TOKEN in .env.local");
    }
    
    const actorId = isYouTube ? 'streampot~youtube-transcript-scraper' : 'apify~website-content-crawler';
    const apiUrl = `/apify-proxy/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}&waitForFinish=120`;

    let input: any;
    if (isYouTube) {
        input = { videoUrl: url };
    } else {
        input = {
            startUrls: [{ url }],
            maxCrawlDepth: 0,
            maxCrawlPages: 1,
            saveHtml: false,
            saveMarkdown: true
        };
    }

    try {
        console.log(`[Apify] Starting run for ${url}...`);
        
        // Add timeout wrapper for the fetch
        const fetchWithTimeout = (url: string, options: RequestInit, timeout = 150000) => {
            return Promise.race([
                fetch(url, options),
                new Promise<Response>((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout after 150 seconds')), timeout)
                )
            ]);
        };
        
        const runResponse = await fetchWithTimeout(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(input)
        });

        if (!runResponse.ok) {
            const errText = await runResponse.text();
            throw new Error(`Apify Run Failed: ${runResponse.status} - ${errText}`);
        }

        const runData = await runResponse.json();
        const datasetId = runData.data.defaultDatasetId;
        const status = runData.data.status;

        if (status !== 'SUCCEEDED') {
            throw new Error(`Apify Actor finished with status: ${status}`);
        }

        console.log(`[Apify] Run Succeeded. Fetching dataset ${datasetId}...`);

        // Fetch Dataset (reuse token from closure)
        const datasetUrl = `/apify-proxy/v2/datasets/${datasetId}/items?token=${getApifyToken()}`;
        const datasetResponse = await fetch(datasetUrl);

        if (!datasetResponse.ok) {
            throw new Error("Failed to fetch dataset items.");
        }

        const items = await datasetResponse.json();

        if (!items || items.length === 0) {
            throw new Error("No content extracted from the URL.");
        }

        const Item = items[0] as any;

        let textContent = "";
        let title = "";
        let author = "";

        if (isYouTube) {
            textContent = Item.text || Item.transcript || "";
            title = Item.title || "";
            author = Item.channelName || "";
        } else {
            textContent = Item.markdown || Item.text || "";
            title = Item.metadata?.title || "";
            author = Item.metadata?.author || "";
        }

        return {
            url,
            transcriptText: textContent,
            contentType: isYouTube ? 'other' : 'html', // 'other' for video/youtube
            title,
            author
        };

    } catch (error) {
        console.error("Apify Service Error:", error);
        throw error;
    }
};

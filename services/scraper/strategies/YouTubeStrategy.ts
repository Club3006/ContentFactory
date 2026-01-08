import { ScraperStrategy, ScrapeResult } from '../types';

// @ts-ignore
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';

export class YouTubeStrategy implements ScraperStrategy {
    canHandle(input: string | File): boolean {
        if (typeof input !== 'string') return false;
        try {
            const url = new URL(input);
            const hostname = url.hostname.toLowerCase();
            return hostname.includes('youtube.com') || hostname.includes('youtu.be');
        } catch {
            return false;
        }
    }

    async scrape(input: string): Promise<ScrapeResult> {
        const url = input;
        const actorId = 'streampot~youtube-transcript-scraper';
        // Add waitForFinish
        const apiUrl = `/apify-proxy/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}&waitForFinish=120`;

        // valid input for streampot/youtube-transcript-scraper is often just 'input' or 'videoId' or 'url'
        // based on search results, 'videoUrl' is likely, but let's try to be robust.
        // Many Apify actors take 'startUrls' or 'videoUrl'.
        // Let's assume 'videoUrl' is the key based on common patterns for this specific actor type.
        const runInput = { videoUrl: url };

        console.log(`[YouTubeStrategy] Starting run for ${url} with input:`, runInput);

        const runResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(runInput)
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

        const datasetUrl = `/apify-proxy/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`;
        const datasetResponse = await fetch(datasetUrl);

        if (!datasetResponse.ok) throw new Error("Failed to fetch dataset items.");

        const items = await datasetResponse.json();
        if (!items || items.length === 0) throw new Error("No transcript found.");

        const item = items[0];
        // Combine text if multiple segments or just take text
        const textContent = item.text || item.transcript || "";

        return {
            content: textContent,
            url,
            title: item.title,
            contentType: 'video',
            metadata: {
                thumbnail: item.thumbnailUrl,
                duration: item.duration,
                channel: item.channelName
            }
        };
    }
}

import { ScraperStrategy, ScrapeResult } from '../types';

// @ts-ignore
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';

export class LinkedInStrategy implements ScraperStrategy {
    canHandle(input: string | File): boolean {
        if (typeof input !== 'string') return false;
        try {
            const url = new URL(input);
            const hostname = url.hostname.toLowerCase();
            return hostname.includes('linkedin.com') && (hostname.includes('/posts/') || hostname.includes('/feed/update/'));
        } catch {
            return false;
        }
    }

    async scrape(input: string): Promise<ScrapeResult> {
        const url = input;
        // Using 'curious_coder/linkedin-post-scraper' (usually good for single posts)
        // Alternative: 'katerinahub/linkedin-post-scraper'
        const actorId = 'katerinahub~linkedin-post-scraper';
        const apiUrl = `/apify-proxy/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}&waitForFinish=120`;

        const runInput = {
            startUrls: [{ url }],
            maxPosts: 1
        };

        console.log(`[LinkedInStrategy] Starting run for ${url}...`);

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
        const items = await datasetResponse.json();

        if (!items || items.length === 0) throw new Error("No content found.");

        const item = items[0];

        return {
            content: item.text || item.usage || "",
            url,
            author: item.authorName || item.user?.name,
            contentType: 'post',
            metadata: {
                likes: item.likesNumber || item.numLikes,
                comments: item.commentsNumber || item.numComments
            }
        };
    }
}

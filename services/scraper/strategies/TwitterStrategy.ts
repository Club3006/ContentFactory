import { ScraperStrategy, ScrapeResult } from '../types';

// @ts-ignore
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';

export class TwitterStrategy implements ScraperStrategy {
    canHandle(input: string | File): boolean {
        if (typeof input !== 'string') return false;
        try {
            const url = new URL(input);
            const hostname = url.hostname.toLowerCase();
            return hostname.includes('twitter.com') || hostname.includes('x.com');
        } catch {
            return false;
        }
    }

    async scrape(input: string): Promise<ScrapeResult> {
        const url = input;
        // Using 'apidojo/tweet-scraper' or 'apify/twitter-scraper'
        // 'apify/twitter-scraper' is official.
        const actorId = 'apify~twitter-scraper';
        const apiUrl = `/apify-proxy/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}&waitForFinish=120`;

        const runInput = {
            startUrls: [{ url }],
            tweetsDesired: 1,
            mode: 'replies' // or 'own' depending on need, often just finding the specific tweet
        };

        console.log(`[TwitterStrategy] Starting run for ${url}...`);

        const runResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(runInput)
        });

        if (!runResponse.ok) {
            throw new Error(`Apify Run Failed: ${runResponse.status}`);
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

        if (!items || items.length === 0) throw new Error("No tweets found.");

        const item = items[0];

        return {
            content: item.full_text || item.text || "",
            url,
            author: item.user?.screen_name || item.user?.name,
            contentType: 'post',
            metadata: {
                likes: item.favorite_count,
                retweets: item.retweet_count,
                replies: item.reply_count
            }
        };
    }
}

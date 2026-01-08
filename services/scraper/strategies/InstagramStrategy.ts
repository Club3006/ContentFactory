import { ScraperStrategy, ScrapeResult } from '../types';

// @ts-ignore
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';

export class InstagramStrategy implements ScraperStrategy {
    canHandle(input: string | File): boolean {
        if (typeof input !== 'string') return false;
        try {
            const url = new URL(input);
            const hostname = url.hostname.toLowerCase();
            return hostname.includes('instagram.com');
        } catch {
            return false;
        }
    }

    async scrape(input: string): Promise<ScrapeResult> {
        const url = input;
        const actorId = 'apify~instagram-scraper';
        const apiUrl = `/apify-proxy/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}&waitForFinish=120`;

        const runInput = {
            directUrls: [url],
            resultsType: 'posts',
            searchType: 'hashtag', // Default param needed sometimes
            searchLimit: 1
        };

        console.log(`[InstagramStrategy] Starting run for ${url}...`);

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

        if (!items || items.length === 0) throw new Error("No content found.");

        const item = items[0];

        let content = item.caption || "";

        // Handle Carousel Slides (childPosts)
        if (item.childPosts && Array.isArray(item.childPosts) && item.childPosts.length > 0) {
            content += "\n\n--- Carousel Slides ---\n";
            item.childPosts.forEach((slide: any, index: number) => {
                const alt = slide.alt || "No description";
                // We typically get 'displayUrl' or 'videoUrl' for children
                const slideUrl = slide.videoUrl || slide.displayUrl || "";

                content += `\nSlide ${index + 1}: ${alt}`;
                if (slideUrl) {
                    content += `\n![Slide ${index + 1}](${slideUrl})`;
                }
            });
        }

        return {
            content,
            url,
            author: item.ownerUsername,
            contentType: item.type === 'Sidecar' ? 'carousel' : 'post',
            metadata: {
                likes: item.likesCount,
                comments: item.commentsCount,
                imageUrl: item.displayUrl,
                childPosts: item.childPosts, // Save raw data too
                timestamp: item.timestamp
            }
        };
    }
}

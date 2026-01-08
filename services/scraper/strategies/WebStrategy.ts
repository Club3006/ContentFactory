import { ScraperStrategy, ScrapeResult } from '../types';

// @ts-ignore
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';

export class WebStrategy implements ScraperStrategy {
    canHandle(input: string | File): boolean {
        // Basic web URL detection, excluding specific platforms handled by other strategies
        if (typeof input !== 'string') return false;
        try {
            const url = new URL(input);
            const hostname = url.hostname.toLowerCase();
            return !hostname.includes('youtube.com') &&
                !hostname.includes('youtu.be') &&
                !hostname.includes('linkedin.com') &&
                !hostname.includes('instagram.com') &&
                !hostname.includes('twitter.com') &&
                !hostname.includes('x.com');
        } catch {
            return false;
        }
    }

    async scrape(input: string): Promise<ScrapeResult> {
        const url = input;
        const actorId = 'apify~website-content-crawler';
        const apiUrl = `/apify-proxy/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}&waitForFinish=120`; // 7.5 min timeout

        const runInput = {
            startUrls: [{ url }],
            maxCrawlDepth: 0,
            maxCrawlPages: 1,
            saveHtml: false,
            saveMarkdown: true,
            removeCookieWarnings: true,
            clickElementsCssSelector: '[aria-expanded="false"]',
            removeElementsCssSelector: `nav, footer, script, style, noscript, svg, img[src^='data:'],
                [role="alert"],
                [role="banner"],
                [role="dialog"],
                [role="alertdialog"],
                [role="region"][aria-label*="skip" i],
                [aria-modal="true"]`,
            htmlTransformer: 'readableText',
            readableTextCharThreshold: 100,
            proxyConfiguration: {
                useApifyProxy: true
            }
        };

        console.log(`[WebStrategy] Starting run for ${url}...`);

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

        // Fetch Dataset
        const datasetUrl = `/apify-proxy/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`;
        const datasetResponse = await fetch(datasetUrl);

        if (!datasetResponse.ok) throw new Error("Failed to fetch dataset items.");

        const items = await datasetResponse.json();
        if (!items || items.length === 0) throw new Error("No content extracted from the URL.");

        const item = items[0];
        const textContent = item.markdown || item.text || "";

        return {
            content: textContent,
            url,
            title: item.metadata?.title,
            author: item.metadata?.author,
            contentType: 'website',
            metadata: {
                description: item.metadata?.description,
                keywords: item.metadata?.keywords
            }
        };
    }
}

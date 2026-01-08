import { ScraperStrategy, ScrapeResult } from '../types';

// @ts-ignore
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';

export class FileStrategy implements ScraperStrategy {
    canHandle(input: string | File): boolean {
        // Only handles File objects or URLs ending in .pdf/.png/.jpg etc.
        if (input instanceof File) return true;
        if (typeof input === 'string') {
            const lower = input.toLowerCase();
            return lower.endsWith('.pdf') ||
                lower.endsWith('.jpg') ||
                lower.endsWith('.jpeg') ||
                lower.endsWith('.png') ||
                lower.endsWith('.txt') ||
                lower.endsWith('.rtf');
        }
        return false;
    }

    async scrape(input: string | File): Promise<ScrapeResult> {
        // NOTE: For client-side File objects, we would need to upload them to Apify Key-Value store first.
        // For simplicity, we assume URLs for now, or assume the File has been uploaded to a public URL.
        // If it's a File object, we throw an error asking for a URL (as we haven't implemented direct upload yet).

        // TODO: Implement direct file upload to Apify Key-Value store using the API

        let fileUrl: string;

        if (input instanceof File) {
            // Placeholder: In a real implementation, we'd upload specific file bits here.
            throw new Error("Direct file upload strategy pending. Please provide a public URL to the file.");
        } else {
            fileUrl = input;
        }

        const lower = fileUrl.toLowerCase();

        if (lower.endsWith('.pdf')) {
            return this.scrapePdf(fileUrl);
        } else if (lower.match(/\.(jpg|jpeg|png)$/)) {
            return this.scrapeImage(fileUrl);
        } else {
            // Fallback to generic text or use Tika for everything
            return this.scrapePdf(fileUrl); // Tika handles many text formats
        }
    }

    private async scrapePdf(url: string): Promise<ScrapeResult> {
        // Using 'apify/tika' (Universal)
        // Alternative: 'jupri/pdf-to-text' if tika is heavy
        const actorId = 'apify~tika';
        const apiUrl = `/apify-proxy/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}&waitForFinish=120`;

        const runInput = {
            instructions: [
                { url: url } // Tika input format
            ]
        };

        const runResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(runInput)
        });

        // Basic error check
        if (!runResponse.ok) throw new Error(`Apify Run Failed: ${runResponse.status}`);

        const runData = await runResponse.json();
        const datasetId = runData.data.defaultDatasetId;

        const datasetUrl = `/apify-proxy/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`;
        const datasetResponse = await fetch(datasetUrl);
        const items = await datasetResponse.json();

        if (!items || items.length === 0) throw new Error("No content extracted from file.");

        // Tika output structure varies, usually 'text' or 'content'
        const item = items[0];
        return {
            content: item.text || item.content || "",
            url: url,
            contentType: 'document',
            metadata: { format: item.metadata?.['Content-Type'] }
        };
    }

    private async scrapeImage(url: string): Promise<ScrapeResult> {
        // Using 'apify/ocr-space-scraper' or similar
        const actorId = 'apify~ocr-space-scraper';
        const apiUrl = `/apify-proxy/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}&waitForFinish=120`;

        const runInput = {
            startUrls: [{ url }],
            language: 'eng',
            isTable: false
        };

        const runResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(runInput)
        });

        if (!runResponse.ok) throw new Error(`Apify Run Failed: ${runResponse.status}`);

        const runData = await runResponse.json();
        const datasetId = runData.data.defaultDatasetId;

        const datasetUrl = `/apify-proxy/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`;
        const datasetResponse = await fetch(datasetUrl);
        const items = await datasetResponse.json();

        if (!items || items.length === 0) throw new Error("No text found in image.");

        const item = items[0];
        return {
            content: item.parsedText || item.text || "",
            url: url,
            contentType: 'image',
            metadata: { engine: 'ocr-space' }
        };
    }
}

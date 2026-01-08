export interface ScrapeResult {
    content: string; // The main text content (markdown preferred)
    url?: string;
    title?: string;
    author?: string;
    publishedAt?: string;
    // Metadata specific to the source
    metadata?: Record<string, any>;
    // Error information if partial failure
    error?: string;
    // The type of content detected
    contentType: 'video' | 'post' | 'article' | 'image' | 'document' | 'website' | 'carousel' | 'unknown';
}

export interface ScraperStrategy {
    // Determines if this strategy can handle the given input
    canHandle(input: string | File): boolean;
    // Executes the scraping logic
    scrape(input: string | File): Promise<ScrapeResult>;
}

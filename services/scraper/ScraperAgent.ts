import { ScraperStrategy, ScrapeResult } from './types';
import { YouTubeStrategy } from './strategies/YouTubeStrategy';
import { LinkedInStrategy } from './strategies/LinkedInStrategy';
import { InstagramStrategy } from './strategies/InstagramStrategy';
import { TwitterStrategy } from './strategies/TwitterStrategy';
import { WebStrategy } from './strategies/WebStrategy';
import { FileStrategy } from './strategies/FileStrategy';

export class ScraperAgent {
    private strategies: ScraperStrategy[] = [];

    constructor() {
        // Register strategies in order of specificity
        this.strategies.push(new YouTubeStrategy());
        this.strategies.push(new LinkedInStrategy());
        this.strategies.push(new InstagramStrategy());
        this.strategies.push(new TwitterStrategy());
        this.strategies.push(new FileStrategy());
        this.strategies.push(new WebStrategy());
    }

    async scrape(input: string | File): Promise<ScrapeResult> {
        console.log(`[ScraperAgent] Analyzing input:`, input instanceof File ? input.name : input);

        for (const strategy of this.strategies) {
            if (strategy.canHandle(input)) {
                console.log(`[ScraperAgent] Strategy Matched: ${strategy.constructor.name}`);
                try {
                    return await strategy.scrape(input);
                } catch (error) {
                    console.error(`[ScraperAgent] Strategy ${strategy.constructor.name} failed:`, error);
                    // Fallback logic could go here if we had multiple strategies for the same type
                    throw error;
                }
            }
        }

        throw new Error("No suitable strategy found for this input.");
    }
}

export const scraperAgent = new ScraperAgent();

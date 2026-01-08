
import { fetchTranscript } from '../services/apifyService';
import { generatePodcastTitle, analyzeIntentAndIssues } from '../services/geminiService';
import { db } from '../db/db';
import { dbService } from '../services/dbService';
import { Episode } from '../types';


interface FetchEpisodeInput {
    transcriptUrl: string;
    episodeNumber: string;
    guest?: string;
}

interface UpdateEpisodeInput {
    id: number;
    title: string;
    guest?: string;
    episodeNumber: string;
    transcriptText?: string;
    bulletPoints?: string;
    notableQuotes?: string;
}

export const fetchAndProcessEpisode = async (input: FetchEpisodeInput): Promise<Episode> => {
    // 1. Call Apify
    const transcriptData = await fetchTranscript(input.transcriptUrl);

    // 2. Draft Database Record
    const now = Date.now();
    const newEpisode: Omit<Episode, 'id'> = {
        episodeNumber: input.episodeNumber,
        guest: input.guest,
        transcriptUrl: input.transcriptUrl,
        transcriptText: transcriptData.transcriptText,
        title: 'Generating Title...',
        createdAt: now,
        updatedAt: now,
        status: 'draft'
    };

    // Save preliminary to DB (Local)
    // We cast to any because Dexie expects its own internal types but we are using shared one
    const localId = await db.episodes.add(newEpisode as Episode);

    // Save to Cloud (Sync)
    let cloudId = '';
    try {
        cloudId = await dbService.addEpisode(newEpisode);
        // Update local with cloudId
        await db.episodes.update(localId, { cloudId });
    } catch (e) {
        console.error("Cloud sync failed during fetch:", e);
    }

    // 3. Generate Title with Gemini
    const generatedTitle = await generatePodcastTitle(
        transcriptData.transcriptText,
        input.guest,
        input.episodeNumber
    );

    // 4. Generate 5 Bullet Points (always generate, no persona required)
    let bulletPoints: string | undefined;
    try {
        bulletPoints = await analyzeIntentAndIssues(transcriptData.transcriptText);
    } catch (e) {
        console.error("Failed to generate bullet points:", e);
        // Continue without bullet points if generation fails
    }

    // 5. Update DB
    const updates: any = {
        title: generatedTitle,
        updatedAt: Date.now(),
        status: 'fetched' as const
    };
    if (bulletPoints) {
        updates.bulletPoints = bulletPoints;
    }

    await db.episodes.update(localId, updates);
    if (cloudId) {
        await dbService.updateEpisode(cloudId, updates);
    }

    // Return full object
    return {
        ...newEpisode,
        id: localId, // Keep using localId for UI state
        cloudId,
        title: generatedTitle,
        bulletPoints,
        status: 'fetched'
    };
};


export const updateEpisodeMetadata = async (input: UpdateEpisodeInput): Promise<void> => {
    const updateData: any = {
        title: input.title,
        guest: input.guest,
        episodeNumber: input.episodeNumber,
        updatedAt: Date.now()
    };
    if (input.transcriptText) {
        updateData.transcriptText = input.transcriptText;
    }
    if (input.bulletPoints !== undefined) {
        updateData.bulletPoints = input.bulletPoints;
    }
    if (input.notableQuotes !== undefined) {
        updateData.notableQuotes = input.notableQuotes;
    }

    // Update Local
    await db.episodes.update(input.id, updateData);

    // Update Cloud
    try {
        const localRecord = await db.episodes.get(input.id);
        if (localRecord && localRecord.cloudId) {
            await dbService.updateEpisode(localRecord.cloudId, updateData);
        }
    } catch (e) {
        console.error("Cloud sync failed during update:", e);
    }
};


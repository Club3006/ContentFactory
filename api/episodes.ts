
import { fetchTranscript } from '../services/apifyService';
import { generatePodcastTitle } from '../services/geminiService';
import { db, Episode } from '../db/db';

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
}

export const fetchAndProcessEpisode = async (input: FetchEpisodeInput): Promise<Episode> => {
    // 1. Call Apify
    const transcriptData = await fetchTranscript(input.transcriptUrl);

    // 2. Draft Database Record
    const newEpisode: Omit<Episode, 'id'> = {
        episodeNumber: input.episodeNumber,
        guest: input.guest,
        transcriptUrl: input.transcriptUrl,
        transcriptText: transcriptData.transcriptText,
        title: 'Generating Title...',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft'
    };

    // Save preliminary to DB
    const id = await db.episodes.add(newEpisode as Episode);

    // 3. Generate Title with Gemini
    const generatedTitle = await generatePodcastTitle(
        transcriptData.transcriptText,
        input.guest,
        input.episodeNumber
    );

    // 4. Update DB
    await db.episodes.update(id, {
        title: generatedTitle,
        updatedAt: new Date(),
        status: 'fetched'
    });

    // Return full object
    return {
        ...newEpisode,
        id: id as number,
        title: generatedTitle,
        status: 'fetched'
    };
};

export const updateEpisodeMetadata = async (input: UpdateEpisodeInput): Promise<void> => {
    const updateData: any = {
        title: input.title,
        guest: input.guest,
        episodeNumber: input.episodeNumber,
        updatedAt: new Date()
    };
    if (input.transcriptText) {
        updateData.transcriptText = input.transcriptText;
    }
    await db.episodes.update(input.id, updateData);
};

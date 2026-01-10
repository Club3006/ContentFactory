
import Dexie, { Table } from 'dexie';
import { Episode, GeneratorDraft, LinkedInContent, ContentIdea, ContentRating } from '../types';


export class ContentFactoryDB extends Dexie {
    episodes!: Table<Episode>;
    generatorDrafts!: Table<GeneratorDraft>;
    linkedInContent!: Table<LinkedInContent>;
    ideas!: Table<ContentIdea>;
    contentRatings!: Table<ContentRating>;

    constructor() {
        super('ContentFactoryDB');
        
        // Version 1: Original schema
        this.version(1).stores({
            episodes: '++id, episodeNumber, title, createdAt, status'
        });

        // Version 2: Add generator drafts, linkedin content, and ideas tables
        this.version(2).stores({
            episodes: '++id, episodeNumber, title, createdAt, status',
            generatorDrafts: '++id, title, status, platform, createdAt, updatedAt',
            linkedInContent: '++id, title, contentType, isPublished, createdAt, updatedAt',
            ideas: '++id, status, createdAt, type'
        });

        // Version 3: Add content ratings table for CopyPro learning system
        this.version(3).stores({
            episodes: '++id, episodeNumber, title, createdAt, status',
            generatorDrafts: '++id, title, status, platform, createdAt, updatedAt',
            linkedInContent: '++id, title, contentType, isPublished, createdAt, updatedAt',
            ideas: '++id, status, createdAt, type',
            contentRatings: '++id, contentType, format, rating, platform, createdAt'
        });
    }
}

export const db = new ContentFactoryDB();

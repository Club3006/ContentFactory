
import Dexie, { Table } from 'dexie';
import { Episode } from '../types';


export class ContentFactoryDB extends Dexie {
    episodes!: Table<Episode>;

    constructor() {
        super('ContentFactoryDB');
        // Defining schema
        this.version(1).stores({
            episodes: '++id, episodeNumber, title, createdAt, status'
        });
    }
}

export const db = new ContentFactoryDB();

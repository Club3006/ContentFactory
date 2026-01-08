import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    doc,
    updateDoc,
    getDoc,
    DocumentReference
} from "firebase/firestore";
import { db } from "./firebase";
import { ContentIdea, ScrapedData, GeneratedContent, IdeaStatus, Episode } from "../types";

// UserFeedback is internal for now unless added to types
export interface UserFeedback {
    id?: string;
    targetCollection: 'content_ideas' | 'generated_content';
    targetId: string;
    rating: number;
    comment: string;
    createdAt: number;
}

class DBService {

    // --- Scraped Data ---

    async addScrapedData(data: Omit<ScrapedData, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, "scraped_data"), {
                ...data,
                createdAt: Timestamp.now()
            });
            return docRef.id;
        } catch (e) {
            console.error("Error adding scraped data: ", e);
            throw e;
        }
    }

    async getAllScrapedData(): Promise<ScrapedData[]> {
        const q = query(collection(db, "scraped_data"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toMillis()
            } as ScrapedData;
        });
    }

    async getScrapedDataByTag(tag: string): Promise<ScrapedData[]> {
        const q = query(
            collection(db, "scraped_data"),
            where("tags", "array-contains", tag),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toMillis()
            } as ScrapedData;
        });
    }

    // --- Content Ideas ---

    async addContentIdea(idea: Omit<ContentIdea, 'id' | 'createdAt'>) {
        try {
            const docRef = await addDoc(collection(db, "content_ideas"), {
                ...idea,
                timestamp: Timestamp.fromMillis(idea.timestamp || Date.now()),
                createdAt: Timestamp.now()
            });
            return docRef.id;
        } catch (e) {
            console.error("Error adding content idea: ", e);
            throw e;
        }
    }

    async getIdeasByStatus(status: IdeaStatus): Promise<ContentIdea[]> {
        const q = query(
            collection(db, "content_ideas"),
            where("status", "==", status),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toMillis(),
                createdAt: (data.createdAt as Timestamp).toMillis()
            } as ContentIdea;
        });
    }

    async getAllIdeas(): Promise<ContentIdea[]> {
        const q = query(
            collection(db, "content_ideas"),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toMillis(),
                createdAt: (data.createdAt as Timestamp).toMillis()
            } as ContentIdea;
        });
    }

    async updateIdeaStatus(id: string, status: IdeaStatus) {
        const docRef = doc(db, "content_ideas", id);
        await updateDoc(docRef, { status });
    }

    async rateIdea(id: string, rating: number) {
        const docRef = doc(db, "content_ideas", id);
        await updateDoc(docRef, { rating });
    }

    // --- Generated Content ---

    async addGeneratedContent(content: Omit<GeneratedContent, 'id' | 'createdAt' | 'updatedAt'>) {
        try {
            const now = Timestamp.now();
            const docRef = await addDoc(collection(db, "generated_content"), {
                ...content,
                createdAt: now,
                updatedAt: now
            });
            return docRef.id;
        } catch (e) {
            console.error("Error adding generated content: ", e);
            throw e;
        }
    }

    // --- Feedback ---

    async addFeedback(feedback: Omit<UserFeedback, 'id' | 'createdAt'>) {
        try {
            await addDoc(collection(db, "user_feedback"), {
                ...feedback,
                createdAt: Timestamp.now()
            });
        } catch (e) {
            console.error("Error adding feedback: ", e);
            throw e;
        }

    }

    // --- Episodes (Podcasts) ---

    async addEpisode(episode: Omit<Episode, 'id'>) {
        try {
            const docRef = await addDoc(collection(db, "episodes"), {
                ...episode,
                createdAt: Timestamp.fromMillis(episode.createdAt || Date.now()),
                updatedAt: Timestamp.fromMillis(episode.updatedAt || Date.now())
            });
            return docRef.id;
        } catch (e) {
            console.error("Error adding episode to cloud: ", e);
            throw e;
        }
    }

    async updateEpisode(id: string, data: Partial<Episode>) {
        const docRef = doc(db, "episodes", id);
        const updateData: any = { ...data };
        if (data.updatedAt) updateData.updatedAt = Timestamp.fromMillis(data.updatedAt);
        await updateDoc(docRef, updateData);
    }

    async getAllEpisodes(): Promise<Episode[]> {
        const q = query(collection(db, "episodes"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toMillis(),
                updatedAt: (data.updatedAt as Timestamp).toMillis()
            } as Episode;
        });
    }
}


export const dbService = new DBService();

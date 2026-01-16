/**
 * ScraperPro Apify Adapter (lightweight)
 *
 * Purpose:
 * - Centralize all Apify HTTP calls (so ScraperPro can remain thin)
 * - Make it easy to swap Apify later
 *
 * Notes:
 * - This is intentionally minimal and matches the invocation logic referenced in the spec.
 */

export type ApifyRunStatus = 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED-OUT' | 'ABORTING' | 'ABORTED';

export interface ApifyRunResponse {
  data?: {
    id?: string;
    status?: ApifyRunStatus;
    defaultDatasetId?: string;
    defaultKeyValueStoreId?: string;
  };
}

export interface ApifyDatasetItem {
  [key: string]: any;
}

export interface ApifyAdapterOptions {
  /** Base URL for Apify proxy or direct Apify API */
  baseUrl?: string; // default: '/apify-proxy'
  /** Wait time (seconds) for synchronous runs */
  waitForFinish?: number; // default: 120
}

export function getApifyToken(): string {
  const token =
    (import.meta as any).env?.VITE_APIFY_API_TOKEN ||
    (typeof process !== 'undefined' && (process as any).env?.APIFY_API_TOKEN) ||
    '';

  if (!token) console.warn('[ScraperPro] Missing APIFY_API_TOKEN');
  return token;
}

export function encodeActorId(actorId: string): string {
  // Apify actor IDs use "/" but API path supports "~"
  return actorId.replace('/', '~');
}

export async function runActorAndFetchDataset(
  actorId: string,
  runInput: Record<string, any>,
  opts: ApifyAdapterOptions = {}
): Promise<{ status: ApifyRunStatus; datasetId?: string; items?: ApifyDatasetItem[]; rawRun?: ApifyRunResponse }>
{
  const token = getApifyToken();
  if (!token) return { status: 'FAILED' };

  const baseUrl = opts.baseUrl ?? '/apify-proxy';
  const waitForFinish = opts.waitForFinish ?? 120;

  const runUrl = `${baseUrl}/v2/acts/${encodeActorId(actorId)}/runs?token=${encodeURIComponent(token)}&waitForFinish=${waitForFinish}`;

  const runResp = await fetch(runUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(runInput),
  });

  if (!runResp.ok) {
    const err = await runResp.text();
    throw new Error(`Apify run failed: ${runResp.status} - ${err}`);
  }

  const runJson = (await runResp.json()) as ApifyRunResponse;
  const status = runJson.data?.status ?? 'FAILED';
  const datasetId = runJson.data?.defaultDatasetId;

  if (status !== 'SUCCEEDED') {
    return { status, datasetId, rawRun: runJson };
  }

  if (!datasetId) {
    return { status: 'SUCCEEDED', rawRun: runJson };
  }

  // Fetch dataset items
  const datasetUrl = `${baseUrl}/v2/datasets/${datasetId}/items?token=${encodeURIComponent(token)}&clean=true&format=json`;
  const dsResp = await fetch(datasetUrl);
  if (!dsResp.ok) {
    const err = await dsResp.text();
    throw new Error(`Apify dataset fetch failed: ${dsResp.status} - ${err}`);
  }

  const items = (await dsResp.json()) as ApifyDatasetItem[];
  return { status: 'SUCCEEDED', datasetId, items, rawRun: runJson };
}

// Task ID mapping (from Apify.md spec)
export type ScraperProTaskId = 
  | 'WEB__Article_Text'
  | 'IG__Post_Reel_Caption'
  | 'X__Thread_Text'
  | 'DOC__Parse_Docling'
  | 'DOC__OCR_PDF'
  | 'MEDIA__Transcribe_Whisper'
  | 'YT__Transcript_Fast'
  | 'LI__Profile'
  | 'LI__Post_Text'
  | 'LI__Article_Text';

export function getActorForTask(taskId: ScraperProTaskId): string {
  const actors: Record<ScraperProTaskId, string> = {
    'WEB__Article_Text': 'apify/website-content-crawler',
    'IG__Post_Reel_Caption': 'apify/instagram-scraper',
    'X__Thread_Text': 'apidojo/twitter-scraper',
    'DOC__Parse_Docling': 'vancura/docling',
    'DOC__OCR_PDF': 'cspnair/pdf-ocr-api',
    'MEDIA__Transcribe_Whisper': 'vittuhy/audio-and-video-transcript',
    'YT__Transcript_Fast': 'streamPot/youtube-transcript-scraper',
    'LI__Profile': 'katerinahub/linkedin-profile-scraper',
    'LI__Post_Text': 'katerinahub/linkedin-post-scraper',
    'LI__Article_Text': 'apify/website-content-crawler'
  };
  return actors[taskId];
}


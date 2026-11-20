// A draft chapter's glosses for the reader script, in the same shape and word order as /gl/<id>.json, except that the
// audio is a full URL: the preview's reader (/preview/reader.js) has no bucket prefix, so a new clip can play from
// this machine (/preview/audio/) beside existing ones from the app's bucket.
import type { APIRoute, GetStaticPaths } from 'astro';
import { audioUrl } from '../lib/words.mjs';
import { listDrafts, loadDraft, readerText } from './drafts.mjs';

export const getStaticPaths = (() => listDrafts().map(({ book, chapter }) => ({ params: { book, chapter } }))) satisfies GetStaticPaths;

export const GET = (({ params }) => {
  const draft = loadDraft(params.book, params.chapter);
  if (!draft) return new Response('Not found', { status: 404 });
  const full = (file: string | null) => (file?.startsWith('/') ? file : audioUrl(file));
  const glosses = readerText(draft).flatMap((sentence) => sentence.words.map((word) => [word.english, word.grammar_note, full(word.audio_url)]));
  return new Response(JSON.stringify(glosses), { headers: { 'Content-Type': 'application/json' } });
}) satisfies APIRoute;

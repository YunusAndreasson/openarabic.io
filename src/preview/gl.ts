// A draft chapter's glosses for the reader script, in the same shape and word order as /gl/<id>.json.
import type { APIRoute, GetStaticPaths } from 'astro';
import { listDrafts, loadDraft, readerText } from './drafts.mjs';

export const getStaticPaths = (() => listDrafts().map(({ book, chapter }) => ({ params: { book, chapter } }))) satisfies GetStaticPaths;

export const GET = (({ params }) => {
  const draft = loadDraft(params.book, params.chapter);
  if (!draft) return new Response('Not found', { status: 404 });
  const glosses = readerText(draft).flatMap((sentence) => sentence.words.map((word) => [word.english, word.grammar_note, word.audio_url]));
  return new Response(JSON.stringify(glosses), { headers: { 'Content-Type': 'application/json' } });
}) satisfies APIRoute;

// One article's glosses, fetched on first pointer contact. Same order as the words in its page: [english, note, audio].
import type { APIRoute, GetStaticPaths } from 'astro';
import { site } from '../../lib/snapshot.mjs';

export const getStaticPaths = (() => site().published.map((article) => ({ params: { id: String(article.id) } }))) satisfies GetStaticPaths;

export const GET = (({ params }) => {
  const glosses = site()
    .articleText(Number(params.id))
    .flatMap((sentence) => (sentence.words ?? []).map((word) => [word.english, word.grammar_note, word.audio_url]));
  return new Response(JSON.stringify(glosses), { headers: { 'Content-Type': 'application/json' } });
}) satisfies APIRoute;

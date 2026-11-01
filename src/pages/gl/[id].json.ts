// One article's glosses, fetched on first pointer contact. Same order as the words in its page: [english, note, audio].
import { site } from '../../lib/snapshot.mjs';

export function getStaticPaths() {
  return site().published.map((article) => ({ params: { id: String(article.id) } }));
}

export function GET({ params }: { params: { id: string } }) {
  const out: unknown[] = [];
  for (const sentence of site().articleText(Number(params.id))) {
    for (const word of sentence.words ?? []) out.push([word.english, word.grammar_note, word.audio_url]);
  }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
}

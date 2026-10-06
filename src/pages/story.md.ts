// The download is the story source itself, byte for byte.
import raw from '../content/story.md?raw';

export const GET = () =>
  new Response(raw, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });

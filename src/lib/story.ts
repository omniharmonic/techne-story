// Parses the one canonical story file. The page and the Markdown download are
// both built from src/content/story.md; nothing public is written anywhere else.

import { marked } from 'marked';
import raw from '../content/story.md?raw';

export interface Scene {
  id: string;
  index: number;
  title: string;
  act: number;
  actName: string;
  firstOfAct: boolean;
  body: string;
  hood: string;
  sources: string;
}

const inline = (s: string) => marked.parseInline(s) as string;

const block = (tok: any): string => {
  if (tok.type === 'paragraph') return `<p>${inline(tok.text)}</p>`;
  if (tok.type === 'blockquote') {
    const text: string = tok.text.trim();
    if (text.startsWith('**Preview note.**')) {
      return `<aside class="preview-note"><p>${inline(text.replace(/\n/g, ' '))}</p></aside>`;
    }
    const lines = text.split('\n');
    const last = lines[lines.length - 1];
    if (last.startsWith('— ')) {
      const quote = lines.slice(0, -1).join(' ');
      return `<figure class="quote"><blockquote><p>${inline(quote)}</p></blockquote><figcaption>${inline(last.slice(2))}</figcaption></figure>`;
    }
    return `<blockquote><p>${inline(text.replace(/\n/g, ' '))}</p></blockquote>`;
  }
  if (tok.type === 'space') return '';
  return marked.parser([tok]) as string;
};

export const storyRaw: string = raw;

export const parseStory = () => {
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
  const tokens = marked.lexer(body);
  const scenes: Scene[] = [];
  let intro = '';
  let title = '';
  let act = 0, actName = '', firstOfAct = false;
  let target: 'body' | 'hood' | 'sources' = 'body';
  for (const tok of tokens as any[]) {
    if (tok.type === 'heading') {
      if (tok.depth === 1) title = tok.text;
      else if (tok.depth === 2) {
        const m = /^(\d)\s*\/\s*(.+)$/.exec(tok.text)!;
        act = Number(m[1]); actName = m[2]; firstOfAct = true;
      } else if (tok.depth === 3) {
        const m = /^(.*?)\s*\{#([\w-]+)\}$/.exec(tok.text)!;
        scenes.push({ id: m[2], index: scenes.length, title: m[1], act, actName, firstOfAct, body: '', hood: '', sources: '' });
        firstOfAct = false; target = 'body';
      } else if (tok.depth === 4) target = /source/i.test(tok.text) ? 'sources' : 'hood';
      continue;
    }
    const html = block(tok);
    if (!scenes.length) intro += html;
    else scenes[scenes.length - 1][target] += html;
  }
  return { title, intro, scenes };
};

import { SOURCES } from '../lib/chapters';
import { BEATS } from '../lib/immersive';
export const GET = () => new Response(
  '# Another web is possible\n\nA Techne story.\n\n' + BEATS.map(b => '## ' + b.chapter + ': ' + b.title.replace('\n', ' ') + '\n\n' + b.body + '\n\n' + b.note + (b.sources.length ? '\n\n' + b.sources.map(k=>'- ['+SOURCES[k].title+']('+SOURCES[k].url+')').join('\n') : '')).join('\n\n') + '\n\n---\n\nThe landscape and corporations are metaphors; the communities are imagined possibilities.\n\nExplore the thinking: https://unforcedagi.github.io/techne-www/writing/protocols-of-belonging/\n',
  { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }
);

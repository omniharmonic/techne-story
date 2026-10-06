import { BEATS } from '../lib/immersive';
export const GET = () => new Response(
  '# Another web is possible\n\nA Techne story.\n\n' + BEATS.map(b => '## ' + b.title.replace('\n', ' ') + '\n\n' + b.body).join('\n\n') + '\n\n---\n\nThe landscape and corporations are metaphors; the communities are imagined possibilities.\n\nExplore the thinking: https://unforcedagi.github.io/techne-www/writing/protocols-of-belonging/\n',
  { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }
);

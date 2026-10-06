import { STILLS } from '../../lib/stills.ts';
import { renderStill } from '../../lib/world/render.ts';

export const getStaticPaths = () => Object.keys(STILLS).map((name) => ({ params: { name } }));

export const GET = ({ params }: { params: { name: string } }) =>
  new Response(renderStill(STILLS[params.name]), { headers: { 'Content-Type': 'image/svg+xml' } });

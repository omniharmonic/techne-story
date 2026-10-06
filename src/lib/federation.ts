/** A stable botanical geometry: local branches scale by phi, hubs stay peers. */
export const PHI = (1 + Math.sqrt(5)) / 2;
export const HUBS = [
  {x:.487,y:.525}, {x:.582,y:.818}, {x:.665,y:.448}, {x:.902,y:.585}, {x:.908,y:.369},
];
export const FEDERATION_LINKS = [[0,1],[1,2],[2,3],[3,1],[0,4],[4,2],[4,3]];
export const BRANCHES = HUBS.flatMap((hub,h)=>Array.from({length:3},(_,j)=>{
  const angle=j*Math.PI*2/3+h*2.3999632297;
  const branch={x:hub.x+Math.cos(angle)*.037,y:hub.y+Math.sin(angle)*.023};
  return {hub:h,branch,leaves:Array.from({length:5},(_,k)=>{
    const a=angle+(k-2)*.57,r=.034/PHI**(1+k*.22);
    return {x:branch.x+Math.cos(a)*r,y:branch.y+Math.sin(a)*r*.60};
  })};
}));

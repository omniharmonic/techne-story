/** All scene anchors use the artwork's coordinates, not viewport percentages. */
export function landscapeCamera(width:number,height:number,t:number) {
  const smooth=(a:number,b:number,n:number)=>{const v=Math.max(0,Math.min(1,(n-a)/(b-a)));return v*v*(3-2*v);};
  const zoom=1.035+.065*(1-smooth(0,1.2,t))+.035*smooth(2,3.2,t)*(1-smooth(4,5.4,t));
  const scale=Math.max(width/1672,height/941)*zoom;
  const w=1672*scale,h=941*scale;
  const x=(width-w)*(width<=700?.60:.50)+Math.sin(t*.6)*width*.006;
  const y=(height-h)*(.5+.35*smooth(0,1,t))-smooth(1.4,3.15,t)*height*.008;
  return {x,y,w,h,scale,point:(u:number,v:number)=>({x:x+w*u,y:y+h*v})};
}

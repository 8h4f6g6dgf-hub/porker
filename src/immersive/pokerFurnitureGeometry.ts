import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const CHAIR_POSITIONS: readonly [number, number][] = [
  [-3.95,-.35],[3.95,-.35],[-3.25,2],[3.25,2],[-2.35,-2.7],[2.35,-2.7],
];
export function chairMatrix(x:number,z:number) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x,.05,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.atan2(x,z)),new THREE.Vector3(1,1,1));
}
// Padded cross section stays within the existing 3.35 × 2.08 half-extents
// and below the previous maximum table surface height (0.797).
export function railGeometry() {
  const vertices:number[]=[],uvs:number[]=[],indices:number[]=[];
  const around=160,section=16;
  for(let i=0;i<=around;i++)for(let j=0;j<=section;j++){
    const t=i/around*Math.PI*2,p=j/section*Math.PI*2;
    vertices.push((3.19+.15*Math.cos(p))*Math.cos(t),.72+.075*Math.sin(p),(1.92+.15*Math.cos(p))*Math.sin(t));
    uvs.push(i/around*14,j/section);
  }
  for(let i=0;i<around;i++)for(let j=0;j<section;j++){
    const a=i*(section+1)+j,b=a+section+1;indices.push(a,a+1,b,b,a+1,b+1);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function railStitches() {
  const points:number[]=[];
  for(let i=0;i<360;i++)for(const end of [0,.48]){
    const t=(i+end)/360*Math.PI*2;
    points.push(3.157*Math.cos(t),.794,1.887*Math.sin(t));
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));return g;
}
function tube(points:number[][],radius:number,segments=24){
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number]))),segments,radius,8,false);
}
export function chairGeometries(){
  // One continuous upholstered shell from the waterfall seat to the curved back.
  const p=new THREE.Shape();
  p.moveTo(-.55,-.08);p.quadraticCurveTo(-.66,.02,-.55,.10);
  p.bezierCurveTo(-.30,.15,.18,.12,.37,.14);
  p.bezierCurveTo(.48,.20,.43,.76,.55,1.08);
  p.quadraticCurveTo(.60,1.20,.72,1.13);
  p.bezierCurveTo(.82,.84,.76,.29,.65,.02);
  p.quadraticCurveTo(.58,-.10,.38,-.10);p.lineTo(-.55,-.08);
  const shell=new THREE.ExtrudeGeometry(p,{depth:1.06,steps:1,bevelEnabled:true,bevelThickness:.045,bevelSize:.035,bevelSegments:3,curveSegments:12});
  shell.translate(0,0,-.53);shell.rotateY(-Math.PI/2);
  const pos=shell.getAttribute('position');
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),back=THREE.MathUtils.smoothstep(y,.12,1.1);
    pos.setXYZ(i,x*(1-.08*back),y+.015*(x/.57)**2,z+.09*(x/.57)**2*back);
  }
  shell.computeVertexNormals();
  const frame:THREE.BufferGeometry[]=[];
  for(const side of [-1,1]){
    frame.push(tube([[side*.49,-1,-.48],[side*.44,-.18,-.43],[side*.43,-.13,0],[side*.44,-.18,.42],[side*.50,-1,.60]],.039));
    for(const z of [-.48,.60]){const foot=new THREE.SphereGeometry(.04,8,6);foot.scale(1,.875,1);foot.translate(side*(z<0?.49:.50),-1.015,z);frame.push(foot);}
  }
  for(const z of [-.35,.32])frame.push(tube([[-.44,-.14,z],[0,-.14,z],[.44,-.14,z]],.028,8));
  const piping:THREE.BufferGeometry[]=[];
  // Back perimeter piping and a restrained seam across the seat front.
  piping.push(tube([[-.48,.24,.76],[-.49,.66,.83],[-.46,1.09,.82],[0,1.16,.75],[.46,1.09,.82],[.49,.66,.83],[.48,.24,.76]],.006,48));
  piping.push(tube([[-.48,.25,.49],[-.47,.70,.51],[-.43,1.04,.58],[0,1.12,.58],[.43,1.04,.58],[.47,.70,.51],[.48,.25,.49]],.004,48));
  piping.push(tube([[-.50,.10,-.53],[0,.105,-.57],[.50,.10,-.53]],.005,24));
  const legs=mergeGeometries(frame)!,seams=mergeGeometries(piping)!;
  frame.forEach(g=>g.dispose());piping.forEach(g=>g.dispose());
  return {shell,legs,seams};
}

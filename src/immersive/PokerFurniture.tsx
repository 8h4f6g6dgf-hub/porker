import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CHAIR_POSITIONS, chairMatrix, chairGeometries, railGeometry, railStitches } from './pokerFurnitureGeometry';

function leatherGrain() {
  const c=document.createElement('canvas');c.width=c.height=256;
  const ctx=c.getContext('2d')!,data=ctx.createImageData(256,256);
  let seed=901;const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  const cells=Array.from({length:32*32},()=>[random(),random()]);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const gx=x/8,gy=y/8,ix=Math.floor(gx),iy=Math.floor(gy);let nearest=2;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const a=ix+i,b=iy+j,cell=cells[((b+32)%32)*32+(a+32)%32];
      nearest=Math.min(nearest,Math.hypot(gx-a-cell[0],gy-b-cell[1]));
    }
    const value=145+Math.min(nearest,1)*42+random()*10,index=(y*256+x)*4;
    data.data[index]=data.data[index+1]=data.data[index+2]=value;data.data[index+3]=255;
  }
  ctx.putImageData(data,0,0);const texture=new THREE.CanvasTexture(c);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}
export function PokerFurniture(){
  const shells=useRef<THREE.InstancedMesh>(null),legs=useRef<THREE.InstancedMesh>(null),seams=useRef<THREE.InstancedMesh>(null);
  const r=useMemo(()=>{
    const grain=leatherGrain();
    return {...chairGeometries(),rail:railGeometry(),stitches:railStitches(),grain,
      leather:new THREE.MeshStandardMaterial({color:'#49342a',roughness:.76,bumpMap:grain,bumpScale:.004}),
      metal:new THREE.MeshStandardMaterial({color:'#302b25',metalness:.55,roughness:.48}),
      thread:new THREE.MeshStandardMaterial({color:'#79604a',roughness:.95})};
  },[]);
  useLayoutEffect(()=>{
    for(const ref of [shells,legs,seams])if(ref.current){
      CHAIR_POSITIONS.forEach(([x,z],i)=>ref.current!.setMatrixAt(i,chairMatrix(x,z)));
      ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere();
    }
  },[]);
  useEffect(()=>()=>{r.grain.dispose();r.leather.dispose();r.metal.dispose();r.thread.dispose();r.shell.dispose();r.legs.dispose();r.seams.dispose();r.rail.dispose();r.stitches.dispose();},[r]);
  return <group>
    <mesh geometry={r.rail} material={r.leather} castShadow receiveShadow/>
    <lineSegments geometry={r.stitches}><lineBasicMaterial color='#80654e' transparent opacity={.7}/></lineSegments>
    <instancedMesh ref={shells} args={[r.shell,r.leather,CHAIR_POSITIONS.length]} castShadow receiveShadow/>
    <instancedMesh ref={legs} args={[r.legs,r.metal,CHAIR_POSITIONS.length]} castShadow receiveShadow/>
    <instancedMesh ref={seams} args={[r.seams,r.thread,CHAIR_POSITIONS.length]} receiveShadow/>
  </group>;
}

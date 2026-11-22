import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { carpetTexture, roomLightMap } from './vipSurfaceTextures';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Room coordinates: floor -1, ceiling 4.0, rear wall -8.4, side walls ±6.4.
// The visible architecture is merged by material, rather than one draw per moulding.
function fabricTexture() {
  const c=document.createElement('canvas'); c.width=c.height=256;
  const ctx=c.getContext('2d')!;
  const pixels=ctx.createImageData(256,256); let seed=731;
  for(let y=0;y<256;y++) for(let x=0;x<256;x++) {
    seed=(seed*16807)%2147483647;
    const weave=((x%4<2)===(y%4<2)?7:-7)+(seed/2147483647-.5)*12;
    const herring=(Math.floor((x+(Math.floor(y/32)%2?y:-y))/16)%2)*3;
    const i=(y*256+x)*4;
    pixels.data[i]=100+weave+herring; pixels.data[i+1]=105+weave+herring;
    pixels.data[i+2]=93+weave+herring; pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(18,22);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function frame(w:number,h:number,depth:number) {
  const s=new THREE.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();
  const hole=new THREE.Path();const rim=.075;
  hole.moveTo(-w/2+rim,-h/2+rim);hole.lineTo(-w/2+rim,h/2-rim);hole.lineTo(w/2-rim,h/2-rim);hole.lineTo(w/2-rim,-h/2+rim);hole.closePath();s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.012,bevelSize:.014,bevelSegments:2,steps:1});
}
export function VipRoom() {
  const {gl,scene}=useThree();
  const frames=useRef(0);
  useFrame(()=>{
    if(import.meta.env.DEV && ++frames.current%60===0) {
      gl.domElement.dataset.roomStats=JSON.stringify({calls:gl.info.render.calls,triangles:gl.info.render.triangles,textures:gl.info.memory.textures});
    }
  });
  const resources=useMemo(()=>{
    const maps:THREE.Texture[]=[];
    let pending=3;
    gl.domElement.dataset.roomTextures='loading';
    const load=(name:string,color=false)=>{
      // Valid procedural fallback also keeps the room usable if an image fails.
      const c=document.createElement('canvas');c.width=c.height=1024;
      const ctx=c.getContext('2d')!;
      ctx.fillStyle=name.includes('normal')?'#8080ff':color?'#816044':'#aaaaaa';ctx.fillRect(0,0,1024,1024);
      const t=new THREE.CanvasTexture(c);
      const image=new Image();
      image.onload=()=>{ctx.drawImage(image,0,0,1024,1024);t.needsUpdate=true;if(--pending===0 && gl.domElement.dataset.roomTextures!=='fallback')gl.domElement.dataset.roomTextures='ready';};
      image.onerror=()=>{gl.domElement.dataset.roomTextures='fallback';};
      image.src=`${import.meta.env.BASE_URL}assets/vip-room/${name}.jpg`;
      t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;maps.push(t);return t;
    };
    const color=load('wood-color',true), normal=load('wood-normal'), rough=load('wood-roughness');
    const weave=fabricTexture(),carpet=carpetTexture(gl.capabilities.getMaxAnisotropy()),floorLight=roomLightMap(true),wallLight=roomLightMap(false);
    maps.push(weave,carpet,floorLight,wallLight);
    const wood=new THREE.MeshStandardMaterial({color:'#b1a293',emissive:'#826247',emissiveMap:color,emissiveIntensity:.04,lightMap:wallLight,lightMapIntensity:1.8,map:color,normalMap:normal,normalScale:new THREE.Vector2(.16,.16),roughnessMap:rough,roughness:.95});
    const trim=new THREE.MeshStandardMaterial({color:'#928174',emissive:'#826247',emissiveMap:color,emissiveIntensity:.035,map:color,roughnessMap:rough,roughness:.90,lightMap:wallLight,lightMapIntensity:1.8});
    const brass=new THREE.MeshStandardMaterial({color:'#88734f',metalness:.65,roughness:.49});
    const fabric=new THREE.MeshStandardMaterial({color:'#345d42',emissive:'#1b3f2b',emissiveIntensity:.18,roughness:1,bumpMap:weave,bumpScale:.0015,lightMap:wallLight,lightMapIntensity:.6});
    const plaster=new THREE.MeshStandardMaterial({color:'#807967',roughness:.98});
    const floorMat=new THREE.MeshStandardMaterial({color:'#ffffff',map:carpet,bumpMap:carpet,bumpScale:.003,roughness:1,lightMap:floorLight,lightMapIntensity:1.6});
    const batches:THREE.BufferGeometry[][]=[[],[],[],[],[]];
    const add=(g:THREE.BufferGeometry,mat:number,p:[number,number,number],ry=0)=>{
      // World-scale timber cuts: vertical panels, horizontal rails. All PBR maps share UV0.
      if(mat<2){
        g.computeBoundingBox();const size=g.boundingBox!.getSize(new THREE.Vector3());
        const uv=g.getAttribute('uv'),position=g.getAttribute('position'),n=batches[mat].length;
        const horizontal=Math.max(size.x,size.z)>size.y*3;
        for(let i=0;i<uv.count;i++){
          const along=size.z>size.x?position.getZ(i):position.getX(i),up=position.getY(i);
          uv.setXY(i,(horizontal?up:along)/2.4+(n*.173)%1,(horizontal?along:up)/3.6+(n*.317)%1);
        }
      }
      g.rotateY(ry);g.translate(...p);
      const positions=g.getAttribute('position'),lightUV:number[]=[];
      const panel=p[0]<-6?0:p[0]>6?2:1;
      for(let i=0;i<positions.count;i++){
        const horizontal=panel===1?(positions.getX(i)+6.4)/12.8:(positions.getZ(i)+8.4)/16.7;
        lightUV.push((panel*256+.5+THREE.MathUtils.clamp(horizontal,0,1)*255)/768,THREE.MathUtils.clamp((positions.getY(i)+1)/5,0,1));
      }
      g.setAttribute('uv1',new THREE.Float32BufferAttribute(lightUV,2));batches[mat].push(g);
    };
    const box=(w:number,h:number,d:number,mat:number,p:[number,number,number],ry=0)=>add(new RoundedBoxGeometry(w,h,d,1,.018),mat,p,ry);
    // Thick shell: a deeper salon, not a change to camera or poker table scale.
    box(13.1,5,.24,0,[0,1.5,-8.52]);
    for(const side of [-1,1])box(.24,5,16.7,0,[side*6.52,1.5,-.05]);
    // A full-height upholstered center bay replaces the six pale window-like panels.
    box(4.64,4.45,.12,1,[0,1.3,-8.30]);
    add(frame(4.60,4.40,.09),0,[0,1.3,-8.20]);
    for(const x of [-1.45,0,1.45]) {
      box(1.37,4.12,.12,3,[x,1.3,-8.16]);
      // Slim recessed seams read as tailoring, not glazing bars.
    }
    for(const x of [-2.38,2.38])box(.018,4.48,.022,2,[x,1.3,-8.10]);
    // Broader timber bays and narrow fluted piers establish an architectural rhythm.
    for(const side of [-1,1]) {
      for(const [x,w] of [[3.25,1.36],[5.20,1.84]]) {
        box(w,4.3,.075,0,[side*x,1.3,-8.29]);
        add(frame(w+.14,4.43,.065),1,[side*x,1.3,-8.18]);
        add(frame(w-.11,4.16,.022),1,[side*x,1.3,-8.205]);
      }
      for(const x of [2.55,4.15,6.25]) {
        box(.18,4.68,.16,1,[side*x,1.33,-8.18]);
        for(const dx of [-.05,0,.05])box(.012,4.5,.02,0,[side*x+dx,1.33,-8.08]);
      }
    }
    // Side walls use staggered bay widths, not an office-like grid of chair rails.
    for(const side of [-1,1]) for(const [z,w] of [[-6.5,3.2],[-3.15,2.9],[.1,3.2],[3.7,3.5],[6.8,2.4]]) {
      const ry=side===-1?Math.PI/2:-Math.PI/2;
      box(w-.16,4.35,.075,0,[side*6.36,1.25,z],ry);
      add(frame(w-.04,4.48,.07),1,[side*6.28,1.25,z],ry);
      add(frame(w-.29,4.20,.022),1,[side*6.30,1.25,z],ry);
      if(z===-3.15)box(w-.42,3.99,.055,3,[side*6.20,1.25,z],ry);
    }
    // Continuous skirting and a stepped cornice join wall, floor and tray ceiling.
    for(const [y,h,d] of [[-.875,.25,.17],[-.69,.055,.18],[3.42,.14,.18],[3.67,.22,.32]]) {
      box(12.8,h,d,1,[0,y,-8.20]);
      for(const side of [-1,1])box(d,h,16.4,1,[side*(6.4-d/2),y,-.05]);
    }
    // Recessed service door: two substantial panels with a small brass lever.
    box(1.42,3.06,.10,1,[5.2,.56,-8.08]);
    add(frame(1.55,3.20,.11),0,[5.2,.56,-7.98]);
    for(const y of [-.22,1.27])add(frame(1.13,1.2,.028),0,[5.2,y,-7.83]);
    box(.035,.23,.04,2,[5.7,.42,-7.77]);box(.19,.035,.055,2,[5.63,.45,-7.73]);
    // Higher recessed ceiling; emitters are concealed behind the projecting lip.
    box(13,.16,16.7,4,[0,4.08,-.05]);
    for(const side of [-1,1])box(.72,.25,16.4,4,[side*6.02,3.81,-.05]);
    box(11.4,.25,.7,4,[0,3.81,-8.05]);
    box(.04,.64,.04,2,[1,3.75,1.5]);
    for(const x of [-1.9,1.9])box(.18,.35,.18,2,[x,3.88,-6.3]);
    const geometries=batches.map(gs=>{const merged=mergeGeometries(gs);gs.forEach(g=>g.dispose());return merged!;});
    const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;
    const gradient=ctx.createRadialGradient(64,64,8,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.48)');gradient.addColorStop(.65,'rgba(0,0,0,.25)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
    const contact=new THREE.CanvasTexture(c);maps.push(contact);
    const washTargets=[-1.9,1.9].map(x=>{const target=new THREE.Object3D();target.position.set(x,.5,-8.28);return target;});
    const floorGeometry=new THREE.PlaneGeometry(12.9,16.7);floorGeometry.setAttribute('uv1',floorGeometry.getAttribute('uv').clone());
    return {floorGeometry,maps,materials:[wood,trim,brass,fabric,plaster],floorMat,geometries,contact,washTargets};
  },[gl]);
  useEffect(()=>{
    scene.background=new THREE.Color('#302b23');gl.domElement.dataset.backdrop='ready';gl.domElement.dataset.environment='vip-3d';
    return()=>{scene.background=null;resources.maps.forEach(t=>t.dispose());resources.materials.forEach(m=>m.dispose());resources.floorMat.dispose();resources.floorGeometry.dispose();resources.geometries.forEach(g=>g.dispose());};
  },[scene,gl,resources]);
  return <group>
    {resources.geometries.map((g,i)=><mesh key={i} geometry={g} material={resources.materials[i]} receiveShadow/>)}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1,-.05]} material={resources.floorMat} geometry={resources.floorGeometry} receiveShadow/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.997,0]}><planeGeometry args={[7.1,4.3]}/><meshBasicMaterial map={resources.contact} transparent depthWrite={false}/></mesh>
    {[-1,1].map(side=><Sconce key={side} side={side}/>)}
    {[-1,1].map(side=><mesh key={side} position={[side*5.62,3.73,-.05]} rotation={[0,0,side*.35]}><boxGeometry args={[.025,.025,15.4]}/><meshBasicMaterial color='#ffcc88'/></mesh>)}
    <ambientLight intensity={.26} color='#f2c793'/>
    <hemisphereLight args={['#ead0a5','#25251c',.30]}/>
    {resources.washTargets.map((target,i)=><group key={i}>
      <primitive object={target}/>
      <spotLight position={[(i===0?-1:1)*1.9,3.7,-6.3]} target={target} color='#ffbd80' intensity={85} angle={.72} penumbra={1} distance={7}/>
    </group>)}
    <mesh position={[1,3.43,1.5]} rotation={[Math.PI/2,0,0]}><circleGeometry args={[.22,32]}/><meshBasicMaterial color="#ffe4b2" side={THREE.DoubleSide}/></mesh>
    <spotLight position={[1,3.4,1.5]} angle={.95} penumbra={1} intensity={38} distance={16} color='#ffe4b2' castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-.0003}/>
    <pointLight position={[-3,2,2]} color='#ffd6a3' intensity={6} distance={7}/>
    <pointLight position={[0,1.6,-1]} color='#f2c794' intensity={5} distance={3}/>
  </group>;
}
function Sconce({side}:{side:number}) {
  const geometry=useMemo(()=>{
    const points=[new THREE.Vector2(.14,-.26),new THREE.Vector2(.22,-.24),new THREE.Vector2(.17,.22),new THREE.Vector2(.12,.26)];
    return new THREE.LatheGeometry(points,24);
  },[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <group position={[side*6.18,.35,-6]} rotation={[0,side===-1?Math.PI/2:-Math.PI/2,0]}>
    <mesh><boxGeometry args={[.16,.62,.07]}/><meshStandardMaterial color='#92744a' metalness={.7} roughness={.38}/></mesh>
    <mesh position={[0,-.16,.19]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.025,.025,.35,12]}/><meshStandardMaterial color='#8a6b40' metalness={.7} roughness={.35}/></mesh>
    <mesh geometry={geometry} position={[0,.12,.34]}><meshStandardMaterial color='#e3ba79' emissive='#ffc576' emissiveIntensity={.65} roughness={.95} side={THREE.DoubleSide}/></mesh>
    <pointLight position={[0,.1,.36]} color='#ffbd80' intensity={13} distance={5.5} decay={2}/>
  </group>;
}

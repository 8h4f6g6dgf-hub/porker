import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Room coordinates: floor -1, ceiling 3.5, rear wall -6.2, side walls ±5.8.
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
  const hole=new THREE.Path();const rim=.055;
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
    const carpet=fabricTexture(); maps.push(carpet);
    const wood=new THREE.MeshStandardMaterial({color:'#bccacb',map:color,normalMap:normal,normalScale:new THREE.Vector2(.35,.35),roughnessMap:rough,roughness:.8});
    const trim=new THREE.MeshStandardMaterial({color:'#a8aaa1',map:color,roughness:.48});
    const brass=new THREE.MeshStandardMaterial({color:'#93744a',metalness:.72,roughness:.37});
    const fabric=new THREE.MeshStandardMaterial({color:'#607367',roughness:1,bumpMap:carpet,bumpScale:.009});
    const plaster=new THREE.MeshStandardMaterial({color:'#807967',roughness:.98});
    const floorMat=new THREE.MeshStandardMaterial({color:'#d1c2a4',map:carpet,bumpMap:carpet,bumpScale:.016,roughness:1});
    const batches:THREE.BufferGeometry[][]=[[],[],[],[],[]];
    const add=(g:THREE.BufferGeometry,mat:number,p:[number,number,number],ry=0)=>{
      g.rotateY(ry);g.translate(...p);batches[mat].push(g);
    };
    const box=(w:number,h:number,d:number,mat:number,p:[number,number,number],ry=0)=>add(new RoundedBoxGeometry(w,h,d,1,.018),mat,p,ry);
    // Closed shell with thickness; side wall corners overlap the rear wall cleanly.
    box(11.9,4.5,.24,0,[0,1.25,-6.32]);
    for(const side of [-1,1]) box(.24,4.5,14.5,0,[side*5.92,1.25,.8]);
    // Recessed rear panels, lower wainscot and physically projecting mouldings.
    for(const x of [-4.65,-2.85,-.95,.95,2.85,4.65]) {
      box(1.62,2.55,.06,3,[x,1.58,-6.15]);
      add(frame(1.72,2.65,.055),1,[x,1.58,-6.10]);
      box(1.58,.66,.07,0,[x,-.45,-6.13]);
      add(frame(1.7,.78,.045),1,[x,-.45,-6.08]);
    }
    // Side panels create real perspective and parallax, with a wider service door on right.
    for(const side of [-1,1]) for(const z of [-4.95,-2.55,-.15,2.25,4.65]) {
      const ry=side===-1?Math.PI/2:-Math.PI/2;
      box(2.12,3.55,.07,0,[side*5.76,1.02,z],ry);
      add(frame(2.22,3.65,.065),1,[side*5.70,1.02,z],ry);
    }
    // Continuous skirting, chair rail and layered ceiling cornice.
    for(const [y,h,d] of [[-.86,.22,.13],[.03,.11,.15],[3.05,.13,.17],[3.22,.18,.26]]) {
      box(11.6,h,d,1,[0,y,-6.04]);
      for(const side of [-1,1])box(d,h,14.1,1,[side*(5.8-d/2),y,.9]);
    }
    box(11.6,.035,.035,2,[0,.12,-5.98]);
    // Door: inset double panels, substantial casing, threshold and brass lever.
    box(1.36,2.92,.12,1,[4.5,.49,-5.90]);
    add(frame(1.49,3.04,.1),0,[4.5,.49,-5.79]);
    for(const y of [-.27,1.13])add(frame(1.07,1.13,.025),0,[4.5,y,-5.73]);
    box(.035,.23,.04,2,[4.97,.42,-5.68]);box(.19,.035,.055,2,[4.9,.45,-5.64]);
    // Tray ceiling: perimeter soffit below recessed center, with hidden cove emitters.
    box(11.8,.16,14.5,4,[0,3.58,.8]);
    for(const side of [-1,1])box(.64,.23,14.2,4,[side*5.42,3.34,.8]);
    box(10.2,.23,.65,4,[0,3.34,-5.87]);
    const geometries=batches.map(gs=>{const merged=mergeGeometries(gs);gs.forEach(g=>g.dispose());return merged!;});
    const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;
    const gradient=ctx.createRadialGradient(64,64,8,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.65)');gradient.addColorStop(.65,'rgba(0,0,0,.4)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
    const contact=new THREE.CanvasTexture(c);maps.push(contact);
    return {maps,materials:[wood,trim,brass,fabric,plaster],floorMat,geometries,contact};
  },[gl]);
  useEffect(()=>{
    scene.background=new THREE.Color('#302b23');gl.domElement.dataset.backdrop='ready';gl.domElement.dataset.environment='vip-3d';
    return()=>{scene.background=null;resources.maps.forEach(t=>t.dispose());resources.materials.forEach(m=>m.dispose());resources.floorMat.dispose();resources.geometries.forEach(g=>g.dispose());};
  },[scene,gl,resources]);
  return <group>
    {resources.geometries.map((g,i)=><mesh key={i} geometry={g} material={resources.materials[i]} receiveShadow/>)}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1,.8]} material={resources.floorMat} receiveShadow><planeGeometry args={[11.7,14.5]}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.997,0]}><planeGeometry args={[7.1,4.3]}/><meshBasicMaterial map={resources.contact} transparent depthWrite={false}/></mesh>
    {[-3.7,3.7].map(x=><Sconce key={x} x={x}/>)}
    {[-1,1].map(side=><mesh key={side} position={[side*5.08,3.26,.5]} rotation={[0,0,side*.35]}><boxGeometry args={[.025,.025,12.8]}/><meshBasicMaterial color='#edbd78'/></mesh>)}
    <ambientLight intensity={.38} color='#d4c5aa'/>
    <hemisphereLight args={['#e7d4b4','#29271d',.55]}/>
    <pointLight position={[-4.7,2.4,-3.8]} color='#ffd6a1' intensity={35} distance={9}/>
    <pointLight position={[4.7,2.4,-3.8]} color='#ffd6a1' intensity={35} distance={9}/>
    <mesh position={[1,3.43,1.5]} rotation={[Math.PI/2,0,0]}><circleGeometry args={[.22,32]}/><meshBasicMaterial color="#ffe4b2" side={THREE.DoubleSide}/></mesh>
    <spotLight position={[1,3.4,1.5]} angle={.95} penumbra={1} intensity={38} distance={16} color='#ffe4b2' castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-.0003}/>
    <pointLight position={[-3,2,2]} color='#b4c7b9' intensity={8} distance={7}/>
    <pointLight position={[0,1.6,-1]} color='#f2c794' intensity={5} distance={3}/>
  </group>;
}
function Sconce({x}:{x:number}) {
  const geometry=useMemo(()=>{
    const points=[new THREE.Vector2(.14,-.26),new THREE.Vector2(.22,-.24),new THREE.Vector2(.17,.22),new THREE.Vector2(.12,.26)];
    return new THREE.LatheGeometry(points,24);
  },[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <group position={[x,.65,-5.68]}>
    <mesh><boxGeometry args={[.16,.62,.07]}/><meshStandardMaterial color='#92744a' metalness={.7} roughness={.38}/></mesh>
    <mesh position={[0,-.16,.19]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.025,.025,.35,12]}/><meshStandardMaterial color='#8a6b40' metalness={.7} roughness={.35}/></mesh>
    <mesh geometry={geometry} position={[0,.12,.34]}><meshStandardMaterial color='#ffe1ac' emissive='#ffce8a' emissiveIntensity={1.3} roughness={.88} side={THREE.DoubleSide}/></mesh>
    <pointLight position={[0,.1,.36]} color='#ffd29a' intensity={18} distance={5} decay={2}/>
  </group>;
}

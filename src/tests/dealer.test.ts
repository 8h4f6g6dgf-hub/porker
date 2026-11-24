import { beforeAll,describe,it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createDealerRig,dealerGesture,dealOffsets,DEAL_TIMING } from '../immersive/dealerMotion';
let rig:ReturnType<typeof createDealerRig>;
beforeAll(async()=>{
 const b=readFileSync('public/assets/dealer/dealer.glb');
 const g=await new GLTFLoader().parseAsync(new Uint8Array(b).buffer,'');
 rig=createDealerRig(g.scene);
});
describe('rigged dealer',()=>{
 it('uses a real skin with normalized bone weights and stays below the transfer budget',()=>{
  expect(readFileSync('public/assets/dealer/dealer.glb').length).toBeLessThan(5_000_000);
  let skins=0;
  rig.root.traverse(o=>{if(!(o as THREE.SkinnedMesh).isSkinnedMesh)return;skins++;
   const m=o as THREE.SkinnedMesh;expect(m.skeleton.bones.length).toBe(65);
   const w=m.geometry.getAttribute('skinWeight'),j=m.geometry.getAttribute('skinIndex');
   for(let i=0;i<w.count;i++){
    expect(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)).toBeCloseTo(1,4);
    expect(Math.max(j.getX(i),j.getY(i),j.getZ(i),j.getW(i))).toBeLessThan(65);
   }
  });expect(skins).toBe(2);
 });
 it('keeps hand mesh above felt throughout idle, dealing and presenting',()=>{
  let minimumY=Infinity,finite=true;const v=new THREE.Vector3();
  for(const phase of ['choose','deal','flop','turn','river'])for(let t=0;t<(phase==='choose'?20:3);t+=.05){
   rig.pose(phase,t,false);rig.root.updateMatrixWorld(true);
   rig.root.traverse(o=>{
    if(!(o as THREE.SkinnedMesh).isSkinnedMesh)return;const m=o as THREE.SkinnedMesh;
    m.skeleton.update();const p=m.geometry.getAttribute('position');
    for(let i=0;i<p.count;i++){if(Math.abs(p.getX(i))<.68)continue;
     v.fromBufferAttribute(p,i);m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld);
     minimumY=Math.min(minimumY,v.y);finite=finite&&Number.isFinite(v.x+v.y+v.z);
    }
   });
  }
  expect(minimumY).toBeGreaterThan(.7875);expect(finite).toBe(true);
 });
 it('rests both hands flat on the felt with a narrower, balanced shoulder span',()=>{
  rig.pose('choose',0,true);rig.root.updateMatrixWorld(true);
  const at=(name:string)=>rig.root.getObjectByName(name)!.getWorldPosition(new THREE.Vector3());
  const span=at('upperarm_l').distanceTo(at('upperarm_r'));
  expect(span).toBeGreaterThan(.66);expect(span).toBeLessThan(.73);
  for(const side of ['l','r']){
   const wrist=at(`hand_${side}`),tip=at(`middle_04_leaf_${side}`),thumb=at(`thumb_04_leaf_${side}`);
   expect(Math.abs(wrist.y-tip.y)).toBeLessThan(.03);
   expect(wrist.z).toBeGreaterThan(-1.55);expect(tip.z).toBeGreaterThan(wrist.z);
   expect(thumb.y-wrist.y).toBeLessThan(.02);expect(thumb.y-wrist.y).toBeGreaterThan(-.05);
  }
  let minimumY=Infinity;
  rig.root.traverse(o=>{if(!(o as THREE.SkinnedMesh).isSkinnedMesh)return;
   const m=o as THREE.SkinnedMesh;m.skeleton.update();const p=m.geometry.getAttribute('position');
   for(let i=0;i<p.count;i++){if(Math.abs(p.getX(i))<.72)continue;
    const v=new THREE.Vector3().fromBufferAttribute(p,i);m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld);minimumY=Math.min(minimumY,v.y);
   }
  });
  expect(minimumY-.7875).toBeGreaterThan(0);expect(minimumY-.7875).toBeLessThan(.012);
 });
 it('faces the player, keeps palms down and stands upright with relaxed elbows',()=>{
  rig.pose('choose',0,true);rig.root.updateMatrixWorld(true);
  expect(new THREE.Vector3(0,0,1).applyQuaternion(rig.root.quaternion).z).toBeGreaterThan(.99);
  for(const arm of rig.arms){
   const palm=new THREE.Vector3(arm.side,0,0).applyQuaternion(arm.hand.getWorldQuaternion(new THREE.Quaternion()));
   expect(palm.y).toBeLessThan(-.99);
   const shoulder=arm.upper.getWorldPosition(new THREE.Vector3()),elbow=arm.lower.getWorldPosition(new THREE.Vector3()),wrist=arm.hand.getWorldPosition(new THREE.Vector3());
   expect(shoulder.y).toBeGreaterThan(1.68);expect(shoulder.y).toBeLessThan(1.82);
   const angle=shoulder.clone().sub(elbow).angleTo(wrist.clone().sub(elbow))*180/Math.PI;
   expect(angle).toBeGreaterThan(115);expect(angle).toBeLessThan(165);
  }
 });
 it('keeps mirrored garment faces oriented consistently with their normals',()=>{
  let checked=0;
  rig.root.traverse(o=>{if(!(o as THREE.SkinnedMesh).isSkinnedMesh)return;
   const m=o as THREE.SkinnedMesh,p=m.geometry.getAttribute('position'),n=m.geometry.getAttribute('normal'),ix=m.geometry.index!;
   if(p.count===7281)return; // original body; inspect the generated clothing
   const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3();
   let minimum=Infinity;
   for(let i=0;i<ix.count;i+=3){
    const ai=ix.getX(i),bi=ix.getX(i+1),ci=ix.getX(i+2);
    a.fromBufferAttribute(p,ai);b.fromBufferAttribute(p,bi).sub(a);c.fromBufferAttribute(p,ci).sub(a);
    normal.fromBufferAttribute(n,ai).add(new THREE.Vector3().fromBufferAttribute(n,bi)).add(new THREE.Vector3().fromBufferAttribute(n,ci));
    minimum=Math.min(minimum,b.cross(c).dot(normal));checked++;
   }
   expect(minimum).toBeGreaterThan(-1e-7);
  });expect(checked).toBeGreaterThan(100);
 });
 it('moves at every card release, presents after landing, and settles to idle',()=>{
  for(const phase of ['deal','flop','turn','river']){
   for(const offset of dealOffsets(phase))expect(dealerGesture(phase,offset+DEAL_TIMING.release).reach).toBeGreaterThan(.8);
   expect(dealerGesture(phase,5).motion).toBe('idle');
   expect(dealerGesture(phase,.2,true).motion).toBe('idle');
  }
  expect(dealerGesture('flop',1.2).present).toBe(0);
  expect(dealerGesture('flop',2).motion).toBe('present');
 });
});

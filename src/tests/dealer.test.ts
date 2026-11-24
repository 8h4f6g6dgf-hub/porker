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
   expect(thumb.y-wrist.y).toBeLessThan(.06);
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

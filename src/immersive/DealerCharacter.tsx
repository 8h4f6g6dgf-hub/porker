import { useEffect,useRef,useState,type ReactNode } from 'react';
import { useFrame,useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createDealerRig } from './dealerMotion';
function dispose(root:THREE.Group){root.traverse(o=>{if((o as THREE.Mesh).isMesh){const m=o as THREE.Mesh;m.geometry.dispose();(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>x.dispose());}});}
export function DealerCharacter({phase,reducedMotion,fallback}:{phase:string;reducedMotion:boolean;fallback:ReactNode}){
  const {gl}=useThree();const [rig,setRig]=useState<ReturnType<typeof createDealerRig>|null>(null);
  const elapsed=useRef(0),previous=useRef(phase),motionPhase=useRef('choose');
  useEffect(()=>{
    let cancelled=false,owned:THREE.Group|null=null;
    gl.domElement.dataset.dealer='loading';
    new GLTFLoader().load(`${import.meta.env.BASE_URL}assets/dealer/dealer.glb`,g=>{
      if(cancelled){dispose(g.scene);return;}
      owned=g.scene;
      try{setRig(createDealerRig(g.scene));gl.domElement.dataset.dealer='ready';}
      catch{dispose(g.scene);owned=null;gl.domElement.dataset.dealer='fallback';}
    },undefined,()=>{if(!cancelled)gl.domElement.dataset.dealer='fallback';});
    return()=>{cancelled=true;if(owned)dispose(owned);};
  },[gl]);
  useFrame((_,dt)=>{
    if(previous.current!==phase){
      const order=['entrance','seat','choose','deal','reveal','hand','flop','turn','river','quiz','result','continue'];
      motionPhase.current=order.indexOf(phase)>order.indexOf(previous.current)?phase:'choose';
      previous.current=phase;elapsed.current=0;
    }
    elapsed.current+=dt;
    if(rig)gl.domElement.dataset.dealerMotion=rig.pose(motionPhase.current,elapsed.current,reducedMotion,dt);
  });
  return rig?<primitive object={rig.root}/>:<>{fallback}</>;
}

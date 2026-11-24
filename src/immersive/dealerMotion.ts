import * as THREE from 'three';
export const DEAL_TIMING={release:.18,flight:.75,holeGap:.48,flopGap:.22} as const;
export function dealOffsets(phase:string){return phase==='deal'?[0,DEAL_TIMING.holeGap]:phase==='flop'?[0,DEAL_TIMING.flopGap,DEAL_TIMING.flopGap*2]:['turn','river'].includes(phase)?[0]:[];}
export function dealerGesture(phase:string,time:number,reduced=false){
  const offsets=dealOffsets(phase);
  if(reduced)return {motion:'idle',reach:0,present:0};
  // A small smooth stroke at every card release, then a quiet return.
  let reach=0;
  for(const offset of offsets){const u=(time-offset)/.42;if(u>=0&&u<=1)reach=Math.max(reach,Math.sin(u*Math.PI)**2);}
  const end=offsets.length?offsets[offsets.length-1]+DEAL_TIMING.release+DEAL_TIMING.flight:0;
  const p=time-end;
  const present=phase!=='deal'&&offsets.length&&p>0&&p<1.5?Math.sin(p/1.5*Math.PI)**2:0;
  return {motion:reach>0?'deal':present>0?'present':'idle',reach,present};
}
function worldPosition(o:THREE.Object3D){return o.getWorldPosition(new THREE.Vector3());}
function aim(bone:THREE.Bone,child:THREE.Bone,target:THREE.Vector3){
  const origin=worldPosition(bone),current=worldPosition(child).sub(origin).normalize(),desired=target.clone().sub(origin).normalize();
  const q=new THREE.Quaternion().setFromUnitVectors(current,desired).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
  bone.quaternion.copy(bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));bone.updateWorldMatrix(false,true);
}
export function createDealerRig(root:THREE.Group){
  root.position.set(0,-1,-1.88);root.scale.setScalar(1.85);root.rotation.y=0;
  const bones:THREE.Bone[]=[];root.traverse(o=>{if((o as THREE.Bone).isBone)bones.push(o as THREE.Bone);if((o as THREE.Mesh).isMesh){o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;}});
  const rest=new Map(bones.map(b=>[b,b.quaternion.clone()]));
  const get=(name:string)=>{const b=root.getObjectByName(name) as THREE.Bone;if(!b?.isBone)throw new Error(`Missing dealer joint ${name}`);return b;};
  const arms=['l','r'].map((s,i)=>({side:i===0?1:-1,upper:get(`upperarm_${s}`),lower:get(`lowerarm_${s}`),hand:get(`hand_${s}`),s}));
  // Uniform bone scaling extends the limbs without introducing shear.
  // The build script compensates sleeve cross-sections; hand scale cancels inherited extension.
  for(const arm of arms){arm.upper.position.y*=.82;arm.upper.scale.multiplyScalar(1.10);arm.lower.scale.multiplyScalar(1.03);arm.hand.scale.multiplyScalar(.88/(1.10*1.03));}
  for(const name of ['spine_02','spine_03'])get(name).position.y*=1.04;
  const spine=get('spine_02'),chest=get('spine_03');
  function pose(phase:string,time:number,reduced:boolean,dt=Infinity){
    const before=bones.map(b=>b.quaternion.clone());
    for(const b of bones)b.quaternion.copy(rest.get(b)!);
    const gesture=dealerGesture(phase,time,reduced),breath=reduced?0:Math.sin(time*.7)*.004;
    spine.rotateX(.035+breath);chest.rotateX(.015);root.updateWorldMatrix(true,true);
    for(const arm of arms){
      const {side,upper,lower,hand}=arm;
      const active=side===-1;
      const wrist=new THREE.Vector3(side*.34,.861,-1.52);
      if(active){wrist.x+=gesture.reach*.18+gesture.present*.12;wrist.z+=gesture.reach*.025+gesture.present*.12;wrist.y+=gesture.reach*.035+gesture.present*.06;}
      wrist.y+=breath*.8;
      const start=worldPosition(upper),elbowRest=worldPosition(lower),handRest=worldPosition(hand);
      const a=start.distanceTo(elbowRest),b=elbowRest.distanceTo(handRest),delta=wrist.clone().sub(start);
      const distance=Math.min(delta.length(),(a+b)*.985),d=delta.normalize();
      const pole=new THREE.Vector3(side*.30,1.20,-2.10).sub(start);pole.addScaledVector(d,-pole.dot(d)).normalize();
      const along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along));
      const elbow=start.clone().addScaledVector(d,along).addScaledVector(pole,height),target=start.clone().addScaledVector(d,distance);
      aim(upper,lower,elbow);aim(lower,hand,target);
      const handWorld=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,-side,-side*.025).normalize(),new THREE.Vector3(0,-.025,1).normalize(),new THREE.Vector3(-side,0,0)));
      hand.quaternion.copy(hand.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(handWorld));
      // Mild knuckle flex; fingers are skinned bones, not independent pieces.
      for(const finger of ['index','middle','ring','pinky'])for(const joint of ['01','02','03'])get(`${finger}_${joint}_${arm.s}`).rotateX(joint==='01'?-.015:-.02);
      hand.updateWorldMatrix(false,true);
      const thumb=get(`thumb_01_${arm.s}`),thumbTip=get(`thumb_02_${arm.s}`);
      aim(thumb,thumbTip,new THREE.Vector3(wrist.x-side*.11,wrist.y-.035,wrist.z+.17));
    }
    const blend=1-Math.exp(-25*dt);
    bones.forEach((b,i)=>b.quaternion.slerpQuaternions(before[i],b.quaternion.clone(),blend));
    root.updateWorldMatrix(true,true);
    return gesture.motion;
  }
  pose('choose',0,true);
  return {root,pose,arms};
}

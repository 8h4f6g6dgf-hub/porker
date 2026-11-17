import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Opaque, depth-writing floor. Distant floor joins the plate in screen space;
// the nearby carpet uses world-space coordinates and receives real contact shadows.
export function CasinoFloor() {
 const { scene, gl } = useThree();
 const material = useMemo(() => new THREE.ShaderMaterial({
  uniforms: { plate:{value:null}, ready:{value:0}, transform:{value:new THREE.Matrix3()}, resolution:{value:new THREE.Vector2()} },
  vertexShader:`varying vec3 world; void main(){vec4 p=modelMatrix*vec4(position,1.);world=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
  fragmentShader:`uniform sampler2D plate; uniform float ready; uniform mat3 transform; uniform vec2 resolution; varying vec3 world;
  void main(){
   vec2 screen=(transform*vec3(gl_FragCoord.xy/resolution,1.)).xy;
   vec3 farColor=texture2D(plate,screen).rgb*.72;
   vec2 carpet=vec2(.28, .02)+abs(fract(world.xz*vec2(.24,.24))*2.-1.)*vec2(.44,.23);
   vec3 nearColor=texture2D(plate,carpet).rgb*.58;
   float join=smoothstep(-5.,-.5,world.z)*(1.-smoothstep(2.6,4.2,abs(world.x)));
   vec3 color=mix(farColor,nearColor,join);
   gl_FragColor=vec4(mix(vec3(.035,.019,.012),color,ready),1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`, depthTest:true, depthWrite:true, transparent:false, toneMapped:false,
 }),[]);
 const contact = useMemo(() => {
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;
  const gradient=ctx.createRadialGradient(64,64,12,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.6)');gradient.addColorStop(.65,'rgba(0,0,0,.35)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
 },[]);
 useFrame(()=>{
  const bg=scene.background;
  if(bg instanceof THREE.Texture){material.uniforms.plate.value=bg;material.uniforms.ready.value=1;material.uniforms.transform.value.copy(bg.matrix);}
  gl.getDrawingBufferSize(material.uniforms.resolution.value);
 });
 useEffect(()=>()=>{material.dispose();contact.dispose()},[material,contact]);
 return <group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1,0]} material={material}><planeGeometry args={[40,40]}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.999,0]} receiveShadow><planeGeometry args={[40,40]}/><shadowMaterial opacity={.3} transparent depthWrite={false}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.997,0]}><planeGeometry args={[7.1,4.3]}/><meshBasicMaterial map={contact} transparent depthWrite={false} toneMapped={false}/></mesh>
 </group>;
}

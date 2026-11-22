import * as THREE from 'three';
import { CHAIR_POSITIONS } from './pokerFurnitureGeometry';

// Original, seamless woven motif. One repeat is ~0.55 scene units, not a giant rug print.
export function carpetTexture() {
  const size=512,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size;
    const diagonal=Math.min(Math.abs(Math.sin(Math.PI*(u+v))),Math.abs(Math.sin(Math.PI*(u-v))));
    const border=Math.exp(-((diagonal/.024)**2));
    const inner=Math.exp(-(((diagonal-.095)/.018)**2));
    const weave=((x%4<2)===(y%4<2)?4:-4);
    const dx=u-.5,dy=v-.5,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
    const rosette=Math.exp(-(((r-(.10+.018*Math.cos(4*angle)))/.017)**2));
    const center=Math.exp(-((r/.025)**2));
    const fleck=Math.sin(x*12.9898+y*78.233)*43758.5453;
    const tone=153+border*10+inner*4+rosette*13+center*8+weave+(fleck-Math.floor(fleck)-.5)*14;
    const i=(y*size+x)*4;
    pixels.data[i]=tone;pixels.data[i+1]=tone*.94;pixels.data[i+2]=tone*.93;pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(23.5,30.42);t.anisotropy=4;return t;
}

// Static indirect-light approximations, not a path-traced bake. They affect only room surfaces.
// The 3-panel wall atlas stores left / rear / right walls; UV1 is independent of wood UVs.
export function roomLightMap(floor:boolean) {
  const bell=(x:number,y=0)=>Math.exp(-(x*x+y*y));
  const width=floor?256:768,height=256,canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(width,height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    let light:number;
    if(floor){
      const wx=(x/(width-1)-.5)*12.9,wz=y/(height-1)*16.7-8.4;
      light=.42+.30*bell((Math.abs(wx)-5.4)/1.8,(wz+5.7)/3.6);
      light+=.16*bell((wz+7.4)/1.8);
      light-=.24*Math.exp(-((wx/3.6)**4+(wz/1.9)**4));
      for(const [cx,cz] of CHAIR_POSITIONS)light-=.12*bell((wx-cx)/.8,(wz-cz)/.85);
    }else{
      const panel=Math.floor(x/256),u=(x%256)/255,h=4-y/(height-1)*5;
      light=.22+.14*bell((h-3.55)/.7);
      if(panel===1){const wx=(u-.5)*12.8;for(const cx of [-1.9,1.9])light+=.32*bell((wx-cx)/2.4,(h-1.6)/2.0);}
      else {const z=u*16.7-8.4;light+=.55*bell((z+6)/2.7,(h-.6)/1.9);}
    }
    const i=(y*width+x)*4,value=Math.max(.10,Math.min(.95,light))*255;
    pixels.data[i]=value;pixels.data[i+1]=value*.84;pixels.data[i+2]=value*.68;pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);const t=new THREE.CanvasTexture(canvas);
  t.colorSpace=THREE.NoColorSpace;t.channel=1;t.generateMipmaps=false;t.minFilter=THREE.LinearFilter;return t;
}

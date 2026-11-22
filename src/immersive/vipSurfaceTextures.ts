import * as THREE from 'three';
import { CHAIR_POSITIONS } from './pokerFurnitureGeometry';

// Original half-drop damask: hand-drawn palmette, acanthus leaves and mirrored scrolls.
// The corner copies wrap exactly; there is no downloaded artwork or raster background.
export function carpetTexture(maxAnisotropy=4) {
  const size=1024,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#633343';ctx.fillRect(0,0,size,size);ctx.scale(size/256,size/256);
  const leaf=new Path2D('M122 157 C110 152 105 140 92 137 C64 132 47 115 53 91 C58 103 68 105 78 103 C64 91 63 74 72 65 C73 85 92 87 103 102 C111 115 104 129 122 141 Z');
  const crown=new Path2D('M128 52 C120 66 108 71 109 83 C109 94 120 99 128 111 C136 99 147 94 147 83 C148 71 136 66 128 52 Z');
  const pendant=new Path2D('M128 163 C111 177 110 190 128 206 C146 190 145 177 128 163 Z');
  const scroll=new Path2D('M117 174 C94 189 65 181 61 159 C58 143 75 137 83 148 C90 159 79 165 74 159 C73 156 75 153 79 154 C75 144 65 151 68 161 C74 179 101 178 117 166 Z');
  const topLeaf=new Path2D('M123 120 C109 114 97 101 98 88 C88 90 85 102 90 113 C98 128 114 127 123 135 Z');
  function motif(cx:number,cy:number){
    ctx.save();ctx.translate(cx,cy);ctx.scale(.78,.78);ctx.translate(-128,-128);
    ctx.fillStyle='#86674f';ctx.fill(crown);ctx.fill(pendant);
    for(const mirror of [false,true]){
      ctx.save();if(mirror){ctx.translate(256,0);ctx.scale(-1,1);}
      ctx.fillStyle='#805b49';ctx.fill(leaf);ctx.fill(scroll);
      ctx.fillStyle='#795044';ctx.fill(topLeaf);
      ctx.strokeStyle='#694237';ctx.lineWidth=1.2;
      ctx.stroke(new Path2D('M119 148 C98 133 99 111 77 95 M98 127 C82 126 70 119 64 109 M128 61 C124 77 122 86 128 102'));
      ctx.strokeStyle='#805749';ctx.lineWidth=1.4;
      ctx.stroke(new Path2D('M128 37 C105 49 74 42 57 63 C31 95 40 130 48 151 C59 185 96 204 128 218'));
      ctx.restore();
    }
    ctx.strokeStyle='#86674f';ctx.lineWidth=2.2;
    ctx.stroke(new Path2D('M128 111 C123 131 128 145 128 163'));
    ctx.restore();
  }
  motif(128,128);
  for(const x of [0,256])for(const y of [0,256])motif(x,y);
  ctx.setTransform(1,0,0,1,0,0);
  const pixels=ctx.getImageData(0,0,size,size);let seed=731;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    seed=seed*16807%2147483647;
    const fibre=((x%4<2)===(y%4<2)?3:-3)+(seed/2147483647-.5)*10;
    const i=(y*size+x)*4;
    for(let channel=0;channel<3;channel++)pixels.data[i+channel]+=fibre;
  }
  ctx.putImageData(pixels,0,0);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  // Square physical repeat on a 12.9 × 16.7 floor, regardless of viewport aspect.
  t.repeat.set(12.9/1.0,16.7/1.0);t.anisotropy=Math.max(1,Math.min(8,maxAnisotropy));
  t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;return t;
}

// Warm bounce only on the apron; UV1 projects its existing X/Z footprint.
export function apronLightMap(){
  const c=document.createElement('canvas');c.width=c.height=64;
  const ctx=c.getContext('2d')!,pixels=ctx.createImageData(64,64);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const front=1-y/63,side=1-Math.abs(x/63-.5)*.5;
    const value=(.045+.48*front*front*side)*255,i=(y*64+x)*4;
    pixels.data[i]=value;pixels.data[i+1]=value*.80;pixels.data[i+2]=value*.60;pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);const t=new THREE.CanvasTexture(c);
  t.channel=1;t.colorSpace=THREE.NoColorSpace;return t;
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
      // Broad, low front bounce; leaves the existing rear-wall light atlas unchanged.
      light+=.48*bell(wx/6,(wz-2.4)/3.1);
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

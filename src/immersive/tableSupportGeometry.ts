import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Twin timber trestles. Floor -1 and existing apron underside .55 are fixed datums.
export function tableSupportGeometry(){
  const parts:THREE.BufferGeometry[]=[];
  function beam(w:number,h:number,d:number,x:number,y:number,z:number,r=.025,taper=false){
    const g=new RoundedBoxGeometry(w,h,d,2,r),p=g.getAttribute('position');
    if(taper){
      for(let i=0;i<p.count;i++){
        const factor=1-.15*(.5-p.getY(i)/h);
        p.setXYZ(i,p.getX(i)*factor,p.getY(i),p.getZ(i)*factor);
      }
      g.computeVertexNormals();
    }
    // Longitudinal grain follows the cut of each timber member.
    const uv=g.getAttribute('uv'),vertical=h>=w&&h>=d;
    for(let i=0;i<p.count;i++){
      const along=vertical?p.getY(i):w>=d?p.getX(i):p.getZ(i);
      uv.setXY(i,(vertical?p.getX(i):p.getY(i))/.55+.5,along/1.6+.5);
    }
    g.translate(x,y,z);parts.push(g);
  }
  for(const x of [-1.65,1.65]){
    beam(.25,.10,1.65,x,-.95,0,.04); // Low rounded foot, flush to carpet.
    beam(.23,1.40,.27,x,-.20,0,.025,true);
    beam(.29,.10,1.46,x,.50,0,.025); // Bearing surface reaches y=.55.
  }
  // High stretcher braces the two trestles without a low bar across players' feet.
  beam(3.30,.14,.17,0,.40,0,.02);
  const g=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());
  const p=g.getAttribute('position'),n=g.getAttribute('normal'),lightUV:number[]=[];
  for(let i=0;i<p.count;i++)lightUV.push((p.getX(i)+3.7)/7.4,THREE.MathUtils.clamp(.47+.32*n.getZ(i)-p.getY(i)*.10,.05,.95));
  g.setAttribute('uv1',new THREE.Float32BufferAttribute(lightUV,2));return g;
}

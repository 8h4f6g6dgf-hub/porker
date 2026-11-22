import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { TABLE, tabletopGeometry, railGeometry, chairGeometries, CHAIR_POSITIONS, chairMatrix } from '../immersive/pokerFurnitureGeometry';
describe('poker furniture clearance',()=>{
  it('uses a two-to-one racetrack with a straight dealer edge and unchanged felt height',()=>{
    const g=tabletopGeometry(TABLE.radius,.14);g.computeBoundingBox();
    const size=g.boundingBox!.getSize(new THREE.Vector3());
    expect(size.x/size.z).toBeCloseTo(7.4/3.6,3);
    expect(size.y).toBeCloseTo(.14,5);g.dispose();
  });
  it('keeps all five board cards and both hole-card corners inside the felt',()=>{
    const centers=[-1.32,-.66,0,.66,1.32].map(x=>[x,-.02]);
    centers.push([-.372,1.12],[.372,1.12]);
    for(const [x,z] of centers)for(const dx of [-.25,.25])for(const dz of [-.35,.35]){
      expect(Math.hypot(Math.max(0,Math.abs(x+dx)-TABLE.halfStraight),z+dz)).toBeLessThan(1.58);
    }
  });
  it('keeps the padded rail within the professional table envelope',()=>{
    const g=railGeometry();g.computeBoundingBox();const b=g.boundingBox!;
    expect(b.min.x).toBeGreaterThanOrEqual(-3.701);expect(b.max.x).toBeLessThanOrEqual(3.701);
    expect(b.min.z).toBeGreaterThanOrEqual(-1.801);expect(b.max.z).toBeLessThanOrEqual(1.801);
    expect(b.max.y).toBeLessThanOrEqual(.797);expect(b.min.y).toBeGreaterThan(.64);g.dispose();
  });
  it('grounds all chairs and keeps backs clear of the tabletop and room walls',()=>{
    const gs=chairGeometries();
    for(const [x,z] of CHAIR_POSITIONS){
      const m=chairMatrix(x,z);let minY=Infinity;
      for(const g of Object.values(gs)){
        const p=g.getAttribute('position');
        for(let i=0;i<p.count;i++){
          const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(m);
          expect(Number.isFinite(v.x+v.y+v.z)).toBe(true);
          minY=Math.min(minY,v.y);
          expect(Math.abs(v.x)).toBeLessThan(6.4);expect(v.z).toBeGreaterThan(-8.4);
          if(v.y>.41 && v.y<.80)expect((Math.max(0,Math.abs(v.x)-1.9)/1.8)**2+(v.z/1.8)**2).toBeGreaterThan(1);
        }
      }
      expect(minY).toBeCloseTo(-1,4);
    }
    Object.values(gs).forEach(g=>g.dispose());
  });
  it('leaves the dealer and player side occupied',()=>{
    expect(CHAIR_POSITIONS).toHaveLength(5);
    for(const [,z] of CHAIR_POSITIONS)expect(z).toBeGreaterThan(0);
    expect(CHAIR_POSITIONS.some(([x,z])=>x===0&&z>2)).toBe(true);
  });
});

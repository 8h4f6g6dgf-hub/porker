import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { railGeometry, chairGeometries, CHAIR_POSITIONS, chairMatrix } from '../immersive/pokerFurnitureGeometry';
describe('poker furniture clearance',()=>{
  it('keeps the padded rail within the original table envelope',()=>{
    const g=railGeometry();g.computeBoundingBox();const b=g.boundingBox!;
    expect(b.min.x).toBeGreaterThanOrEqual(-3.35);expect(b.max.x).toBeLessThanOrEqual(3.35);
    expect(b.min.z).toBeGreaterThanOrEqual(-2.08);expect(b.max.z).toBeLessThanOrEqual(2.08);
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
          if(v.y>.41 && v.y<.80)expect((v.x/3.35)**2+(v.z/2.08)**2).toBeGreaterThan(1);
        }
      }
      expect(minY).toBeCloseTo(-1,4);
    }
    Object.values(gs).forEach(g=>g.dispose());
  });
  it('leaves the dealer and first-person center aisle unoccupied',()=>{
    expect(CHAIR_POSITIONS).toHaveLength(6);
    for(const [x] of CHAIR_POSITIONS)expect(Math.abs(x)).toBeGreaterThan(2);
  });
});

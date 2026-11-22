import { describe,it,expect } from 'vitest';
import { tableSupportGeometry } from '../immersive/tableSupportGeometry';
describe('table supports',()=>{
  it('connects the fixed floor to the fixed apron without changing the top',()=>{
    const g=tableSupportGeometry();g.computeBoundingBox();const b=g.boundingBox!;
    expect(b.min.y).toBeCloseTo(-1,5);expect(b.max.y).toBeCloseTo(.55,5);
    expect(b.max.z).toBeLessThan(.83);expect(b.min.z).toBeGreaterThan(-.83);
    g.dispose();
  });
  it('keeps knee space open and has two balanced grounded feet',()=>{
    const g=tableSupportGeometry(),p=g.getAttribute('position');let left=0,right=0;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      if(y<-.999){if(x<0)left++;else right++;}
      if(y>-.75&&y<.3){expect(Math.abs(z)).toBeLessThan(.14);expect(Math.abs(x)).toBeGreaterThan(1.5);}
      expect(Number.isFinite(x+y+z)).toBe(true);
    }
    expect(left).toBeGreaterThan(0);expect(left).toBe(right);g.dispose();
  });
});

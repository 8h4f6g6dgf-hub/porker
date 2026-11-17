import { test, expect } from "@playwright/test";
test("52枚の両隅は同じランクとスート・180度反転・赤黒を保持", async ({ page }) => {
 await page.goto("/");
 const result = await page.evaluate(async () => {
  const modulePath = "/src/immersive/sceneTextures.ts";
  const { cardTexture } = await import(/* @vite-ignore */ modulePath);
  const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const suits = ["♥","♦","♠","♣"];
  const issues: string[]=[];
  document.body.innerHTML = '<main id="gallery" style="display:grid;grid-template-columns:repeat(13,100px);gap:8px;padding:16px;background:#21382c;color:white"></main>';
  const gallery=document.getElementById("gallery")!;
  for(const suit of suits)for(const rank of ranks){
   const calls: {text:string; color:string; matrix:number[]}[]=[];
   const original=CanvasRenderingContext2D.prototype.fillText;
   CanvasRenderingContext2D.prototype.fillText=function(text,x,y,max){const t=this.getTransform();calls.push({text,color:String(this.fillStyle),matrix:[t.a,t.b,t.c,t.d,t.e,t.f]});if(max===undefined)original.call(this,text,x,y);else original.call(this,text,x,y,max);};
   let texture;
   try {texture=cardTexture(rank,suit);} finally {CanvasRenderingContext2D.prototype.fillText=original;}
   const canvas=texture.image as HTMLCanvasElement;
   if(calls.map(c=>c.text).join('|')!==[rank,suit,rank,suit,suit].join('|'))issues.push(rank+suit+': index mismatch');
   const lower=calls[2].matrix;
   if(Math.abs(lower[0]+2)>1e-6 || Math.abs(lower[3]+2)>1e-6 || Math.abs(lower[4]-512)>1e-6 || Math.abs(lower[5]-720)>1e-6)issues.push(rank+suit+': rotation');
   const color=suit==='♥'||suit==='♦'?'#a32227':'#161616';
   if(calls.some(c=>c.color!==color))issues.push(rank+suit+': color');
   const ctx=canvas.getContext('2d')!;const data=ctx.getImageData(0,0,512,720).data;
   let mismatch=0,total=0;
   for(let y=25;y<195;y++)for(let x=25;x<145;x++)for(let c=0;c<3;c++){total++;if(Math.abs(data[(y*512+x)*4+c]-data[((719-y)*512+511-x)*4+c])>12)mismatch++;}
   // Browser font hinting differs slightly after 180-degree rotation.
   if(mismatch/total>.04)issues.push(rank+suit+': rotated pixels '+mismatch/total);
   const tile=document.createElement('div');const label=document.createElement('div');label.textContent=rank+suit;label.style.textAlign='center';canvas.style.width='100px';canvas.style.height='140px';tile.append(label,canvas);gallery.append(tile);texture.dispose();
  }
  return {issues,count:gallery.children.length};
 });
 expect(result.issues).toEqual([]);expect(result.count).toBe(52);
 await page.setViewportSize({width:1450,height:720});
 await page.locator('#gallery').screenshot({path:'test-results/card-deck-52.png'});
});

import { test, expect } from "@playwright/test";
test("52枚のSVG・ピップ数・両隅・絵札・テクスチャを検証", async ({ page }) => {
 await page.goto("/");
 const result = await page.evaluate(async () => {
  const modulePath = "/src/immersive/sceneTextures.ts";
  const { cardTexture } = await import(/* @vite-ignore */ modulePath);
  const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const suits = ["♥","♦","♠","♣"];
  const names = ["heart","diamond","spade","club"];
  const issues: string[]=[];
  document.body.innerHTML = '<main id="gallery" style="display:grid;grid-template-columns:repeat(13,100px);gap:8px;padding:16px;background:#21382c;color:white"></main>';
  const gallery=document.getElementById("gallery")!;
  for(const [si,suit] of suits.entries())for(const [ri,rank] of ranks.entries()){
   const name=names[si];const rn=ri<10?String(ri+1):["jack","queen","king"][ri-10];
   const response=await fetch(`/assets/cards/${name}_${rn}.svg`);
   const doc=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
   const group=doc.getElementById(`${name}_${rn}`)!;
   const uses=Array.from(group.children).filter(e=>e.localName==='use');
   const href=(e:Element)=>e.getAttributeNS('http://www.w3.org/1999/xlink','href');
   const indexRef=ri===0?'ace':ri<10?`n_${rn}`:rn;
   const indices=uses.filter(e=>href(e)===`#${indexRef}`);
   if(indices.length!==2 || !indices[1].getAttribute('transform')?.startsWith('matrix(-1,0,0,-1,'))issues.push(rank+suit+': indices');
   const color=si<2?'#e6180a':'#000000';
   if(indices.some(e=>!(e.getAttribute('style') ?? 'fill:#000000').includes(color)))issues.push(rank+suit+': color');
   if(ri<10){
    // Actual visible SVG suit instances, excluding the two small corner suits.
    const pips=uses.filter(e=>href(e)===`#${name}`);
    if(pips.length-2!==ri+1)issues.push(rank+suit+': pip count '+(pips.length-2));
   }else{
    const portraits=uses.filter(e=>href(e)?.startsWith(`#${rn}_`));
    if(portraits.length!==2 || !portraits.some(e=>/^matrix\(-[\d.]+,[^,]+,[^,]+,-[\d.]+,/.test(e.getAttribute('transform') ?? '')))issues.push(rank+suit+': mirrored court');
    if(doc.querySelectorAll('path').length<8)issues.push(rank+suit+': missing artwork');
   }
   const texture=cardTexture(rank,suit);
   if(!await texture.userData.ready)issues.push(rank+suit+': load failed');
   const canvas=texture.image as HTMLCanvasElement;
   const tile=document.createElement('div');const label=document.createElement('div');label.textContent=rank+suit;label.style.textAlign='center';canvas.style.width='100px';canvas.style.height='140px';tile.append(label,canvas);gallery.append(tile);texture.dispose();
  }
  return {issues,count:gallery.children.length};
 });
 expect(result.issues).toEqual([]);expect(result.count).toBe(52);
 await page.setViewportSize({width:1450,height:720});
 await page.locator('#gallery').screenshot({path:'test-results/card-deck-52.png'});
});

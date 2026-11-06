import * as THREE from "three";
function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
export function materialTexture(kind: "wood" | "felt") {
  return canvasTexture(512, 512, (ctx) => {
    let seed = 24;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    ctx.fillStyle = kind === "wood" ? "#3e291b" : "#174538";
    ctx.fillRect(0, 0, 512, 512);
    if (kind === "wood") {
      for (let y = 0; y < 512; y++) {
        const light = rand() * 25;
        ctx.strokeStyle = `rgba(${100 + light},${65 + light},${36 + light},${0.1 + rand() * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= 512; x += 16)
          ctx.lineTo(x, y + Math.sin(x * 0.018 + y * 0.009) * 5);
        ctx.stroke();
      }
    } else {
      for (let n = 0; n < 65000; n++) {
        ctx.fillStyle =
          rand() > 0.5 ? "rgba(230,235,198,.045)" : "rgba(0,0,0,.12)";
        ctx.fillRect(rand() * 512, rand() * 512, 1, 1);
      }
    }
  });
}
export function cardTexture(rank: string, suit: string) {
  return canvasTexture(256, 360, (ctx) => {
    ctx.fillStyle = "#f9f6e9";
    ctx.fillRect(0, 0, 256, 360);
    ctx.strokeStyle = "#d3cab0";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 240, 344);
    ctx.fillStyle = suit === "♥" || suit === "♦" ? "#a9362f" : "#152b25";
    ctx.font = "bold 48px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(rank, 35, 56);
    ctx.font = "36px Georgia";
    ctx.fillText(suit, 35, 94);
    ctx.save();
    ctx.translate(256, 360);
    ctx.rotate(Math.PI);
    ctx.font = "bold 48px Georgia";
    ctx.fillText(rank, 35, 56);
    ctx.font = "36px Georgia";
    ctx.fillText(suit, 35, 94);
    ctx.restore();
    ctx.font = "128px Georgia";
    ctx.fillText(suit, 128, 222);
  });
}
export function cardBackTexture() {
  return canvasTexture(256, 360, (ctx) => {
    ctx.fillStyle = "#f3e8c9";
    ctx.fillRect(0, 0, 256, 360);
    ctx.fillStyle = "#183c32";
    ctx.fillRect(9, 9, 238, 342);
    ctx.strokeStyle = "#b99b5e77";
    ctx.lineWidth = 0.8;
    for (let n = -360; n < 600; n += 12) {
      ctx.beginPath();
      ctx.moveTo(n, 9);
      ctx.lineTo(n + 342, 351);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(n, 9);
      ctx.lineTo(n - 342, 351);
      ctx.stroke();
    }
    ctx.fillStyle = "#173b31";
    ctx.fillRect(57, 113, 142, 134);
    ctx.strokeStyle = "#c5ac73";
    ctx.strokeRect(61, 117, 134, 126);
    ctx.fillStyle = "#d8c18b";
    ctx.textAlign = "center";
    ctx.font = "72px Georgia";
    ctx.fillText("♠", 128, 195);
    ctx.font = "10px Georgia";
    ctx.fillText("POKER ACADEMY", 128, 222);
  });
}
export function feltMarkTexture() {
  return canvasTexture(1024, 256, (ctx) => {
    ctx.fillStyle = "#d6bf8490";
    ctx.textAlign = "center";
    ctx.font = "34px Georgia";
    ctx.fillText("P O K E R   A C A D E M Y", 512, 100);
    ctx.fillStyle = "#cbb37666";
    ctx.font = "17px Georgia";
    ctx.fillText("N O   L I M I T   T E X A S   H O L D ’ E M", 512, 157);
    ctx.strokeStyle = "#cbb37655";
    ctx.beginPath();
    ctx.moveTo(230, 192);
    ctx.lineTo(794, 192);
    ctx.stroke();
  });
}

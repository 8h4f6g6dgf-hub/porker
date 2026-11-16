import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/** A camera-space photographic plate behind the unchanged depth-tested 3D scene. */
export function CasinoBackdrop() {
  const { scene, size, gl } = useThree();
  const texture = useRef<THREE.Texture | null>(null);
  const viewport = useRef(size);
  viewport.current = size;
  const fit = (map: THREE.Texture) => {
    const aspect = viewport.current.width / viewport.current.height;
    const image = map.image as HTMLImageElement;
    const imageAspect = image.width / image.height;
    map.repeat.set(Math.min(1, aspect / imageAspect), Math.min(1, imageAspect / aspect));
    map.offset.set((1 - map.repeat.x) / 2, 1 - map.repeat.y);
    map.updateMatrix();
  };
  useEffect(() => {
    let disposed = false;
    scene.background = new THREE.Color("#292017");
    scene.backgroundIntensity = 0.72;
    gl.domElement.dataset.backdrop = "loading";
    const map = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}assets/casino-floor.webp`, loaded => {
      if (disposed) { loaded.dispose(); return; }
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.generateMipmaps = false;
      loaded.minFilter = THREE.LinearFilter;
      fit(loaded);
      scene.background = loaded;
      gl.domElement.dataset.backdrop = "ready";
    }, undefined, () => {
      if (!disposed) gl.domElement.dataset.backdrop = "fallback";
    });
    texture.current = map;
    return () => { disposed = true; scene.background = null; scene.backgroundIntensity = 1; map.dispose(); texture.current = null; };
  }, [scene, gl]);
  useEffect(() => { if (texture.current?.image) fit(texture.current); }, [size.width, size.height]);
  return null;
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { tableSupportGeometry } from "./tableSupportGeometry";
import { apronLightMap } from "./vipSurfaceTextures";
import { VipRoom } from "./VipRoom";
import { tabletopGeometry } from "./pokerFurnitureGeometry";
import { PokerFurniture } from "./PokerFurniture";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  materialTexture,
  cardTexture,
  cardBackTexture,
  feltMarkTexture,
} from "./sceneTextures";
import { CARD_LAYOUT, boardCardX } from "./cardLayout";
export interface CasinoSceneProps {
  phase: string;
  revealed: boolean[];
  communityCount: number;
  onReveal: (index: number) => void;
  reducedMotion: boolean;
  mode?: "academy" | "casino";
  onReady?: () => void;
}
// Seated camera stays fixed; pitch offset is independently tunable.
export const CAMERA_DOWNWARD_DEGREES = 3;
// Distances measured horizontally from the seated look-at point (z=-0.15).
export const SEATED_PULLBACK = 0.08;
const comparison = import.meta.env.DEV ? new URLSearchParams(location.search).get("cameraStudy") : null;
const pullback = comparison === "A" ? 0 : comparison === "C" ? 0.15 : SEATED_PULLBACK;
const GOLD = "#b89858";
const WHITE = "#acafa6";
const phases = [
  "entrance",
  "seat",
  "choose",
  "deal",
  "reveal",
  "hand",
  "flop",
  "turn",
  "river",
  "quiz",
  "result",
  "continue",
];
function CameraRail({
  phase,
  reducedMotion,
}: {
  phase: string;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  const elapsed = useRef(0);
  const look = useRef(new THREE.Vector3(0, 1, -0.5));
  useEffect(() => {
    elapsed.current = 0;
  }, [phase]);
  useFrame((_, dt) => {
    elapsed.current += dt;
    const entrance = phase === "entrance";
    const progress = reducedMotion ? 1 : Math.min(1, elapsed.current / 5.2);
    const target = entrance
      ? new THREE.Vector3(
          0.35 * (1 - progress),
          3.2 - progress * 0.4,
          7.8 - progress * 2,
        )
      : new THREE.Vector3(0, 2.8, 4.15 + 4.3 * pullback);
    camera.position.lerp(target, reducedMotion ? 1 : 1 - Math.exp(-dt * 2));
    look.current.lerp(
      new THREE.Vector3(0, entrance ? 1.1 : 0.35, -0.15),
      1 - Math.exp(-dt * 2),
    );
    camera.lookAt(look.current);
    if (!entrance) camera.rotateX(-THREE.MathUtils.degToRad(CAMERA_DOWNWARD_DEGREES));
  });
  return null;
}
function Table() {
  const support=useMemo(()=>tableSupportGeometry(),[]);
  useEffect(()=>()=>support.dispose(),[support]);
  const apronBounce=useMemo(()=>apronLightMap(),[]);
  useEffect(()=>()=>apronBounce.dispose(),[apronBounce]);
  const surfaces=useMemo(()=>{
    const geometries=[tabletopGeometry(1.79,.14),tabletopGeometry(1.70,.07),tabletopGeometry(1.59,.035)];
    for(const g of geometries.slice(0,2)){
      const p=g.getAttribute('position'),uv:number[]=[];
      for(let i=0;i<p.count;i++)uv.push((p.getX(i)+3.7)/7.4,(p.getZ(i)+1.8)/3.6);
      g.setAttribute('uv1',new THREE.Float32BufferAttribute(uv,2));
    }
    return geometries;
  },[]);
  useEffect(()=>()=>surfaces.forEach(g=>g.dispose()),[surfaces]);
  const [wood, felt, mark] = useMemo(
    () => [materialTexture("wood"), materialTexture("felt"), feltMarkTexture()],
    [],
  );
  useEffect(
    () => () => {
      wood.dispose();
      felt.dispose();
      mark.dispose();
    },
    [wood, felt, mark],
  );
  return (
    <group>
      <mesh geometry={surfaces[0]} position={[0,.69,0]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} color="#493426" roughness={.62} lightMap={apronBounce} lightMapIntensity={12}/>
      </mesh>
      <mesh geometry={surfaces[1]} position={[0,.755,0]} castShadow>
        <meshStandardMaterial color="#191d16" roughness={.75} lightMap={apronBounce} lightMapIntensity={2.2}/>
      </mesh>
      <mesh geometry={surfaces[2]} position={[0,.7875,0]} receiveShadow>
        <meshStandardMaterial map={felt} color="#abc0a9" roughness={.94}/>
      </mesh>
      <mesh position={[0, 0.795, -0.66]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.3, 0.58]} />
        <meshBasicMaterial
          map={mark}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={support} castShadow receiveShadow>
        <meshStandardMaterial map={wood} color="#493426" roughness={.62} lightMap={apronBounce} lightMapIntensity={70}/>
      </mesh>
      <mesh position={[0, 0.797, 0.95]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.66, 0.667, 64, 1, 0, Math.PI * 2]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}
function Limb({
  a,
  b,
  radius,
  color,
}: {
  a: THREE.Vector3;
  b: THREE.Vector3;
  radius: number;
  color: string;
}) {
  const direction = b.clone().sub(a);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return (
    <mesh
      position={a.clone().add(b).multiplyScalar(0.5)}
      quaternion={quaternion}
      castShadow
    >
      <capsuleGeometry
        args={[radius, Math.max(0.01, direction.length() - radius * 2), 5, 12]}
      />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}
function Hand({ side }: { side: number }) {
  return (
    <group rotation={[0, side * 0.13, side * 0.08]}>
      <mesh scale={[0.13, 0.052, 0.18]} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#b58b69" roughness={0.78} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <group
          key={i}
          position={[(i - 1.5) * 0.059, 0, 0.12]}
          rotation={[0.1, 0, (i - 1.5) * -0.06]}
        >
          <mesh
            position={[0, -0.005, 0.085]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <capsuleGeometry args={[0.027, 0.105, 4, 8]} />
            <meshStandardMaterial color="#b88f6d" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.015, 0.15]} rotation={[0.15, 0, 0]} castShadow>
            <sphereGeometry args={[0.027, 8, 8]} />
            <meshStandardMaterial color="#b88f6d" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh
        position={[side * 0.135, 0, 0.045]}
        rotation={[0, 0, side * -0.7]}
        scale={[0.043, 0.035, 0.1]}
        castShadow
      >
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#b58b69" roughness={0.75} />
      </mesh>
    </group>
  );
}
function TailoredTorso() {
  const shirt = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.43, 1.0);
    s.lineTo(-0.53, 1.92);
    s.quadraticCurveTo(-0.57, 2.17, -0.36, 2.27);
    s.lineTo(-0.16, 2.38);
    s.lineTo(0.16, 2.38);
    s.lineTo(0.36, 2.27);
    s.quadraticCurveTo(0.57, 2.17, 0.53, 1.92);
    s.lineTo(0.43, 1.0);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, {
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.055,
      bevelThickness: 0.06,
    });
  }, []);
  const vest = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.42, 1.02);
    s.lineTo(-0.46, 1.95);
    s.lineTo(-0.32, 2.24);
    s.lineTo(-0.21, 2.28);
    s.lineTo(0, 1.87);
    s.lineTo(0.21, 2.28);
    s.lineTo(0.32, 2.24);
    s.lineTo(0.46, 1.95);
    s.lineTo(0.42, 1.02);
    s.lineTo(0.08, 0.94);
    s.lineTo(0, 1.04);
    s.lineTo(-0.08, 0.94);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, {
      depth: 0.035,
      bevelEnabled: true,
      bevelSize: 0.018,
      bevelThickness: 0.018,
      bevelSegments: 2,
    });
  }, []);
  useEffect(
    () => () => {
      shirt.dispose();
      vest.dispose();
    },
    [shirt, vest],
  );
  return (
    <group>
      <mesh geometry={shirt} position={[0, 0, -0.23]} castShadow>
        <meshStandardMaterial color={WHITE} roughness={0.97} />
      </mesh>
      <mesh geometry={vest} position={[0, 0, 0.18]} castShadow>
        <meshStandardMaterial color="#101916" roughness={0.93} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.105, 2.28, 0.205]}
          rotation={[0, 0, side * -0.45]}
        >
          <boxGeometry args={[0.13, 0.21, 0.035]} />
          <meshStandardMaterial color="#b9bbb0" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 2.09, 0.255]}>
        <boxGeometry args={[0.065, 0.34, 0.028]} />
        <meshStandardMaterial color="#242d26" roughness={0.95} />
      </mesh>
      {[1.27, 1.47, 1.67, 1.87].map((y) => (
        <mesh
          key={y}
          position={[0.015, y, 0.235]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.014, 0.014, 0.012, 10]} />
          <meshStandardMaterial color="#645f49" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 2.49, -0.045]}>
        <cylinderGeometry args={[0.13, 0.15, 0.23, 20]} />
        <meshStandardMaterial color="#514333" roughness={1} />
      </mesh>
      <mesh position={[0, 2.78, -0.09]} scale={[0.21, 0.3, 0.21]}>
        <sphereGeometry args={[1, 24, 20]} />
        <meshStandardMaterial color="#413d30" roughness={1} />
      </mesh>
    </group>
  );
}
function Dealer({
  phase,
  reducedMotion,
}: {
  phase: string;
  reducedMotion: boolean;
}) {
  const left = useRef<THREE.Group>(null),
    right = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = reducedMotion ? 0 : clock.elapsedTime;
    const dealing = ["deal", "flop", "turn", "river"].includes(phase);
    const shuffling = ["entrance", "seat", "choose"].includes(phase);
    for (const [ref, side] of [
      [left, -1],
      [right, 1],
    ] as const) {
      if (!ref.current) continue;
      ref.current.position.x =
        side * 0.52 + (shuffling ? Math.sin(t * 2 + side) * 0.055 : 0);
      ref.current.position.z = dealing
        ? Math.sin(t * 2.5 + side) * 0.17
        : Math.sin(t * 0.65 + side) * 0.025;
      ref.current.position.y = dealing
        ? Math.max(0, Math.sin(t * 2.5 + side)) * 0.055
        : Math.sin(t * 0.8) * 0.012;
      ref.current.rotation.y = dealing
        ? Math.sin(t * 2.5) * 0.07
        : Math.sin(t * 0.5) * 0.018;
    }
  });
  return (
    <group position={[0, 0, -2.24]}>
      <TailoredTorso />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Limb
            a={new THREE.Vector3(side * 0.51, 2.14, 0)}
            b={new THREE.Vector3(side * 0.88, 1.37, 0.23)}
            radius={0.12}
            color={WHITE}
          />
          <Limb
            a={new THREE.Vector3(side * 0.88, 1.37, 0.23)}
            b={new THREE.Vector3(side * 0.52, 1.0, 0.81)}
            radius={0.145}
            color={WHITE}
          />
          <group
            ref={side === -1 ? left : right}
            position={[side * 0.52, 0, 0]}
          >
            <mesh position={[0, 1.0, 0.82]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.105, 0.105, 0.13, 16]} />
              <meshStandardMaterial color="#efead8" roughness={0.8} />
            </mesh>
            <group position={[0, 0.94, 1.02]}>
              <Hand side={side} />
            </group>
          </group>
        </group>
      ))}
    </group>
  );
}
function Chips() {
  const geometry = useMemo(() => {
    const green: THREE.BufferGeometry[] = [],
      gold: THREE.BufferGeometry[] = [],
      inlay: THREE.BufferGeometry[] = [];
    for (let col = 0; col < 3; col++)
      for (let i = 0; i < (col === 1 ? 7 : 4); i++) {
        const x = 1.35 + col * 0.24,
          y = 0.801 + i * 0.027,
          z = 1.06 + (col % 2) * 0.11;
        const disk = new THREE.CylinderGeometry(
          0.105,
          0.105,
          0.027,
          24,
        ).translate(x, y, z);
        (col === 1 ? green : gold).push(disk);
        inlay.push(
          new THREE.RingGeometry(0.071, 0.077, 24)
            .rotateX(-Math.PI / 2)
            .translate(x, y + 0.015, z),
        );
        for (let n = 0; n < 8; n++) {
          const angle = (n * Math.PI) / 4;
          inlay.push(
            new THREE.BoxGeometry(0.027, 0.003, 0.021)
              .rotateY(-angle)
              .translate(
                x + Math.cos(angle) * 0.091,
                y + 0.014,
                z + Math.sin(angle) * 0.091,
              ),
          );
        }
      }
    const result = [
      mergeGeometries(green),
      mergeGeometries(gold),
      mergeGeometries(inlay),
    ];
    [...green, ...gold, ...inlay].forEach((g) => g.dispose());
    return result;
  }, []);
  useEffect(() => () => geometry.forEach((g) => g.dispose()), [geometry]);
  return (
    <group>
      {geometry.map((g, i) => (
        <mesh key={i} geometry={g} castShadow>
          <meshStandardMaterial
            color={["#264e41", "#ae8d50", "#e0d4ae"][i]}
            roughness={0.62}
          />
        </mesh>
      ))}
    </group>
  );
}
function Card({
  index,
  position,
  rank,
  suit,
  face,
  delay = 0,
  onClick,
  reducedMotion,
}: {
  index: number;
  position: [number, number, number];
  rank: string;
  suit: string;
  face: boolean;
  delay?: number;
  onClick?: () => void;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null),
    flip = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const destinationX = useRef(position[0]);
  const initialFace = useRef(face);
  const textures = useMemo(
    () => [cardTexture(rank, suit), cardBackTexture()],
    [rank, suit],
  );
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  useFrame((_, dt) => {
    elapsed.current += dt;
    const p = reducedMotion
      ? 1
      : THREE.MathUtils.clamp((elapsed.current - delay) / 0.75, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    // Keep existing cards centered smoothly when turn/river extends the row.
    destinationX.current = reducedMotion ? position[0]
      : THREE.MathUtils.damp(destinationX.current, position[0], 10, dt);
    if (group.current) {
      group.current.visible = p > 0;
      group.current.position.set(
        THREE.MathUtils.lerp(-0.15, destinationX.current, eased),
        position[1] +
          Math.sin(p * Math.PI) * 0.018 +
          (flip.current ? Math.sin(flip.current.rotation.y) * 0.27 : 0),
        THREE.MathUtils.lerp(-1.22, position[2], eased),
      );
      group.current.rotation.y = (1 - eased) * 0.18;
      group.current.rotation.z = 0;
    }
    if (flip.current)
      flip.current.rotation.y = reducedMotion
        ? face
          ? 0
          : Math.PI
        : THREE.MathUtils.damp(
            flip.current.rotation.y,
            face ? 0 : Math.PI,
            7,
            dt,
          );
  });
  return (
    <group ref={group}>
      <group
        rotation={[
          -Math.PI / 2,
          0,
          index < 2 ? (index === 0 ? -0.045 : 0.045) : 0,
        ]}
      >
        <group
          ref={flip}
          rotation={[0, initialFace.current ? 0 : Math.PI, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          onPointerOver={() => {
            if (onClick) document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.7, 0.0024]} />
            <meshStandardMaterial color="#e5dcc4" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.0013]}>
            <planeGeometry args={[0.5, 0.7]} />
            <meshStandardMaterial map={textures[0]} roughness={0.72} />
          </mesh>
          <mesh position={[0, 0, -0.0013]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.5, 0.7]} />
            <meshStandardMaterial map={textures[1]} roughness={0.7} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
function Cards(props: CasinoSceneProps) {
  const show = phases.indexOf(props.phase) >= 3 || props.mode === "casino";
  const ranks = ["Q", "J", "10", "2", "7"],
    suits = ["♥", "♥", "♥", "♣", "♦"];
  return (
    <>
      {show &&
        [0, 1].map((i) => (
          <Card
            key={`hole-${i}`}
            index={i}
            position={[(i === 0 ? -1 : 1) * CARD_LAYOUT.handHalfPitch, CARD_LAYOUT.surfaceY, CARD_LAYOUT.handZ]}
            rank={i === 0 ? "A" : "K"}
            suit="♥"
            face={props.revealed[i] ?? false}
            delay={i * 0.48}
            onClick={() => props.onReveal(i)}
            reducedMotion={props.reducedMotion}
          />
        ))}
      {Array.from({ length: props.communityCount }, (_, i) => (
        <Card
          key={`board-${i}`}
          index={i + 2}
          position={[boardCardX(i, props.communityCount), CARD_LAYOUT.surfaceY, CARD_LAYOUT.boardZ]}
          rank={ranks[i]}
          suit={suits[i]}
          face
          delay={i < 3 ? i * 0.22 : 0}
          reducedMotion={props.reducedMotion}
        />
      ))}

    </>
  );
}
function SceneContents(props: CasinoSceneProps) {
  const { gl } = useThree();
  useEffect(() => {
    gl.domElement.setAttribute(
      "aria-label",
      "着席視点の3Dカジノ。カード操作は画面上のボタンからも行えます。",
    );
    props.onReady?.();
  }, [gl, props.onReady]);
  return (
    <>
      <CameraRail phase={props.phase} reducedMotion={props.reducedMotion} />
      <VipRoom />
      <Table />
      <PokerFurniture />
      <Dealer phase={props.phase} reducedMotion={props.reducedMotion} />
      <Cards {...props} />
      <Chips />
    </>
  );
}
export default function CasinoScene(props: CasinoSceneProps) {
  const [failed, setFailed] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    const fn = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, []);
  if (failed)
    return (
      <div className="scene-fallback" role="status">
        3D描画を利用できません。画面のカードボタンと字幕でレッスンを続けられます。
      </div>
    );
  return (
    <Canvas
      frameloop={hidden ? "never" : "always"}
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 3.2, 7.8], fov: 45, near: 0.1, far: 35 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            setFailed(true);
          },
          { once: true },
        );
      }}
      fallback={
        <div className="scene-fallback">
          3D非対応のため、字幕とカード操作でご案内します。
        </div>
      }
    >
      <SceneContents {...props} />
    </Canvas>
  );
}

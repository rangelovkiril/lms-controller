"use client";

export const STATION_SCALE = 1.5;
const DOME_LOCAL_Y = 1.64;
export const DOME_APEX_Y = DOME_LOCAL_Y * STATION_SCALE; // world-space за Laser

const MAT_WALL = { color: "#eae6e0", roughness: 0.8, metalness: 0.05 } as const;
const MAT_DOME = {
  color: "#f0ede8",
  roughness: 0.55,
  metalness: 0.08,
} as const;
const MAT_RING = { color: "#d8d4cc", roughness: 0.6, metalness: 0.25 } as const;
const MAT_SCOPE = {
  color: "#dcdad5",
  roughness: 0.65,
  metalness: 0.15,
} as const;
const MAT_RAIL = { color: "#3a3a3a", roughness: 0.5, metalness: 0.6 } as const;

// Напречни греди на шибъра — 5 броя по дължина на рейките
const RUNG_Y = [-0.12, 0.06, 0.24, 0.42, 0.58] as const;

export default function StationModel() {
  return (
    <group>
      {/* ── Цокъл / долна плоча ────────────────────────────────── */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.86, 0.88, 0.05, 32]} />
        <meshStandardMaterial {...MAT_RING} />
      </mesh>

      {/* ── Цилиндрична сграда ─────────────────────────────────── */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.8, 0.82, 0.7, 32]} />
        <meshStandardMaterial {...MAT_WALL} />
      </mesh>

      {/* Горен корниз */}
      <mesh position={[0, 0.745, 0]}>
        <cylinderGeometry args={[0.85, 0.82, 0.055, 32]} />
        <meshStandardMaterial {...MAT_RING} />
      </mesh>

      {/* Обиколен пръстен (collar) */}
      <mesh position={[0, 0.79, 0]}>
        <torusGeometry args={[0.85, 0.04, 8, 48]} />
        <meshStandardMaterial {...MAT_RING} />
      </mesh>

      {/* ── Купол (полусфера) ──────────────────────────────────── */}
      <mesh position={[0, 0.76, 0]}>
        <sphereGeometry args={[0.88, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...MAT_DOME} />
      </mesh>

      {/* ── Телескоп + шибър — pivot в центъра на купола ─────── */}
      <group position={[0, 0.76, 0]} rotation={[0, 0.35, 0]}>
        <group rotation={[-0.82, 0, 0]}>
          {/* Основен тубус */}
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.088, 0.095, 0.88, 14]} />
            <meshStandardMaterial {...MAT_SCOPE} />
          </mesh>
          {/* Апертурен пръстен (обективна леща) */}
          <mesh position={[0, 0.625, 0]}>
            <torusGeometry args={[0.088, 0.016, 8, 24]} />
            <meshStandardMaterial
              color="#b0aaa0"
              metalness={0.7}
              roughness={0.2}
            />
          </mesh>
          {/* Окулярен блок (долу) */}
          <mesh position={[0, -0.26, 0]}>
            <cylinderGeometry args={[0.06, 0.075, 0.18, 10]} />
            <meshStandardMaterial {...MAT_SCOPE} />
          </mesh>
          {/* Finder scope */}
          <mesh position={[0.13, 0.15, 0]}>
            <cylinderGeometry args={[0.026, 0.026, 0.54, 8]} />
            <meshStandardMaterial {...MAT_SCOPE} />
          </mesh>
          {/* ── Шибър — две рейки + греди ─────────────────── */}
          {/* Дясна рейка */}
          <mesh position={[0.155, 0.23, 0.03]}>
            <boxGeometry args={[0.042, 0.82, 0.042]} />
            <meshStandardMaterial {...MAT_RAIL} />
          </mesh>
          {/* Напречни греди */}
          {RUNG_Y.map((y) => (
            <mesh key={y} position={[0, y, 0.03]}>
              <boxGeometry args={[0.35, 0.022, 0.042]} />
              <meshStandardMaterial {...MAT_RAIL} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ── Врата ─────────────────────────────────────────────── */}
      {/* Рамка */}
      <mesh position={[0, 0.35, 0.815]}>
        <boxGeometry args={[0.28, 0.54, 0.07]} />
        <meshStandardMaterial {...MAT_RING} />
      </mesh>
      {/* Панел */}
      <mesh position={[0, 0.36, 0.845]}>
        <boxGeometry args={[0.22, 0.46, 0.02]} />
        <meshStandardMaterial
          color="#d5d0c8"
          roughness={0.75}
          metalness={0.05}
        />
      </mesh>
      {/* Стъпало */}
      <mesh position={[0, 0.025, 0.81]}>
        <boxGeometry args={[0.34, 0.04, 0.14]} />
        <meshStandardMaterial {...MAT_RING} />
      </mesh>

      <pointLight
        position={[0, DOME_LOCAL_Y, 0]}
        color="#00dc82"
        intensity={0.6}
        distance={5}
      />
    </group>
  );
}

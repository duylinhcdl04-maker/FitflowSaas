import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Trừu tượng, không phải render 1 quả tạ/máy tập thật (dễ trông rẻ tiền, lỗi tỉ lệ) — 3 vành
// torus xoay lệch trục mô phỏng chuyển động của đĩa tạ quay/bánh xe kettlebell, phát sáng
// emerald để khớp màu thương hiệu. Nhẹ: không HDRI, không postprocessing/bloom package —
// glow giả lập bằng vật liệu emissive + lớp radial-gradient CSS phía sau canvas.
function PlateRings() {
  const group = useRef<THREE.Group>(null)
  const rings = useMemo(
    () => [
      { radius: 1.5, tube: 0.11, rot: [0.5, 0, 0.2] as const, speed: 0.12, color: '#10b981', y: 0 },
      { radius: 1.15, tube: 0.09, rot: [1.15, 0.3, -0.15] as const, speed: -0.18, color: '#34d399', y: 0.15 },
      { radius: 0.8, tube: 0.075, rot: [0.9, -0.4, 0.4] as const, speed: 0.24, color: '#6ee7b7', y: -0.1 },
    ],
    [],
  )

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.getElapsedTime()
    group.current.rotation.y = t * 0.15
    group.current.position.y = Math.sin(t * 0.6) * 0.08
    // Nghiêng nhẹ theo vị trí con trỏ (đã chuẩn hoá về [-1,1] trong onPointerMove ở Canvas cha).
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.25, 0.04)
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, state.pointer.x * 0.15, 0.04)
  })

  return (
    <group ref={group}>
      {rings.map((r, i) => (
        <mesh key={i} rotation={r.rot} position={[0, r.y, 0]}>
          <torusGeometry args={[r.radius, r.tube, 24, 96]} />
          <meshStandardMaterial
            color="#0a0a0a"
            emissive={r.color}
            emissiveIntensity={0.55}
            metalness={0.4}
            roughness={0.35}
          />
        </mesh>
      ))}
    </group>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 2]} intensity={1.1} color="#ffffff" />
      <pointLight position={[-3, -2, 2]} intensity={6} color="#10b981" />
      <PlateRings />
    </>
  )
}

/**
 * Hero visual — thay ảnh stock ngẫu nhiên (picsum không khớp nội dung theo seed, xem lịch sử
 * trao đổi) bằng 1 cảnh 3D nhẹ, đặc trưng riêng cho FitFlow thay vì ảnh chụp không liên quan.
 * Tôn trọng `prefers-reduced-motion`: dựng cảnh tĩnh (không autorotate) qua `frameloop="demand"`.
 */
export default function GymOrb({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <div className="relative aspect-square w-full">
      <div
        aria-hidden
        className="absolute inset-0 rounded-full bg-emerald-500/30 blur-[80px]"
      />
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 40 }}
        dpr={[1, 2]}
        frameloop={reducedMotion ? 'demand' : 'always'}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}

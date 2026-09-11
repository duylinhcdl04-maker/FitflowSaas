import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'

interface NodeData {
  id: string
  label: string
  pos: [number, number, number]
  color: string
}

const NODES: NodeData[] = [
  { id: 'members', label: 'HỘI VIÊN', pos: [-2.1, 1.0, 0], color: '#c084fc' },
  { id: 'trainers', label: 'HUẤN LUYỆN VIÊN', pos: [2.1, 1.0, 0.2], color: '#a855f7' },
  { id: 'memberships', label: 'GÓI TẬP', pos: [-2.1, -1.0, 0.3], color: '#e9d5ff' },
  { id: 'payments', label: 'THANH TOÁN', pos: [2.1, -1.0, -0.2], color: '#9333ea' },
  { id: 'branches', label: 'CHI NHÁNH', pos: [0, 1.6, -0.2], color: '#a855f7' },
  { id: 'analytics', label: 'BÁO CÁO', pos: [0, -1.6, 0.1], color: '#c084fc' },
]

interface EcosystemSceneProps {
  activeNode: string | null
  onHoverNode: (id: string | null) => void
}

function CentralCore({ isActive }: { isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.4
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.2
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.3
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Central Glowing Core Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial
          color="#151119"
          emissive="#9333ea"
          emissiveIntensity={isActive ? 1.2 : 0.8}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Orbiting Core Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.05, 0.04, 16, 48]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function ConnectedLines({ activeNode }: { activeNode: string | null }) {
  const lines = useMemo(() => {
    return NODES.map((node) => {
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...node.pos)]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      return { id: node.id, geometry }
    })
  }, [])

  return (
    <group>
      {lines.map((line) => {
        const isHovered = activeNode === line.id
        return (
          <primitive
            key={line.id}
            object={
              new THREE.Line(
                line.geometry,
                new THREE.LineBasicMaterial({
                  color: isHovered ? '#c084fc' : '#581c87',
                  transparent: true,
                  opacity: isHovered ? 0.95 : activeNode ? 0.2 : 0.45,
                  linewidth: isHovered ? 2 : 1,
                })
              )
            }
          />
        )
      })}
    </group>
  )
}

function NodeItem({
  node,
  isActive,
  isDimmed,
  onHover,
}: {
  node: NodeData
  isActive: boolean
  isDimmed: boolean
  onHover: (id: string | null) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()
    meshRef.current.position.y = node.pos[1] + Math.sin(t + node.pos[0]) * 0.08
  })

  return (
    <mesh
      ref={meshRef}
      position={node.pos}
      onPointerOver={() => onHover(node.id)}
      onPointerOut={() => onHover(null)}
      scale={isActive ? [1.3, 1.3, 1.3] : [1, 1, 1]}
    >
      <sphereGeometry args={[0.3, 24, 24]} />
      <meshStandardMaterial
        color={isActive ? '#c084fc' : node.color}
        emissive={node.color}
        emissiveIntensity={isActive ? 1.5 : isDimmed ? 0.2 : 0.7}
        metalness={0.7}
        roughness={0.3}
      />
    </mesh>
  )
}

export default function EcosystemScene({
  activeNode,
  onHoverNode,
}: EcosystemSceneProps) {
  const prefersReduced = usePrefersReducedMotion()
  const groupRef = useRef<THREE.Group>(null)

  return (
    <div className="relative w-full h-[480px] sm:h-[580px] z-10 cursor-pointer overflow-visible">
      <Canvas
        camera={{ position: [0, 0, 7.0], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop={prefersReduced ? 'demand' : 'always'}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <pointLight position={[0, 0, 4]} intensity={4} color="#a855f7" />
          <directionalLight position={[4, 5, 2]} intensity={1.5} color="#ffffff" />

          <group ref={groupRef}>
            <CentralCore isActive={activeNode !== null} />
            <ConnectedLines activeNode={activeNode} />
            {NODES.map((node) => (
              <NodeItem
                key={node.id}
                node={node}
                isActive={activeNode === node.id}
                isDimmed={activeNode !== null && activeNode !== node.id}
                onHover={onHoverNode}
              />
            ))}
          </group>
        </Suspense>
      </Canvas>
    </div>
  )
}

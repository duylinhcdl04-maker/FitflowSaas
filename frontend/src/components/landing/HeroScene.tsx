import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { usePrefersReducedMotion, useIsMobile } from '../../hooks/useMediaQuery'

interface HeroSceneProps {
  scrollProgress?: number
}

// -----------------------------------------------------------------------------
// Procedural Canvas Textures (0 external downloads, instant 60fps load)
// -----------------------------------------------------------------------------

/**
 * Procedural Diamond Knurling Texture for Olympic steel grip
 * Generates an embossed diamond cross-hatch pattern for realistic light glinting
 */
function useKnurlingTexture(): THREE.CanvasTexture | null {
  return useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Mid-gray base for bump map
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, 256, 256)

    // Diamond knurl cross-hatch grooves
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.8
    const step = 16
    for (let x = -256; x < 512; x += step) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + 256, 256)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x + 256, 0)
      ctx.lineTo(x, 256)
      ctx.stroke()
    }

    // Shadow lines for micro-depth
    ctx.strokeStyle = '#303030'
    ctx.lineWidth = 1.0
    for (let x = -256; x < 512; x += step) {
      ctx.beginPath()
      ctx.moveTo(x + 1.5, 0)
      ctx.lineTo(x + 257.5, 256)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(10, 4)
    texture.needsUpdate = true
    return texture
  }, [])
}

/**
 * Procedural CNC Machined Face Texture for Dumbbell End-Cap
 * Generates concentric lathe-turned grooves with FITFLOW PRO & 24 KG branding
 */
function usePlateFaceTexture(): THREE.CanvasTexture | null {
  return useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Deep dark titanium satin face
    ctx.fillStyle = '#16121d'
    ctx.fillRect(0, 0, 512, 512)

    // Concentric lathe-turned metal grooves
    ctx.strokeStyle = '#231d2e'
    ctx.lineWidth = 1.2
    for (let r = 35; r < 245; r += 6) {
      ctx.beginPath()
      ctx.arc(256, 256, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // High-specular machined accent rings
    ctx.strokeStyle = '#a855f7'
    ctx.lineWidth = 3.5
    ctx.beginPath()
    ctx.arc(256, 256, 235, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = '#7e22ce'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(256, 256, 110, 0, Math.PI * 2)
    ctx.stroke()

    // Curved Text branding: "FITFLOW PRO" (Top Arc)
    ctx.save()
    ctx.translate(256, 256)
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif'
    ctx.fillStyle = '#f5f3f7'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const textTop = 'FITFLOW PRO'
    const radiusTop = 175
    const angleStep = 0.14
    const startAngle = -Math.PI / 2 - ((textTop.length - 1) * angleStep) / 2
    for (let i = 0; i < textTop.length; i++) {
      const angle = startAngle + i * angleStep
      ctx.save()
      ctx.rotate(angle)
      ctx.translate(0, -radiusTop)
      ctx.fillText(textTop[i], 0, 0)
      ctx.restore()
    }

    // Curved Text branding: "24 KG · OLYMPIC" (Bottom Arc)
    const textBottom = '24 KG · OLYMPIC'
    const radiusBottom = 175
    const angleStepBottom = 0.12
    const startAngleBottom = Math.PI / 2 - ((textBottom.length - 1) * angleStepBottom) / 2
    for (let i = 0; i < textBottom.length; i++) {
      const angle = startAngleBottom + i * angleStepBottom
      ctx.save()
      ctx.rotate(angle)
      ctx.translate(0, radiusBottom)
      ctx.rotate(Math.PI)
      ctx.fillStyle = '#c084fc'
      ctx.fillText(textBottom[i], 0, 0)
      ctx.restore()
    }

    // Center Lightning Gym Icon
    ctx.fillStyle = '#a855f7'
    ctx.beginPath()
    ctx.moveTo(256 - 4, 256 - 22)
    ctx.lineTo(256 + 14, 256 - 4)
    ctx.lineTo(256 + 2, 256 - 4)
    ctx.lineTo(256 + 6, 256 + 22)
    ctx.lineTo(256 - 12, 256 + 4)
    ctx.lineTo(256, 256 + 4)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
}

// -----------------------------------------------------------------------------
// Dumbbell Weight Head (One side of the dumbbell)
// -----------------------------------------------------------------------------

interface WeightHeadProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  faceTexture: THREE.CanvasTexture | null
  invertFace?: boolean
}

function WeightHead({ position, rotation = [0, 0, 0], faceTexture, invertFace = false }: WeightHeadProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Plate 1 (Innermost - Largest) */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.22, 64]} />
        <meshStandardMaterial
          color="#1e1828"
          metalness={0.92}
          roughness={0.24}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Chamfered Bevel Rim for Plate 1 */}
      <mesh position={[0, 0.23, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.025, 20, 64]} />
        <meshStandardMaterial color="#302640" metalness={0.95} roughness={0.18} />
      </mesh>

      {/* Anodized Purple Accent Ring */}
      <mesh position={[0, 0.245, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.88, 0.018, 16, 64]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#6b21a8"
          emissiveIntensity={0.55}
          metalness={0.9}
          roughness={0.22}
        />
      </mesh>

      {/* Plate 2 (Middle Tier) */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.84, 0.84, 0.22, 64]} />
        <meshStandardMaterial
          color="#16121d"
          metalness={0.88}
          roughness={0.28}
          envMapIntensity={1.4}
        />
      </mesh>
      {/* Chamfered Bevel Rim for Plate 2 */}
      <mesh position={[0, 0.49, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.025, 20, 64]} />
        <meshStandardMaterial color="#2d223c" metalness={0.94} roughness={0.2} />
      </mesh>

      {/* Plate 3 (Outermost Tier) */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.76, 0.76, 0.2, 64]} />
        <meshStandardMaterial
          color="#1b1524"
          metalness={0.92}
          roughness={0.25}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* CNC Branded End-Cap Face */}
      {faceTexture && (
        <mesh position={[0, 0.725, 0]} rotation={invertFace ? [Math.PI / 2, 0, 0] : [-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.74, 64]} />
          <meshStandardMaterial
            map={faceTexture}
            metalness={0.85}
            roughness={0.28}
            envMapIntensity={1.6}
          />
        </mesh>
      )}

      {/* Center Stainless Steel Lock Nut / Hex Bolt */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.07, 6]} />
        <meshStandardMaterial
          color="#f8fafc"
          metalness={0.98}
          roughness={0.12}
          envMapIntensity={2.0}
        />
      </mesh>
      {/* Bolt center washer */}
      <mesh position={[0, 0.73, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.02, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.2} />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// Masterpiece Precision Dumbbell (Centerpiece)
// -----------------------------------------------------------------------------

function MasterpieceDumbbell({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const dumbbellRef = useRef<THREE.Group>(null)

  const knurlTexture = useKnurlingTexture()
  const faceTexture = usePlateFaceTexture()

  useFrame((state) => {
    if (!groupRef.current || !dumbbellRef.current) return
    const t = state.clock.getElapsedTime()

    // Heroic diagonal tilt (showing the whole dumbbell: head - knurled handle - head)
    // Heroic diagonal tilt (showing the whole dumbbell: head - knurled handle - head)
    // Continuous slow cinematic spin around handle axis + slight tumble
    dumbbellRef.current.rotation.y = t * 0.22
    dumbbellRef.current.rotation.x = 0.45 + Math.sin(t * 0.25) * 0.1
    dumbbellRef.current.rotation.z = Math.PI / 3.6 + Math.cos(t * 0.18) * 0.08

    // Interactive mouse tilt response (subtle parallax)
    const targetTiltX = -state.pointer.y * 0.3
    const targetTiltY = state.pointer.x * 0.35
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetTiltX, 0.05)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetTiltY, 0.05)

    // Scroll progress transition
    const baseScale = 0.74
    const scale = THREE.MathUtils.lerp(baseScale, baseScale * 0.7, Math.min(scrollProgress * 1.5, 1))
    groupRef.current.scale.set(scale, scale, scale)
    groupRef.current.position.y = THREE.MathUtils.lerp(0.05, -1.0, Math.min(scrollProgress * 1.5, 1))
  })

  return (
    <group ref={groupRef} position={[0.62, 0.02, 0]}>
      <group ref={dumbbellRef}>
        {/* Stainless Steel Center Handle Bar */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 1.8, 48]} />
          <meshStandardMaterial
            color="#f1f5f9"
            metalness={0.96}
            roughness={0.16}
            bumpMap={knurlTexture || undefined}
            bumpScale={0.06}
            envMapIntensity={2.0}
          />
        </mesh>

        {/* Ergonomic Central Grip Ring Bands */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.138, 0.014, 16, 32]} />
          <meshStandardMaterial color="#a855f7" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.136, 0.012, 16, 32]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.136, 0.012, 16, 32]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Handle Collar Stoppers (Connects handle to weight heads) */}
        <mesh position={[0, 0.78, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 48]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.2} envMapIntensity={1.8} />
        </mesh>
        <mesh position={[0, -0.78, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 48]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.2} envMapIntensity={1.8} />
        </mesh>

        {/* Anodized Purple Collar Accent Rings */}
        <mesh position={[0, 0.81, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.265, 0.016, 16, 48]} />
          <meshStandardMaterial
            color="#c084fc"
            emissive="#581c87"
            emissiveIntensity={0.6}
            metalness={0.92}
            roughness={0.18}
          />
        </mesh>
        <mesh position={[0, -0.81, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.265, 0.016, 16, 48]} />
          <meshStandardMaterial
            color="#c084fc"
            emissive="#581c87"
            emissiveIntensity={0.6}
            metalness={0.92}
            roughness={0.18}
          />
        </mesh>

        {/* Top Weight Head (+Y) */}
        <WeightHead
          position={[0, 0.85, 0]}
          faceTexture={faceTexture}
          invertFace={false}
        />

        {/* Bottom Weight Head (-Y, flipped 180°) */}
        <WeightHead
          position={[0, -0.85, 0]}
          rotation={[Math.PI, 0, 0]}
          faceTexture={faceTexture}
          invertFace={true}
        />
      </group>
    </group>
  )
}

// -----------------------------------------------------------------------------
// Floating Depth Element: Olympic Bumper Plate (Background depth parallax)
// -----------------------------------------------------------------------------

function BackgroundOlympicPlate() {
  const plateRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!plateRef.current) return
    const t = state.clock.getElapsedTime()
    plateRef.current.rotation.y = -t * 0.12
    plateRef.current.rotation.x = Math.sin(t * 0.2) * 0.15 + 0.3
  })

  return (
    <group ref={plateRef} position={[2.0, 0.3, -2.2]} scale={[0.72, 0.72, 0.72]}>
      {/* Outer Rubber Rim */}
      <mesh>
        <cylinderGeometry args={[1.8, 1.8, 0.24, 64]} />
        <meshStandardMaterial
          color="#0f0c14"
          metalness={0.82}
          roughness={0.35}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* Chamfer rim ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.78, 0.04, 16, 64]} />
        <meshStandardMaterial color="#21182c" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Recessed Center Hub */}
      <mesh>
        <cylinderGeometry args={[1.1, 1.1, 0.16, 48]} />
        <meshStandardMaterial color="#1a1324" metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Stainless Steel Center Olympic Bore Collar */}
      <mesh>
        <cylinderGeometry args={[0.38, 0.38, 0.28, 32]} />
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.98}
          roughness={0.14}
          envMapIntensity={2.0}
        />
      </mesh>
      {/* Inner Bore Hole */}
      <mesh>
        <cylinderGeometry args={[0.26, 0.26, 0.32, 32]} />
        <meshStandardMaterial color="#070609" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Glowing Brand Indicator Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.12, 0.02, 16, 48]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#7e22ce"
          emissiveIntensity={0.5}
          metalness={0.9}
        />
      </mesh>

      {/* 3 Ergonomic Grip Slots / Hand Openings */}
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, idx) => (
        <mesh
          key={idx}
          position={[Math.cos(angle) * 1.35, 0, Math.sin(angle) * 1.35]}
          rotation={[0, -angle, 0]}
        >
          <boxGeometry args={[0.22, 0.26, 0.55]} />
          <meshStandardMaterial color="#2a1f3a" metalness={0.92} roughness={0.22} />
        </mesh>
      ))}
    </group>
  )
}

// -----------------------------------------------------------------------------
// Studio Lighting Rig with Procedural HDR Lightformers (Real metal reflections)
// -----------------------------------------------------------------------------

function StudioLightingEnvironment() {
  return (
    <>
      <ambientLight intensity={0.8} />
      {/* Key Directional Studio Spot */}
      <directionalLight position={[5, 7, 5]} intensity={2.6} color="#ffffff" />
      {/* Fill Warm Directional */}
      <directionalLight position={[-4, -3, 3]} intensity={1.2} color="#f8fafc" />

      {/* Vivid Purple Rim Points */}
      <pointLight position={[3, 4, 3]} intensity={12} color="#c084fc" distance={15} />
      <pointLight position={[-4, -2, -2]} intensity={10} color="#a855f7" distance={12} />
      <pointLight position={[0, -5, 2]} intensity={8} color="#e879f9" distance={10} />

      {/* Procedural Reflection Environment (Crucial for photo-realistic metal PBR) */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          {/* Overhead Key Softbox */}
          <Lightformer
            form="rect"
            intensity={4}
            position={[0, 7, -8]}
            scale={[14, 7, 1]}
            target={[0, 0, 0]}
            color="#ffffff"
          />
          {/* Side Purple Rim Lightformer */}
          <Lightformer
            form="rect"
            intensity={3.5}
            position={[-7, 1, 1]}
            scale={[18, 4, 1]}
            rotation={[0, Math.PI / 2, 0]}
            color="#c084fc"
          />
          {/* Cool White/Silver Accent Lightformer */}
          <Lightformer
            form="rect"
            intensity={3.0}
            position={[8, 2, -1]}
            scale={[16, 3, 1]}
            rotation={[0, -Math.PI / 2, 0]}
            color="#f3e8ff"
          />
          {/* Under-Glow Ring Lightformer */}
          <Lightformer
            form="ring"
            color="#c084fc"
            intensity={2.2}
            position={[0, -8, 2]}
            scale={10}
            target={[0, 0, 0]}
          />
        </group>
      </Environment>
    </>
  )
}

// -----------------------------------------------------------------------------
// Main Hero Scene Component
// -----------------------------------------------------------------------------

export default function HeroScene({ scrollProgress = 0 }: HeroSceneProps) {
  const prefersReduced = usePrefersReducedMotion()
  const isMobile = useIsMobile()

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden">
      {/* Cinematic Radial Atmosphere Backing Glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 lg:left-[62%] -translate-x-1/2 -translate-y-1/2 w-[450px] sm:w-[700px] h-[450px] sm:h-[700px] rounded-full bg-gradient-to-tr from-purple-700/20 via-purple-500/15 to-transparent blur-[140px] pointer-events-none"
      />

      <Canvas
        camera={{
          position: isMobile ? [0, 0, 5.8] : [0.6, 0.1, 4.8],
          fov: 42,
        }}
        dpr={isMobile ? [1, 1.2] : [1, 1.6]}
        frameloop={prefersReduced ? 'demand' : 'always'}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <Suspense fallback={null}>
          <StudioLightingEnvironment />

          {/* Smooth Zero-Gravity Floating Motion */}
          <Float
            speed={prefersReduced ? 0 : 1.6}
            rotationIntensity={0.25}
            floatIntensity={0.4}
            floatingRange={[-0.08, 0.08]}
          >
            {/* Foreground Masterpiece Dumbbell */}
            <MasterpieceDumbbell scrollProgress={scrollProgress} />

            {/* Subtle Background Bumper Plate for Depth Parallax */}
            {!isMobile && <BackgroundOlympicPlate />}
          </Float>

          {/* Atmospheric Soft Glowing Particles / Chalk Motes (Not square pixels!) */}
          <Sparkles
            count={isMobile ? 24 : 50}
            scale={8}
            size={2.4}
            speed={0.35}
            opacity={0.45}
            color="#c084fc"
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text as DreiText } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Table3D } from './Table3D';
import { InstancedTables } from './InstancedTable';
import { Door } from './Door';
import { Stairs } from './Stairs';
import { BaristaStation } from './BaristaStation';
import { Kitchen } from './Kitchen';
import { Counter } from './Counter';
import { HangingLight, WallArt, Plant, VIPChair } from './Decorations';
import { AmbientAudio } from './AmbientAudio';
import { useTableStore, useOrderStore } from '@/store';
import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useMemo } from 'react';

// Workaround for Text type issue with drei
const Text = DreiText as any;

// Create white/gray parquet texture for ground floor
function createGrayParquetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  const tileSize = 64;
  const colors = ['#d4d4d4', '#ffffff'];
  
  for (let y = 0; y < canvas.height; y += tileSize) {
    for (let x = 0; x < canvas.width; x += tileSize) {
      const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isEven ? colors[0] : colors[1];
      ctx.fillRect(x, y, tileSize, tileSize);
      
      ctx.strokeStyle = isEven ? '#c0c0c0' : '#e8e8e8';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y + (tileSize / 4) * (i + 1));
        ctx.lineTo(x + tileSize, y + (tileSize / 4) * (i + 1) + (Math.random() - 0.5) * 4);
        ctx.stroke();
      }
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

// Create brown parquet texture for upper floor
function createBrownParquetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  const tileSize = 64;
  const colors = ['#5D4037', '#4E342E'];
  
  for (let y = 0; y < canvas.height; y += tileSize) {
    for (let x = 0; x < canvas.width; x += tileSize) {
      const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isEven ? colors[0] : colors[1];
      ctx.fillRect(x, y, tileSize, tileSize);
      
      ctx.strokeStyle = isEven ? '#3E2723' : '#5D4037';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y + (tileSize / 4) * (i + 1));
        ctx.lineTo(x + tileSize, y + (tileSize / 4) * (i + 1) + (Math.random() - 0.5) * 4);
        ctx.stroke();
      }
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

// Camera controller component - animates smooth transitions between floors
function CameraController({ isUpperFloor, orbitControlsRef }: { 
  isUpperFloor: boolean; 
  orbitControlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();
  const currentTargetPosition = useRef(new THREE.Vector3(0, 14, 10));
  const currentTargetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(false);
  const lastFloor = useRef(isUpperFloor);
  
  // Reset transition when floor changes
  useEffect(() => {
    if (lastFloor.current !== isUpperFloor) {
      lastFloor.current = isUpperFloor;
      isTransitioning.current = true;
      
      // Set new target positions
      const cameraY = isUpperFloor ? 18 : 14;
      const floorY = isUpperFloor ? 4 : 0;
      currentTargetPosition.current.set(0, cameraY, 10);
      currentTargetLookAt.current.set(0, floorY, 0);
    }
  }, [isUpperFloor]);
  
  useFrame(() => {
    if (!isTransitioning.current) return;
    
    // Lerp camera position smoothly
    camera.position.lerp(currentTargetPosition.current, 0.03);
    
    // Apply to OrbitControls if available
    const controls = orbitControlsRef.current;
    if (controls && controls.target) {
      controls.target.lerp(currentTargetLookAt.current, 0.03);
      controls.update();
    }
    
    // Check if we're close enough to stop transitioning
    const cameraDist = camera.position.distanceTo(currentTargetPosition.current);
    const targetDist = controls?.target ? controls.target.distanceTo(currentTargetLookAt.current) : 0;
    
    if (cameraDist < 0.1 && targetDist < 0.1) {
      isTransitioning.current = false;
      // Snap to exact position
      camera.position.copy(currentTargetPosition.current);
      if (controls && controls.target) {
        controls.target.copy(currentTargetLookAt.current);
        controls.update();
      }
    }
  });
  
  return null;
}

function SceneContent({ isUpperFloor, onGoUp, onGoDown }: { 
  isUpperFloor: boolean; 
  onGoUp: () => void; 
  onGoDown: () => void;
}) {
  const { tables, selectTable, selectedTableId } = useTableStore();
  const { orders, setCurrentOrder } = useOrderStore();
  
  const grayTexture = useMemo(() => createGrayParquetTexture(), []);
  const brownTexture = useMemo(() => createBrownParquetTexture(), []);

  const circleTables = tables
    .filter(t => t.shape === 'circle')
    .map(t => ({
      id: t.id,
      position: new THREE.Vector3(t.position.x, isUpperFloor ? 4 : 0, t.position.y),
      status: t.status,
      tableNumber: t.id,
      seats: t.seats,
    }));

  const rectangleTables = tables
    .filter(t => t.shape === 'rectangle')
    .map(t => ({
      id: t.id,
      position: new THREE.Vector3(t.position.x, isUpperFloor ? 4 : 0, t.position.y),
      status: t.status,
      tableNumber: t.id,
      seats: t.seats,
    }));

  return (
    <>
      {/* Ambient Audio */}
      <AmbientAudio />

      {/* Modern Lighting */}
      <ambientLight intensity={isUpperFloor ? 0.5 : 0.4} color="#ffffff" />
      <directionalLight 
        position={[10, 12, 8]} 
        intensity={isUpperFloor ? 1.2 : 1.0} 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <directionalLight 
        position={[-8, 10, -5]} 
        intensity={0.3} 
        color="#b4c6e7"
      />
      <pointLight 
        position={[0, 8, 0]} 
        intensity={isUpperFloor ? 0.6 : 0.4} 
        color={isUpperFloor ? "#d4a574" : "#fff5e6"}
      />
      
      {/* Environment */}
      <Environment preset="apartment" />

      {/* Floor */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, isUpperFloor ? 3.99 : -0.01, 0]} 
        receiveShadow
      >
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial 
          map={isUpperFloor ? brownTexture : grayTexture}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Ground floor elements */}
      {!isUpperFloor && (
        <>
          {/* Walls */}
          {/* Back wall (behind tables) */}
          <mesh position={[0, 2.5, -7]} receiveShadow>
            <boxGeometry args={[14, 5, 0.3]} />
            <meshStandardMaterial color="#3E2723" roughness={0.9} />
          </mesh>
          
          {/* Left wall */}
          <mesh position={[-7, 2.5, 0]} receiveShadow>
            <boxGeometry args={[0.3, 5, 14]} />
            <meshStandardMaterial color="#4E342E" roughness={0.9} />
          </mesh>
          
          {/* Right wall */}
          <mesh position={[7, 2.5, 0]} receiveShadow>
            <boxGeometry args={[0.3, 5, 14]} />
            <meshStandardMaterial color="#4E342E" roughness={0.9} />
          </mesh>
          
          {/* Front wall sections (sides of entrance) */}
          <mesh position={[-4, 2.5, 7]} receiveShadow>
            <boxGeometry args={[6, 5, 0.3]} />
            <meshStandardMaterial color="#3E2723" roughness={0.9} />
          </mesh>
          <mesh position={[4, 2.5, 7]} receiveShadow>
            <boxGeometry args={[6, 5, 0.3]} />
            <meshStandardMaterial color="#3E2723" roughness={0.9} />
          </mesh>

          {/* Ceiling */}
          <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[14, 14]} />
            <meshStandardMaterial color="#2a2015" roughness={0.95} />
          </mesh>

          {/* Windows with light */}
          {/* Back windows */}
          <mesh position={[-3, 3.5, -6.8]}>
            <boxGeometry args={[2, 1.5, 0.1]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} emissive="#87CEEB" emissiveIntensity={0.2} />
          </mesh>
          <pointLight position={[-3, 3.5, -6]} intensity={0.5} color="#87CEEB" distance={4} />
          
          <mesh position={[3, 3.5, -6.8]}>
            <boxGeometry args={[2, 1.5, 0.1]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} emissive="#87CEEB" emissiveIntensity={0.2} />
          </mesh>
          <pointLight position={[3, 3.5, -6]} intensity={0.5} color="#87CEEB" distance={4} />

          {/* Side windows */}
          <mesh position={[-6.8, 3, 3]}>
            <boxGeometry args={[0.1, 1.2, 2]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} emissive="#87CEEB" emissiveIntensity={0.2} />
          </mesh>
          <pointLight position={[-6, 3, 3]} intensity={0.3} color="#87CEEB" distance={3} />
          
          <mesh position={[-6.8, 3, -2]}>
            <boxGeometry args={[0.1, 1.2, 2]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} emissive="#87CEEB" emissiveIntensity={0.2} />
          </mesh>
          <pointLight position={[-6, 3, -2]} intensity={0.3} color="#87CEEB" distance={3} />

          {/* Hanging lights above tables */}
          <HangingLight position={[3, 4, 3]} />
          <HangingLight position={[-3, 4, 3]} />
          <HangingLight position={[3, 4, 0]} />
          <HangingLight position={[-3, 4, 0]} />

          {/* Wall decorations */}
          {/* Clock on back wall */}
          <group position={[0, 4, -6.8]}>
            <mesh>
              <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
              <meshStandardMaterial color="#2a2a2a" metalness={0.8} />
            </mesh>
            <Text position={[0, 0, 0.06]} fontSize={0.15} color="#d4a574" anchorX="center" anchorY="middle">
              12:00
            </Text>
          </group>

          {/* Wall art frames */}
          <WallArt position={[-5, 3, -6.5]} />
          <WallArt position={[5, 3, -6.5]} />

          {/* Plants in corners */}
          <Plant position={[-6, 0, 5]} />
          <Plant position={[6, 0, 5]} />
          <Plant position={[-6, 0, -5]} />

          {/* Instanced Tables */}
          <InstancedTables 
            circleTables={circleTables}
            rectangleTables={rectangleTables}
          />

          {/* Barista Station */}
          <BaristaStation />

          {/* Kitchen */}
          <Kitchen />

          {/* Cashier Counter */}
          <Counter />

          {/* Entrance Door */}
          <Door />
        </>
      )}

      {/* Upper floor elements - VIP Lounge */}
      {isUpperFloor && (
        <>
          {/* VIP Lounge Sign */}
          <group position={[0, 6, 0]}>
            <Text
              fontSize={0.8}
              color="#d4a574"
              anchorX="center"
              anchorY="middle"
              font="/fonts/Vazirmatn-Bold.ttf"
            >
              سالن VIP
            </Text>
          </group>

          {/* Decorative rug under stairs area */}
          <mesh position={[0, 4.02, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3, 2]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>

          {/* VIP Round Tables with Chairs */}
          {/* VIP Table 1 */}
          <group position={[4, 4, 2]}>
            {/* Table top */}
            <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.7, 0.7, 0.08, 32]} />
              <meshStandardMaterial color="#4a3728" roughness={0.3} metalness={0.4} />
            </mesh>
            {/* Table base */}
            <mesh position={[0, 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.35, 0.7, 24]} />
              <meshStandardMaterial color="#d4a574" roughness={0.2} metalness={0.9} />
            </mesh>
            {/* VIP indicator */}
            <mesh position={[0, 0.85, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
              <meshStandardMaterial color="#d4a574" emissive="#d4a574" emissiveIntensity={0.5} />
            </mesh>
            {/* Chairs around */}
            <VIPChair position={[0, 0, 0.9]} rotation={0} />
            <VIPChair position={[0.78, 0, 0.45]} rotation={Math.PI / 4} />
            <VIPChair position={[0.78, 0, -0.45]} rotation={Math.PI * 3 / 4} />
            <VIPChair position={[0, 0, -0.9]} rotation={Math.PI} />
          </group>

          {/* VIP Table 2 */}
          <group position={[-4, 4, 2]}>
            {/* Table top */}
            <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.7, 0.7, 0.08, 32]} />
              <meshStandardMaterial color="#4a3728" roughness={0.3} metalness={0.4} />
            </mesh>
            {/* Table base */}
            <mesh position={[0, 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.35, 0.7, 24]} />
              <meshStandardMaterial color="#d4a574" roughness={0.2} metalness={0.9} />
            </mesh>
            {/* VIP indicator */}
            <mesh position={[0, 0.85, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
              <meshStandardMaterial color="#d4a574" emissive="#d4a574" emissiveIntensity={0.5} />
            </mesh>
            {/* Chairs around */}
            <VIPChair position={[0, 0, 0.9]} rotation={0} />
            <VIPChair position={[-0.78, 0, 0.45]} rotation={-Math.PI / 4} />
            <VIPChair position={[-0.78, 0, -0.45]} rotation={-Math.PI * 3 / 4} />
            <VIPChair position={[0, 0, -0.9]} rotation={Math.PI} />
          </group>

          {/* Lounge Area with Sofas */}
          {/* Sofa along wall */}
          <group position={[5, 4, 0]}>
            {/* Sofa base */}
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.5, 0.5, 0.9]} />
              <meshStandardMaterial color="#3E2723" roughness={0.6} />
            </mesh>
            {/* Sofa back */}
            <mesh position={[0, 0.65, -0.4]} castShadow>
              <boxGeometry args={[2.5, 0.6, 0.15]} />
              <meshStandardMaterial color="#4E342E" roughness={0.6} />
            </mesh>
            {/* Armrests */}
            <mesh position={[-1.15, 0.45, 0]} castShadow>
              <boxGeometry args={[0.15, 0.3, 0.8]} />
              <meshStandardMaterial color="#3E2723" roughness={0.6} />
            </mesh>
            <mesh position={[1.15, 0.45, 0]} castShadow>
              <boxGeometry args={[0.15, 0.3, 0.8]} />
              <meshStandardMaterial color="#3E2723" roughness={0.6} />
            </mesh>
            {/* Cushions */}
            <mesh position={[-0.5, 0.55, 0.05]} castShadow>
              <boxGeometry args={[0.8, 0.15, 0.55]} />
              <meshStandardMaterial color="#8B4513" roughness={0.7} />
            </mesh>
            <mesh position={[0.5, 0.55, 0.05]} castShadow>
              <boxGeometry args={[0.8, 0.15, 0.55]} />
              <meshStandardMaterial color="#8B4513" roughness={0.7} />
            </mesh>
          </group>

          {/* Sofa opposite wall */}
          <group position={[-5, 4, 0]}>
            {/* Sofa base */}
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.5, 0.5, 0.9]} />
              <meshStandardMaterial color="#3E2723" roughness={0.6} />
            </mesh>
            {/* Sofa back */}
            <mesh position={[0, 0.65, 0.4]} castShadow>
              <boxGeometry args={[2.5, 0.6, 0.15]} />
              <meshStandardMaterial color="#4E342E" roughness={0.6} />
            </mesh>
            {/* Armrests */}
            <mesh position={[-1.15, 0.45, 0]} castShadow>
              <boxGeometry args={[0.15, 0.3, 0.8]} />
              <meshStandardMaterial color="#3E2723" roughness={0.6} />
            </mesh>
            <mesh position={[1.15, 0.45, 0]} castShadow>
              <boxGeometry args={[0.15, 0.3, 0.8]} />
              <meshStandardMaterial color="#3E2723" roughness={0.6} />
            </mesh>
            {/* Cushions */}
            <mesh position={[-0.5, 0.55, -0.05]} castShadow>
              <boxGeometry args={[0.8, 0.15, 0.55]} />
              <meshStandardMaterial color="#8B4513" roughness={0.7} />
            </mesh>
            <mesh position={[0.5, 0.55, -0.05]} castShadow>
              <boxGeometry args={[0.8, 0.15, 0.55]} />
              <meshStandardMaterial color="#8B4513" roughness={0.7} />
            </mesh>
          </group>

          {/* Coffee table between sofas */}
          <group position={[0, 4, 0]}>
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.5, 0.05, 0.8]} />
              <meshStandardMaterial color="#5D4037" roughness={0.3} metalness={0.4} />
            </mesh>
            {/* Legs */}
            <mesh position={[-0.6, 0.2, -0.35]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
              <meshStandardMaterial color="#d4a574" metalness={0.8} />
            </mesh>
            <mesh position={[0.6, 0.2, -0.35]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
              <meshStandardMaterial color="#d4a574" metalness={0.8} />
            </mesh>
            <mesh position={[-0.6, 0.2, 0.35]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
              <meshStandardMaterial color="#d4a574" metalness={0.8} />
            </mesh>
            <mesh position={[0.6, 0.2, 0.35]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
              <meshStandardMaterial color="#d4a574" metalness={0.8} />
            </mesh>
          </group>

          {/* Decorative plants */}
          <Plant position={[6, 4, -4]} />
          <Plant position={[-6, 4, -4]} />
          <Plant position={[0, 4, 5]} />

          {/* Wall art frames */}
          <WallArt position={[6, 5.5, 0]} />
          <WallArt position={[-6, 5.5, 0]} />

          {/* Ambient lighting for upper floor */}
          <pointLight position={[0, 6, 0]} intensity={0.6} color="#d4a574" distance={12} />
          <pointLight position={[4, 5.5, 3]} intensity={0.4} color="#fff5e6" distance={8} />
          <pointLight position={[-4, 5.5, 3]} intensity={0.4} color="#fff5e6" distance={8} />

          {/* Hanging lights above VIP tables */}
          <HangingLight position={[4, 5, 2]} />
          <HangingLight position={[-4, 5, 2]} />
        </>
      )}

      {/* Stairs - always visible */}
      <Stairs 
        onGoUp={onGoUp} 
        onGoDown={onGoDown} 
        isUpperFloor={isUpperFloor}
      />

      {/* Interaction layer - handles click, hover, selection glow */}
      {!isUpperFloor && tables.map((table) => (
        <Table3D
          key={`interaction-${table.id}`}
          table={table}
          isSelected={selectedTableId === table.id}
          onClick={() => {
            selectTable(table.id);
            // If table has existing order, show OrderPanel by setting currentOrder
            // If no order exists, clear currentOrder to hide OrderPanel
            const existingOrder = orders.find(o => o.tableId === table.id);
            if (existingOrder) {
              setCurrentOrder(existingOrder);
            } else {
              setCurrentOrder(null);
            }
          }}
          onHover={(isHovered) => {
            // Could track hovered table here if needed
          }}
        />
      ))}

      {/* Contact Shadows */}
      <ContactShadows
        position={[0, isUpperFloor ? 4 : 0, 0]}
        opacity={0.5}
        scale={20}
        blur={2.5}
        far={5}
      />
    </>
  );
}

export default function Scene3D() {
  const [isUpperFloor, setIsUpperFloor] = useState(false);
  const orbitControlsRef = useRef<any>(null);
  
  const handleGoUp = useCallback(() => {
    setIsUpperFloor(true);
  }, []);
  
  const handleGoDown = useCallback(() => {
    setIsUpperFloor(false);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 14, 10], fov: 50 }}
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
    >
      <CameraController isUpperFloor={isUpperFloor} orbitControlsRef={orbitControlsRef} />
      
      <SceneContent 
        isUpperFloor={isUpperFloor} 
        onGoUp={handleGoUp} 
        onGoDown={handleGoDown} 
      />

      {/* Controls */}
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={true}
        panSpeed={0.5}
        minDistance={6}
        maxDistance={25}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.5}
        target={[0, 0, 0]}
      />

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          intensity={0.8}
          radius={0.8}
        />
        <Vignette 
          offset={0.3}
          darkness={0.5}
        />
      </EffectComposer>
    </Canvas>
  );
}

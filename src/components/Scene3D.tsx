'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Table3D } from './Table3D';
import { InstancedTables } from './InstancedTable';
import { Door } from './Door';
import { Stairs } from './Stairs';
import { BaristaStation } from './BaristaStation';
import { Kitchen } from './Kitchen';
import { Counter } from './Counter';
import { useTableStore } from '@/store';
import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useMemo } from 'react';

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
  orbitControlsRef: React.RefObject<typeof OrbitControls>;
}) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 14, 10));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  
  useFrame(() => {
    // Target positions for each floor
    const floorY = isUpperFloor ? 4 : 0;
    const cameraY = isUpperFloor ? 18 : 14;
    
    // Lerp camera position smoothly
    targetPosition.current.set(0, cameraY, 10);
    camera.position.lerp(targetPosition.current, 0.05);
    
    // Lerp look-at target smoothly
    targetLookAt.current.set(0, floorY, 0);
    
    // Apply to OrbitControls if available
    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.lerp(targetLookAt.current, 0.05);
      orbitControlsRef.current.update();
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
  
  const grayTexture = useMemo(() => createGrayParquetTexture(), []);
  const brownTexture = useMemo(() => createBrownParquetTexture(), []);

  const circleTables = tables
    .filter(t => t.shape === 'circle')
    .map(t => ({
      id: t.id,
      position: new THREE.Vector3(t.position.x, isUpperFloor ? 4 : 0, t.position.y),
      status: t.status,
      tableNumber: t.id,
    }));

  const rectangleTables = tables
    .filter(t => t.shape === 'rectangle')
    .map(t => ({
      id: t.id,
      position: new THREE.Vector3(t.position.x, isUpperFloor ? 4 : 0, t.position.y),
      status: t.status,
      tableNumber: t.id,
    }));

  return (
    <>
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

      {/* Upper floor elements */}
      {isUpperFloor && (
        <>
          {/* VIP Floor label with text */}
          <group position={[0, 5.5, 0]}>
            {/* Sign background */}
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[4, 1, 0.15]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.7} />
            </mesh>
            {/* Sign border */}
            <mesh position={[0, 0, 0.08]} castShadow>
              <boxGeometry args={[4.1, 1.1, 0.05]} />
              <meshStandardMaterial color="#d4a574" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Decorative circle */}
            <mesh position={[0, 0, 0.1]} castShadow>
              <cylinderGeometry args={[0.35, 0.35, 0.02, 32]} />
              <meshStandardMaterial color="#d4a574" roughness={0.2} metalness={0.9} />
            </mesh>
            <Text
              position={[0, 0, 0.12]}
              fontSize={0.4}
              color="#d4a574"
              anchorX="center"
              anchorY="middle"
            >
              طبقه دوم
            </Text>
          </group>

          {/* Decorative rug under stairs area */}
          <mesh position={[0, 4.02, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3, 2]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>

          {/* Decorative plants */}
          {/* Plant pot 1 */}
          <group position={[4, 4, -4]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.25, 0.6, 16]} />
              <meshStandardMaterial color="#5D4037" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.8, 0]} castShadow>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color="#228B22" roughness={0.8} />
            </mesh>
          </group>

          {/* Plant pot 2 */}
          <group position={[-4, 4, -4]}>
            <mesh position={[0, 0.25, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.2, 0.5, 16]} />
              <meshStandardMaterial color="#4E342E" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.7, 0]} castShadow>
              <sphereGeometry args={[0.35, 16, 16]} />
              <meshStandardMaterial color="#2E8B57" roughness={0.8} />
            </mesh>
          </group>

          {/* Plant pot 3 near stairs */}
          <group position={[-2, 4, -4]}>
            <mesh position={[0, 0.2, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.15, 0.4, 12]} />
              <meshStandardMaterial color="#6D4C41" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.55, 0]} castShadow>
              <sphereGeometry args={[0.25, 12, 12]} />
              <meshStandardMaterial color="#3CB371" roughness={0.8} />
            </mesh>
          </group>

          {/* Decorative table near center */}
          <group position={[0, 4, 2]}>
            {/* Table top */}
            <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.8, 0.8, 0.08, 32]} />
              <meshStandardMaterial color="#4a3728" roughness={0.4} metalness={0.3} />
            </mesh>
            {/* Table base */}
            <mesh position={[0, 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.4, 0.7, 24]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.8} />
            </mesh>
          </group>

          {/* Sofa along wall */}
          <group position={[5, 4, 0]}>
            {/* Sofa base */}
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
              <boxGeometry args={[2, 0.5, 0.8]} />
              <meshStandardMaterial color="#3E2723" roughness={0.7} />
            </mesh>
            {/* Sofa back */}
            <mesh position={[0, 0.65, -0.35]} castShadow>
              <boxGeometry args={[2, 0.5, 0.15]} />
              <meshStandardMaterial color="#4E342E" roughness={0.7} />
            </mesh>
            {/* Cushions */}
            <mesh position={[-0.4, 0.55, 0.05]} castShadow>
              <boxGeometry args={[0.7, 0.15, 0.5]} />
              <meshStandardMaterial color="#8B4513" roughness={0.8} />
            </mesh>
            <mesh position={[0.4, 0.55, 0.05]} castShadow>
              <boxGeometry args={[0.7, 0.15, 0.5]} />
              <meshStandardMaterial color="#8B4513" roughness={0.8} />
            </mesh>
          </group>

          {/* Sofa opposite wall */}
          <group position={[-5, 4, 0]}>
            {/* Sofa base */}
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
              <boxGeometry args={[2, 0.5, 0.8]} />
              <meshStandardMaterial color="#3E2723" roughness={0.7} />
            </mesh>
            {/* Sofa back */}
            <mesh position={[0, 0.65, 0.35]} castShadow>
              <boxGeometry args={[2, 0.5, 0.15]} />
              <meshStandardMaterial color="#4E342E" roughness={0.7} />
            </mesh>
            {/* Cushions */}
            <mesh position={[-0.4, 0.55, -0.05]} castShadow>
              <boxGeometry args={[0.7, 0.15, 0.5]} />
              <meshStandardMaterial color="#8B4513" roughness={0.8} />
            </mesh>
            <mesh position={[0.4, 0.55, -0.05]} castShadow>
              <boxGeometry args={[0.7, 0.15, 0.5]} />
              <meshStandardMaterial color="#8B4513" roughness={0.8} />
            </mesh>
          </group>

          {/* Coffee table between sofas */}
          <group position={[0, 4, 0]}>
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.2, 0.05, 0.6]} />
              <meshStandardMaterial color="#5D4037" roughness={0.4} metalness={0.3} />
            </mesh>
            {/* Legs */}
            <mesh position={[-0.5, 0.2, -0.25]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
              <meshStandardMaterial color="#2a2a2a" metalness={0.8} />
            </mesh>
            <mesh position={[0.5, 0.2, -0.25]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
              <meshStandardMaterial color="#2a2a2a" metalness={0.8} />
            </mesh>
            <mesh position={[-0.5, 0.2, 0.25]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
              <meshStandardMaterial color="#2a2a2a" metalness={0.8} />
            </mesh>
            <mesh position={[0.5, 0.2, 0.25]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
              <meshStandardMaterial color="#2a2a2a" metalness={0.8} />
            </mesh>
          </group>

          {/* Wall art frame 1 */}
          <mesh position={[6, 5, 0]} castShadow>
            <boxGeometry args={[1.5, 1, 0.05]} />
            <meshStandardMaterial color="#5D4037" roughness={0.6} />
          </mesh>
          <mesh position={[6, 5, 0.03]} castShadow>
            <boxGeometry args={[1.3, 0.8, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>

          {/* Wall art frame 2 */}
          <mesh position={[-6, 5, 0]} castShadow>
            <boxGeometry args={[1.5, 1, 0.05]} />
            <meshStandardMaterial color="#5D4037" roughness={0.6} />
          </mesh>
          <mesh position={[-6, 5, 0.03]} castShadow>
            <boxGeometry args={[1.3, 0.8, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>

          {/* Ambient lighting for upper floor */}
          <pointLight position={[0, 6, 0]} intensity={0.5} color="#d4a574" distance={10} />
          <pointLight position={[4, 5, 4]} intensity={0.3} color="#fff5e6" distance={8} />
          <pointLight position={[-4, 5, 4]} intensity={0.3} color="#fff5e6" distance={8} />
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
          onClick={() => selectTable(table.id)}
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
  const orbitControlsRef = useRef<typeof OrbitControls>(null);
  
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
        ref={orbitControlsRef as React.RefObject<typeof OrbitControls>}
        enablePan={true}
        panSpeed={0.5}
        minDistance={6}
        maxDistance={25}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.5}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}

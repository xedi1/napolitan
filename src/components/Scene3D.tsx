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

// Camera controller component
function CameraController({ isUpperFloor }: { isUpperFloor: boolean }) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3());
  
  useEffect(() => {
    if (isUpperFloor) {
      targetRef.current.set(0, 14, 10);
    } else {
      targetRef.current.set(0, 14, 10);
    }
  }, [isUpperFloor]);
  
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
          {/* Upper floor decoration */}
          <mesh position={[0, 4.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3, 3]} />
            <meshStandardMaterial color="#6D4C41" roughness={0.8} />
          </mesh>
          
          {/* Upper floor label */}
          <mesh position={[0, 5, 0]}>
            <planeGeometry args={[4, 0.8]} />
            <meshBasicMaterial color="#3E2723" />
          </mesh>
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
  
  const handleGoUp = useCallback(() => {
    setIsUpperFloor(true);
  }, []);
  
  const handleGoDown = useCallback(() => {
    setIsUpperFloor(false);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, isUpperFloor ? 18 : 14, 10], fov: 50 }}
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
    >
      <CameraController isUpperFloor={isUpperFloor} />
      
      <SceneContent 
        isUpperFloor={isUpperFloor} 
        onGoUp={handleGoUp} 
        onGoDown={handleGoDown} 
      />

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        panSpeed={0.5}
        minDistance={6}
        maxDistance={isUpperFloor ? 30 : 25}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.5}
        target={[0, isUpperFloor ? 4 : 0, 0]}
      />
    </Canvas>
  );
}

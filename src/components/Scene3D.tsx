'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Table3D } from './Table3D';
import { InstancedTables } from './InstancedTable';
import { Door } from './Door';
import { Stairs } from './Stairs';
import { BaristaStation } from './BaristaStation';
import { Kitchen } from './Kitchen';
import { useTableStore } from '@/store';
import * as THREE from 'three';
import { useMemo } from 'react';

// Create parquet/checkerboard texture
function createParquetTexture(): THREE.CanvasTexture {
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
      
      // Add wood grain lines for each tile
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

export default function Scene3D() {
  const { tables, selectTable, selectedTableId } = useTableStore();
  
  // Create parquet texture
  const parquetTexture = useMemo(() => createParquetTexture(), []);

  // Prepare instanced data for visual rendering
  const circleTables = tables
    .filter(t => t.shape === 'circle')
    .map(t => ({
      id: t.id,
      position: new THREE.Vector3(t.position.x, 0, t.position.y),
      status: t.status,
      tableNumber: t.id,
    }));

  const rectangleTables = tables
    .filter(t => t.shape === 'rectangle')
    .map(t => ({
      id: t.id,
      position: new THREE.Vector3(t.position.x, 0, t.position.y),
      status: t.status,
      tableNumber: t.id,
    }));

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
      {/* Modern Lighting */}
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight 
        position={[10, 12, 8]} 
        intensity={1.0} 
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
        intensity={0.4} 
        color="#fff5e6"
      />
      
      {/* Environment */}
      <Environment preset="apartment" />

      {/* Parquet Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial 
          map={parquetTexture}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Instanced Tables - visual rendering only (no glow, no selection) */}
      <InstancedTables 
        circleTables={circleTables}
        rectangleTables={rectangleTables}
      />

      {/* Barista Station */}
      <BaristaStation />

      {/* Kitchen */}
      <Kitchen />

      {/* Entrance Door */}
      <Door />

      {/* Stairs going up */}
      <Stairs />

      {/* Interaction layer - handles click, hover, selection glow */}
      {tables.map((table) => (
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
        position={[0, 0, 0]}
        opacity={0.5}
        scale={20}
        blur={2.5}
        far={5}
      />

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        panSpeed={0.5}
        minDistance={6}
        maxDistance={25}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.5}
      />
    </Canvas>
  );
}

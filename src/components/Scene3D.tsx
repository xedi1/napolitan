'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Table3D } from './Table3D';
import { InstancedTables } from './InstancedTable';
import { useTableStore } from '@/store';
import * as THREE from 'three';

export default function Scene3D() {
  const { tables, selectTable, selectedTableId } = useTableStore();

  // Prepare instanced data
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
      camera={{ position: [0, 12, 8], fov: 45 }}
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]} // Limit pixel ratio for performance
      performance={{ min: 0.5 }} // Degrade gracefully on low-end devices
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, 10, -5]} intensity={0.5} />

      {/* Environment */}
      <Environment preset="city" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Instanced Tables (optimized) */}
      <InstancedTables 
        circleTables={circleTables}
        rectangleTables={rectangleTables}
      />

      {/* Individual Tables for interaction (selected only) */}
      {tables.map((table) => (
        <Table3D
          key={`interactive-${table.id}`}
          table={table}
          isSelected={selectedTableId === table.id}
          onClick={() => selectTable(table.id)}
          interactive
        />
      ))}

      {/* Contact Shadows */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={4}
      />

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
      />
    </Canvas>
  );
}

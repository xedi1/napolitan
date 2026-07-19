'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface TableInstance {
  id: number;
  position: THREE.Vector3;
  status: string;
  tableNumber: number;
}

const STATUS_COLORS = {
  available: '#22c55e',
  occupied: '#ef4444',
  preparing: '#f59e0b',
  awaiting: '#a855f7',
  eating: '#3b82f6',
  reserved: '#6366f1',
  cleaning: '#10b981',
};

// Create wood texture
function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  
  // Base color
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Wood grain
  for (let i = 0; i < 50; i++) {
    ctx.strokeStyle = `rgba(60, 40, 10, ${Math.random() * 0.3})`;
    ctx.lineWidth = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.moveTo(0, Math.random() * canvas.height);
    ctx.lineTo(canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

const woodTexture = createWoodTexture();

// Circle Table with persistent status ring
function InstancedCircleTable({ instances }: { instances: TableInstance[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.InstancedMesh>(null);
  const ringGlowRef = useRef<THREE.InstancedMesh>(null);
  
  const radius = 0.5;
  
  useEffect(() => {
    if (!meshRef.current || !ringRef.current) return;
    
    const matrix = new THREE.Matrix4();
    
    instances.forEach((instance, i) => {
      // Table top
      matrix.makeTranslation(instance.position.x, 0.38, instance.position.z);
      meshRef.current!.setMatrixAt(i, matrix);
      
      // Status ring (subtle, always visible)
      matrix.makeTranslation(instance.position.x, 0.02, instance.position.z);
      ringRef.current!.setMatrixAt(i, matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    ringRef.current.instanceMatrix.needsUpdate = true;
  }, [instances]);
  
  // Animate ring glow
  useFrame((state) => {
    if (ringGlowRef.current) {
      const time = state.clock.elapsedTime;
      ringGlowRef.current.material.opacity = 0.15 + Math.sin(time * 2) * 0.05;
    }
  });
  
  return (
    <group>
      {/* Main table surface */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, instances.length]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[radius, radius * 0.95, 0.06, 24]} />
        <meshStandardMaterial
          map={woodTexture}
          roughness={0.6}
          metalness={0.1}
        />
      </instancedMesh>
      
      {/* Persistent status ring */}
      {instances.map((instance, i) => {
        const color = STATUS_COLORS[instance.status as keyof typeof STATUS_COLORS] || '#22c55e';
        return (
          <group key={instance.id}>
            {/* Outer glow ring */}
            <mesh 
              position={[instance.position.x, 0.015, instance.position.z]} 
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[radius + 0.08, radius + 0.18, 32]} />
              <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={0.2} 
                depthWrite={false}
              />
            </mesh>
            {/* Status indicator bar on table edge */}
            <mesh 
              position={[instance.position.x, 0.42, instance.position.z]}
            >
              <cylinderGeometry args={[0.03, 0.03, 0.04, 8]} />
              <meshStandardMaterial 
                color={color}
                emissive={color}
                emissiveIntensity={0.8}
              />
            </mesh>
          </group>
        );
      })}
      
      {/* Table numbers */}
      {instances.map((instance) => (
        <Text
          key={`text-${instance.id}`}
          position={[instance.position.x, 0.42, instance.position.z]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Vazirmatn-Bold.woff"
        >
          {instance.tableNumber}
        </Text>
      ))}
    </group>
  );
}

// Rectangle Table with persistent status ring
function InstancedRectangleTable({ instances }: { instances: TableInstance[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const width = 1.8;
  const depth = 1.0;
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    const matrix = new THREE.Matrix4();
    
    instances.forEach((instance, i) => {
      matrix.makeTranslation(instance.position.x, 0.38, instance.position.z);
      meshRef.current!.setMatrixAt(i, matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [instances]);
  
  return (
    <group>
      {/* Main table surface */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, instances.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, 0.06, depth]} />
        <meshStandardMaterial
          map={woodTexture}
          roughness={0.6}
          metalness={0.1}
        />
      </instancedMesh>
      
      {/* Persistent status ring */}
      {instances.map((instance) => {
        const color = STATUS_COLORS[instance.status as keyof typeof STATUS_COLORS] || '#22c55e';
        return (
          <group key={instance.id}>
            {/* Corner indicators */}
            {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([dx, dz], idx) => (
              <mesh 
                key={idx}
                position={[
                  instance.position.x + dx * (width / 2 - 0.05),
                  0.42,
                  instance.position.z + dz * (depth / 2 - 0.05)
                ]}
              >
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial 
                  color={color}
                  emissive={color}
                  emissiveIntensity={0.6}
                />
              </mesh>
            ))}
          </group>
        );
      })}
      
      {/* Table numbers */}
      {instances.map((instance) => (
        <Text
          key={`text-${instance.id}`}
          position={[instance.position.x, 0.42, instance.position.z]}
          fontSize={0.22}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {instance.tableNumber}
        </Text>
      ))}
    </group>
  );
}

// Table legs (instanced)
function TableLegs({ instances, isCircle }: { instances: TableInstance[]; isCircle: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const legOffset = isCircle ? 0.38 : 0.75;
  const depth = isCircle ? 0 : 0.35;
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    const matrix = new THREE.Matrix4();
    const angles = isCircle 
      ? [0, Math.PI / 2, Math.PI, Math.PI * 1.5]
      : [-Math.PI / 4, Math.PI / 4, Math.PI * 0.75, Math.PI * 1.25];
    
    let idx = 0;
    instances.forEach((instance) => {
      angles.forEach((angle) => {
        const x = instance.position.x + Math.sin(angle) * legOffset;
        const z = instance.position.z + Math.cos(angle) * (isCircle ? legOffset : depth);
        
        matrix.makeTranslation(x, 0.17, z);
        meshRef.current!.setMatrixAt(idx++, matrix);
      });
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [instances, isCircle, legOffset, depth]);
  
  const count = instances.length * 4;
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      castShadow
    >
      <cylinderGeometry args={[0.035, 0.045, 0.34, 8]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
    </instancedMesh>
  );
}

// Main exported component
export function InstancedTables({ 
  circleTables, 
  rectangleTables 
}: { 
  circleTables: TableInstance[];
  rectangleTables: TableInstance[];
}) {
  return (
    <group>
      {/* Circle tables */}
      {circleTables.length > 0 && (
        <>
          <InstancedCircleTable instances={circleTables} />
          <TableLegs instances={circleTables} isCircle={true} />
        </>
      )}
      
      {/* Rectangle tables */}
      {rectangleTables.length > 0 && (
        <>
          <InstancedRectangleTable instances={rectangleTables} />
          <TableLegs instances={rectangleTables} isCircle={false} />
        </>
      )}
    </group>
  );
}

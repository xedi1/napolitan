'use client';

import { useRef, useEffect } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface TableInstance {
  id: number;
  position: THREE.Vector3;
  status: string;
  tableNumber: number;
}

const STATUS_COLORS = {
  available: '#4ADE80',
  occupied: '#F87171',
  preparing: '#FBBF24',
  awaiting: '#A78BFA',
  reserved: '#60A5FA',
  cleaning: '#34D399',
};

// Instanced circle table component - visual only, no interaction
function InstancedCircleTable({ instances }: { instances: TableInstance[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const radius = 0.45;
  
  // Use useEffect for ref updates (not useMemo - refs are null on first render)
  useEffect(() => {
    if (!meshRef.current) return;
    
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    
    instances.forEach((instance, i) => {
      matrix.makeTranslation(instance.position.x, 0.4, instance.position.z);
      meshRef.current!.setMatrixAt(i, matrix);
      
      color.set(STATUS_COLORS[instance.status as keyof typeof STATUS_COLORS] || '#4ADE80');
      meshRef.current!.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
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
        <cylinderGeometry args={[radius, radius, 0.1, 16]} />
        <meshStandardMaterial
          color="#3a2a1a"
          roughness={0.8}
          metalness={0.1}
        />
      </instancedMesh>
      
      {/* Table numbers */}
      {instances.map((instance) => (
        <Text
          key={`text-${instance.id}`}
          position={[instance.position.x, 0.46, instance.position.z]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {instance.tableNumber}
        </Text>
      ))}
    </group>
  );
}

// Instanced rectangle table component
function InstancedRectangleTable({ instances }: { instances: TableInstance[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const width = 1.6;
  const depth = 0.9;
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    
    instances.forEach((instance, i) => {
      matrix.makeTranslation(instance.position.x, 0.4, instance.position.z);
      meshRef.current!.setMatrixAt(i, matrix);
      
      color.set(STATUS_COLORS[instance.status as keyof typeof STATUS_COLORS] || '#4ADE80');
      meshRef.current!.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [instances]);
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, instances.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[width, 0.1, depth]} />
      <meshStandardMaterial
        color="#3a2a1a"
        roughness={0.8}
        metalness={0.1}
      />
    </instancedMesh>
  );
}

// Table legs (instanced)
function TableLegs({ instances, isCircle }: { instances: TableInstance[]; isCircle: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const radius = isCircle ? 0.45 : 0.8;
  const legOffset = isCircle ? 0.35 : 0.6;
  const depth = isCircle ? 0 : 0.45;
  
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
        
        matrix.makeTranslation(x, 0.2, z);
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
      <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
      <meshStandardMaterial color="#2a1a0a" metalness={0.5} />
    </instancedMesh>
  );
}

// Status indicator lights (instanced)
function StatusLights({ instances }: { instances: TableInstance[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    
    instances.forEach((instance, i) => {
      matrix.makeTranslation(instance.position.x, 0.55, instance.position.z);
      meshRef.current!.setMatrixAt(i, matrix);
      
      color.set(STATUS_COLORS[instance.status as keyof typeof STATUS_COLORS] || '#4ADE80');
      meshRef.current!.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [instances]);
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, instances.length]}
    >
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial
        color="#4ADE80"
        emissive="#4ADE80"
        emissiveIntensity={0.5}
      />
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
          <StatusLights instances={circleTables} />
        </>
      )}
      
      {/* Rectangle tables */}
      {rectangleTables.length > 0 && (
        <>
          <InstancedRectangleTable instances={rectangleTables} />
          <TableLegs instances={rectangleTables} isCircle={false} />
          <StatusLights instances={rectangleTables} />
        </>
      )}
    </group>
  );
}

'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Table } from '@/types';

interface Table3DProps {
  table: Table;
  isSelected: boolean;
  onClick: () => void;
}

const STATUS_COLORS = {
  available: '#4ADE80',
  occupied: '#F87171',
  preparing: '#FBBF24',
  awaiting: '#A78BFA',
  reserved: '#60A5FA',
  cleaning: '#34D399',
};

export function Table3D({ table, isSelected, onClick }: Table3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (glowRef.current && isSelected) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.05);
    }
  });

  const color = STATUS_COLORS[table.status];
  const isCircle = table.shape === 'circle';
  const radius = table.seats === 6 ? 0.8 : 0.6;

  return (
    <group position={[table.position.x, 0, table.position.y]}>
      {/* Table Glow (when selected) */}
      {isSelected && (
        <mesh ref={glowRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius + 0.1, radius + 0.3, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      )}

      {/* Table Surface */}
      <mesh
        ref={meshRef}
        position={[0, 0.4, 0]}
        onClick={onClick}
        castShadow
        receiveShadow
      >
        {isCircle ? (
          <cylinderGeometry args={[radius, radius, 0.1, 32]} />
        ) : (
          <boxGeometry args={[radius * 2, 0.1, radius * 1.5]} />
        )}
        <meshStandardMaterial
          color="#3a2a1a"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Table Leg */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
        <meshStandardMaterial color="#2a1a0a" metalness={0.5} />
      </mesh>

      {/* Status Indicator */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.5 : 0.2}
        />
      </mesh>

      {/* Table Number */}
      <Text
        position={[0, 0.46, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {table.id}
      </Text>

      {/* Seats */}
      {Array.from({ length: table.seats }).map((_, i) => {
        const angle = (i / table.seats) * Math.PI * 2;
        const seatRadius = radius + 0.3;
        const x = Math.sin(angle) * seatRadius;
        const z = Math.cos(angle) * seatRadius;
        return (
          <mesh
            key={i}
            position={[x, 0.25, z]}
            castShadow
          >
            <boxGeometry args={[0.2, 0.1, 0.2]} />
            <meshStandardMaterial color="#4a3a2a" />
          </mesh>
        );
      })}
    </group>
  );
}

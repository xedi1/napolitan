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
  interactive?: boolean;
}

const STATUS_COLORS = {
  available: '#4ADE80',
  occupied: '#F87171',
  preparing: '#FBBF24',
  awaiting: '#A78BFA',
  reserved: '#60A5FA',
  cleaning: '#34D399',
};

export function Table3D({ table, isSelected, onClick, interactive = false }: Table3DProps) {
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

  // Only render interactive elements if interactive mode is on
  if (!interactive) {
    return null;
  }

  return (
    <group position={[table.position.x, 0, table.position.y]}>
      {/* Table Glow (when selected) */}
      {isSelected && (
        <mesh ref={glowRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius + 0.1, radius + 0.3, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      )}

      {/* Invisible interaction plane */}
      <mesh
        position={[0, 0.5, 0]}
        onClick={onClick}
      >
        <cylinderGeometry args={[radius + 0.5, radius + 0.5, 1, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

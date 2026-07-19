'use client';

import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Table } from '@/types';

interface Table3DProps {
  table: Table;
  isSelected: boolean;
  onClick: () => void;
  onHover?: (isHovered: boolean) => void;
}

const STATUS_COLORS = {
  available: '#4ADE80',
  occupied: '#F87171',
  preparing: '#FBBF24',
  awaiting: '#A78BFA',
  reserved: '#60A5FA',
  cleaning: '#34D399',
};

export function Table3D({ table, isSelected, onClick, onHover }: Table3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const color = STATUS_COLORS[table.status];
  const isCircle = table.shape === 'circle';
  const baseRadius = table.seats === 6 ? 0.8 : 0.6;
  
  // Animation for hover and selection
  useFrame((state) => {
    if (groupRef.current) {
      // Target scale based on hover/selection
      const targetScale = isSelected ? 1.1 : isHovered ? 1.05 : 1;
      // Smooth interpolation
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
    
    // Glow animation for selected or hovered
    if (glowRef.current) {
      const glowOpacity = isSelected 
        ? 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1
        : isHovered 
          ? 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.05
          : 0;
      
      const glowScale = isSelected || isHovered
        ? 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05
        : 1;
      
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glowOpacity;
      glowRef.current.scale.setScalar(glowScale);
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    onHover?.(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    onHover?.(false);
    document.body.style.cursor = 'default';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  const radius = baseRadius;

  return (
    <group 
      ref={groupRef}
      position={[table.position.x, 0, table.position.y]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Glow ring (visible on hover or selection) */}
      {/* Positioned at y=0.05 to avoid z-fighting with floor at y=-0.01 */}
      <mesh 
        ref={glowRef} 
        position={[0, 0.05, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[radius + 0.15, radius + 0.35, 32]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0} 
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Invisible interaction plane - larger for easier clicking */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[radius + 0.6, radius + 0.6, 1, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Hover/Selection indicator ring (subtle) */}
      {/* Positioned at y=0.06 to avoid overlap with glow ring */}
      {(isHovered || isSelected) && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius + 0.5, radius + 0.55, 32]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={isSelected ? 0.5 : 0.25} 
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Tooltip on hover - table info */}
      {isHovered && !isSelected && (
        <group position={[0, 1.2, 0]}>
          {/* Tooltip background */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.8, 0.6]} />
            <meshBasicMaterial color="#1a1a1a" transparent opacity={0.95} />
          </mesh>
          {/* Border ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <ringGeometry args={[0.85, 0.9, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.3} />
          </mesh>
          {/* Table number */}
          <Text
            position={[0, 0.08, 0.01]}
            fontSize={0.14}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            میز {table.id}
          </Text>
          {/* Group name */}
          <Text
            position={[0, -0.05, 0.01]}
            fontSize={0.1}
            color={color}
            anchorX="center"
            anchorY="middle"
          >
            {table.group}
          </Text>
          {/* Status */}
          <Text
            position={[0, -0.15, 0.01]}
            fontSize={0.08}
            color="#888888"
            anchorX="center"
            anchorY="middle"
          >
            {table.seats} نفر
          </Text>
        </group>
      )}
    </group>
  );
}

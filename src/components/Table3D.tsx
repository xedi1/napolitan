'use client';

import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Table } from '@/types';

interface Table3DProps {
  table: Table;
  isSelected: boolean;
  onClick: () => void;
  onHover?: (isHovered: boolean) => void;
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

const STATUS_LABELS: Record<string, string> = {
  available: 'خالی',
  occupied: 'اشغال',
  preparing: 'آماده‌سازی',
  awaiting: 'در انتظار',
  eating: 'در حال صرف',
  reserved: 'رزرو',
  cleaning: 'تمیزکاری',
};

export function Table3D({ table, isSelected, onClick, onHover }: Table3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tooltipRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const color = STATUS_COLORS[table.status];
  const isCircle = table.shape === 'circle';
  const baseRadius = table.seats === 6 ? 0.9 : 0.6;
  
  // Animation for hover and selection
  useFrame((state) => {
    if (groupRef.current) {
      const targetScale = isSelected ? 1.08 : isHovered ? 1.03 : 1;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.12
      );
    }
    
    // Animate tooltip appearance
    if (tooltipRef.current) {
      const targetOpacity = isHovered || isSelected ? 1 : 0;
      const currentOpacity = tooltipRef.current.children[0]?.material?.opacity || 0;
      const newOpacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, 0.15);
      
      tooltipRef.current.children.forEach((child) => {
        if ((child as THREE.Mesh).material) {
          ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = newOpacity;
        }
      });
      
      const targetScale = isHovered || isSelected ? 1 : 0.8;
      tooltipRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
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
      {/* Invisible interaction plane */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[radius + 0.8, radius + 0.8, 1, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Billboard Tooltip - always faces camera */}
      <Billboard 
        position={[0, 1.8, 0]}
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <group ref={tooltipRef}>
          {/* Tooltip background */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[2.2, 1.0]} />
            <meshBasicMaterial 
              color="#1a1a1a" 
              transparent 
              opacity={0} 
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Status color accent bar */}
          <mesh position={[0, 0.42, 0.01]}>
            <planeGeometry args={[2.0, 0.1]} />
            <meshBasicMaterial 
              color={color} 
              transparent 
              opacity={0}
            />
          </mesh>
          
          {/* Table number */}
          <Text
            position={[0, 0.22, 0.01]}
            fontSize={0.24}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {`میز ${table.id}`}
          </Text>
          
          {/* Status badge background */}
          <mesh position={[0, -0.02, 0.01]}>
            <planeGeometry args={[1.4, 0.32]} />
            <meshBasicMaterial 
              color={color} 
              transparent 
              opacity={0}
            />
          </mesh>
          
          {/* Status badge text */}
          <Text
            position={[0, -0.02, 0.02]}
            fontSize={0.15}
            color={color}
            anchorX="center"
            anchorY="middle"
          >
            {STATUS_LABELS[table.status]}
          </Text>
          
          {/* Info line */}
          <Text
            position={[0, -0.25, 0.01]}
            fontSize={0.12}
            color="#888888"
            anchorX="center"
            anchorY="middle"
          >
            {`${table.group} • ${table.seats} نفر`}
          </Text>
          
          {/* Click hint */}
          <Text
            position={[0, -0.42, 0.01]}
            fontSize={0.09}
            color="#555555"
            anchorX="center"
            anchorY="middle"
          >
            برای مشاهده کلیک کنید
          </Text>
        </group>
      </Billboard>
    </group>
  );
}

'use client';

import { useRef, useState } from 'react';
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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
  const showTooltip = isHovered || isSelected;

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

      {/* HTML Tooltip - always faces camera correctly with transform3D */}
      {showTooltip && (
        <Html
          position={[0, 1.8, 0]}
          center
          transform
          distanceFactor={8}
          occlude
          style={{
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: showTooltip ? 1 : 0,
            pointerEvents: 'none',
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
            borderRadius: '16px',
            padding: '16px 24px',
            minWidth: '180px',
            border: `2px solid ${color}`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${color}40`,
            fontFamily: 'Vazirmatn, sans-serif',
            textAlign: 'right',
            direction: 'rtl',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              borderBottom: `2px solid ${color}40`,
              paddingBottom: '8px',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}`,
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                میز {table.id}
              </span>
            </div>
            
            {/* Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
            }}>
              <span style={{ color, fontSize: '14px', fontWeight: '500' }}>
                {STATUS_LABELS[table.status]}
              </span>
            </div>
            
            {/* Info */}
            <div style={{
              color: '#888',
              fontSize: '12px',
              display: 'flex',
              gap: '4px',
            }}>
              <span>{table.group}</span>
              <span>•</span>
              <span>{table.seats} نفر</span>
            </div>
          </div>
          
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.2); }
            }
          `}</style>
        </Html>
      )}
    </group>
  );
}

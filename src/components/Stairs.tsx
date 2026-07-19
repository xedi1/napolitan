'use client';

import { useMemo, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface StairsProps {
  onGoUp?: () => void;
  onGoDown?: () => void;
  isUpperFloor?: boolean;
}

export function Stairs({ onGoUp, onGoDown, isUpperFloor }: StairsProps) {
  const stairCount = 10; // 10 steps × 0.5 depth = 5 units total, fits within 14×14 floor
  const stepHeight = 0.2;
  const stepDepth = 0.5;
  const stepWidth = 2.5;
  const [hovered, setHovered] = useState(false);
  
  const totalHeight = stairCount * stepHeight;
  const totalDepth = stairCount * stepDepth;
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isUpperFloor) {
      onGoDown?.();
    } else {
      onGoUp?.();
    }
  };

  return (
    <group position={[-4, 0, -3]}>
      {/* Invisible interaction mesh for stairs only (not counter) */}
      <mesh
        position={[0, totalHeight / 2, -totalDepth / 2]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[stepWidth, totalHeight + 0.5, totalDepth]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Stair structure - taller and longer */}
      {Array.from({ length: stairCount }, (_, i) => {
        const y = i * stepHeight;
        const z = -i * stepDepth;
        return (
          <group key={i}>
            <mesh 
              position={[0, y + stepHeight / 2, z]} 
              castShadow 
              receiveShadow
            >
              <boxGeometry args={[stepWidth, stepHeight, stepDepth]} />
              <meshStandardMaterial 
                color="#2a2a2a"
                roughness={0.4}
                metalness={0.6}
              />
            </mesh>
            
            <mesh position={[0, y + stepHeight, z - stepDepth / 2 + 0.02]}>
              <boxGeometry args={[stepWidth, 0.03, 0.05]} />
              <meshStandardMaterial 
                color="#3a3a3a"
                roughness={0.3}
                metalness={0.8}
              />
            </mesh>
          </group>
        );
      })}
      
      {/* Side rail - left */}
      <mesh position={[-stepWidth / 2 + 0.05, totalHeight / 2, -totalDepth / 2]} castShadow>
        <boxGeometry args={[0.06, totalHeight + 0.6, 0.06]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Side rail - right */}
      <mesh position={[stepWidth / 2 - 0.05, totalHeight / 2, -totalDepth / 2]} castShadow>
        <boxGeometry args={[0.06, totalHeight + 0.6, 0.06]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Rail horizontal bars */}
      {[0.4, 1.0, 1.6, 2.2, 2.8].map((height, i) => (
        <mesh 
          key={i}
          position={[0, height, -totalDepth / 2]} 
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.04, 0.04, stepWidth - 0.3, 8]} />
          <meshStandardMaterial 
            color="#d4a574"
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      ))}
      
      {/* Upper platform extending from stairs */}
      <mesh 
        position={[0, totalHeight + 0.05, -totalDepth - 1]} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[stepWidth + 1, 0.12, 3]} />
        <meshStandardMaterial 
          color="#252525"
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      
      {/* Upper floor platform */}
      <mesh 
        position={[0, totalHeight + 0.05, -totalDepth - 3.5]} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[stepWidth + 2, 0.15, 5]} />
        <meshStandardMaterial 
          color="#2a2a2a"
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      
      {/* Floating label */}
      <Html
        position={[0, totalHeight + 0.8, -totalDepth / 2]}
        center
        transform
        distanceFactor={10}
        style={{
          pointerEvents: 'none',
        }}
      >
        <div style={{
          background: hovered ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
          borderRadius: '25px',
          padding: '14px 28px',
          border: '2px solid #22c55e',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 25px #22c55e50',
          fontFamily: 'Vazirmatn, sans-serif',
          textAlign: 'center',
          direction: 'rtl',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
        }}>
          <div style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold' }}>
            {isUpperFloor ? 'بازگشت به طبقه اول' : 'رفتن به طبقه بالا'}
          </div>
          <div style={{ color: '#aaa', fontSize: '11px', marginTop: '5px' }}>
            {isUpperFloor ? '↓' : '↑'} کلیک کنید
          </div>
        </div>
      </Html>
    </group>
  );
}

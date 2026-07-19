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
  const stairCount = 10;
  const stepHeight = 0.2;
  const stepDepth = 0.4;
  const stepWidth = 2.5;
  const [hovered, setHovered] = useState(false);
  
  // Create individual steps
  const steps = useMemo(() => {
    return Array.from({ length: stairCount }, (_, i) => ({
      y: i * stepHeight,
      z: -i * stepDepth,
    }));
  }, []);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isUpperFloor) {
      onGoDown?.();
    } else {
      onGoUp?.();
    }
  };

  return (
    <group 
      position={[-6, 0, 2]}
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
      {/* Counter under stairs */}
      <mesh position={[0, 0.5, 1.5]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.0, 1.0]} />
        <meshStandardMaterial 
          color="#2a2a2a"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Counter top */}
      <mesh position={[0, 1.02, 1.5]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.05, 1.1]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Cash drawer on counter */}
      <mesh position={[0, 0.7, 1.5]} castShadow>
        <boxGeometry args={[1.8, 0.15, 0.6]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>
      
      {/* Display on counter */}
      <mesh position={[0, 1.2, 1.5]} castShadow>
        <boxGeometry args={[1.2, 0.5, 0.05]} />
        <meshStandardMaterial 
          color="#0a0a0a"
          emissive="#1a3a1a"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Counter light */}
      <pointLight 
        position={[0, 1.5, 1.5]} 
        intensity={0.3} 
        color="#22c55e"
        distance={1.5}
      />
      
      {/* Stair structure */}
      {steps.map((step, i) => (
        <group key={i}>
          {/* Step platform */}
          <mesh 
            position={[0, step.y + stepHeight / 2, step.z]} 
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
          
          {/* Step edge highlight */}
          <mesh position={[0, step.y + stepHeight, step.z - stepDepth / 2 + 0.02]}>
            <boxGeometry args={[stepWidth, 0.03, 0.05]} />
            <meshStandardMaterial 
              color="#3a3a3a"
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
        </group>
      ))}
      
      {/* Side rail - left */}
      <mesh position={[-stepWidth / 2 + 0.05, stairCount * stepHeight / 2, -stepDepth * stairCount / 2]} castShadow>
        <boxGeometry args={[0.05, stairCount * stepHeight + 0.5, 0.05]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Side rail - right */}
      <mesh position={[stepWidth / 2 - 0.05, stairCount * stepHeight / 2, -stepDepth * stairCount / 2]} castShadow>
        <boxGeometry args={[0.05, stairCount * stepHeight + 0.5, 0.05]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Rail horizontal bars */}
      {[0.3, 0.8, 1.3, 1.8].map((height, i) => (
        <mesh 
          key={i}
          position={[0, height, -stepDepth * stairCount / 2]} 
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.03, 0.03, stepWidth - 0.3, 8]} />
          <meshStandardMaterial 
            color="#d4a574"
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      ))}
      
      {/* Upper platform */}
      <mesh 
        position={[0, stairCount * stepHeight + 0.05, -stepDepth * stairCount - 0.5]} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[stepWidth + 0.5, 0.1, 2]} />
        <meshStandardMaterial 
          color="#252525"
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      
      {/* Floating label */}
      <Html
        position={[0, 2.5, -stepDepth * stairCount / 2]}
        center
        transform
        distanceFactor={8}
        style={{
          pointerEvents: 'none',
        }}
      >
        <div style={{
          background: hovered ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
          borderRadius: '25px',
          padding: '12px 24px',
          border: '2px solid #22c55e',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px #22c55e40',
          fontFamily: 'Vazirmatn, sans-serif',
          textAlign: 'center',
          direction: 'rtl',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
        }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
            {isUpperFloor ? 'بازگشت به طبقه اول' : 'رفتن به طبقه بالا'}
          </div>
          <div style={{ color: '#aaa', fontSize: '10px', marginTop: '4px' }}>
            {isUpperFloor ? '↓' : '↑'} کلیک کنید
          </div>
        </div>
      </Html>
      
      {/* Landing shadow */}
      <mesh 
        position={[0, 0.01, -stepDepth * stairCount - 1]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[stepWidth + 1, 2.5]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

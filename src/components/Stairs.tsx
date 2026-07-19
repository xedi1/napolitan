'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

export function Stairs() {
  const stairCount = 10;
  const stepHeight = 0.2;
  const stepDepth = 0.4;
  const stepWidth = 2.5;
  
  // Create individual steps
  const steps = useMemo(() => {
    return Array.from({ length: stairCount }, (_, i) => ({
      y: i * stepHeight,
      z: -i * stepDepth,
    }));
  }, []);

  return (
    <group position={[7, 0, -5]}>
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

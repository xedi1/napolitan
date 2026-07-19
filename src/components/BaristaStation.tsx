'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export function BaristaStation() {
  const groupRef = useRef<THREE.Group>(null);
  
  // Subtle steam animation
  useFrame((state) => {
    // Could add particle effects here
  });

  return (
    <group ref={groupRef} position={[4, 0, -4]}>
      {/* Main counter body */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.0, 1.5]} />
        <meshStandardMaterial 
          color="#2a2a2a"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Counter top surface */}
      <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.05, 1.6]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Espresso machine */}
      <mesh position={[-0.6, 1.4, 0]} castShadow>
        <boxGeometry args={[0.5, 0.8, 0.4]} />
        <meshStandardMaterial 
          color="#c0c0c0"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Coffee grinder */}
      <mesh position={[0.3, 1.25, 0.2]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.5, 16]} />
        <meshStandardMaterial 
          color="#4a4a4a"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Coffee beans container */}
      <mesh position={[-0.8, 1.25, -0.3]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.3, 12]} />
        <meshStandardMaterial 
          color="#3d2817"
          roughness={0.8}
        />
      </mesh>
      
      {/* Cups stack */}
      <mesh position={[0.6, 1.55, -0.2]} castShadow>
        <cylinderGeometry args={[0.1, 0.08, 0.3, 12]} />
        <meshStandardMaterial 
          color="#ffffff"
          roughness={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Milk pitcher */}
      <mesh position={[-0.2, 1.3, 0.3]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.2, 12]} />
        <meshStandardMaterial 
          color="#c0c0c0"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Syrup bottles */}
      {[-0.4, -0.25, -0.1].map((x, i) => (
        <mesh key={i} position={[x, 1.45, 0.4]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 0.2, 8]} />
          <meshStandardMaterial 
            color={i === 0 ? '#8B4513' : i === 1 ? '#2F4F4F' : '#800020'}
            roughness={0.4}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
      
      {/* Fridge */}
      <mesh position={[0.9, 0.8, -0.3]} castShadow>
        <boxGeometry args={[0.5, 1.2, 0.5]} />
        <meshStandardMaterial 
          color="#3a3a3a"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Display menu board */}
      <mesh position={[-0.5, 1.8, 0.75]} castShadow>
        <boxGeometry args={[1.2, 0.6, 0.05]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.5}
        />
      </mesh>
      
      {/* Menu text */}
      <Text
        position={[-0.5, 1.85, 0.78]}
        fontSize={0.08}
        color="#22c55e"
        anchorX="center"
        anchorY="middle"
        maxWidth={1}
      >
        ☕ اسپرسو | لاته | کاپوچینو
      </Text>
      
      {/* Label */}
      <Text
        position={[0, 1.55, 0.78]}
        fontSize={0.1}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        باریستا
      </Text>
      
      {/* Ambient glow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.7, 1.7]} />
        <meshBasicMaterial 
          color="#8B4513"
          transparent 
          opacity={0.03} 
          depthWrite={false}
        />
      </mesh>
      
      {/* Point light for ambiance */}
      <pointLight 
        position={[0, 2, 0]} 
        intensity={0.2} 
        color="#d4a574"
        distance={2}
        decay={2}
      />
    </group>
  );
}

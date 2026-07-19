'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export function Door() {
  const lightRef = useRef<THREE.PointLight>(null);
  
  // Subtle pulsing animation for the entrance light
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  return (
    <group position={[6, 0, 6]}>
      {/* Door frame outer */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 2.2, 0.15]} />
        <meshStandardMaterial 
          color="#2a2a2a"
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>
      
      {/* Door frame inner */}
      <mesh position={[0, 1.1, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 2.0, 0.1]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Door panels */}
      <mesh position={[-0.25, 1.1, 0.08]}>
        <boxGeometry args={[0.5, 1.6, 0.02]} />
        <meshStandardMaterial 
          color="#252525"
          roughness={0.5}
          metalness={0.6}
        />
      </mesh>
      <mesh position={[0.25, 1.1, 0.08]}>
        <boxGeometry args={[0.5, 1.6, 0.02]} />
        <meshStandardMaterial 
          color="#252525"
          roughness={0.5}
          metalness={0.6}
        />
      </mesh>
      
      {/* Door handles */}
      <mesh position={[0.15, 1.0, 0.15]} castShadow>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial 
          color="#d4a574"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      <mesh position={[-0.15, 1.0, 0.15]} castShadow>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial 
          color="#d4a574"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Door step/threshold */}
      <mesh position={[0, 0.03, 0.25]} receiveShadow>
        <boxGeometry args={[1.6, 0.06, 0.3]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>
      
      {/* Entrance light */}
      <pointLight 
        ref={lightRef}
        position={[0, 2.5, 0.5]} 
        intensity={0.3} 
        color="#fff5e6"
        distance={3}
        decay={2}
      />
      
      {/* Light fixture above door */}
      <mesh position={[0, 2.6, 0.1]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.15, 16]} />
        <meshStandardMaterial 
          color="#2a2a2a"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Glass panel at top */}
      <mesh position={[0, 1.85, 0.06]}>
        <boxGeometry args={[0.8, 0.4, 0.02]} />
        <meshStandardMaterial 
          color="#1a3a4a"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Sign/Mat area */}
      <mesh position={[0, 0.02, 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.8, 0.6]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.8}
        />
      </mesh>
      
      {/* Welcome mat texture lines */}
      <mesh position={[0, 0.025, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshStandardMaterial 
          color="#252525"
          roughness={0.9}
        />
      </mesh>
      
      {/* Label */}
      <Text
        position={[0, -0.1, 0.6]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color="#555555"
        anchorX="center"
        anchorY="middle"
      >
        ورود
      </Text>
    </group>
  );
}

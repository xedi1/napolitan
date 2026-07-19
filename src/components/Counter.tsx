'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export function Counter() {
  const screenRef = useRef<THREE.Mesh>(null);
  
  // Pulsing animation for the screen
  useFrame((state) => {
    if (screenRef.current) {
      const material = screenRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group position={[-7, 0, -5]}>
      {/* Main counter body */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.0, 0.6]} />
        <meshStandardMaterial 
          color="#2a2a2a"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Counter top surface */}
      <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.04, 0.7]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Display screen */}
      <mesh ref={screenRef} position={[0, 1.2, 0.1]} castShadow>
        <boxGeometry args={[0.8, 0.4, 0.05]} />
        <meshStandardMaterial 
          color="#0a0a0a"
          emissive="#1a3a1a"
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Screen glow */}
      <pointLight 
        position={[0, 1.2, 0.3]} 
        intensity={0.3} 
        color="#22c55e"
        distance={1}
      />
      
      {/* Buttons row */}
      <mesh position={[0, 0.9, 0.2]} castShadow>
        <boxGeometry args={[0.9, 0.08, 0.15]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      
      {/* Individual buttons */}
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.95, 0.2]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} />
          <meshStandardMaterial 
            color={i === 0 ? "#22c55e" : i === 1 ? "#ef4444" : i === 2 ? "#f59e0b" : "#3b82f6"}
            emissive={i === 0 ? "#22c55e" : i === 1 ? "#ef4444" : i === 2 ? "#f59e0b" : "#3b82f6"}
            emissiveIntensity={0.5}
            roughness={0.3}
          />
        </mesh>
      ))}
      
      {/* Cash drawer */}
      <mesh position={[0, 0.25, 0.05]} castShadow>
        <boxGeometry args={[0.9, 0.12, 0.4]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>
      
      {/* Drawer handle */}
      <mesh position={[0, 0.25, 0.26]} castShadow>
        <boxGeometry args={[0.3, 0.02, 0.02]} />
        <meshStandardMaterial 
          color="#4a4a4a"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Receipt printer slot */}
      <mesh position={[0, 0.7, 0.31]} castShadow>
        <boxGeometry args={[0.6, 0.03, 0.02]} />
        <meshStandardMaterial 
          color="#0a0a0a"
          roughness={0.5}
        />
      </mesh>
      
      {/* Label */}
      <Text
        position={[0, 1.55, 0]}
        fontSize={0.12}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        صندوق
      </Text>
      
      {/* Ambient glow underneath */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 0.8]} />
        <meshBasicMaterial 
          color="#22c55e"
          transparent 
          opacity={0.05} 
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export function Kitchen() {
  const hoodLightRef = useRef<THREE.PointLight>(null);
  
  // Flickering hood light
  useFrame((state) => {
    if (hoodLightRef.current) {
      hoodLightRef.current.intensity = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  return (
    <group position={[-4, 0, -4]}>
      {/* Main kitchen counter */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.0, 1.5]} />
        <meshStandardMaterial 
          color="#3a3a3a"
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      
      {/* Stainless steel counter top */}
      <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.04, 1.6]} />
        <meshStandardMaterial 
          color="#c0c0c0"
          roughness={0.1}
          metalness={0.95}
        />
      </mesh>
      
      {/* Stove/Range */}
      <mesh position={[-0.4, 1.2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.3, 0.5]} />
        <meshStandardMaterial 
          color="#2a2a2a"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Burners */}
      {[[-0.55, 0.35], [-0.25, 0.35], [-0.55, -0.05], [-0.25, -0.05]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.37, z]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 0.02, 16]} />
          <meshStandardMaterial 
            color="#1a1a1a"
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
      ))}
      
      {/* Oven */}
      <mesh position={[0.5, 0.7, 0]} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.5]} />
        <meshStandardMaterial 
          color="#2a2a2a"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Oven door */}
      <mesh position={[0.5, 0.7, 0.26]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.02]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Exhaust hood */}
      <mesh position={[-0.4, 1.8, 0]} castShadow>
        <boxGeometry args={[1.0, 0.4, 0.7]} />
        <meshStandardMaterial 
          color="#c0c0c0"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Hood light */}
      <pointLight 
        ref={hoodLightRef}
        position={[-0.4, 1.6, 0]} 
        intensity={0.4} 
        color="#fff5e6"
        distance={2}
        decay={2}
      />
      
      {/* Preparation area */}
      <mesh position={[0.7, 1.15, -0.3]} castShadow>
        <boxGeometry args={[0.5, 0.05, 0.4]} />
        <meshStandardMaterial 
          color="#c0c0c0"
          roughness={0.1}
          metalness={0.95}
        />
      </mesh>
      
      {/* Cutting boards */}
      {[-0.1, 0.15].map((x, i) => (
        <mesh key={i} position={[x, 1.13, -0.25]} castShadow>
          <boxGeometry args={[0.2, 0.02, 0.15]} />
          <meshStandardMaterial 
            color={i === 0 ? '#8B4513' : '#2F4F2F'}
            roughness={0.8}
          />
        </mesh>
      ))}
      
      {/* Knives */}
      {[0, 0.08].map((x, i) => (
        <mesh key={i} position={[x, 1.14, -0.25]} castShadow>
          <boxGeometry args={[0.02, 0.01, 0.12]} />
          <meshStandardMaterial 
            color="#c0c0c0"
            roughness={0.1}
            metalness={0.95}
          />
        </mesh>
      ))}
      
      {/* Pot rack above */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
        <meshStandardMaterial 
          color="#c0c0c0"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Hanging pots */}
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 2.0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.15, 0.2, 12]} />
          <meshStandardMaterial 
            color="#c0c0c0"
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      ))}
      
      {/* Fridge */}
      <mesh position={[-0.9, 0.8, 0.2]} castShadow>
        <boxGeometry args={[0.6, 1.4, 0.6]} />
        <meshStandardMaterial 
          color="#4a4a4a"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Sink */}
      <mesh position={[0.2, 1.05, 0.35]} castShadow>
        <boxGeometry args={[0.3, 0.1, 0.25]} />
        <meshStandardMaterial 
          color="#888888"
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Label */}
      <Text
        position={[0, 1.55, 0.78]}
        fontSize={0.12}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        آشپزخانه
      </Text>
      
      {/* Ambient glow (warm kitchen light) */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.7, 1.7]} />
        <meshBasicMaterial 
          color="#ff6b35"
          transparent 
          opacity={0.03} 
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

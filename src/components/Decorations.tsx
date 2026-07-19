'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Hanging lamp/light fixture
export function HangingLight({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Wire/cord */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Lamp shade */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.15, 0.25, 16, 1, true]} />
        <meshStandardMaterial color="#2a2a2a" side={THREE.DoubleSide} metalness={0.6} />
      </mesh>
      
      {/* Inner glow */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.28, 0.13, 0.2, 16, 1, true]} />
        <meshStandardMaterial color="#fff5e6" emissive="#fff5e6" emissiveIntensity={0.8} transparent opacity={0.9} />
      </mesh>
      
      {/* Light bulb */}
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#fff5e6" emissive="#fff5e6" emissiveIntensity={1} />
      </mesh>
      
      {/* Point light */}
      <pointLight
        ref={lightRef}
        position={[0, -0.2, 0]}
        intensity={0.6}
        color="#fff5e6"
        distance={4}
        decay={2}
      />
    </group>
  );
}

// Wall art frame
export function WallArt({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 0.08]} />
        <meshStandardMaterial color="#5D4037" roughness={0.6} metalness={0.2} />
      </mesh>
      
      {/* Inner frame */}
      <mesh position={[0, 0, 0.05]} castShadow>
        <boxGeometry args={[1.3, 0.8, 0.02]} />
        <meshStandardMaterial color="#3E2723" roughness={0.8} />
      </mesh>
      
      {/* Art content - abstract pattern */}
      <mesh position={[0, 0, 0.07]} castShadow>
        <boxGeometry args={[1.2, 0.7, 0.01]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      
      {/* Decorative circle in center */}
      <mesh position={[0, 0, 0.08]} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshStandardMaterial color="#d4a574" metalness={0.5} />
      </mesh>
    </group>
  );
}

// Decorative plant
export function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.25, 0.6, 16]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      
      {/* Soil */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.05, 16]} />
        <meshStandardMaterial color="#3E2723" roughness={1} />
      </mesh>
      
      {/* Leaves - simple stylized */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#228B22" roughness={0.8} />
      </mesh>
      
      {/* Additional leaf clusters */}
      <mesh position={[0.3, 1.3, 0.2]} castShadow>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial color="#2E8B57" roughness={0.8} />
      </mesh>
      
      <mesh position={[-0.25, 1.25, -0.15]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#3CB371" roughness={0.8} />
      </mesh>
    </group>
  );
}

// VIP Chair for upper floor
export function VIPChair({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Chair base */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.1, 16]} />
        <meshStandardMaterial color="#d4a574" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Chair pole */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Seat cushion */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.2, 0.08, 16]} />
        <meshStandardMaterial color="#8B4513" roughness={0.6} />
      </mesh>
      {/* Chair back */}
      <mesh position={[0, 0.9, -0.15]} castShadow>
        <boxGeometry args={[0.35, 0.45, 0.05]} />
        <meshStandardMaterial color="#3E2723" roughness={0.5} />
      </mesh>
    </group>
  );
}

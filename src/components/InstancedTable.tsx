'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TableInstance {
  id: number;
  position: THREE.Vector3;
  status: string;
  tableNumber: number;
  seats: number;
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

// Create modern marble/ceramic texture
function createMarbleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  
  // Soft warm gray base
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 200);
  gradient.addColorStop(0, '#4a4a4a');
  gradient.addColorStop(0.5, '#3d3d3d');
  gradient.addColorStop(1, '#2d2d2d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Soft marble veins
  for (let i = 0; i < 20; i++) {
    ctx.strokeStyle = `rgba(80, 80, 80, ${Math.random() * 0.15})`;
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.bezierCurveTo(
      Math.random() * canvas.width, Math.random() * canvas.height,
      Math.random() * canvas.width, Math.random() * canvas.height,
      Math.random() * canvas.width, Math.random() * canvas.height
    );
    ctx.stroke();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

const marbleTexture = createMarbleTexture();

// Circle Table - Modern design with soft ambient glow
function InstancedCircleTable({ instances }: { instances: TableInstance[] }) {
  const groupRefs = useRef<Map<number, THREE.Group>>(new Map());
  const glowRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  
  const radius = 0.55;
  
  return (
    <group>
      {instances.map((instance) => {
        const color = STATUS_COLORS[instance.status as keyof typeof STATUS_COLORS] || '#22c55e';
        return (
          <group 
            key={instance.id}
            ref={(el) => { if (el) groupRefs.current.set(instance.id, el); }}
            position={[instance.position.x, 0, instance.position.z]}
          >
            {/* Soft shadow under table */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <circleGeometry args={[radius + 0.15, 32]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.3} depthWrite={false} />
            </mesh>
            
            {/* Table base/legs connector */}
            <mesh position={[0, 0.15, 0]} castShadow>
              <cylinderGeometry args={[radius * 0.7, radius * 0.8, 0.3, 24]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.8} />
            </mesh>
            
            {/* Main table top - rounded cylinder */}
            <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[radius, radius * 0.9, 0.12, 32]} />
              <meshStandardMaterial 
                color="#3a3a3a"
                roughness={0.2}
                metalness={0.3}
              />
            </mesh>
            
            {/* Soft ambient glow ring around table */}
            <mesh 
              ref={(el) => { if (el) glowRefs.current.set(instance.id, el); }}
              position={[0, 0.01, 0]} 
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[radius + 0.05, radius + 0.35, 48]} />
              <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={0.25} 
                depthWrite={false}
              />
            </mesh>
            
            {/* Center status indicator - subtle pulsing dot */}
            <mesh position={[0, 0.42, 0]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial 
                color={color}
                emissive={color}
                emissiveIntensity={0.5}
                roughness={0.3}
              />
            </mesh>

            {/* Chairs around table */}
            <CircleTableChairs tablePosition={instance.position} seatCount={instance.seats} />
          </group>
        );
      })}
    </group>
  );
}

// Rectangle Table - Modern design with soft ambient glow
function InstancedRectangleTable({ instances }: { instances: TableInstance[] }) {
  const width = 1.6;
  const depth = 0.9;
  
  return (
    <group>
      {instances.map((instance) => {
        const color = STATUS_COLORS[instance.status as keyof typeof STATUS_COLORS] || '#22c55e';
        return (
          <group 
            key={instance.id}
            position={[instance.position.x, 0, instance.position.z]}
          >
            {/* Soft shadow under table */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[width + 0.3, depth + 0.3]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.25} depthWrite={false} />
            </mesh>
            
            {/* Table base/legs connector */}
            <mesh position={[0, 0.12, 0]} castShadow>
              <boxGeometry args={[width * 0.8, 0.24, depth * 0.8]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.8} />
            </mesh>
            
            {/* Main table top - rounded box */}
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
              <boxGeometry args={[width, 0.1, depth]} />
              <meshStandardMaterial 
                color="#3a3a3a"
                roughness={0.2}
                metalness={0.3}
              />
            </mesh>
            
            {/* Soft ambient glow around table */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[width + 0.6, depth + 0.6]} />
              <meshBasicMaterial 
                color={color}
                transparent 
                opacity={0.08} 
                depthWrite={false}
              />
            </mesh>
            
            {/* Center status indicator */}
            <mesh position={[0, 0.36, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshStandardMaterial 
                color={color}
                emissive={color}
                emissiveIntensity={0.5}
                roughness={0.3}
              />
            </mesh>

            {/* Chairs around table */}
            <RectangleTableChairs tablePosition={instance.position} seatCount={instance.seats} />
          </group>
        );
      })}
    </group>
  );
}

// Table legs
function TableLegs({ instances, isCircle }: { instances: TableInstance[]; isCircle: boolean }) {
  const legOffset = isCircle ? 0.4 : 0.65;
  const depth = isCircle ? 0 : 0.3;
  
  return (
    <group>
      {instances.map((instance) => {
        const angles = isCircle 
          ? [0, Math.PI / 2, Math.PI, Math.PI * 1.5]
          : [-Math.PI / 4, Math.PI / 4, Math.PI * 0.75, Math.PI * 1.25];
        
        return angles.map((angle, idx) => {
          const x = instance.position.x + Math.sin(angle) * legOffset;
          const z = instance.position.z + Math.cos(angle) * (isCircle ? legOffset : depth);
          
          return (
            <mesh 
              key={`${instance.id}-leg-${idx}`}
              position={[x, 0.1, z]}
              castShadow
            >
              <cylinderGeometry args={[0.03, 0.04, 0.2, 12]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
            </mesh>
          );
        });
      })}
    </group>
  );
}

// Chair component for around tables
function Chair({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Chair seat */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.05, 0.4]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.3} />
      </mesh>
      
      {/* Chair back */}
      <mesh position={[0, 0.6, -0.17]} castShadow>
        <boxGeometry args={[0.4, 0.45, 0.05]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.5} metalness={0.3} />
      </mesh>
      
      {/* Chair legs */}
      <mesh position={[-0.15, 0.17, -0.15]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
      </mesh>
      <mesh position={[0.15, 0.17, -0.15]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
      </mesh>
      <mesh position={[-0.15, 0.17, 0.15]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
      </mesh>
      <mesh position={[0.15, 0.17, 0.15]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
      </mesh>
    </group>
  );
}

// Chairs around circle table
function CircleTableChairs({ tablePosition, seatCount }: { tablePosition: THREE.Vector3; seatCount: number }) {
  const chairDistance = 0.85;
  const chairs = [];
  
  for (let i = 0; i < seatCount; i++) {
    const angle = (i / seatCount) * Math.PI * 2;
    const x = tablePosition.x + Math.sin(angle) * chairDistance;
    const z = tablePosition.z + Math.cos(angle) * chairDistance;
    chairs.push(
      <Chair 
        key={`chair-${tablePosition.x}-${tablePosition.z}-${i}`}
        position={[x, 0, z]}
        rotation={-angle + Math.PI}
      />
    );
  }
  
  return <group>{chairs}</group>;
}

// Chairs around rectangle table
function RectangleTableChairs({ tablePosition, seatCount }: { tablePosition: THREE.Vector3; seatCount: number }) {
  const chairDistanceFront = 0.7;
  const chairDistanceSide = 0.6;
  const chairs = [];
  
  // Distribute seats: 2 on each long side, remaining on short sides
  const seatsPerSide = Math.floor(seatCount / 2);
  const remainingSeats = seatCount % 2;
  
  // Front side seats
  const frontCount = Math.ceil(seatCount / 2);
  for (let i = 0; i < frontCount; i++) {
    const offset = (i - (frontCount - 1) / 2) * 0.6;
    chairs.push(
      <Chair 
        key={`chair-front-${tablePosition.x}-${tablePosition.z}-${i}`}
        position={[tablePosition.x + offset, 0, tablePosition.z + chairDistanceFront]}
        rotation={0}
      />
    );
  }
  
  // Back side seats
  const backCount = Math.floor(seatCount / 2);
  for (let i = 0; i < backCount; i++) {
    const offset = (i - (backCount - 1) / 2) * 0.6;
    chairs.push(
      <Chair 
        key={`chair-back-${tablePosition.x}-${tablePosition.z}-${i}`}
        position={[tablePosition.x + offset, 0, tablePosition.z - chairDistanceFront]}
        rotation={Math.PI}
      />
    );
  }
  
  return <group>{chairs}</group>;
}

// Main exported component
export function InstancedTables({ 
  circleTables, 
  rectangleTables 
}: { 
  circleTables: TableInstance[];
  rectangleTables: TableInstance[];
}) {
  return (
    <group>
      {/* Circle tables */}
      {circleTables.length > 0 && (
        <>
          <InstancedCircleTable instances={circleTables} />
          <TableLegs instances={circleTables} isCircle={true} />
        </>
      )}
      
      {/* Rectangle tables */}
      {rectangleTables.length > 0 && (
        <>
          <InstancedRectangleTable instances={rectangleTables} />
          <TableLegs instances={rectangleTables} isCircle={false} />
        </>
      )}
    </group>
  );
}

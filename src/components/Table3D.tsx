'use client';

import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Table } from '@/types';
import { useOrderStore } from '@/store';

interface Table3DProps {
  table: Table;
  isSelected: boolean;
  onClick: () => void;
  onHover?: (isHovered: boolean) => void;
}

const STATUS_COLORS: Record<string, string> = {
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
  const { orders } = useOrderStore();
  
  const color = STATUS_COLORS[table.status] || '#22c55e';
  const isCircle = table.shape === 'circle';
  const baseRadius = table.seats === 6 ? 0.9 : 0.6;
  
  // Get order for this table
  const tableOrder = orders.find(o => o.tableId === table.id);
  
  // Animation for hover and selection
  useFrame(() => {
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

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

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

      {/* HTML Tooltip */}
      <Html
        position={[0, 1.8, 0]}
        center
        transform
        distanceFactor={8}
        occlude={false}
        style={{
          opacity: isHovered || isSelected ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        <div style={{
          background: 'linear-gradient(145deg, #1a1a1a, #252525)',
          borderRadius: '16px',
          padding: '16px',
          minWidth: '200px',
          border: `2px solid ${color}`,
          boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${color}40`,
          fontFamily: 'Vazirmatn, system-ui, sans-serif',
          textAlign: 'right',
          direction: 'rtl',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            paddingBottom: '8px',
            borderBottom: `1px solid ${color}40`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}`,
              }} />
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                میز {table.id}
              </span>
            </div>
            <span style={{ 
              color: '#fff', 
              fontSize: '10px',
              background: `${color}30`,
              padding: '3px 8px',
              borderRadius: '12px',
            }}>
              {STATUS_LABELS[table.status] || table.status}
            </span>
          </div>
          
          {/* Table Info */}
          <div style={{
            color: '#888',
            fontSize: '11px',
            marginBottom: '8px',
          }}>
            {table.group} • {table.seats} نفر
          </div>
          
          {/* Order Items */}
          {tableOrder && tableOrder.items.length > 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              padding: '10px',
              marginTop: '6px',
            }}>
              <div style={{
                color: '#666',
                fontSize: '10px',
                marginBottom: '6px',
              }}>
                سفارش ({tableOrder.items.length} آیتم)
              </div>
              {tableOrder.items.slice(0, 3).map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 0',
                  fontSize: '11px',
                }}>
                  <span style={{ color: '#ccc' }}>
                    {item.name}
                    {item.quantity > 1 && <span style={{ color: '#666' }}> ×{item.quantity}</span>}
                  </span>
                  <span style={{ color: '#22c55e' }}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              {tableOrder.items.length > 3 && (
                <div style={{ color: '#555', fontSize: '10px', marginTop: '4px', textAlign: 'center' }}>
                  + {tableOrder.items.length - 3} مورد...
                </div>
              )}
              <div style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>جمع:</span>
                <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '14px' }}>
                  {formatPrice(tableOrder.subtotal)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{
              color: '#555',
              fontSize: '11px',
              textAlign: 'center',
              padding: '8px',
            }}>
              بدون سفارش
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

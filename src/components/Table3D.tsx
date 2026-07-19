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

const STATUS_COLORS = {
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
  
  const color = STATUS_COLORS[table.status];
  const isCircle = table.shape === 'circle';
  const baseRadius = table.seats === 6 ? 0.9 : 0.6;
  
  // Get order for this table
  const tableOrder = orders.find(o => o.tableId === table.id);
  
  // Animation for hover and selection
  useFrame((state) => {
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
  const showTooltip = isHovered || isSelected;

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

      {/* HTML Tooltip - always faces camera correctly */}
      {showTooltip && (
        <Html
          position={[0, 2.2, 0]}
          center
          transform
          distanceFactor={10}
          occlude={false}
          style={{
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            opacity: showTooltip ? 1 : 0,
            transform: `scale(${showTooltip ? 1 : 0.8}) translateY(${showTooltip ? 0 : 20}px)`,
            pointerEvents: 'none',
          }}
        >
          <div style={{
            background: 'linear-gradient(145deg, #1a1a1a 0%, #252525 50%, #1a1a1a 100%)',
            borderRadius: '20px',
            padding: '20px',
            minWidth: '220px',
            maxWidth: '280px',
            border: `2px solid ${color}`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${color}30, inset 0 1px 0 rgba(255,255,255,0.05)`,
            fontFamily: 'Vazirmatn, system-ui, sans-serif',
            textAlign: 'right',
            direction: 'rtl',
            backdropFilter: 'blur(10px)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              borderBottom: `2px solid ${color}30`,
              paddingBottom: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}`,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                <span style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
                  میز {table.id}
                </span>
              </div>
              <span style={{ 
                color: '#fff', 
                fontSize: '11px',
                background: `${color}20`,
                padding: '4px 10px',
                borderRadius: '20px',
                border: `1px solid ${color}40`,
              }}>
                {STATUS_LABELS[table.status]}
              </span>
            </div>
            
            {/* Table Info */}
            <div style={{
              color: '#666',
              fontSize: '12px',
              marginBottom: '12px',
              display: 'flex',
              gap: '6px',
            }}>
              <span>{table.group}</span>
              <span style={{ color: '#444' }}>•</span>
              <span>{table.seats} نفر</span>
            </div>
            
            {/* Order Items */}
            {tableOrder && tableOrder.items.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                padding: '12px',
                marginTop: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  color: '#888',
                  fontSize: '11px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>سفارش:</span>
                  <span style={{ color: '#666' }}>{tableOrder.items.length} آیتم</span>
                </div>
                {tableOrder.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 0',
                    borderBottom: idx < tableOrder.items.slice(0, 3).length - 1 ? '1px dashed rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <span style={{ color: '#ccc', fontSize: '12px' }}>
                      {item.name}
                      {item.quantity > 1 && <span style={{ color: '#888' }}> ×{item.quantity}</span>}
                    </span>
                    <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: '500' }}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                {tableOrder.items.length > 3 && (
                  <div style={{ color: '#666', fontSize: '11px', marginTop: '6px', textAlign: 'center' }}>
                    + {tableOrder.items.length - 3} مورد دیگر...
                  </div>
                )}
                <div style={{
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>جمع:</span>
                  <span style={{ color: '#22c55e', fontSize: '16px', fontWeight: 'bold' }}>
                    {formatPrice(tableOrder.subtotal)}
                  </span>
                </div>
              </div>
            )}
            
            {!tableOrder || tableOrder.items.length === 0 ? (
              <div style={{
                color: '#555',
                fontSize: '12px',
                textAlign: 'center',
                padding: '10px',
              }}>
                بدون سفارش
              </div>
            ) : null}
          </div>
          
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; box-shadow: 0 0 12px currentColor; }
              50% { opacity: 0.6; box-shadow: 0 0 20px currentColor; }
            }
          `}</style>
        </Html>
      )}
    </group>
  );
}

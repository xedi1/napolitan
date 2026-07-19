'use client';

import { useRef, useState, useEffect } from 'react';
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
  const baseRadius = table.seats === 6 ? 0.9 : 0.6;
  
  // Get order for this table
  const tableOrder = orders.find(o => o.tableId === table.id);
  
  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  return (
    <group 
      ref={groupRef}
      position={[table.position.x, 0, table.position.y]}
    >
      {/* Invisible interaction mesh - catches click/hover events */}
      <mesh 
        position={[0, 0.5, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          onHover?.(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
          onHover?.(false);
          document.body.style.cursor = 'default';
        }}
      >
        <cylinderGeometry args={[baseRadius + 0.8, baseRadius + 0.8, 1, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* HTML Tooltip - shows on hover */}
      {(isHovered || isSelected) && (
        <Html
          position={[0, 2.0, 0]}
          center
          transform
          distanceFactor={10}
          occlude={false}
          style={{
            pointerEvents: 'none',
          }}
        >
          <div style={{
            background: 'linear-gradient(160deg, #1a1a1a 0%, #252525 100%)',
            borderRadius: '18px',
            padding: '18px 22px',
            minWidth: '180px',
            border: `2px solid ${color}`,
            boxShadow: `0 15px 50px rgba(0,0,0,0.6), 0 0 30px ${color}30`,
            fontFamily: 'Vazirmatn, system-ui, sans-serif',
            textAlign: 'right',
            direction: 'rtl',
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <style>{`
              @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '10px',
              borderBottom: `1px solid ${color}35`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}`,
                }} />
                <span style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
                  میز {table.id}
                </span>
              </div>
              <span style={{ 
                color: '#fff', 
                fontSize: '10px',
                background: `${color}25`,
                padding: '4px 10px',
                borderRadius: '15px',
                border: `1px solid ${color}50`,
              }}>
                {STATUS_LABELS[table.status] || table.status}
              </span>
            </div>
            
            {/* Table Info */}
            <div style={{
              color: '#777',
              fontSize: '12px',
              marginBottom: '10px',
            }}>
              {table.group} • {table.seats} نفر
            </div>
            
            {/* Order Section */}
            {tableOrder && tableOrder.items.length > 0 ? (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  color: '#888',
                  fontSize: '11px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>سفارش</span>
                  <span style={{ color: '#666' }}>{tableOrder.items.length} آیتم</span>
                </div>
                {tableOrder.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    fontSize: '12px',
                    borderBottom: idx < Math.min(tableOrder.items.length, 3) - 1 ? '1px dashed rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <span style={{ color: '#bbb' }}>
                      {item.name}
                      {item.quantity > 1 && <span style={{ color: '#666', marginRight: '4px' }}>×{item.quantity}</span>}
                    </span>
                    <span style={{ color: '#22c55e', fontWeight: '500' }}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                {tableOrder.items.length > 3 && (
                  <div style={{ color: '#555', fontSize: '10px', marginTop: '6px', textAlign: 'center' }}>
                    + {tableOrder.items.length - 3} مورد دیگر
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
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>جمع کل</span>
                  <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '16px' }}>
                    {formatPrice(tableOrder.subtotal)}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{
                color: '#555',
                fontSize: '12px',
                textAlign: 'center',
                padding: '10px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '10px',
              }}>
                بدون سفارش
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

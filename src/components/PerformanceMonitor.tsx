'use client';

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  fpsHistory: number[];
  memory: number | null;
  paintTime: number;
  bundleSize: number;
}

interface FPSMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showInUI?: boolean;
}

export function PerformanceMonitor({ onMetricsUpdate, showInUI = false }: FPSMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    fpsHistory: [],
    memory: null,
    paintTime: 0,
    bundleSize: 0,
  });
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameRef = useRef<number>(performance.now());

  useEffect(() => {
    let animationId: number;
    const fpsHistory: number[] = [];

    const measureFPS = () => {
      const now = performance.now();
      const delta = now - lastFrameRef.current;
      lastFrameRef.current = now;

      // Calculate FPS
      const fps = Math.round(1000 / delta);
      frameTimesRef.current.push(fps);

      // Keep last 60 frames
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      // Calculate average FPS every 10 frames
      if (frameTimesRef.current.length % 10 === 0) {
        const avgFps = Math.round(
          frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
        );

        const newMetrics: PerformanceMetrics = {
          fps: avgFps,
          fpsHistory: [...fpsHistory, avgFps].slice(-30),
          memory: (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize 
            ? Math.round((performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / 1024 / 1024) 
            : null,
          paintTime: Math.round(delta * 100) / 100,
          bundleSize: 0, // Set by bundle analyzer
        };

        setMetrics(newMetrics);
        onMetricsUpdate?.(newMetrics);
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [onMetricsUpdate]);

  if (!showInUI) {
    return null;
  }

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 rounded-lg p-3 text-xs font-mono z-50">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">FPS:</span>
          <span className={getFPSColor(metrics.fps)}>{metrics.fps}</span>
        </div>
        {metrics.memory !== null && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">RAM:</span>
            <span className="text-blue-400">{metrics.memory}MB</span>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Frame:</span>
          <span className="text-purple-400">{metrics.paintTime}ms</span>
        </div>
        
        {/* FPS Graph */}
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="h-8 flex items-end gap-0.5">
            {metrics.fpsHistory.map((fps, i) => (
              <div
                key={i}
                className={`w-1 ${
                  fps >= 55 ? 'bg-green-500' : fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ height: `${Math.min(fps / 60 * 100, 100)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Performance Budget thresholds
export const PERFORMANCE_BUDGET = {
  firstContentfulPaint: 1000, // ms
  targetFPS: 60,
  minFPSMobile: 30,
  bundleSizeKB: 200, // KB (gzip)
  lighthouseScore: 90,
};

// Check if performance meets budget
export function checkPerformanceBudget(metrics: PerformanceMetrics): {
  passed: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (metrics.fps < PERFORMANCE_BUDGET.minFPSMobile) {
    issues.push(`FPS below minimum: ${metrics.fps} < ${PERFORMANCE_BUDGET.minFPSMobile}`);
  }

  if (metrics.paintTime > 16.67) {
    issues.push(`Frame time above target: ${metrics.paintTime}ms > 16.67ms`);
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

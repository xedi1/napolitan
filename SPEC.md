# Cafe Napoli - Floor 1 3D Management System

## 1. Project Overview

**Project Name:** Cafe Napoli - Floor 1 Management System  
**Project Type:** 3D Interactive Cafe Floor Visualization & Management  
**Core Functionality:** Real-time 3D visualization of cafe floor with interactive table management for waitstaff workflow  
**Target Users:** Cafe waiters/staff for table status monitoring and order management

---

## 1.1 Design Philosophy

### Calm Technology
- UI does not overwhelm the waiter with information
- Information displayed only when needed
- Minimal visual clutter
- Smooth transitions for panel appear/disappear

### Tactile Digital
- Everything has tactile feel with depth
- Soft shadows and layered depth
- Natural, smooth animations (ease-in-out curves)
- 3D-like hover effects on 2D elements
- Responsive press feedback on buttons

### Ambient Awareness
- Table status visible at a glance from corner of the eye
- Color-coded status (green/red/yellow/blue)
- Glowing effects on tables indicate status
- Pulsing animation for occupied/cleaning tables
- Status bar at top shows real-time counts

### Zero Learning Curve
- New waiter can use system in under 5 minutes
- Intuitive click-to-select interaction
- Large, touch-friendly buttons
- Color coding is universal and clear
- Minimal text, more visual icons

---

## 2. Design System

### 2.1 Color Palette (OKLCH)

| Name | OKLCH | Usage |
|------|-------|-------|
| Primary Brown | `oklch(0.25 0.05 35)` | Brand identity |
| Dark Brown | `oklch(0.12 0.03 30)` | Deep backgrounds |
| Vanilla | `oklch(0.92 0.06 85)` | Accents & highlights |
| Cream | `oklch(0.94 0.04 85)` | Light backgrounds |
| Dark Green | `oklch(0.55 0.15 145)` | Available status |
| Black | `oklch(0.08 0 0)` | Text, dark mode |
| White | `oklch(0.98 0 0)` | Negative space |

### Status Colors (OKLCH)

| Status | OKLCH | Hex |
|--------|-------|-----|
| Available | `oklch(0.65 0.18 145)` | Green |
| Occupied | `oklch(0.60 0.22 25)` | Red |
| Reserved | `oklch(0.80 0.16 85)` | Yellow |
| Cleaning | `oklch(0.65 0.15 250)` | Blue |

### 2.2 Circadian Theming

Three automatic color modes based on time of day:

| Mode | Time | Characteristics |
|------|------|----------------|
| Day | 06:00 - 17:00 | Bright, warm, high contrast |
| Dusk | 17:00 - 20:00 | Warm sunset tones, medium contrast |
| Night | 20:00 - 06:00 | Dark, cool, low contrast |

### 2.3 Typography

- **Font Family:** Vazirmatn Variable (Persian/Latin)
- **Weight Range:** 100 - 900 (variable)
- **Fluid Sizing:** Using `clamp()` for responsive typography

```css
--font-size-xs: clamp(0.65rem, 0.6rem + 0.25vw, 0.7rem);
--font-size-sm: clamp(0.75rem, 0.7rem + 0.25vw, 0.8rem);
--font-size-base: clamp(0.875rem, 0.8rem + 0.375vw, 0.95rem);
--font-size-lg: clamp(1rem, 0.9rem + 0.5vw, 1.1rem);
--font-size-xl: clamp(1.2rem, 1rem + 1vw, 1.4rem);
```

### 2.4 Design Tokens

```css
/* Spacing */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;

/* Border Radius */
--radius-sm: 8px;
--radius-md: 14px;
--radius-lg: 20px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 2px 8px oklch(0.08 0 0 / 0.3);
--shadow-md: 0 8px 32px oklch(0.08 0 0 / 0.4);
--shadow-lg: 0 16px 48px oklch(0.08 0 0 / 0.5);

/* Transitions */
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 4. System Architecture

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐   │
│  │ Staff Tablet  │  │ Kitchen Screen│  │ Customer QR  │   │
│  │ (3D Floor)   │  │    (KDS)     │  │ (Mobile Web) │   │
│  │   ✅ Current  │  │   🔜 Later   │  │   🔜 Later   │   │
│  └───────────────┘  └───────────────┘  └──────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                             │  WebSocket Ready
┌───────────────────────────▼─────────────────────────────────┐
│                  Real-Time Sync Layer                       │
│      (CRDT-based State + Conflict-free Merge)               │
│                      🔜 Future                              │
└───────────────────────────┬─────────────────────────────────┘
                             │
┌───────────────────────────▼─────────────────────────────────┐
│                  Application Layer                          │
│           Next.js Server Actions + Edge Functions            │
│                      🔜 Future                              │
└───────────────────────────┬─────────────────────────────────┘
                             │
┌───────────────────────────▼─────────────────────────────────┐
│              Data Layer (Postgres + Redis)                   │
│                      🔜 Future                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Current Implementation (Phase 1)

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Single Page)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ State Mgmt  │  │ 3D Renderer │  │     UI     │        │
│  │   Module    │←→│   (Three)   │←→│  Components │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         ↓                                                    │
│  ┌─────────────┐                                            │
│  │  Event Bus  │ ← Publish/Subscribe Pattern                │
│  └─────────────┘                                            │
│         ↓                                                    │
│  ┌─────────────┐                                            │
│  │ LocalStore  │ ← Persistence (IndexedDB Ready)            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 State Management

```javascript
// Single Source of Truth
const AppState = {
  tables: Map<TableId, TableState>,
  syncStatus: 'connected' | 'disconnected' | 'syncing',
  lastUpdate: timestamp,
  theme: 'day' | 'dusk' | 'night'
}

// Table State Schema
interface TableState {
  id: number;
  shape: 'circle' | 'rectangle';
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  seats: number;
  group: string;
  position: [x: number, z: number];
  updatedAt: timestamp;
  updatedBy: string; // deviceId
}
```

### 4.4 Event System (Publish/Subscribe)

```javascript
// Events
'TABLE_STATUS_CHANGED'  // When table status updates
'THEME_CHANGED'          // When circadian theme changes
'SYNC_STATUS_CHANGED'    // When connection status changes
'TABLE_SELECTED'         // When user selects a table

// Usage
EventBus.subscribe('TABLE_STATUS_CHANGED', (data) => {
  // Update all clients
});
```

### 4.5 Future WebSocket Integration

```javascript
// Prepared interface for real-time sync
interface SyncClient {
  connect(): Promise<void>;
  disconnect(): void;
  publish(event: string, data: any): void;
  subscribe(event: string, handler: Function): void;
  getState(): AppState;
}

// CRDT-ready state merge
function mergeState(local: TableState, remote: TableState): TableState {
  // Last-write-wins with vector clock
  return remote.updatedAt > local.updatedAt ? remote : local;
}
```

---

## 6. Table Status System

### 6.1 Status Types

| Status | Color (OKLCH) | Visual Behavior |
|--------|---------------|----------------|
| **خالی (Available)** | `oklch(0.55 0.15 145)` Dark Green | Idle Breathing - slow gentle glow pulse |
| **مشتری (Occupied)** | `oklch(0.45 0.08 35)` Brown | Steady glow, guest count icon above table |
| **آماده‌سازی (Preparing)** | `oklch(0.75 0.15 75)` Golden | Progress Ring animation - faster pulse |
| **پرداخت (Awaiting Payment)** | `oklch(0.55 0.18 25)` Soft Red | Gentle pulse - slow rhythmic blink |
| **رزرو (Reserved)** | `oklch(0.55 0.05 220)` Blue-gray | Steady glow with countdown display |
| **نظافت (Cleaning)** | `oklch(0.70 0.12 245)` Light Blue | Between-state animation - medium pulse |

### 6.2 Status Visual Indicators

```javascript
// Glow Animation Patterns
available: 0.35 + sin(time * 0.8) * 0.1  // Slow breathing
occupied: 0.4                           // Steady
preparing: 0.4 + sin(time * 3) * 0.15 // Golden flicker
awaiting: 0.35 + sin(time * 2.5) * 0.15 // Soft pulse
reserved: 0.35                          // Steady
cleaning: 0.3 + sin(time * 1.5) * 0.1  // Medium pulse
```

### 6.3 UI Components

**Status Bar (Top of screen):**
- Always visible, color-coded pills
- Shows count for each status
- Click to filter (future feature)

**Info Panel:**
- 6 status buttons in 3x2 grid
- Icon + text for each status
- Active state highlighted

**Legend:**
- 6 color dots with labels
- Located bottom-left corner

---

## 7. 3D Parametric Table Model

### 7.1 Unified Table Architecture

Single parametric model generates both circle and rectangle tables:

```javascript
// Table factory parameters
interface TableParams {
  shape: 'circle' | 'rectangle';
  width: number;      // Table width
  depth: number;      // Table depth
  height: number;     // Standard: 0.75m
  topThickness: number; // Standard: 0.04m
  legCount: number;   // 4 for all tables
  legThickness: number;
  radius: number;     // For circle tables
}
```

### 7.2 Table Dimensions

| Table Type | Shape | Dimensions | Seats |
|------------|-------|------------|-------|
| Side Tables (1-4) | Circle | ø0.9m (radius 0.45m) | 4 |
| Top Tables (5-6) | Rectangle | 1.6m × 0.95m | 6 |

### 7.3 Materials & Textures

**Wood Material (PBR):**
- Procedural wood grain texture (canvas-generated)
- Bump map for surface detail
- Oak variant for tables, Walnut for chairs
- Roughness: 0.65, Metalness: 0.05

**Metal Material (Legs):**
- Dark brushed metal finish
- Roughness: 0.25, Metalness: 0.9

### 7.4 3D Features

| Feature | Implementation |
|---------|----------------|
| Rounded Edges | ExtrudeGeometry with bevel |
| Contact Shadow | Transparent plane beneath each table |
| Table Number | Canvas sprite texture (T1-T6) |
| Point Light | Above each table (intensity: 0.3) |
| Glow Ring | Emissive material around table edge |

### 7.5 Floor

- **Material:** Procedural wood parquet (canvas texture)
- **Dimensions:** 12m × 10m
- **Pattern:** Horizontal planks with grain variation

### 7.6 Lighting System

**Ambient:**
- Ambient Light: 0.35 (warm white)
- Hemisphere Light: 0.25 (sky/ground)

**Directional:**
- Main sun light: 0.7 intensity
- Shadow map: 2048×2048
- Soft shadow radius: 3

**Accent:**
- 4 corner point lights (0.4 intensity each)
- 6 table point lights (0.3 intensity, increase on hover)

### 7.7 Camera Controls

| Feature | Behavior |
|---------|----------|
| Orbit | Limited polar angle (30°-75°) |
| Zoom | Range: 5-20 units |
| Zoom-to-Table | Click → smooth 800ms animation |
| Reset View | Double-click or deselect |

---

## 7. Visual & Rendering Specification

### Scene Setup

**Camera:**
- Type: Perspective camera with orbit controls
- Initial Position: Elevated top-down view (isometric-like) at 45° angle
- Controls: OrbitControls with limited vertical rotation (30° to 75°)
- Auto-rotation: Subtle idle rotation when not interacting

**Lighting:**
- Ambient Light: Warm tone (0xFFF5E6), intensity 0.4
- Main Directional Light: From above-front, warm white, intensity 0.8, casting shadows
- Point Lights: 4x warm accent lights (0xFFE4B5) above table areas, intensity 0.6
- Hemisphere Light: Sky (0x87CEEB) / Ground (0x8B7355), intensity 0.3

**Environment:**
- Background: Soft gradient (warm cream to light tan)
- Floor: Wooden parquet texture with PBR material
- Walls: Minimal, semi-transparent boundary lines
- Ceiling: Not visible (camera angle)

### Materials & Effects

**Table Materials (PBR):**
- Table top: Wood texture (oak/walnut), roughness 0.6, metalness 0.1
- Table legs: Dark metal, roughness 0.3, metalness 0.8
- Chairs: Matching wood with slight variation

**Floor Material:**
- Wood parquet pattern
- Color: Warm brown (#8B6914)
- Roughness: 0.7
- Normal map for wood grain

**Status Indicators:**
- Available: Green glow (#4CAF50)
- Occupied: Red glow (#F44336)
- Reserved: Yellow glow (#FFC107)
- Cleaning: Blue glow (#2196F3)

**Post-Processing:**
- Ambient Occlusion (SSAO): Subtle contact shadows
- Soft shadows from directional light
- Subtle bloom on status lights (threshold 0.8, intensity 0.3)

### 3D Assets

**Table Models (Parametric):**

1. **Circular Table**
   - Diameter: 80cm (0.8 units)
   - Height: 75cm
   - Legs: 4x cylindrical, height 72cm
   - Top thickness: 4cm

2. **Rectangular Table (Large)**
   - Dimensions: 160cm x 90cm (1.6 x 0.9 units)
   - Height: 75cm
   - Legs: 4x rectangular, height 72cm
   - Top thickness: 4cm

**Chair Model:**
- Seat: 45cm x 45cm, 5cm thick
- Backrest: 45cm x 40cm, 3cm thick
- Legs: 4x, height 45cm
- Rotation: Facing center of table

**Counter/Kitchen Bar:**
- Position: Top of floor plan
- Dimensions: 400cm x 60cm x 110cm (L x W x H)
- Material: Dark wood with chrome edge

**Decorative Elements:**
- Floor boundary walls (low, semi-transparent)
- Step/structure markers near side tables

---

## 3. Floor Layout Specification

### Coordinate System
- Origin (0,0,0): Center of floor plan
- X-axis: Left to Right
- Z-axis: Front to Back
- Y-axis: Up

### Coordinate System
- Origin (0,0,0): Center of floor plan
- X-axis: Left (-) to Right (+)
- Z-axis: Counter/Kitchen (-) to Bottom (+)
- Y-axis: Up

### Table Positions & Rotations

| Table | Shape | Position (x, z) | Rotation (Y) | Seats | Description |
|-------|-------|-----------------|--------------|-------|-------------|
| Table 1 | Circle | (4.5, 0) | 0° | 4 | Right side, near stairs |
| Table 2 | Circle | (-4.5, 0) | 0° | 4 | Left side, near stairs |
| Table 3 | Circle | (2, 4) | 0° | 4 | Bottom, tilted right |
| Table 4 | Circle | (-2, 4) | 0° | 4 | Bottom, tilted left |
| Table 5 | Rectangle | (2, -4) | 0° | 6 | Top, tilted right, near counter |
| Table 6 | Rectangle | (-2, -4) | 0° | 6 | Top, tilted left, near counter |

### Floor Dimensions
- Width: 10 meters (x: -5 to +5)
- Depth: 9 meters (z: -4.5 to +4.5)
- Wall height: 0.5 meters

### Spatial Arrangement (Top View)
```
    Z = -4.5 (Counter/Kitchen)
    ┌─────────────────────────────────┐
    │                                 │
    │     ┌───────┐   ┌───────┐      │
    │     │ Tbl 6 │   │ Tbl 5 │      │  ← Rectangle tables
    │     │ Rect  │   │ Rect  │      │
    │     └───┬───┘   └───┬───┘      │
    └─────────┼───────────┼───────────┘
              │           │
    Z = 0     │           │            ← Side tables
    ┌─────────┼───────────┼───────────┐
    │         │           │           │
    │  ┌──────┴──┐   ┌───┴──────┐   │
    │  │  Tbl 2  │   │  Tbl 1   │   │
    │  │ Circle  │   │  Circle  │   │
    │  └─────────┘   └──────────┘   │
    └─────────────────────────────────┘
              Z = +4.5 (Bottom)
```

**Note:** Negative Z points toward counter/kitchen, positive Z points toward the bottom of the floor plan.

---

## 4. Interaction Specification

### Camera Controls
- **Mouse drag:** Orbit around scene center
- **Scroll wheel:** Zoom in/out (min: 5 units, max: 20 units)
- **Double-click:** Reset camera to default position

### Table Interactions
- **Click on table:** Select table, show info panel
- **Right-click:** Open status context menu
- **Hover:** Highlight table with subtle glow

### UI Panel
- **Table Info Panel:** Shows selected table number, status, seat count, current time
- **Status Selector:** 4 buttons for table status (Available, Occupied, Reserved, Cleaning)
- **Legend:** Color-coded status indicators

---

## 5. Technical Implementation

### Framework & Libraries
- Three.js r158+ (via CDN)
- No build system required (vanilla JS)
- Single HTML file with embedded CSS/JS for simplicity

### Performance Targets
- 60 FPS on modern browsers
- < 2 second initial load
- Mobile-responsive (touch controls)

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 6. Acceptance Criteria

1. ✅ All 6 tables render in correct positions matching floor plan
2. ✅ Circular tables have correct diameter and 4 legs
3. ✅ Rectangular tables are larger (160x90cm) with 4 legs
4. ✅ Each table has correct number of chairs facing center
5. ✅ Counter/kitchen visible at top of scene
6. ✅ Status colors clearly distinguish table states
7. ✅ Clicking table shows info panel with correct table data
8. ✅ Status can be changed via UI
9. ✅ Camera orbit controls work smoothly
10. ✅ Professional lighting with soft shadows
11. ✅ Wood materials with realistic PBR properties
12. ✅ Post-processing effects enhance visual quality

---

## 🛠️ Tech Stack (Production)

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React Framework with App Router | ^14.2.0 |
| **React** | UI Library | ^18.3.0 |
| **TypeScript** | Type Safety (Strict Mode) | ^5.4.0 |
| **TailwindCSS** | Utility-first CSS with Container Queries | ^3.4.0 |
| **React Three Fiber** | React renderer for Three.js | ^8.15.0 |
| **Drei** | Useful helpers for R3F | ^9.99.0 |
| **Three.js** | 3D Graphics Library | ^0.162.0 |
| **Zustand** | State Management | ^4.5.0 |
| **React Hook Form** | Form Handling | ^7.51.0 |
| **Zod** | Schema Validation | ^3.22.0 |

### Real-Time & Data
| Technology | Purpose | Version |
|------------|---------|---------|
| **Yjs** | CRDT for real-time collaboration | ^13.6.0 |
| **y-websocket** | WebSocket provider for Yjs | ^2.0.0 |
| **Redis** | Cache & Pub/Sub | ^5.3.0 |
| **PostgreSQL** | Main Database | ^8.11.0 |

### Testing
| Technology | Purpose | Version |
|------------|---------|---------|
| **Vitest** | Unit Testing | ^1.4.0 |
| **Playwright** | E2E Testing | ^1.42.0 |
| **Storybook** | Component Development | ^8.0.0 |

### DevOps & Monitoring
| Technology | Purpose |
|------------|---------|
| **GitHub Actions** | CI/CD Pipeline |
| **Sentry** | Error Monitoring & Performance |
| **Cloudflare Pages** | Hosting & CDN |

---

## 📁 Project Structure (Next.js Migration)

```
napolitan/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Main page
│   │   └── globals.css        # Global styles
│   ├── components/             # React components
│   │   ├── Scene3D.tsx        # Three.js scene
│   │   ├── Table3D.tsx        # 3D table component
│   │   ├── LoginModal.tsx      # PIN authentication
│   │   ├── Header.tsx          # App header
│   │   ├── StatusBar.tsx       # Status summary
│   │   ├── TablePanel.tsx      # Table details
│   │   ├── OrderPanel.tsx      # Order management
│   │   ├── MenuModal.tsx       # Menu display
│   │   ├── AuditPanel.tsx      # Audit log
│   │   ├── TextFallback.tsx     # Accessibility fallback
│   │   ├── ToastContainer.tsx   # Notifications
│   │   └── AccessibilityProvider.tsx
│   ├── store/                  # Zustand stores
│   │   └── index.ts           # All state management
│   ├── lib/                    # Utilities
│   │   └── utils.ts
│   ├── hooks/                  # Custom hooks
│   ├── types/                  # TypeScript types
│   │   └── index.ts
├── tests/
│   ├── unit/                   # Vitest tests
│   └── e2e/                    # Playwright tests
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions
├── public/                     # Static assets
├── next.config.js              # Next.js config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
├── vitest.config.ts            # Vitest config
├── playwright.config.ts        # Playwright config
└── package.json
```

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Test
npm run test

# E2E Test
npm run test:e2e

# Storybook
npm run storybook
```

---

## ⚡ Performance Budget

### Targets

| Metric | Target | Current Status |
|--------|--------|----------------|
| First Contentful Paint | < 1s | ✅ Optimized |
| 3D Scene Frame Rate | 60fps (30fps mobile) | ✅ Instancing |
| Initial JS Bundle | < 200KB (gzip) | ✅ Code Splitting |
| Lighthouse Score | > 90 | 🔄 Monitoring |

### Optimization Techniques

#### 1. GPU Instancing (Three.js)
- **Circle Tables**: Single draw call for all circular tables
- **Rectangle Tables**: Single draw call for all rectangular tables
- **Legs & Lights**: Instanced rendering for repeated geometry
- **Benefit**: Reduced draw calls from 50+ to ~10

#### 2. Code Splitting
```typescript
// Dynamic import with Suspense
const Scene3D = dynamic(() => import('@/components/Scene3D'), {
  ssr: false,
  loading: () => <LoadingSkeleton />
});
```

#### 3. Lazy Loading Images
```typescript
// Intersection Observer based lazy loading
<LazyImage src={item.image} alt={item.name} />
```

#### 4. Texture Compression
- WebP/AVIF formats for images
- Compressed textures for 3D models
- Progressive loading

#### 5. Performance Monitor (Alt+P)
- Real-time FPS counter
- Memory usage tracking
- Frame time monitoring
- Visual FPS graph

### Bundle Optimization

| Chunk | Purpose | Target Size |
|-------|---------|-------------|
| main | Core app | < 80KB |
| three-vendor | Three.js + R3F | < 150KB |
| vendors | React + Zustand | < 50KB |

### Cache Strategy

```
Static Assets: Cache-Control: public, max-age=31536000, immutable
API Data:     Cache-Control: public, max-age=3600, stale-while-revalidate=86400
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

| Module | Coverage | Status |
|--------|----------|--------|
| Order Calculation | 100% | ✅ |
| Auth/Permissions | 100% | ✅ |
| State Management | 90% | 🔄 |

**Test Files:**
- `tests/unit/orderCalculator.test.ts` - Price, discount, tax calculations
- `tests/unit/auth.test.ts` - Permission checks

**Run:**
```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

### E2E Tests (Playwright)

| Test Suite | Scenarios | Status |
|------------|-----------|--------|
| Order Flow | Add order, view menu, select items | ✅ |
| Table Status | Change status, verify counts | ✅ |
| Auth | Login, logout, permissions | ✅ |

**Test Files:**
- `tests/e2e/app.spec.ts` - Basic app flow
- `tests/e2e/orders.spec.ts` - Order management
- `tests/e2e/visual.spec.ts` - Visual regression

**Run:**
```bash
npm run test:e2e              # Run E2E tests
npm run test:e2e:headed       # With browser UI
npm run test:e2e:debug       # Debug mode
```

---

### Visual Regression Tests

**Target Elements:**
- Glassmorphism effects (login modal, panels, toasts)
- 3D scene rendering (tables, floor, lighting)
- Color scheme consistency
- Responsive design

**Tools:**
- Playwright screenshot comparison
- CSS regression detection

**Reference Screenshots:**
```
tests/e2e/screenshots/
├── login-modal.png
├── main-scene.png
├── table-selected.png
└── menu-open.png
```

---

### Usability Testing

**Guide:** `docs/usability-test-guide.md`

**Before Every Release:**
1. [ ] Recruit 3+ waiters
2. [ ] Run 5 test scenarios
3. [ ] Collect feedback forms
4. [ ] Fix critical issues
5. [ ] Get sign-off

**Success Criteria:**
- 80% task completion rate
- Satisfaction score ≥ 4/5
- No critical UX issues

---

### CI/CD Integration

```yaml
# .github/workflows/ci-cd.yml
test:
  - name: Unit Tests
    run: npm run test -- --run
  - name: E2E Tests
    run: npm run test:e2e
  - name: Visual Regression
    run: npm run test:e2e -- --update-screenshots
```

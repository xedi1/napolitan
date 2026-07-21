# ☕ Cafe Napolitan - Restaurant Management System v2.0

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![React](https://img.shields.io/badge/React-19.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**سیستم مدیریت هوشمند کافه ناپلitan - مدرن، سریع و امن**

[English](./README.en.md) | [فارسی](./README.md)

</div>

---

## ✨ ویژگی‌های جدید v2.0

- 🔐 **امنیت پیشرفته** - JWT با refresh tokens، rate limiting، CSP
- 🎨 **طراحی مدرن** - Tailwind CSS 4، Glassmorphism، Dark Mode
- ⚡ **عملکرد بهتر** - Next.js 15، React Server Components
- 📊 **مدیریت بهتر** - TanStack Query برای داده‌های server-side
- 🎯 **UX بهبود یافته** - Sonner برای notifications، animations روان

---

## 🏗️ معماری سیستم

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐   │
│  │ Staff Tablet  │  │ Kitchen Screen│  │ Manager     │   │
│  │ (2D/3D View) │  │    (KDS)     │  │ Dashboard   │   │
│  └───────────────┘  └───────────────┘  └──────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS + JWT
┌───────────────────────────▼─────────────────────────────────┐
│                    API Layer (Next.js)                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
│  │ /auth/* │  │ /tables │  │ /orders │  │ /menu      │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Database Layer (Supabase PostgreSQL)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐   │
│  │app_users │  │orders   │  │menu_items│  │audit_log │   │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 شروع سریع

### پیش‌نیازها

- Node.js 20+
- npm یا pnpm
- حساب Supabase (رایگان)

### نصب

```bash
# کلون کردن پروژه
git clone https://github.com/xedi1/napolitan.git
cd napolitan

# نصب وابستگی‌ها
npm install

# کپی فایل محیطی
cp .env.example .env.local

# ویرایش .env.local با مقادیر واقعی
# NEXT_PUBLIC_SUPABASE_URL=your-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
# JWT_SECRET=your-secret-key

# اجرا در حالت توسعه
npm run dev
```

### اجرا با Docker

```bash
docker-compose up -d
```

---

## 🔐 امنیت

### implemented Security Measures

| ویژگی | توضیحات |
|-------|---------|
| **JWT Authentication** | Access tokens + Refresh tokens |
| **Password Hashing** | bcrypt با salt منحصربفرد |
| **Rate Limiting** | محدودیت درخواست‌های API |
| **CSP Headers** | Content Security Policy |
| **CSRF Protection** | Protection در فرم‌ها |
| **Input Validation** | Zod schemas |
| **SQL Injection** | Parameterized queries |
| **XSS Protection** | Sanitization |

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
JWT_SECRET=your-very-long-secret-key-min-32-chars
```

---

## 📁 ساختار پروژه

```
napolitan/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/           # Authentication
│   │   │   ├── tables/         # Table management
│   │   │   ├── orders/         # Order management
│   │   │   └── menu/           # Menu management
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Main page
│   │   └── globals.css        # Global styles
│   │
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   ├── layout/            # Layout components
│   │   ├── panels/            # Panel components
│   │   ├── 3d/                # 3D components
│   │   └── ui/                # UI primitives
│   │
│   ├── store/                 # Zustand stores
│   ├── lib/                   # Utilities
│   │   ├── auth/              # Auth utilities
│   │   ├── db/                # Database schemas
│   │   └── supabase/          # Supabase client
│   │
│   ├── types/                 # TypeScript types
│   ├── hooks/                 # Custom hooks
│   └── middleware.ts          # Security middleware
│
├── public/                    # Static assets
├── supabase/                  # Database migrations
└── tests/                     # Tests
```

---

## 🎨 Default Users

| Username | Password | Role | Name |
|----------|----------|------|------|
| manager | manager123 | مدیریت | Manager |
| kitchen | kitchen123 | آشپزخانه | Kitchen |
| waiter | waiter123 | گارسون | Waiter |

⚠️ **IMPORTANT:** حتماً پسوردها را در production تغییر دهید!

---

## 📝 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with username/password |
| POST | `/api/auth/logout` | Logout and invalidate token |
| GET | `/api/auth/me` | Get current user info |

### Tables

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tables` | Get all tables |
| POST | `/api/tables` | Create new table (manager) |
| PATCH | `/api/tables/[id]` | Update table |
| DELETE | `/api/tables/[id]` | Delete table (manager) |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| POST | `/api/orders` | Create new order |
| PATCH | `/api/orders/[id]` | Update order |
| POST | `/api/orders/[id]/pay` | Complete payment |

---

## 🧪 Testing

```bash
# Unit Tests
npm run test

# E2E Tests
npm run test:e2e

# Type Check
npm run typecheck
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```bash
docker build -t napolitan .
docker run -p 3000:3000 napolitan
```

### Manual

```bash
npm run build
npm start
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">

Made with ❤️ for Cafe Napolitan

</div>

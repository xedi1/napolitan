'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  useSalesAnalytics, useTopSellingItems, useHourlyAnalytics,
  useDailyAnalytics, useTableAnalytics, useCategoryAnalytics,
  formatCurrency, formatNumber, formatDuration, formatPersianDate
} from '@/lib/analyticsProvider';

type TimeRange = 'today' | 'week' | 'month' | 'all';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'hours' | 'tables'>('overview');

  const sales = useSalesAnalytics(timeRange);
  const topItems = useTopSellingItems(timeRange, 10);
  const hourlyData = useHourlyAnalytics();
  const dailyData = useDailyAnalytics(7);
  const tableData = useTableAnalytics();
  const categoryData = useCategoryAnalytics(timeRange);

  const tabs = [
    { id: 'overview', label: 'خلاصه', icon: '📊' },
    { id: 'items', label: 'آیتم‌ها', icon: '🍽️' },
    { id: 'hours', label: 'ساعات', icon: '⏰' },
    { id: 'tables', label: 'میزها', icon: '🪑' },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-[var(--color-surface)]">
      {/* Header */}
      <div className="sticky top-0 z-10 p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📊</span>
            <div>
              <h2 className="text-xl font-bold text-white">آنالیتیکس</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {formatPersianDate(Date.now())}
              </p>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)]/80'
              }`}
            >
              {range === 'today' ? 'امروز' : range === 'week' ? 'هفته' : range === 'month' ? 'ماه' : 'همه'}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-surface-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)]/80'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Sales Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="کل فروش"
                value={formatCurrency(sales.totalSales)}
                icon="💰"
                color="bg-green-500/20 text-green-400"
              />
              <StatCard
                title="تعداد سفارش"
                value={formatNumber(sales.totalOrders)}
                icon="🧾"
                color="bg-blue-500/20 text-blue-400"
              />
              <StatCard
                title="میانگین سفارش"
                value={formatCurrency(sales.averageOrderValue)}
                icon="📈"
                color="bg-purple-500/20 text-purple-400"
              />
              <StatCard
                title="آیتم‌های فروخته"
                value={formatNumber(sales.totalItems)}
                icon="🍽️"
                color="bg-orange-500/20 text-orange-400"
              />
            </div>

            {/* Daily Sales Chart */}
            <div className="bg-[var(--color-surface-light)] rounded-2xl p-4 border border-[var(--color-border)]">
              <h3 className="text-lg font-bold text-white mb-4">📈 فروش روزانه (۷ روز اخیر)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="persianDate" stroke="var(--color-text-muted)" fontSize={12} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface-light)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                      }}
                      labelStyle={{ color: 'white' }}
                      formatter={(value) => [formatCurrency(value as number), 'فروش']}
                    />
                    <Bar dataKey="revenue" fill="#4ECDC4" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-[var(--color-surface-light)] rounded-2xl p-4 border border-[var(--color-border)]">
              <h3 className="text-lg font-bold text-white mb-4">🥧 توزیع دسته‌بندی‌ها</h3>
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.slice(0, 6)}
                      dataKey="revenue"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      labelLine={false}
                    >
                      {categoryData.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface-light)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                      }}
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div className="bg-[var(--color-surface-light)] rounded-2xl p-4 border border-[var(--color-border)]">
            <h3 className="text-lg font-bold text-white mb-4">🏆 پرفروش‌ترین آیتم‌ها</h3>
            <div className="space-y-3">
              {topItems.map((item, index) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between p-3 bg-[var(--color-surface)] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-[var(--color-surface-light)] text-[var(--color-text-muted)]'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{item.nameEn}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-[var(--color-accent)] font-bold">{formatCurrency(item.revenue)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{formatNumber(item.quantity)} عدد</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hours Tab */}
        {activeTab === 'hours' && (
          <>
            <div className="bg-[var(--color-surface-light)] rounded-2xl p-4 border border-[var(--color-border)]">
              <h3 className="text-lg font-bold text-white mb-4">⏰ توزیع ساعات (امروز)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="hour" stroke="var(--color-text-muted)" fontSize={12} tickFormatter={(h) => `${h}:00`} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface-light)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                      }}
                      labelFormatter={(h) => `ساعت ${h}:00`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="orderCount" stroke="#4ECDC4" strokeWidth={2} dot={{ fill: '#4ECDC4' }} name="تعداد سفارش" />
                    <Line type="monotone" dataKey="revenue" stroke="#FF6B6B" strokeWidth={2} dot={{ fill: '#FF6B6B' }} name="فروش" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Peak Hours */}
            <div className="bg-[var(--color-surface-light)] rounded-2xl p-4 border border-[var(--color-border)]">
              <h3 className="text-lg font-bold text-white mb-4">🔥 ساعات پرترافیک</h3>
              <div className="grid grid-cols-3 gap-4">
                {hourlyData
                  .filter(h => h.orderCount > 0)
                  .sort((a, b) => b.orderCount - a.orderCount)
                  .slice(0, 6)
                  .map((hour, i) => (
                    <div key={hour.hour} className="text-center p-3 bg-[var(--color-surface)] rounded-xl">
                      <p className="text-2xl mb-1">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}</p>
                      <p className="text-white font-bold">{hour.hour}:00 - {hour.hour + 1}:00</p>
                      <p className="text-[var(--color-accent)]">{hour.orderCount} سفارش</p>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div className="bg-[var(--color-surface-light)] rounded-2xl p-4 border border-[var(--color-border)]">
            <h3 className="text-lg font-bold text-white mb-4">🪑 عملکرد میزها</h3>
            <div className="space-y-3">
              {tableData.slice(0, 10).map((table) => (
                <div
                  key={table.tableId}
                  className="flex items-center justify-between p-3 bg-[var(--color-surface)] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-bold">
                      {table.tableId}
                    </span>
                    <div>
                      <p className="text-white font-medium">میز {table.tableId}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {table.orderCount} سفارش | {formatDuration(table.averageServingTime)} میانگین
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-[var(--color-accent)] font-bold">{formatCurrency(table.totalRevenue)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatDuration(table.averageServingTime)} زمان سرو
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-80">{title}</p>
    </div>
  );
}

export default AnalyticsDashboard;

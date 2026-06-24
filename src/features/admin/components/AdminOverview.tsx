import React from 'react';
import { 
  Users, Building, Calendar, DollarSign, Star, TrendingUp, CheckCircle, Clock, Percent, ShieldAlert 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, LineChart, Line, CartesianGrid, Legend 
} from 'recharts';

interface Stats {
  totalUsers: number;
  totalTenants: number;
  totalProperties: number;
  activeProperties: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalReviews: number;
  peakSeasonRevenue?: number;
  peakSeasonBookings?: number;
  averageMultiplier?: number;
}

interface TrendItem {
  month: string;
  bookings: number;
  revenue: number;
  users: number;
  properties: number;
}

interface AdminOverviewProps {
  stats: Stats;
  trends: TrendItem[];
}

export default function AdminOverview({ stats, trends }: AdminOverviewProps) {
  const cards = [
    { 
      id: "stat-total-users",
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      description: 'Registered customers' 
    },
    { 
      id: "stat-total-tenants",
      title: 'Total Tenants', 
      value: stats.totalTenants, 
      icon: ShieldAlert, 
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      description: 'Registered property hosts' 
    },
    { 
      id: "stat-total-properties",
      title: 'Total Properties', 
      value: stats.totalProperties, 
      icon: Building, 
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      description: `${stats.activeProperties} currently active` 
    },
    { 
      id: "stat-total-bookings",
      title: 'Total Bookings', 
      value: stats.totalBookings, 
      icon: Calendar, 
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      description: `${stats.pendingBookings} pending actions` 
    },
    { 
      id: "stat-total-revenue",
      title: 'Total Revenue', 
      value: `$${Math.round(stats.totalRevenue).toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      description: `MTD: $${Math.round(stats.monthlyRevenue).toLocaleString()}` 
    },
    { 
      id: "stat-total-reviews",
      title: 'Total Reviews', 
      value: stats.totalReviews, 
      icon: Star, 
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      description: 'Overall moderate ratings' 
    },
    { 
      id: "stat-peak-bookings",
      title: 'Peak Season Bookings', 
      value: stats.peakSeasonBookings !== undefined ? stats.peakSeasonBookings : 0, 
      icon: Calendar, 
      color: 'text-orange-600 bg-orange-50 border-orange-100',
      description: 'Bookings matching peak constraints' 
    },
    { 
      id: "stat-peak-revenue",
      title: 'Peak Season Revenue', 
      value: `Rp ${(stats.peakSeasonRevenue || 0).toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      description: `Premium holiday subtotal` 
    },
    { 
      id: "stat-avg-multiplier",
      title: 'Average Multiplier', 
      value: `${(stats.averageMultiplier || 1.0).toFixed(2)}x`, 
      icon: Percent, 
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      description: 'Average active seasonal surge multiplier' 
    }
  ];

  return (
    <div className="space-y-8" id="admin-overview-container">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900" id="overview-heading">Dashboard Analytics</h2>
        <p className="mt-1 text-sm text-gray-500" id="overview-subheading">Real-time statistics and historical platform trend evaluations.</p>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" id="overview-stats-grid">
        {cards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div 
              key={card.id} 
              id={card.id}
              className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-xs transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{card.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`rounded-xl border p-3 ${card.color}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Sub KPI Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3" id="sub-kpis-wrapper">
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-xs" id="sub-kpi-1">
          <div className="rounded-lg bg-green-50 p-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Completed Bookings</p>
            <p className="text-md font-bold text-gray-800">{stats.completedBookings}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-xs" id="sub-kpi-2">
          <div className="rounded-lg bg-yellow-50 p-2 text-yellow-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Awaiting Payments</p>
            <p className="text-md font-bold text-gray-800">{stats.pendingBookings}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-xs" id="sub-kpi-3">
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Active Listings Ratio</p>
            <p className="text-md font-bold text-gray-800">
              {stats.totalProperties > 0 ? `${Math.round((stats.activeProperties / stats.totalProperties) * 100)}%` : '100%'}
            </p>
          </div>
        </div>
      </div>

      {/* Recharts Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" id="charts-grid">
        
        {/* Booking Trend */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-xs" id="chart-bookings-trend">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-purple-500" /> Bookings Performance
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid #f3f4f6' }} />
                <Area type="monotone" dataKey="bookings" stroke="#9333ea" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBookings)" name="Bookings" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-xs" id="chart-revenue-trend">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-emerald-500" /> Revenue Flow ($)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid #f3f4f6' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-xs" id="chart-user-growth">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-blue-500" /> User Sign-ups Growth
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid #f3f4f6' }} />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Property Listings Growth */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-xs" id="chart-property-growth">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5">
            <Building className="h-4 w-4 text-indigo-500" /> Property Listings Added
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid #f3f4f6' }} />
                <Bar dataKey="properties" fill="#6366f1" radius={[4, 4, 0, 0]} name="Properties" maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import axios from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, ShoppingBag, Calendar, IndianRupee, AlertTriangle, Package } from 'lucide-react';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [lowStock, setLowStock]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([axios.get('/api/sales/analytics'), axios.get('/api/inventory/low-stock')])
      .then(([a,l]) => { setAnalytics(a.data); setLowStock(l.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>;

  const stats = [
    { label:"Today's Revenue", value:`₹${analytics?.today?.revenue?.toFixed(0)||0}`, sub:`${analytics?.today?.orders||0} orders`, icon:IndianRupee, color:'from-indigo-500 to-indigo-600' },
    { label:'This Month',      value:`₹${analytics?.month?.revenue?.toFixed(0)||0}`, sub:`${analytics?.month?.orders||0} orders`, icon:Calendar,     color:'from-purple-500 to-purple-600' },
    { label:'This Year',       value:`₹${analytics?.year?.revenue?.toFixed(0)||0}`,  sub:`${analytics?.year?.orders||0} orders`,  icon:TrendingUp,    color:'from-pink-500 to-pink-600'     },
    { label:'All Time',        value:`₹${analytics?.all?.revenue?.toFixed(0)||0}`,   sub:`${analytics?.all?.orders||0} orders`,   icon:ShoppingBag,   color:'from-cyan-500 to-cyan-600'     },
  ];

  const CustomTooltip = ({ active, payload, label }) => active && payload?.length ? (
    <div className="glass rounded-xl px-4 py-3 text-sm">
      <p className="text-slate-300 font-medium">{label}</p>
      <p className="text-indigo-400">₹{payload[0]?.value?.toFixed(0)}</p>
      <p className="text-slate-500">{payload[1]?.value} orders</p>
    </div>
  ) : null;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Welcome back, KaushClothing</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((s,i) => (
          <div key={i} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider leading-tight">{s.label}</p>
                <p className="text-xl md:text-2xl font-bold text-white mt-1.5">{s.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.sub}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}>
                <s.icon size={16} className="text-white"/>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-5 text-sm">Revenue — Last 12 Months</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics?.monthly||[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a52" vertical={false}/>
              <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="revenue" fill="#6366f1" radius={[5,5,0,0]}/>
              <Bar dataKey="orders"  fill="#8b5cf6" radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4 text-sm">Top Selling Items</h2>
          <div className="space-y-3">
            {(analytics?.topItems||[]).length===0 && <p className="text-slate-500 text-sm text-center py-6">No sales yet</p>}
            {(analytics?.topItems||[]).map((item,i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                  <p className="text-slate-500 text-xs">{item.qty} units</p>
                </div>
                <p className="text-indigo-400 text-sm font-semibold">₹{item.revenue?.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-red-500/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-400"/>
            <h2 className="text-white font-semibold text-sm">Low Stock Alert</h2>
            <span className="ml-auto bg-red-500/20 text-red-400 text-xs font-medium px-2.5 py-1 rounded-full">{lowStock.length} items</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {lowStock.map(item => (
              <div key={item._id} className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                <Package size={13} className="text-red-400 mb-1"/>
                <p className="text-white text-xs font-medium truncate">{item.name}</p>
                <p className="text-red-400 text-xs mt-0.5">Only {item.quantity} left</p>
                <p className="text-slate-500 text-xs">{item.code}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
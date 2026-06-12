import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Download, Search, X, Calendar, FileSpreadsheet, Receipt, IndianRupee, TrendingUp, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function Sales() {
  const [sales, setSales]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');
  const [expanded, setExpanded] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/sales', { params: { search, from, to } });
      setSales(res.data);
    } catch { toast.error('Failed to load sales'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSales(); }, [search, from, to]);

  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await axios.get('/api/sales/export', { params: { from, to }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `Kausheen_Sales.xlsx`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const totalRevenue = sales.reduce((s,x) => s + x.grandTotal, 0);
  const avgOrder     = sales.length ? totalRevenue / sales.length : 0;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales</h1>
          <p className="text-slate-400 text-sm">All transactions & reports</p>
        </div>
        <button onClick={exportExcel} disabled={exporting}
          className="btn-primary bg-emerald-600 hover:bg-emerald-500">
          {exporting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <><FileSpreadsheet size={15}/>Export Excel</>}
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label:'Total Revenue',    value:`₹${totalRevenue.toFixed(0)}`, icon:IndianRupee, color:'from-indigo-500 to-indigo-600' },
          { label:'Total Orders',     value:sales.length,                  icon:Receipt,     color:'from-purple-500 to-purple-600' },
          { label:'Avg Order Value',  value:`₹${avgOrder.toFixed(0)}`,     icon:TrendingUp,  color:'from-pink-500 to-pink-600'     },
        ].map((s,i) => (
          <div key={i} className="stat-card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}>
              <s.icon size={17} className="text-white"/>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-bold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-40">
          {!search && <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>}
          <input className={`input ${!search?'pl-9':'pl-4'} py-2 transition-all`} placeholder="Search customer, bill no..."
            value={search} onChange={e=>setSearch(e.target.value)}/>
          {search && <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={13}/></button>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={13} className="text-slate-500"/>
          <input type="date" className="input py-2 text-sm w-36" value={from} onChange={e=>setFrom(e.target.value)}/>
          <span className="text-slate-500 text-xs">to</span>
          <input type="date" className="input py-2 text-sm w-36" value={to} onChange={e=>setTo(e.target.value)}/>
          {(from||to) && <button onClick={()=>{setFrom('');setTo('');}} className="text-slate-500 hover:text-white"><X size={13}/></button>}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Bill No','Date','Customer','Phone','Items','Subtotal','GST','Discount','Total','Payment','Invoice',''].map(h => (
                  <th key={h} className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="text-center py-12 text-slate-500">Loading...</td></tr>
              ) : sales.length===0 ? (
                <tr><td colSpan={12} className="text-center py-12">
                  <Receipt size={30} className="text-slate-600 mx-auto mb-2"/>
                  <p className="text-slate-500 text-sm">No sales found</p>
                </td></tr>
              ) : sales.map(sale => (
                <>
                  <tr key={sale._id} className="table-row cursor-pointer" onClick={()=>setExpanded(expanded===sale._id?null:sale._id)}>
                    <td className="px-4 py-3"><span className="font-mono text-indigo-400 text-xs bg-indigo-500/10 px-2 py-1 rounded">{sale.billNumber}</span></td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{format(new Date(sale.createdAt),'dd MMM yy')}</td>
                    <td className="px-4 py-3 text-white font-medium text-sm">{sale.customerName}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{sale.customerPhone}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{sale.items.length}</td>
                    <td className="px-4 py-3 text-white text-sm">₹{sale.subtotal?.toFixed(0)}</td>
                    <td className="px-4 py-3 text-yellow-400 text-sm">₹{sale.totalGST?.toFixed(0)}</td>
                    <td className="px-4 py-3 text-green-400 text-sm">₹{sale.totalDiscount?.toFixed(0)}</td>
                    <td className="px-4 py-3 text-indigo-400 font-bold text-sm">₹{sale.grandTotal?.toFixed(0)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${sale.paymentMode==='Cash'?'bg-green-500/15 text-green-400':sale.paymentMode==='Card'?'bg-blue-500/15 text-blue-400':'bg-orange-500/15 text-orange-400'}`}>
                        {sale.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sale.invoiceToken && (
                        <a href={`/i/${sale.invoiceToken}`} target="_blank" rel="noreferrer"
                          onClick={e=>e.stopPropagation()}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all inline-flex">
                          <ExternalLink size={13}/>
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {expanded===sale._id ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
                    </td>
                  </tr>
                  {expanded===sale._id && (
                    <tr key={`${sale._id}-exp`} className="bg-white/[0.015]">
                      <td colSpan={12} className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Items in this bill</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {sale.items.map((item,i) => (
                            <div key={i} className="bg-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
                              <div>
                                <p className="text-white text-sm font-medium">{item.name}</p>
                                <p className="text-slate-500 text-xs font-mono">{item.code} · Qty:{item.quantity} · GST:{item.gst}% · Disc:₹{item.discount?.toFixed(0)}</p>
                              </div>
                              <p className="text-indigo-400 font-semibold text-sm ml-3">₹{item.subtotal?.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
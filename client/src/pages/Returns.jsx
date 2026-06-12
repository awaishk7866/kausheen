import { useEffect, useState } from 'react';
import axios from '../utils/api';
import toast from 'react-hot-toast';
import { Search, X, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

export default function Returns() {
  const [returns, setReturns]       = useState([]);
  const [billNo, setBillNo]         = useState('');
  const [originalBill, setOriginal] = useState(null);
  const [selectedItems, setSelected]= useState([]);
  const [reason, setReason]         = useState('');
  const [refundMode, setRefundMode] = useState('Cash');
  const [searching, setSearching]   = useState(false);
  const [saving, setSaving]         = useState(false);

  const fetchReturns = async () => {
    try { const r = await axios.get('/api/returns'); setReturns(r.data); }
    catch { toast.error('Failed to load returns'); }
  };
  useEffect(() => { fetchReturns(); }, []);

  const searchBill = async () => {
    if (!billNo.trim()) return;
    setSearching(true);
    try {
      const res = await axios.get(`/api/returns/bill/${billNo.trim()}`);
      setOriginal(res.data);
      setSelected(res.data.items.map(i=>({ ...i, returnQty:0, selected:false })));
    } catch { toast.error('Bill not found'); setOriginal(null); }
    finally { setSearching(false); }
  };

  const toggleItem = idx => {
    const u = [...selectedItems];
    u[idx].selected = !u[idx].selected;
    if (u[idx].selected && u[idx].returnQty===0) u[idx].returnQty = 1;
    setSelected(u);
  };

  const updateQty = (idx, val) => {
    const u = [...selectedItems];
    u[idx].returnQty = Math.min(parseInt(val)||0, u[idx].quantity);
    setSelected(u);
  };

  const handleReturn = async () => {
    const items = selectedItems.filter(i=>i.selected && i.returnQty>0);
    if (!items.length) return toast.error('Select items to return');
    setSaving(true);
    try {
      await axios.post('/api/returns', {
        originalBillId: originalBill._id,
        billNumber: originalBill.billNumber,
        customerName: originalBill.customerName,
        customerPhone: originalBill.customerPhone,
        items: items.map(i=>({ itemId:i.itemId, name:i.name, code:i.code, quantity:i.returnQty, price:i.price })),
        reason, refundMode,
      });
      toast.success('Return processed! Stock restocked.');
      setOriginal(null); setBillNo(''); setSelected([]); setReason('');
      fetchReturns();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const totalRefund = selectedItems.filter(i=>i.selected).reduce((s,i)=>s+(i.price*(i.returnQty||0)),0);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Returns</h1>
        <p className="text-slate-400 text-sm">Process customer returns and restock inventory</p>
      </div>

      {/* Search bill */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Search Original Bill</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            {!billNo && <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>}
            <input
              className={`input ${!billNo?'pl-9':'pl-4'} transition-all font-mono`}
              placeholder="Enter bill number e.g. KSH-202501-0001"
              value={billNo} onChange={e=>setBillNo(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&searchBill()}
            />
          </div>
          <button onClick={searchBill} disabled={searching} className="btn-primary px-5">
            {searching ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : 'Search'}
          </button>
        </div>
      </div>

      {/* Return form */}
      {originalBill && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-sm">Bill: {originalBill.billNumber}</h2>
              <p className="text-slate-400 text-xs">{originalBill.customerName} · {originalBill.customerPhone}</p>
            </div>
            <button onClick={()=>{setOriginal(null);setBillNo('');}} className="text-slate-400 hover:text-white"><X size={16}/></button>
          </div>

          <p className="text-slate-400 text-xs">Select items to return:</p>
          <div className="space-y-2">
            {selectedItems.map((item,idx)=>(
              <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${item.selected?'border-indigo-500/40 bg-indigo-500/5':'border-white/[0.06] bg-white/[0.02] hover:bg-white/5'}`}
                onClick={()=>toggleItem(idx)}>
                <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${item.selected?'bg-indigo-500 border-indigo-500':'border-slate-500'}`}>
                  {item.selected && <CheckCircle size={11} className="text-white"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{item.name}</p>
                  <p className="text-slate-500 text-xs">₹{item.price} · Qty bought: {item.quantity}</p>
                </div>
                {item.selected && (
                  <div onClick={e=>e.stopPropagation()}>
                    <input type="number" min="1" max={item.quantity}
                      className="w-16 bg-white/10 border border-white/20 text-white text-center rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={item.returnQty} onChange={e=>updateQty(idx,e.target.value)}/>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalRefund > 0 && (
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <span className="text-green-300 text-sm font-medium">Total Refund Amount</span>
              <span className="text-green-400 font-bold text-lg">₹{totalRefund.toFixed(2)}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Reason</label>
              <input className="input" placeholder="Reason for return..." value={reason} onChange={e=>setReason(e.target.value)}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Refund Mode</label>
              <select className="input" value={refundMode} onChange={e=>setRefundMode(e.target.value)}>
                <option>Cash</option>
                <option>UPI</option>
                <option>Exchange</option>
              </select>
            </div>
          </div>

          <button onClick={handleReturn} disabled={saving}
            className="w-full btn-primary justify-center py-3 bg-orange-600 hover:bg-orange-500">
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <><RotateCcw size={14}/>Process Return</>}
          </button>
        </div>
      )}

      {/* Returns history */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h2 className="text-white font-semibold text-sm">Returns History</h2>
        </div>
        {returns.length===0 ? (
          <div className="text-center py-10">
            <RotateCcw size={28} className="text-slate-600 mx-auto mb-2"/>
            <p className="text-slate-500 text-sm">No returns yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Return No','Original Bill','Customer','Items','Refund','Mode','Reason','Date'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returns.map(ret=>(
                  <tr key={ret._id} className="table-row">
                    <td className="px-4 py-3"><span className="font-mono text-orange-400 text-xs bg-orange-500/10 px-2 py-1 rounded">{ret.returnNumber}</span></td>
                    <td className="px-4 py-3 font-mono text-indigo-400 text-xs">{ret.billNumber}</td>
                    <td className="px-4 py-3 text-white text-sm">{ret.customerName}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{ret.items.length} item{ret.items.length>1?'s':''}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold">₹{ret.totalRefund?.toFixed(2)}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-white/10 text-slate-300">{ret.refundMode}</span></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{ret.reason||'—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(ret.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
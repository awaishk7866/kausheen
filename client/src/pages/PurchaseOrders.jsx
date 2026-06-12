import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, X, Save, Package, Truck, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const emptyForm = { supplier:'', supplierPhone:'', notes:'', expectedDate:'', items:[] };

export default function PurchaseOrders() {
  const [orders, setOrders]       = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [expanded, setExpanded]   = useState(null);
  const [showReceive, setShowReceive] = useState(null);
  const [receiveQtys, setReceiveQtys] = useState({});
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState(emptyForm);

  const fetchAll = async () => {
    try {
      const [o,i] = await Promise.all([axios.get('/api/purchase-orders'), axios.get('/api/inventory')]);
      setOrders(o.data); setInventory(i.data);
    } catch { toast.error('Failed to load'); }
  };
  useEffect(() => { fetchAll(); }, []);

  const addFormItem = () =>
    setForm(f => ({ ...f, items:[...f.items, { itemId:'', name:'', code:'', orderedQty:1, unitCost:0 }] }));

  const updateFormItem = (idx, field, val) => {
    const u = [...form.items];
    if (field==='itemId') {
      const found = inventory.find(i=>i._id===val);
      u[idx] = { ...u[idx], itemId:val, name:found?.name||'', code:found?.code||'', unitCost:found?.price||0 };
    } else {
      u[idx] = { ...u[idx], [field]:val };
    }
    setForm(f=>({...f,items:u}));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.items.length) return toast.error('Add at least one item');
    setSaving(true);
    try {
      const totalCost = form.items.reduce((s,i)=>s+(i.orderedQty*i.unitCost),0);
      await axios.post('/api/purchase-orders',{...form,totalCost});
      toast.success('Purchase order created!');
      setShowForm(false); setForm(emptyForm); fetchAll();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const handleReceive = async (po) => {
    const items = po.items
      .map(i=>({ itemId:i.itemId, receivedQty:parseInt(receiveQtys[i.itemId]||0) }))
      .filter(i=>i.receivedQty>0);
    if (!items.length) return toast.error('Enter quantities to receive');
    try {
      await axios.put(`/api/purchase-orders/${po._id}/receive`,{items});
      toast.success('Stock updated!');
      setShowReceive(null); setReceiveQtys({}); fetchAll();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
  };

  const SC = {
    Pending:  { cls:'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon:Clock        },
    Partial:  { cls:'text-blue-400 bg-blue-500/10 border-blue-500/20',       icon:Truck        },
    Received: { cls:'text-green-400 bg-green-500/10 border-green-500/20',    icon:CheckCircle  },
    Cancelled:{ cls:'text-red-400 bg-red-500/10 border-red-500/20',          icon:AlertCircle  },
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Purchase Orders</h1>
          <p className="text-slate-400 text-sm">Manage stock orders from suppliers</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="btn-primary"><Plus size={15}/>New PO</button>
      </div>

      <div className="space-y-3">
        {orders.length===0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Package size={34} className="text-slate-600 mx-auto mb-3"/>
            <p className="text-slate-400 text-sm">No purchase orders yet</p>
          </div>
        )}
        {orders.map(po => {
          const s = SC[po.status]||SC.Pending;
          return (
            <div key={po._id} className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={()=>setExpanded(expanded===po._id?null:po._id)}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-indigo-400 text-xs bg-indigo-500/10 px-2 py-0.5 rounded">{po.poNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${s.cls}`}>{po.status}</span>
                  </div>
                  <p className="text-white font-medium text-sm">{po.supplier}</p>
                  <p className="text-slate-500 text-xs">{po.items.length} items · ₹{po.totalCost?.toFixed(0)} · {po.expectedDate?new Date(po.expectedDate).toLocaleDateString('en-IN'):'No date'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {po.status!=='Received'&&po.status!=='Cancelled' && (
                    <button onClick={e=>{e.stopPropagation();setShowReceive(po);setReceiveQtys({});}}
                      className="btn-primary text-xs px-3 py-1.5"><Truck size={12}/>Receive</button>
                  )}
                  {expanded===po._id ? <ChevronUp size={15} className="text-slate-400"/> : <ChevronDown size={15} className="text-slate-400"/>}
                </div>
              </div>
              {expanded===po._id && (
                <div className="border-t border-white/[0.06] p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-white/[0.06]">
                          {['Item','Code','Ordered','Received','Unit Cost'].map(h=>(
                            <th key={h} className="pb-2 text-left font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {po.items.map((item,i)=>(
                          <tr key={i} className="border-b border-white/[0.04] last:border-0">
                            <td className="py-2 text-white text-sm">{item.name}</td>
                            <td className="py-2 font-mono text-indigo-400">{item.code}</td>
                            <td className="py-2 text-slate-300">{item.orderedQty}</td>
                            <td className="py-2">
                              <span className={item.receivedQty>=item.orderedQty?'text-green-400':'text-yellow-400'}>{item.receivedQty||0}</span>
                            </td>
                            <td className="py-2 text-slate-300">₹{item.unitCost?.toFixed(0)}/unit</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {po.notes && <p className="text-slate-500 text-xs mt-3">📝 {po.notes}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New PO Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06] sticky top-0 bg-[#1a1a2e] z-10">
              <h2 className="text-white font-semibold">New Purchase Order</h2>
              <button onClick={()=>setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Supplier Name *</label>
                  <input className="input" placeholder="Supplier name" value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})} required/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Supplier Phone</label>
                  <input className="input" placeholder="+91..." value={form.supplierPhone} onChange={e=>setForm({...form,supplierPhone:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Expected Date</label>
                  <input type="date" className="input" value={form.expectedDate} onChange={e=>setForm({...form,expectedDate:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Notes</label>
                  <input className="input" placeholder="Optional..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Items *</label>
                  <button type="button" onClick={addFormItem} className="btn-ghost text-xs px-2 py-1"><Plus size={12}/>Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((fi,idx)=>(
                    <div key={idx} className="flex gap-2 items-center">
                      <select className="input flex-1 text-sm" value={fi.itemId} onChange={e=>updateFormItem(idx,'itemId',e.target.value)} required>
                        <option value="">Select item...</option>
                        {inventory.map(i=><option key={i._id} value={i._id}>{i.name} ({i.code})</option>)}
                      </select>
                      <input type="number" min="1" className="input w-20 text-sm" placeholder="Qty"
                        value={fi.orderedQty} onChange={e=>updateFormItem(idx,'orderedQty',parseInt(e.target.value)||1)}/>
                      <input type="number" min="0" className="input w-24 text-sm" placeholder="₹ Cost"
                        value={fi.unitCost} onChange={e=>updateFormItem(idx,'unitCost',parseFloat(e.target.value)||0)}/>
                      <button type="button" onClick={()=>setForm(f=>({...f,items:f.items.filter((_,i)=>i!==idx)}))}
                        className="text-slate-500 hover:text-red-400 flex-shrink-0 p-1"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowForm(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <><Save size={14}/>Create PO</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Stock Modal */}
      {showReceive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-white font-semibold">Receive Stock — {showReceive.poNumber}</h2>
              <button onClick={()=>setShowReceive(null)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-3">
              {showReceive.items.map(item=>(
                <div key={item.itemId} className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{item.name}</p>
                    <p className="text-slate-500 text-xs">Ordered: {item.orderedQty} · Received: {item.receivedQty||0}</p>
                  </div>
                  <input type="number" min="0" max={item.orderedQty-(item.receivedQty||0)}
                    className="input w-20 text-sm text-center" placeholder="Qty"
                    value={receiveQtys[item.itemId]||''}
                    onChange={e=>setReceiveQtys(p=>({...p,[item.itemId]:e.target.value}))}/>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowReceive(null)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button onClick={()=>handleReceive(showReceive)} className="btn-primary flex-1 justify-center">
                  <Truck size={14}/>Receive Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
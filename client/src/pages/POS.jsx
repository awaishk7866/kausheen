import { useState, useEffect, useRef } from 'react';
import axios from '../utils/api';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import {
  Search, Trash2, AlertTriangle, User, Phone, Mail, Receipt,
  Download, CreditCard, Banknote, Smartphone, X,
  PauseCircle, PlayCircle, CheckCircle, Loader, ExternalLink
} from 'lucide-react';

function calcItem(item) {
  const base     = item.price * item.quantity;
  const gstAmt   = (base * (item.gst || 0)) / 100;
  const afterGST = base + gstAmt;
  const discAmt  = Math.min(parseFloat(item.discount) || 0, afterGST);
  return { base, gstAmt, discAmt, total: afterGST - discAmt };
}

export default function POS() {
  const [customer, setCustomer]       = useState({ name:'', phone:'', email:'' });
  const [items, setItems]             = useState([]);
  const [query, setQuery]             = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug]         = useState(false);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [loading, setLoading]         = useState(false);
  const [lastBill, setLastBill]       = useState(null);
  const [showUPI, setShowUPI]         = useState(false);
  const [upiData, setUpiData]         = useState(null);
  const [upiLoading, setUpiLoading]   = useState(false);
  const [heldBills, setHeldBills]     = useState([]);
  const [showHeld, setShowHeld]       = useState(false);
  const sugRef = useRef();

  // Live search
  useEffect(() => {
    if (!query) { setSuggestions([]); setShowSug(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get('/api/inventory/search', { params: { q: query } });
        setSuggestions(res.data); setShowSug(true);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Close suggestions on outside click
  useEffect(() => {
    const fn = e => { if (!sugRef.current?.contains(e.target)) setShowSug(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Load held bills
  const loadHeld = async () => {
    try { const r = await axios.get('/api/held'); setHeldBills(r.data); } catch {}
  };
  useEffect(() => { loadHeld(); }, []);

  const addItem = (item) => {
    setQuery(''); setShowSug(false);
    const idx = items.findIndex(i => i.itemId === item._id);
    if (idx >= 0) {
      const u = [...items];
      u[idx].quantity = Math.min(u[idx].quantity + 1, item.quantity);
      setItems(u);
    } else {
      setItems(p => [...p, {
        itemId: item._id, name: item.name, code: item.code,
        price: item.price, quantity: 1, gst: 0, discount: 0,
        lowStock: item.lowStock, maxQty: item.quantity
      }]);
    }
  };

  const updateItem = (idx, field, val) => {
    const u = [...items];
    u[idx] = { ...u[idx], [field]: parseFloat(val) || 0 };
    setItems(u);
  };

  const removeItem = idx => setItems(items.filter((_,i) => i !== idx));

  const totals = items.reduce((acc, item) => {
    const c = calcItem(item);
    return { subtotal: acc.subtotal+c.base, gst: acc.gst+c.gstAmt, discount: acc.discount+c.discAmt, grand: acc.grand+c.total };
  }, { subtotal:0, gst:0, discount:0, grand:0 });

  // Hold bill
  const holdBill = async () => {
    if (items.length === 0) return toast.error('Nothing to hold');
    try {
      await axios.post('/api/held', {
        label: customer.name || `Hold ${new Date().toLocaleTimeString()}`,
        customerName: customer.name, customerPhone: customer.phone,
        customerEmail: customer.email, items, paymentMode
      });
      toast.success('Bill held!');
      setCustomer({ name:'', phone:'', email:'' }); setItems([]);
      loadHeld();
    } catch { toast.error('Failed to hold'); }
  };

  const resumeHeld = async (bill) => {
    setCustomer({ name: bill.customerName, phone: bill.customerPhone, email: bill.customerEmail });
    setItems(bill.items); setPaymentMode(bill.paymentMode);
    await axios.delete(`/api/held/${bill._id}`);
    loadHeld(); setShowHeld(false);
    toast.success('Bill resumed!');
  };

  // UPI QR
  const showUPIQR = async () => {
    if (items.length === 0) return toast.error('Add items first');
    setUpiLoading(true); setShowUPI(true);
    try {
      const res = await axios.post('/api/upi-qr', { amount: totals.grand, billNumber: 'PREVIEW' });
      setUpiData(res.data);
    } catch { toast.error('Failed to generate QR'); setShowUPI(false); }
    finally { setUpiLoading(false); }
  };

  // Generate bill
  const generateBill = async () => {
    if (!customer.name) return toast.error('Customer name required');
    if (!customer.phone && !customer.email) return toast.error('Phone or email required');
    if (items.length === 0) return toast.error('Add at least one item');
    setLoading(true);
    try {
      const res = await axios.post('/api/pos/bill', {
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        items: items.map(i => ({
          itemId: i.itemId, name: i.name, price: i.price,
          quantity: i.quantity, gst: i.gst, discount: i.discount
        })),
        paymentMode,
      });
      setLastBill(res.data);
      setShowUPI(false);
      toast.success('Bill created!');
      if (res.data.emailSent) toast.success('📧 Email sent!');
      setCustomer({ name:'', phone:'', email:'' }); setItems([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bill');
    } finally { setLoading(false); }
  };

  const openWhatsApp = () => {
    if (lastBill?.waLink) window.open(lastBill.waLink, '_blank');
  };

  const payModes = [
    { label:'Cash', icon:Banknote  },
    { label:'Card', icon:CreditCard},
    { label:'UPI',  icon:Smartphone},
  ];

  return (
    <div className="p-3 md:p-5 flex flex-col gap-4 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">Point of Sale</h1>
          <p className="text-slate-400 text-xs">Search or scan items to add to cart</p>
        </div>
        <div className="flex gap-2">
          {heldBills.length > 0 && (
            <button onClick={() => setShowHeld(true)} className="btn-ghost text-xs relative">
              <PauseCircle size={14}/>Held
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full text-[9px] flex items-center justify-center text-black font-bold">{heldBills.length}</span>
            </button>
          )}
          <button onClick={holdBill} className="btn-ghost text-xs"><PauseCircle size={14}/>Hold Bill</button>
        </div>
      </div>

      <div className="flex gap-4 flex-col xl:flex-row flex-1">

        {/* LEFT — Search + Cart */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Search */}
          <div className="glass rounded-2xl p-4 relative z-50">
            <div className="relative" ref={sugRef}>
              {!query && <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>}
              <input
                className={`input ${!query?'pl-9':'pl-4'} transition-all`}
                placeholder="Search item name or code to add..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => suggestions.length && setShowSug(true)}
                autoComplete="off"
              />
              {showSug && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 glass rounded-xl overflow-hidden z-[9999] shadow-2xl border border-white/10">
                  {suggestions.map(item => (
                    <button key={item._id} onClick={() => addItem(item)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/[0.04] last:border-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">{item.name}</span>
                          {item.lowStock && <span className="badge-low text-[10px]"><AlertTriangle size={9}/>Low Stock</span>}
                        </div>
                        <span className="text-slate-500 text-xs font-mono">{item.code}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-indigo-400 font-semibold text-sm">₹{item.price?.toLocaleString('en-IN')}</p>
                        <p className="text-slate-500 text-xs">{item.quantity} in stock</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Table */}
          <div className="glass rounded-2xl overflow-visible flex-1 min-h-[200px]">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                <Receipt size={28} className="mb-2 opacity-40"/>
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Search above to add items</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Item','Qty','Price','GST %','GST ₹','Disc (₹)','Total',''].map(h => (
                        <th key={h} className="px-3 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const c = calcItem(item);
                      return (
                        <tr key={idx} className="table-row">
                          <td className="px-3 py-2.5">
                            <p className="text-white font-medium">{item.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-mono text-indigo-400 text-[10px]">{item.code}</span>
                              {item.lowStock && <span className="badge-low text-[9px]"><AlertTriangle size={8}/>Low</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <input type="number" min="1" max={item.maxQty}
                              className="w-14 bg-white/5 border border-white/10 text-white text-center rounded-lg px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              value={item.quantity} onChange={e=>updateItem(idx,'quantity',e.target.value)}/>
                          </td>
                          <td className="px-3 py-2.5 text-white">₹{item.price}</td>
                          <td className="px-3 py-2.5">
                            <input type="number" min="0" max="28"
                              className="w-12 bg-white/5 border border-white/10 text-white text-center rounded-lg px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              value={item.gst} onChange={e=>updateItem(idx,'gst',e.target.value)}/>
                          </td>
                          <td className="px-3 py-2.5 text-yellow-400">₹{c.gstAmt.toFixed(2)}</td>
                          <td className="px-3 py-2.5">
                            <div className="relative w-20">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">₹</span>
                              <input type="number" min="0"
                                className="w-full bg-white/5 border border-white/10 text-white rounded-lg pl-5 pr-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                                value={item.discount} onChange={e=>updateItem(idx,'discount',e.target.value)}/>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-white">₹{c.total.toFixed(2)}</td>
                          <td className="px-3 py-2.5">
                            <button onClick={()=>removeItem(idx)} className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={13}/></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Customer + Payment + Summary */}
        <div className="w-full xl:w-72 flex flex-col gap-3">

          {/* Customer */}
          <div className="glass rounded-2xl p-4 space-y-3">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2"><User size={14} className="text-indigo-400"/>Customer</h2>
            <input className="input" placeholder="Customer name *"
              value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/>
            <div className="relative">
              {!customer.phone && <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>}
              <input className={`input ${!customer.phone?'pl-9':'pl-4'} transition-all`}
                placeholder="Phone (WhatsApp bill sent here)"
                value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/>
            </div>
            <div className="relative">
              {!customer.email && <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>}
              <input className={`input ${!customer.email?'pl-9':'pl-4'} transition-all`}
                placeholder="Email (bill sent here)" type="email"
                value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})}/>
            </div>
          </div>

          {/* Payment mode */}
          <div className="glass rounded-2xl p-4">
            <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><CreditCard size={14} className="text-indigo-400"/>Payment Mode</h2>
            <div className="grid grid-cols-3 gap-2">
              {payModes.map(({label,icon:Icon}) => (
                <button key={label} onClick={()=>setPaymentMode(label)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all ${
                    paymentMode===label
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                      : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}>
                  <Icon size={14}/>{label}
                </button>
              ))}
            </div>
            {paymentMode==='UPI' && items.length > 0 && (
              <button onClick={showUPIQR}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-300 text-xs font-medium hover:bg-orange-500/25 transition-all">
                <Smartphone size={13}/>Show UPI QR · ₹{totals.grand.toFixed(2)}
              </button>
            )}
          </div>

          {/* Bill Summary */}
          <div className="glass rounded-2xl p-4">
            <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><Receipt size={14} className="text-indigo-400"/>Bill Summary</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="text-white">₹{totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-400"><span>GST</span><span className="text-yellow-400">+ ₹{totals.gst.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-400"><span>Discount</span><span className="text-green-400">- ₹{totals.discount.toFixed(2)}</span></div>
              <div className="border-t border-white/[0.08] pt-2.5 flex justify-between">
                <span className="text-white font-bold text-sm">Grand Total</span>
                <span className="text-indigo-400 font-bold text-lg">₹{totals.grand.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={generateBill} disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
              {loading ? <Loader size={15} className="animate-spin"/> : <><Receipt size={14}/>Generate Bill</>}
            </button>
          </div>

          {/* Last bill actions */}
          {lastBill && (
            <div className="glass rounded-2xl p-4 border border-green-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400"/>
                <p className="text-green-400 text-xs font-semibold">Bill Created!</p>
              </div>
              <p className="text-slate-400 text-xs font-mono">{lastBill.sale?.billNumber}</p>

              {/* Invoice link */}
              <a href={lastBill.invoiceLink} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                <ExternalLink size={12}/>View Invoice
              </a>

              {/* WhatsApp button — cashier sends manually */}
              {lastBill.waLink && (
                <button onClick={openWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600/20 border border-green-500/30 text-green-300 text-xs font-medium hover:bg-green-600/30 transition-all">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.563 4.14 1.539 5.877L.057 23.4c-.073.28.186.54.466.467l5.525-1.482A11.941 11.941 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.937 0-3.756-.497-5.335-1.365l-.383-.228-3.278.879.894-3.278-.25-.4A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  Send on WhatsApp
                </button>
              )}

              {lastBill.emailSent && <p className="text-blue-400 text-xs text-center">📧 Email sent to customer</p>}
            </div>
          )}
        </div>
      </div>

      {/* ── UPI QR MODAL ── */}
      {showUPI && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">UPI Payment</h2>
              <button onClick={()=>setShowUPI(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            {upiLoading ? (
              <div className="flex items-center justify-center h-52"><Loader size={32} className="text-indigo-400 animate-spin"/></div>
            ) : upiData && (
              <>
                <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-lg">
                  <QRCode value={upiData.upiString} size={200} fgColor="#3D2B1F"/>
                </div>
                <p className="text-slate-300 text-sm mb-1">Customer scans with any UPI app</p>
                <p className="text-indigo-400 font-bold text-3xl mb-1">₹{totals.grand.toFixed(2)}</p>
                <p className="text-slate-500 text-xs mb-1">{upiData.upiId}</p>
                <p className="text-slate-500 text-xs mb-5">Amount is pre-filled — customer just confirms</p>
                <div className="flex gap-3">
                  <button onClick={()=>setShowUPI(false)} className="flex-1 btn-ghost justify-center text-sm">Cancel</button>
                  <button onClick={()=>{ setShowUPI(false); generateBill(); }}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                    <CheckCircle size={14}/>Payment Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── HELD BILLS MODAL ── */}
      {showHeld && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-white font-semibold">Held Bills ({heldBills.length})</h2>
              <button onClick={()=>setShowHeld(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {heldBills.length === 0 && <p className="text-slate-500 text-sm text-center py-6">No held bills</p>}
              {heldBills.map(bill => (
                <div key={bill._id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{bill.customerName || bill.label}</p>
                    <p className="text-slate-500 text-xs">{bill.items?.length||0} items · {new Date(bill.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <button onClick={()=>resumeHeld(bill)} className="btn-primary text-xs px-3 py-1.5">
                    <PlayCircle size={12}/>Resume
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
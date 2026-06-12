import { useEffect, useState, useCallback } from 'react';
import axios from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, Save, AlertTriangle, Package, ChevronUp, ChevronDown } from 'lucide-react';

const empty = { name:'', code:'', price:'', quantity:'', category:'' };

export default function Inventory() {
  const [items, setItems]       = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(empty);
  const [saving, setSaving]     = useState(false);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir]   = useState('desc');

  const fetchItems = useCallback(async () => {
    try {
      const res = await axios.get('/api/inventory', { params: { search } });
      setItems(res.data);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openAdd  = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (item) => {
    setEditing(item._id);
    setForm({ name:item.name, code:item.code, price:item.price, quantity:item.quantity, category:item.category||'' });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await axios.put(`/api/inventory/${editing}`, form); toast.success('Item updated!'); }
      else          { await axios.post('/api/inventory', form);           toast.success('Item added!');   }
      setShowForm(false); fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await axios.delete(`/api/inventory/${id}`); toast.success('Deleted'); fetchItems(); }
    catch { toast.error('Failed to delete'); }
  };

  const sort = (field) => {
    if (sortField === field) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sorted = [...items].sort((a,b) => {
    const v1=a[sortField], v2=b[sortField];
    if (typeof v1==='string') return sortDir==='asc' ? v1.localeCompare(v2) : v2.localeCompare(v1);
    return sortDir==='asc' ? v1-v2 : v2-v1;
  });

  const lowCount = items.filter(i=>i.lowStock).length;

  const SortIcon = ({ field }) => sortField===field
    ? (sortDir==='asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)
    : <ChevronUp size={12} className="opacity-20"/>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-slate-400 text-sm">{items.length} items total</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={15}/>Add Item</button>
      </div>

      {/* Low stock banner */}
      {lowCount > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle size={15} className="text-red-400 flex-shrink-0"/>
          <p className="text-red-300 text-sm"><strong>{lowCount} item{lowCount>1?'s':''}</strong> running low (≤5 units). Restock soon.</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        {!search && <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>}
        <input
          className={`input ${!search?'pl-9':'pl-4'} transition-all`}
          placeholder="Search by name, code or category..."
          value={search} onChange={e=>setSearch(e.target.value)}
        />
        {search && <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={14}/></button>}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {[['name','Item Name'],['code','Code'],['category','Category'],['price','Price'],['quantity','Stock'],['','']].map(([f,l]) => (
                  <th key={l} onClick={()=>f&&sort(f)}
                    className={`px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${f?'cursor-pointer hover:text-white':''}`}>
                    <span className="flex items-center gap-1">{l}{f&&<SortIcon field={f}/>}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">Loading...</td></tr>
              ) : sorted.length===0 ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <Package size={30} className="text-slate-600 mx-auto mb-2"/>
                  <p className="text-slate-500 text-sm">No items found</p>
                </td></tr>
              ) : sorted.map(item => (
                <tr key={item._id} className="table-row">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{item.name}</span>
                      {item.lowStock && <span className="badge-low"><AlertTriangle size={9}/>Low</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-indigo-400 text-xs bg-indigo-500/10 px-2 py-1 rounded">{item.code}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-sm">{item.category||'—'}</td>
                  <td className="px-4 py-3.5 text-white font-semibold text-sm">₹{item.price?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5">
                    <span className={`font-semibold text-sm ${item.lowStock?'text-red-400':'text-green-400'}`}>{item.quantity}</span>
                    <span className="text-slate-500 text-xs ml-1">units</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>openEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"><Edit2 size={13}/></button>
                      <button onClick={()=>handleDelete(item._id,item.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-white font-semibold">{editing?'Edit Item':'Add New Item'}</h2>
              <button onClick={()=>setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Item Name *</label>
                <input className="input" placeholder="e.g. Rose Bloom Lawn Suit" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Item Code *</label>
                  <input className="input font-mono" placeholder="KSH-001" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} required/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
                  <input className="input" placeholder="Lawn, Chiffon..." value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Price (₹) *</label>
                  <input className="input" type="number" min="0" step="0.01" placeholder="1499" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Quantity *</label>
                  <input className="input" type="number" min="0" placeholder="10" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} required/>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowForm(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <><Save size={14}/>Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shirt, Lock, User } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ username:'', password:'' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await login(form.username, form.password); toast.success('Welcome back!'); navigate('/'); }
    catch { toast.error('Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"/>
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"/>
      </div>
      <div className="w-full max-w-md relative">
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              <Shirt size={28} className="text-white"/>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">KAUSHEEN</h1>
            <p className="text-slate-400 text-sm mt-1">Admin Portal · Sign in to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Username</label>
              <div className="relative">
                {!form.username && <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>}
                <input className={`input ${!form.username?'pl-9':'pl-4'} transition-all`} placeholder="Enter username"
                  value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                {!form.password && <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>}
                <input type={show?'text':'password'} className={`input ${!form.password?'pl-9':'pl-4'} pr-10 transition-all`}
                  placeholder="Enter password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
                <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {show?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Signing in...</span> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
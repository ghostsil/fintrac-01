"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, RefreshCw, Plus, Calendar, PieChart, Wallet, Fuel, Utensils, Wifi, HelpCircle, TrendingUp, Edit3, X, Check, ArrowUpRight, Search, Download, Filter } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const PROJECT_NAME = "FINTRAC_01";

export default function FintracPro() {
  const [entries, setEntries] = useState<any[]>([]);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [category, setCategory] = useState("FOOD");
  const [type, setType] = useState("EXPENSE");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchLedger = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  };

  useEffect(() => { fetchLedger(); }, []);

  // Filtered Entries for Search
  const filteredEntries = useMemo(() => {
    return entries.filter(e =>
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [entries, searchQuery]);

  // Analytics Logic
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    entries.filter(e => e.type === 'EXPENSE').forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
    });
    return totals;
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amt) return;
    const payload = {
      description: desc.toUpperCase(),
      amount: parseFloat(amt),
      type: type,
      category: type === 'INCOME' ? 'REVENUE' : category
    };
    if (editingId) {
      const { error } = await supabase.from('ledger_entries').update(payload).eq('id', editingId);
      if (!error) setEntries(entries.map(item => item.id === editingId ? { ...item, ...payload } : item));
      setEditingId(null);
    } else {
      const { data, error } = await supabase.from('ledger_entries').insert([payload]).select();
      if (data) setEntries([data[0], ...entries]);
    }
    setDesc(""); setAmt("");
  };

  const exportToCSV = () => {
    const headers = ["Date,Description,Type,Category,Amount\n"];
    const rows = entries.map(e => `${new Date(e.created_at).toLocaleDateString()},${e.description},${e.type},${e.category},${e.amount}\n`);
    const blob = new Blob([headers.concat(rows).join("")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${PROJECT_NAME}_Report.csv`;
    a.click();
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const totalBalance = entries.reduce((acc, curr) => curr.type === 'INCOME' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0);

  return (
    <main className="min-h-screen bg-[#080808] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-[#bfff00]">
            <Wallet size={32} /> {PROJECT_NAME}
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setShowAnalytics(!showAnalytics)} className="p-3 rounded-full bg-white/5 hover:bg-[#bfff00]/20 transition-colors">
              <PieChart size={20} className={showAnalytics ? "text-[#bfff00]" : "text-white/40"} />
            </button>
            <button onClick={fetchLedger} className="p-3 rounded-full bg-white/5 border border-white/10">
              <RefreshCw size={20} className={loading ? "animate-spin text-[#bfff00]" : "text-[#bfff00]"} />
            </button>
          </div>
        </div>

        {/* ANALYTICS SECTION */}
        {showAnalytics && (
          <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {Object.entries(categoryTotals).map(([cat, val]) => (
              <div key={cat} className="bg-[#111] border border-white/10 p-4 rounded-2xl text-center">
                <p className="text-[8px] font-black opacity-30 uppercase mb-1">{cat}</p>
                <p className="text-sm font-black text-[#bfff00]">{val.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* METRICS */}
        <div className="bg-[#111] border border-white/10 p-8 rounded-[2.5rem] mb-12 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase opacity-30 tracking-[0.3em] mb-2">Total Capital</p>
            <h2 className="text-5xl font-black text-white tracking-tighter">{totalBalance.toLocaleString()}</h2>
          </div>
          <button onClick={exportToCSV} className="flex items-center gap-2 text-[10px] font-black uppercase text-[#bfff00] hover:underline">
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* INPUT FORM */}
        <div className={`mb-12 p-8 rounded-[2.5rem] border-2 transition-all ${editingId ? 'bg-amber-500/5 border-amber-500/50' : 'bg-white/[0.02] border-white/5'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/10">
              {['EXPENSE', 'INCOME'].map(t => (
                <button key={t} type="button" onClick={() => setType(t)} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${type === t ? 'bg-[#bfff00] text-black' : 'opacity-40'}`}>{t}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <input placeholder="DESCRIPTION" className="md:col-span-1 bg-transparent border-b-2 border-white/10 py-2 outline-none focus:border-[#bfff00] font-bold text-lg uppercase" value={desc} onChange={e => setDesc(e.target.value)} />
              <input type="number" placeholder="AMOUNT" className="bg-transparent border-b-2 border-white/10 py-2 outline-none focus:border-[#bfff00] font-black text-lg" value={amt} onChange={e => setAmt(e.target.value)} />
              {type === 'EXPENSE' ? (
                <select className="bg-[#151515] border border-white/10 rounded-xl p-2 text-[10px] font-black outline-none" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="FOOD">🍔 FOOD</option>
                  <option value="DATA">📡 DATA</option>
                  <option value="PETROL">⛽ PETROL</option>
                  <option value="MISC">📦 MISC</option>
                </select>
              ) : <div className="p-3 text-[10px] font-black text-emerald-400 opacity-50 uppercase tracking-widest flex items-center">Revenue Stream</div>}
            </div>
            <button className={`w-full py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 ${editingId ? 'bg-amber-500 text-black' : 'bg-[#bfff00] text-black shadow-lg shadow-[#bfff00]/10'}`}>
              {editingId ? <><Check size={18} /> UPDATE</> : <><Plus size={18} /> LOG ENTRY</>}
            </button>
          </form>
        </div>

        {/* SEARCH & LEDGER */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-3xl border border-white/5 focus-within:border-[#bfff00]/30 transition-all">
            <Search size={18} className="opacity-20" />
            <input
              placeholder="SEARCH BY NAME OR CATEGORY..."
              className="bg-transparent w-full outline-none text-[10px] font-black uppercase tracking-widest"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredEntries.map((item) => (
              <div key={item.id} className="bg-[#111] p-5 rounded-3xl border border-white/5 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${item.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                    {item.category === 'FOOD' && <Utensils size={18} />}
                    {item.category === 'DATA' && <Wifi size={18} />}
                    {item.category === 'PETROL' && <Fuel size={18} />}
                    {item.category === 'MISC' && <HelpCircle size={18} />}
                    {item.type === 'INCOME' && <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase text-white">{item.description}</p>
                    <p className="text-[8px] font-bold opacity-30 uppercase tracking-tighter italic">{formatTimestamp(item.created_at)} • {item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className={`text-lg font-black ${item.type === 'INCOME' ? 'text-emerald-400' : 'text-white'}`}>
                    {item.type === 'INCOME' ? '+' : '-'}{Number(item.amount).toLocaleString()}
                  </p>
                  <div className="hidden group-hover:flex gap-2 transition-all">
                    <button onClick={() => {
                      setEditingId(item.id); setDesc(item.description); setAmt(item.amount.toString()); setType(item.type); setCategory(item.category);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} className="p-2 hover:text-[#bfff00] opacity-30 hover:opacity-100"><Edit3 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
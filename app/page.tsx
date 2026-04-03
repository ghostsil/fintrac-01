"use client";

import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Plus, Calendar, PieChart, Wallet, Fuel, Utensils, Wifi, HelpCircle, TrendingUp, Edit3, X, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// EDIT THIS NAME TO YOUR PREFERENCE
const PROJECT_NAME = "FINTRAC_01";

export default function Fintrac() {
  const [entries, setEntries] = useState<any[]>([]);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [category, setCategory] = useState("FOOD");
  const [type, setType] = useState("EXPENSE");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      if (!error) {
        setEntries(entries.map(item => item.id === editingId ? { ...item, ...payload } : item));
        setEditingId(null);
      }
    } else {
      const { data, error } = await supabase.from('ledger_entries').insert([payload]).select();
      if (data) setEntries([data[0], ...entries]);
    }
    setDesc(""); setAmt("");
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm("DELETE THIS LOG?")) return;
    const { error } = await supabase.from('ledger_entries').delete().eq('id', id);
    if (!error) setEntries(entries.filter(e => e.id !== id));
  };

  const isEditable = (createdAt: string) => {
    const entryTime = new Date(createdAt).getTime();
    const now = new Date().getTime();
    return (now - entryTime) < (24 * 60 * 60 * 1000);
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dayName} • ${datePart} • ${timePart}`;
  };

  // Stats
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const getStats = (filterDate: Date) => {
    const filtered = entries.filter(e => new Date(e.created_at) >= filterDate);
    const earned = filtered.filter(e => e.type === 'INCOME').reduce((a, b) => a + Number(b.amount), 0);
    const spent = filtered.filter(e => e.type === 'EXPENSE').reduce((a, b) => a + Number(b.amount), 0);
    return { earned, spent, net: earned - spent };
  };

  const today = getStats(startOfToday);
  const week = getStats(oneWeekAgo);
  const totalBalance = entries.reduce((acc, curr) => curr.type === 'INCOME' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0);

  return (
    <main className="min-h-screen bg-[#080808] text-[#e0e0e0] p-4 md:p-8 font-sans">

      {/* HEADER */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-10 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-[#bfff00]">
            <Wallet size={32} /> {PROJECT_NAME}
          </h1>
          <p className="text-[10px] opacity-40 uppercase font-bold tracking-[0.4em] mt-1 italic">Personal Wealth Infrastructure</p>
        </div>
        <button onClick={fetchLedger} className={`p-3 rounded-full bg-white/5 border border-white/10 ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={20} className="text-[#bfff00]" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto">

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#111] border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={60} /></div>
            <p className="text-[10px] font-black uppercase opacity-40 mb-2">Wallet Total</p>
            <h2 className="text-4xl font-black text-white">{totalBalance.toLocaleString()}<span className="text-xs ml-2 opacity-30 font-normal">NGN</span></h2>
          </div>

          <div className="bg-[#111] border border-white/10 p-6 rounded-3xl">
            <p className="text-[10px] font-black uppercase opacity-40 mb-2 text-emerald-400">Daily Net</p>
            <h2 className={`text-2xl font-black ${today.net >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {today.net >= 0 ? '+' : ''}{today.net.toLocaleString()}
            </h2>
            <p className="text-[8px] opacity-30 mt-1 uppercase">Rev: {today.earned.toLocaleString()} / Exp: {today.spent.toLocaleString()}</p>
          </div>

          <div className="bg-[#111] border border-white/10 p-6 rounded-3xl">
            <p className="text-[10px] font-black uppercase opacity-40 mb-2 text-blue-400">Weekly Savings</p>
            <h2 className="text-2xl font-black text-blue-400">+{week.net.toLocaleString()}</h2>
            <p className="text-[8px] opacity-30 mt-1 uppercase">Past 7 Days Cycle</p>
          </div>
        </div>

        {/* INPUT / EDIT FORM */}
        <div className={`mb-16 p-8 rounded-[2.5rem] border-2 transition-all ${editingId ? 'bg-amber-500/5 border-amber-500/50' : 'bg-white/[0.02] border-white/5 shadow-2xl'}`}>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                {['EXPENSE', 'INCOME'].map(t => (
                  <button
                    key={t} type="button" onClick={() => setType(t)}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${type === t ? 'bg-[#bfff00] text-black' : 'hover:bg-white/5 opacity-40'}`}
                  >
                    {t === 'INCOME' ? 'ADD REVENUE' : 'ADD EXPENSE'}
                  </button>
                ))}
              </div>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setDesc(""); setAmt(""); }} className="text-rose-500 font-black text-[10px] uppercase underline flex items-center gap-1">
                  <X size={14} /> Abort Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black opacity-30 uppercase tracking-widest ml-1">Source / Item Name</label>
                <input
                  placeholder={type === 'INCOME' ? "E.G. PROJECT PAYMENT" : "E.G. FUEL / GROCERIES"}
                  className="w-full bg-transparent border-b-2 border-white/10 py-3 outline-none focus:border-[#bfff00] font-bold text-xl uppercase transition-colors"
                  value={desc} onChange={e => setDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black opacity-30 uppercase tracking-widest ml-1">Amount</label>
                  <input
                    type="number" placeholder="0.00"
                    className="w-full bg-transparent border-b-2 border-white/10 py-3 outline-none focus:border-[#bfff00] font-black text-2xl transition-colors"
                    value={amt} onChange={e => setAmt(e.target.value)}
                  />
                </div>
                {type === 'EXPENSE' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black opacity-30 uppercase tracking-widest ml-1">Category</label>
                    <select
                      className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-[10px] font-black outline-none h-[50px] mt-1"
                      value={category} onChange={e => setCategory(e.target.value)}
                    >
                      <option value="FOOD">🍔 FOOD</option>
                      <option value="DATA">📡 DATA</option>
                      <option value="PETROL">⛽ PETROL</option>
                      <option value="MISC">📦 MISC</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button className={`w-full py-5 rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-3 transition-all ${editingId ? 'bg-amber-500 text-black' : 'bg-[#bfff00] text-black hover:scale-[1.01] active:scale-95 shadow-lg shadow-[#bfff00]/10'}`}>
              {editingId ? <><Check size={18} /> UPDATE RECORD</> : <><Plus size={18} /> CONFIRM TRANSACTION</>}
            </button>
          </form>
        </div>

        {/* LOGS */}
        <div className="space-y-4 pb-20">
          <div className="flex justify-between items-center px-2">
            <p className="text-[10px] font-black opacity-20 uppercase tracking-[0.5em]">Activity Ledger</p>
            <div className="h-[1px] flex-1 mx-6 bg-white/5"></div>
          </div>

          {entries.map((item) => (
            <div key={item.id} className="bg-[#111] p-5 rounded-3xl border border-white/5 flex flex-wrap md:flex-nowrap justify-between items-center group hover:border-[#bfff00]/30 transition-all">
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl ${item.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                  {item.category === 'FOOD' && <Utensils size={20} />}
                  {item.category === 'DATA' && <Wifi size={20} />}
                  {item.category === 'PETROL' && <Fuel size={20} />}
                  {item.category === 'MISC' && <HelpCircle size={20} />}
                  {item.type === 'INCOME' && <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-tight text-white mb-1">{item.description}</p>
                  <p className="text-[9px] font-bold opacity-30 uppercase tracking-tighter italic">{formatTimestamp(item.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-8 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <p className={`text-xl font-black ${item.type === 'INCOME' ? 'text-emerald-400' : 'text-white'}`}>
                    {item.type === 'INCOME' ? '+' : '-'}{Number(item.amount).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  {isEditable(item.created_at) ? (
                    <>
                      <button onClick={() => {
                        setEditingId(item.id);
                        setDesc(item.description);
                        setAmt(item.amount.toString());
                        setType(item.type);
                        setCategory(item.category);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} className="p-3 bg-white/5 text-white/20 rounded-xl hover:bg-[#bfff00] hover:text-black transition-all">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => deleteEntry(item.id)} className="p-3 bg-white/5 text-white/20 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="p-3 opacity-10 cursor-not-allowed"><Check size={16} /></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
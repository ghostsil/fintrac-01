"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, RefreshCw, Plus, Calendar, Wallet, Fuel, Utensils, Wifi, HelpCircle, TrendingUp, Edit3, X, Check, ChevronDown, ChevronRight, Zap, Box, Smartphone } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const PROJECT_NAME = "FINTRAC_01";

export default function FintracComplete() {
  const [entries, setEntries] = useState<any[]>([]);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [category, setCategory] = useState("FOOD");
  const [subCategory, setSubCategory] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([]);

  const fetchLedger = async () => {
    setLoading(true);
    const { data } = await supabase.from('ledger_entries').select('*').order('created_at', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLedger();
    const now = new Date();
    setExpandedMonths([now.toLocaleString('default', { month: 'long' }).toUpperCase()]);
  }, []);

  function getWeekNumber(d: Date) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));
    const yearStart = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  const organizedData = useMemo(() => {
    const months: Record<string, any> = {};
    entries.forEach(e => {
      const date = new Date(e.created_at);
      const mKey = date.toLocaleString('default', { month: 'long' }).toUpperCase();
      const wKey = `WEEK ${getWeekNumber(date)}`;

      if (!months[mKey]) months[mKey] = { revenue: 0, expense: 0, weeks: {} };
      if (!months[mKey].weeks[wKey]) months[mKey].weeks[wKey] = { revenue: 0, expense: 0, entries: [] };

      months[mKey].weeks[wKey].entries.push(e);
      if (e.type === 'INCOME') {
        months[mKey].revenue += Number(e.amount);
        months[mKey].weeks[wKey].revenue += Number(e.amount);
      } else {
        months[mKey].expense += Number(e.amount);
        months[mKey].weeks[wKey].expense += Number(e.amount);
      }
    });
    return months;
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amt) return;

    let finalCategory = category;
    if ((category === "DATA" || category === "MISC") && subCategory) {
      finalCategory = `${category}: ${subCategory}`;
    }

    const payload = {
      description: desc.toUpperCase(),
      amount: parseFloat(amt),
      type: type,
      category: type === 'INCOME' ? 'REVENUE' : finalCategory
    };

    if (editingId) {
      const { error } = await supabase.from('ledger_entries').update(payload).eq('id', editingId);
      if (!error) {
        setEntries(entries.map(item => item.id === editingId ? { ...item, ...payload } : item));
        setEditingId(null);
      }
    } else {
      const { data } = await supabase.from('ledger_entries').insert([payload]).select();
      if (data) setEntries([data[0], ...entries]);
    }

    setDesc(""); setAmt(""); setSubCategory("");
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm("ARE YOU SURE YOU WANT TO DELETE THIS LOG?")) return;
    const { error } = await supabase.from('ledger_entries').delete().eq('id', id);
    if (!error) setEntries(entries.filter(e => e.id !== id));
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setDesc(item.description);
    setAmt(item.amount.toString());
    setType(item.type);

    if (item.category.includes(':')) {
      const [cat, sub] = item.category.split(': ');
      setCategory(cat);
      setSubCategory(sub);
    } else {
      setCategory(item.category);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalBalance = entries.reduce((acc, curr) => curr.type === 'INCOME' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0);

  return (
    <main className="min-h-screen bg-[#050505] text-[#d1d1d1] p-4 md:p-10 font-sans italic">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-end mb-10 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-[#bfff00] uppercase">{PROJECT_NAME}</h1>
            <p className="text-[9px] opacity-30 font-bold tracking-[0.4em] mt-1 italic">V2.1 • LIVE INVENTORY CONTROL</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black opacity-20 uppercase tracking-widest">Global Wallet</p>
            <p className="text-2xl font-black text-white">{totalBalance.toLocaleString()}</p>
          </div>
        </div>

        {/* INPUT FORM */}
        <div className={`p-8 rounded-[2.5rem] border transition-all mb-12 shadow-2xl ${editingId ? 'bg-amber-500/5 border-amber-500/50' : 'bg-[#111] border-white/5'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-2 p-1 bg-black rounded-2xl border border-white/5">
                {['EXPENSE', 'INCOME'].map(t => (
                  <button key={t} type="button" onClick={() => { setType(t); setCategory(t === 'INCOME' ? 'REVENUE' : 'FOOD'); }} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${type === t ? 'bg-[#bfff00] text-black' : 'opacity-20'}`}>{t}</button>
                ))}
              </div>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setDesc(""); setAmt(""); }} className="text-rose-500 text-[9px] font-black uppercase underline flex items-center gap-1">
                  <X size={12} /> Cancel Edit
                </button>
              )}
            </div>

            {type === 'INCOME' && (
              <p className="text-[10px] font-black text-[#bfff00] uppercase tracking-widest border-l-2 border-[#bfff00] pl-3 italic">Daily Income Report</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input placeholder="DESCRIPTION" className="bg-transparent border-b border-white/10 p-2 outline-none focus:border-[#bfff00] font-bold uppercase text-lg" value={desc} onChange={e => setDesc(e.target.value)} />
              <input type="number" placeholder="AMOUNT" className="bg-transparent border-b border-white/10 p-2 outline-none focus:border-[#bfff00] font-black text-xl" value={amt} onChange={e => setAmt(e.target.value)} />
            </div>

            {type === 'EXPENSE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select className="bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black outline-none" value={category} onChange={e => { setCategory(e.target.value); setSubCategory(""); }}>
                  <option value="FOOD">🍔 FOOD</option>
                  <option value="DATA">📡 DATA</option>
                  <option value="PETROL">⛽ PETROL</option>
                  <option value="NEPA">⚡ NEPA</option>
                  <option value="MISC">📦 MISC</option>
                </select>

                {(category === 'DATA' || category === 'MISC') && (
                  <select className="bg-black border border-[#bfff00]/30 rounded-xl p-3 text-[10px] font-black outline-none text-[#bfff00]" value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                    <option value="">{category === 'DATA' ? 'SELECT PROVIDER' : 'SELECT TYPE'}</option>
                    {category === 'DATA' ? (
                      <><option value="MTN">MTN</option><option value="AIRTEL">AIRTEL</option></>
                    ) : (
                      <><option value="INVENTORY">📋 INVENTORY</option><option value="OTHERS">🌀 OTHERS</option></>
                    )}
                  </select>
                )}
              </div>
            )}
            <button className={`w-full py-5 rounded-2xl font-black text-[11px] tracking-widest shadow-lg transition-all ${editingId ? 'bg-amber-500 text-black' : 'bg-[#bfff00] text-black shadow-[#bfff00]/5'}`}>
              {editingId ? 'UPDATE RECORD' : 'LOG TRANSACTION'}
            </button>
          </form>
        </div>

        {/* NESTED LISTING */}
        <div className="space-y-8 pb-20">
          {Object.keys(organizedData).map(mKey => {
            const mSaved = organizedData[mKey].revenue - organizedData[mKey].expense;
            return (
              <div key={mKey} className="rounded-[2.5rem] bg-white/[0.02] border border-white/5 overflow-hidden">
                <button onClick={() => setExpandedMonths(prev => prev.includes(mKey) ? prev.filter(k => k !== mKey) : [...prev, mKey])}
                  className="w-full p-8 flex justify-between items-center bg-white/[0.03] hover:bg-white/[0.06] transition-all text-left">
                  <div className="flex items-center gap-4">
                    {expandedMonths.includes(mKey) ? <ChevronDown className="text-[#bfff00]" /> : <ChevronRight />}
                    <h2 className="text-xl font-black tracking-widest">{mKey}</h2>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black uppercase ${mSaved >= 0 ? 'text-[#bfff00]' : 'text-rose-500'}`}>
                      {mSaved >= 0 ? `Saved to Bank: ${mSaved.toLocaleString()}` : `Deficit: ${mSaved.toLocaleString()}`}
                    </p>
                  </div>
                </button>

                {expandedMonths.includes(mKey) && (
                  <div className="p-4 space-y-4">
                    {Object.keys(organizedData[mKey].weeks).sort().reverse().map(wKey => {
                      const wSaved = organizedData[mKey].weeks[wKey].revenue - organizedData[mKey].weeks[wKey].expense;
                      return (
                        <div key={wKey} className="rounded-3xl border border-white/5 bg-black/40 overflow-hidden">
                          <button onClick={() => setExpandedWeeks(prev => prev.includes(wKey) ? prev.filter(k => k !== wKey) : [...prev, wKey])}
                            className="w-full p-5 flex justify-between items-center hover:bg-white/5 transition-all">
                            <p className="text-[10px] font-black text-white/40 uppercase">{wKey}</p>
                            <p className={`text-[10px] font-black ${wSaved >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {wSaved >= 0 ? `Saved: ${wSaved.toLocaleString()}` : `Loss: ${wSaved.toLocaleString()}`}
                            </p>
                          </button>

                          {expandedWeeks.includes(wKey) && (
                            <div className="px-4 pb-4 space-y-2">
                              {organizedData[mKey].weeks[wKey].entries.map((item: any) => (
                                <div key={item.id} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/[0.02] group">
                                  <div className="flex items-center gap-4">
                                    <div className="text-[#bfff00] opacity-30">
                                      {item.category.includes('FOOD') && <Utensils size={14} />}
                                      {item.category.includes('PETROL') && <Fuel size={14} />}
                                      {item.category.includes('NEPA') && <Zap size={14} />}
                                      {item.category.includes('DATA') && <Smartphone size={14} />}
                                      {item.category.includes('INVENTORY') && <Box size={14} />}
                                      {item.type === 'INCOME' && <TrendingUp size={14} />}
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-black uppercase text-white tracking-tight">{item.description}</p>
                                      <p className="text-[8px] font-bold opacity-20 uppercase tracking-tighter">
                                        {new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'short' })} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <p className={`text-sm font-black ${item.type === 'INCOME' ? 'text-emerald-400' : 'text-white'}`}>
                                      {item.type === 'INCOME' ? '+' : '-'}{Number(item.amount).toLocaleString()}
                                    </p>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => startEdit(item)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"><Edit3 size={14} /></button>
                                      <button onClick={() => deleteEntry(item.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
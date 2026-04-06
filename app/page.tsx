"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, RefreshCw, Plus, Calendar, Wallet, Fuel, Utensils, Wifi, HelpCircle, TrendingUp, Edit3, X, Check, ChevronDown, ChevronRight, Zap, Box, List } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const PROJECT_NAME = "FINTRAC_01";

export default function FintracUltra() {
  const [entries, setEntries] = useState<any[]>([]);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [category, setCategory] = useState("FOOD");
  const [subCategory, setSubCategory] = useState("OTHERS");
  const [type, setType] = useState("EXPENSE");
  const [loading, setLoading] = useState(false);
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
    const finalCategory = category === "MISC" ? `MISC: ${subCategory}` : category;
    const payload = {
      description: desc.toUpperCase(),
      amount: parseFloat(amt),
      type: type,
      category: type === 'INCOME' ? 'REVENUE' : finalCategory
    };
    const { data } = await supabase.from('ledger_entries').insert([payload]).select();
    if (data) {
      setEntries([data[0], ...entries]);
      setDesc(""); setAmt("");
    }
  };

  const totalBalance = entries.reduce((acc, curr) => curr.type === 'INCOME' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0);

  return (
    <main className="min-h-screen bg-[#050505] text-[#d1d1d1] p-4 md:p-10 font-sans italic">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-end mb-10 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-[#bfff00] uppercase">{PROJECT_NAME}</h1>
            <p className="text-[9px] opacity-30 font-bold tracking-[0.4em] mt-1">NESTED FINANCIAL INFRASTRUCTURE</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black opacity-20 uppercase">Lifetime Balance</p>
            <p className="text-2xl font-black text-white">{totalBalance.toLocaleString()}</p>
          </div>
        </div>

        {/* INPUT FORM */}
        <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 mb-12 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2 p-1 bg-black rounded-2xl border border-white/5">
              {['EXPENSE', 'INCOME'].map(t => (
                <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${type === t ? 'bg-[#bfff00] text-black' : 'opacity-20'}`}>{t === 'INCOME' ? 'ADD REVENUE' : 'ADD EXPENSE'}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input placeholder="DESCRIPTION / SOURCE" className="bg-transparent border-b border-white/10 p-2 outline-none focus:border-[#bfff00] font-bold uppercase text-lg" value={desc} onChange={e => setDesc(e.target.value)} />
              <input type="number" placeholder="AMOUNT (NGN)" className="bg-transparent border-b border-white/10 p-2 outline-none focus:border-[#bfff00] font-black text-xl" value={amt} onChange={e => setAmt(e.target.value)} />
            </div>

            {type === 'EXPENSE' && (
              <div className="grid grid-cols-2 gap-4">
                <select className="bg-black border border-white/10 rounded-xl p-3 text-[10px] font-black outline-none" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="FOOD">🍔 FOOD</option>
                  <option value="DATA">📡 DATA</option>
                  <option value="PETROL">⛽ PETROL</option>
                  <option value="NEPA">⚡ NEPA</option>
                  <option value="MISC">📦 MISC</option>
                </select>
                {category === 'MISC' && (
                  <select className="bg-black border border-[#bfff00]/30 rounded-xl p-3 text-[10px] font-black outline-none text-[#bfff00]" value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                    <option value="INVENTORY">📋 INVENTORY</option>
                    <option value="OTHERS">🌀 OTHERS</option>
                  </select>
                )}
              </div>
            )}
            <button className="w-full bg-[#bfff00] text-black py-5 rounded-2xl font-black text-[11px] tracking-widest shadow-lg shadow-[#bfff00]/5 active:scale-95 transition-all">EXECUTE TRANSACTION</button>
          </form>
        </div>

        {/* NESTED LISTING */}
        <div className="space-y-8">
          {Object.keys(organizedData).map(mKey => (
            <div key={mKey} className="rounded-[2.5rem] bg-white/[0.02] border border-white/5 overflow-hidden">
              {/* MONTH HEADER */}
              <button onClick={() => setExpandedMonths(prev => prev.includes(mKey) ? prev.filter(k => k !== mKey) : [...prev, mKey])}
                className="w-full p-8 flex justify-between items-center bg-white/[0.03] hover:bg-white/[0.06] transition-all">
                <div className="flex items-center gap-4">
                  {expandedMonths.includes(mKey) ? <ChevronDown className="text-[#bfff00]" /> : <ChevronRight />}
                  <h2 className="text-xl font-black tracking-widest">{mKey}</h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-[#bfff00] uppercase">Saved to Bank: {(organizedData[mKey].revenue - organizedData[mKey].expense).toLocaleString()}</p>
                  <p className="text-[8px] opacity-30 font-bold uppercase">OUT: {organizedData[mKey].expense.toLocaleString()}</p>
                </div>
              </button>

              {expandedMonths.includes(mKey) && (
                <div className="p-4 space-y-4">
                  {Object.keys(organizedData[mKey].weeks).sort().reverse().map(wKey => (
                    <div key={wKey} className="rounded-3xl border border-white/5 bg-black/40 overflow-hidden">
                      {/* WEEK HEADER */}
                      <button onClick={() => setExpandedWeeks(prev => prev.includes(wKey) ? prev.filter(k => k !== wKey) : [...prev, wKey])}
                        className="w-full p-5 flex justify-between items-center hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-3">
                          <p className="text-[10px] font-black text-white/40 uppercase">{wKey}</p>
                        </div>
                        <p className="text-[10px] font-black text-emerald-400">Weekly Saved: {(organizedData[mKey].weeks[wKey].revenue - organizedData[mKey].weeks[wKey].expense).toLocaleString()}</p>
                      </button>

                      {expandedWeeks.includes(wKey) && (
                        <div className="px-4 pb-4 space-y-2">
                          {organizedData[mKey].weeks[wKey].entries.map((item: any) => (
                            <div key={item.id} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/[0.02]">
                              <div className="flex items-center gap-4">
                                <div className="text-[#bfff00] opacity-50">
                                  {item.category.includes('FOOD') && <Utensils size={14} />}
                                  {item.category.includes('PETROL') && <Fuel size={14} />}
                                  {item.category.includes('NEPA') && <Zap size={14} />}
                                  {item.category.includes('DATA') && <Wifi size={14} />}
                                  {item.category.includes('INVENTORY') && <Box size={14} />}
                                  {item.category.includes('REVENUE') && <TrendingUp size={14} />}
                                </div>
                                <div>
                                  <p className="text-[11px] font-black uppercase text-white tracking-tight">{item.description}</p>
                                  <p className="text-[8px] font-bold opacity-20 uppercase">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.category}</p>
                                </div>
                              </div>
                              <p className={`text-sm font-black ${item.type === 'INCOME' ? 'text-emerald-400' : 'text-white'}`}>
                                {item.type === 'INCOME' ? '+' : '-'}{Number(item.amount).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
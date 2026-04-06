"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, RefreshCw, Plus, Calendar, Wallet, Fuel, Utensils, Wifi, HelpCircle, TrendingUp, Edit3, X, Check, ChevronDown, ChevronRight, Smartphone } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const PROJECT_NAME = "FINTRAC_01";

export default function FintracPrecision() {
  const [entries, setEntries] = useState<any[]>([]);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [category, setCategory] = useState("FOOD");
  const [dataProvider, setDataProvider] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [loading, setLoading] = useState(false);
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
    setExpandedWeeks([getWeekKey(now)]);
  }, []);

  function getWeekKey(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    const monthName = d.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    return `${d.getFullYear()} • ${monthName} • WEEK ${weekNo}`;
  }

  const groupedEntries = useMemo(() => {
    const groups: Record<string, any> = {};
    entries.forEach(e => {
      const weekKey = getWeekKey(new Date(e.created_at));
      if (!groups[weekKey]) groups[weekKey] = { entries: [], revenue: 0, expense: 0 };
      groups[weekKey].entries.push(e);
      if (e.type === 'INCOME') groups[weekKey].revenue += Number(e.amount);
      else groups[weekKey].expense += Number(e.amount);
    });
    return groups;
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amt) return;

    // Auto-append provider to description if Data is selected
    const finalDesc = (category === 'DATA' && dataProvider)
      ? `${dataProvider}: ${desc.toUpperCase()}`
      : desc.toUpperCase();

    const payload = {
      description: finalDesc,
      amount: parseFloat(amt),
      type: type,
      category: type === 'INCOME' ? 'REVENUE' : category
    };

    const { data } = await supabase.from('ledger_entries').insert([payload]).select();
    if (data) {
      setEntries([data[0], ...entries]);
      setDesc(""); setAmt(""); setDataProvider("");
    }
  };

  const totalBalance = entries.reduce((acc, curr) => curr.type === 'INCOME' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0);

  return (
    <main className="min-h-screen bg-[#080808] text-[#e0e0e0] p-4 md:p-8 font-sans italic">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-[#bfff00] flex items-center gap-2">
              <Wallet size={28} /> {PROJECT_NAME}
            </h1>
            <p className="text-[9px] opacity-40 uppercase tracking-[0.3em] font-bold">Lagos Infrastructure • {new Date().getFullYear()}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black opacity-30 uppercase">Liquid Assets</p>
            <p className="text-xl font-black text-[#bfff00]">{totalBalance.toLocaleString()} <span className="text-[10px]">NGN</span></p>
          </div>
        </div>

        {/* INPUT BOX */}
        <div className="bg-[#111] p-6 rounded-[2rem] border border-white/5 mb-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              {['EXPENSE', 'INCOME'].map(t => (
                <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${type === t ? 'bg-[#bfff00] text-black' : 'bg-white/5 opacity-30'}`}>{t}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="DESCRIPTION / SOURCE" className="bg-transparent border-b border-white/10 p-2 outline-none focus:border-[#bfff00] font-bold uppercase text-sm" value={desc} onChange={e => setDesc(e.target.value)} />
              <input type="number" placeholder="AMOUNT" className="bg-transparent border-b border-white/10 p-2 outline-none focus:border-[#bfff00] font-black" value={amt} onChange={e => setAmt(e.target.value)} />

              {type === 'EXPENSE' && (
                <select className="bg-black border border-white/10 rounded-xl p-2 text-[10px] font-black outline-none" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="FOOD">🍔 FOOD</option>
                  <option value="DATA">📡 DATA / WIFI</option>
                  <option value="PETROL">⛽ PETROL</option>
                  <option value="MISC">📦 MISC</option>
                </select>
              )}
            </div>

            {/* QUICK DATA PROVIDER SELECT */}
            {category === 'DATA' && type === 'EXPENSE' && (
              <div className="flex gap-2 animate-in fade-in zoom-in duration-300">
                {['MTN', 'AIRTEL', 'OTHER'].map(p => (
                  <button
                    key={p} type="button" onClick={() => setDataProvider(p)}
                    className={`flex-1 py-2 rounded-lg text-[9px] font-black border ${dataProvider === p ? 'bg-[#bfff00]/20 border-[#bfff00] text-[#bfff00]' : 'border-white/5 text-white/30'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <button className="w-full bg-[#bfff00] text-black py-4 rounded-xl font-black text-xs shadow-lg shadow-[#bfff00]/10 active:scale-95 transition-all">EXECUTE ENTRY</button>
          </form>
        </div>

        {/* NESTED WEEKLY LIST */}
        <div className="space-y-6">
          {Object.keys(groupedEntries).sort().reverse().map(weekKey => (
            <div key={weekKey} className="border border-white/5 rounded-[2rem] overflow-hidden bg-white/[0.01]">
              <button
                onClick={() => setExpandedWeeks(prev => prev.includes(weekKey) ? prev.filter(k => k !== weekKey) : [...prev, weekKey])}
                className="w-full p-6 flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {expandedWeeks.includes(weekKey) ? <ChevronDown size={18} className="text-[#bfff00]" /> : <ChevronRight size={18} />}
                  <div className="text-left">
                    <p className="text-xs font-black uppercase text-[#bfff00] tracking-tighter">{weekKey}</p>
                    <p className="text-[8px] opacity-20 uppercase font-black tracking-widest">Cycle Performance</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">{(groupedEntries[weekKey].revenue - groupedEntries[weekKey].expense).toLocaleString()}</p>
                  <p className="text-[8px] font-bold opacity-30 uppercase">REV: {groupedEntries[weekKey].revenue.toLocaleString()} / EXP: {groupedEntries[weekKey].expense.toLocaleString()}</p>
                </div>
              </button>

              {expandedWeeks.includes(weekKey) && (
                <div className="p-4 space-y-2 bg-black/20">
                  {groupedEntries[weekKey].entries.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-[#111] p-4 rounded-2xl border border-white/5 group">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${item.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                          {item.category === 'FOOD' ? <Utensils size={14} /> : item.category === 'PETROL' ? <Fuel size={14} /> : item.category === 'DATA' ? <Wifi size={14} /> : <TrendingUp size={14} />}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight leading-none mb-1">{item.description}</p>
                          <p className="text-[7px] font-bold opacity-20 uppercase tracking-widest">
                            {new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
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
      </div>
    </main>
  );
}
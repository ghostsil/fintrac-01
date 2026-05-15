"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, TrendingUp, Edit3, Landmark, Receipt, RefreshCw, CalendarDays, ChevronDown, Clock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function FintracRevamp() {
  const [entries, setEntries] = useState<any[]>([]);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [category, setCategory] = useState("FOOD");
  const [subCategory, setSubCategory] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [liveTime, setLiveTime] = useState("");

  // Track expanded state for Months and Weeks
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const toggleMonth = (mKey: string) => {
    setExpandedMonths(prev => ({ ...prev, [mKey]: !prev[mKey] }));
  };

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));
  };

  const fetchLedger = async () => {
    setIsSyncing(true);
    const { data } = await supabase
      .from('ledger_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setEntries(data);
    setIsSyncing(false);
  };

  useEffect(() => {
    fetchLedger();
    const timer = setInterval(() => {
      const now = new Date();
      setLiveTime(now.toLocaleString('default', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).toUpperCase());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    return entries.reduce((acc, curr) => {
      const val = Number(curr.amount);
      const t = curr.type?.toUpperCase();
      if (t === 'INCOME') acc.income += val;
      else if (t === 'BANK') acc.bank += val;
      else acc.expense += val;
      return acc;
    }, { income: 0, expense: 0, bank: 0 });
  }, [entries]);

  const organizedData = useMemo(() => {
    const months: Record<string, any> = {};

    entries.forEach(e => {
      const date = new Date(e.created_at);
      const mKey = date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();

      const tempDate = new Date(date.getTime());
      tempDate.setHours(0, 0, 0, 0);
      const dayNum = tempDate.getDay();
      const diffToMonday = tempDate.getDate() - (dayNum === 0 ? 6 : dayNum - 1);
      const mondayDate = new Date(tempDate.setDate(diffToMonday));
      const sundayDate = new Date(tempDate.setDate(mondayDate.getDate() + 6));

      const wKey = `WEEK: ${mondayDate.getDate()}/${mondayDate.getMonth() + 1} - ${sundayDate.getDate()}/${sundayDate.getMonth() + 1}`;
      const dKey = date.toLocaleString('default', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

      if (!months[mKey]) months[mKey] = { income: 0, expense: 0, bank: 0, weeks: {}, sortVal: date.getTime() };
      if (!months[mKey].weeks[wKey]) months[mKey].weeks[wKey] = { income: 0, expense: 0, bank: 0, days: {}, sortVal: mondayDate.getTime() };
      if (!months[mKey].weeks[wKey].days[dKey]) months[mKey].weeks[wKey].days[dKey] = [];

      months[mKey].weeks[wKey].days[dKey].push(e);
      const val = Number(e.amount);
      const t = e.type?.toUpperCase();
      if (t === 'INCOME') { months[mKey].income += val; months[mKey].weeks[wKey].income += val; }
      else if (t === 'BANK') { months[mKey].bank += val; months[mKey].weeks[wKey].bank += val; }
      else { months[mKey].expense += val; months[mKey].weeks[wKey].expense += val; }
    });

    return months;
  }, [entries]);

  const sortedMonthKeys = useMemo(() => {
    return Object.keys(organizedData).sort((a, b) => organizedData[b].sortVal - organizedData[a].sortVal);
  }, [organizedData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amt) return;
    let finalDesc = desc.trim().toUpperCase();
    if (!finalDesc) finalDesc = subCategory ? `${subCategory} ${type}` : `${type} ENTRY`;
    let finalCategory = category;
    if (type === 'BANK') finalCategory = `BANK: ${subCategory || 'GENERAL'}`;
    else if ((category === "DATA" || category === "MISC") && subCategory) finalCategory = `${category}: ${subCategory}`;
    const payload = { description: finalDesc, amount: parseFloat(amt), type: type.toUpperCase(), category: type === 'INCOME' ? 'REVENUE' : finalCategory };
    const { data, error } = await supabase.from('ledger_entries').insert([payload]).select();
    if (!error && data) { setEntries([data[0], ...entries]); setDesc(""); setAmt(""); setSubCategory(""); }
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm("DELETE?")) return;
    await supabase.from('ledger_entries').delete().eq('id', id);
    fetchLedger();
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#f0f0f0] p-4 md:p-10 font-sans italic">
      <style>{`
        .pop-accordion { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s ease-out, opacity 0.2s; opacity: 0; }
        .pop-accordion.open { grid-template-rows: 1fr; opacity: 1; margin-top: 20px; }
        .pop-content { overflow: hidden; }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* HUD & Form - Same as previous stable build */}
        <div className="flex justify-between items-center mb-8 px-4 border-b border-white/5 pb-4">
          <div>
            <h1 className="text-[10px] font-black tracking-[0.5em] opacity-30 uppercase">Fintrac // 02</h1>
            <p className="text-[9px] font-mono font-bold text-[#bfff00] mt-1 tracking-wider"><Clock size={10} className="inline mr-1" /> {liveTime || "SYSTEM READY"}</p>
          </div>
          <button onClick={fetchLedger} className={`p-2 transition-all ${isSyncing ? 'animate-spin opacity-100' : 'opacity-20 hover:opacity-100'}`}><RefreshCw size={16} /></button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-10">
          {[{ label: 'Income', val: stats.income, color: 'text-[#bfff00]' }, { label: 'Spent', val: stats.expense, color: 'text-rose-500' }, { label: 'In Bank', val: stats.bank, color: 'text-sky-400' }].map((s, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 p-5 rounded-[2rem] text-center"><p className="text-[7px] font-black uppercase opacity-20 tracking-widest mb-1">{s.label}</p><p className={`text-xl font-black ${s.color}`}>{s.val.toLocaleString()}</p></div>
          ))}
        </div>

        {/* INPUT FORM */}
        <div className="p-8 rounded-[3rem] border border-white/5 bg-[#0a0a0a] shadow-2xl mb-16">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex gap-2 p-1.5 bg-black rounded-2xl border border-white/5">
              {['EXPENSE', 'INCOME', 'BANK'].map(t => (
                <button key={t} type="button" onClick={() => { setType(t); setCategory(t === 'INCOME' ? 'REVENUE' : t === 'BANK' ? 'BANK' : 'FOOD'); }} className={`flex-1 py-3.5 rounded-xl text-[9px] font-black transition-all ${type === t ? 'bg-[#bfff00] text-black shadow-lg shadow-[#bfff00]/20' : 'opacity-20'}`}>{t}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <input placeholder="DESCRIPTION" className="bg-transparent border-b border-white/10 p-2 outline-none focus:border-[#bfff00] font-bold uppercase text-2xl" value={desc} onChange={e => setDesc(e.target.value)} />
              <input type="number" placeholder="AMOUNT" className="bg-transparent border-b border-white/10 p-2 outline-none focus:border-[#bfff00] font-black text-3xl" value={amt} onChange={e => setAmt(e.target.value)} />
            </div>
            <button className="w-full py-6 rounded-2xl font-black text-[10px] tracking-[0.4em] bg-[#bfff00] text-black shadow-xl">EXECUTE</button>
          </form>
        </div>

        {/* NESTED VIEW */}
        <div className="space-y-10 pb-20">
          {sortedMonthKeys.map(mKey => (
            <div key={mKey} className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-6 md:p-8">
              <button onClick={() => toggleMonth(mKey)} className="w-full flex justify-between items-end mb-2 text-left group">
                <h2 className="text-4xl font-black uppercase tracking-tighter group-hover:text-[#bfff00] transition-colors">{mKey}</h2>
                <div className="text-right">
                  <p className="text-[8px] font-black opacity-30 tracking-[0.3em] mb-1 uppercase">Month Yield</p>
                  <p className="text-xl font-black text-[#bfff00]">{organizedData[mKey].income.toLocaleString()}</p>
                </div>
              </button>

              <div className={`pop-accordion ${expandedMonths[mKey] ? 'open' : ''}`}>
                <div className="pop-content grid grid-cols-1 gap-6">
                  {Object.keys(organizedData[mKey].weeks).sort((a, b) => organizedData[mKey].weeks[b].sortVal - organizedData[mKey].weeks[a].sortVal).map(wKey => {
                    const weekId = `${mKey}-${wKey}`;
                    const isExp = expandedWeeks[weekId];
                    return (
                      <div key={wKey} className={`bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden transition-all ${isExp ? 'bg-white/[0.04]' : ''}`}>
                        <button onClick={() => toggleWeek(weekId)} className="w-full flex justify-between items-center p-6 text-left">
                          <div className="flex items-center gap-4">
                            <ChevronDown size={14} className={`transition-transform duration-300 ${isExp ? 'rotate-180 text-[#bfff00]' : 'opacity-20'}`} />
                            <p className="text-[10px] font-black tracking-widest uppercase opacity-60">{wKey}</p>
                          </div>
                          <div className="flex gap-4 text-right">
                            <div><p className="text-[7px] opacity-20 font-black uppercase">Spent</p><p className="text-[10px] font-black text-rose-500">-{organizedData[mKey].weeks[wKey].expense.toLocaleString()}</p></div>
                            <div><p className="text-[7px] opacity-20 font-black uppercase">Bank</p><p className="text-[10px] font-black text-sky-400">+{organizedData[mKey].weeks[wKey].bank.toLocaleString()}</p></div>
                          </div>
                        </button>
                        {isExp && (
                          <div className="px-6 pb-6 pt-2 space-y-6">
                            {Object.keys(organizedData[mKey].weeks[wKey].days).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(dKey => (
                              <div key={dKey} className="space-y-3">
                                <p className="text-[9px] font-black tracking-wider uppercase opacity-40 ml-2">{dKey}</p>
                                {organizedData[mKey].weeks[wKey].days[dKey].map((item: any) => (
                                  <div key={item.id} className="bg-black/40 p-5 rounded-[1.5rem] border border-white/[0.03] flex justify-between items-center">
                                    <div className="flex items-center gap-5">
                                      <div className={`p-3 rounded-xl ${item.type?.toUpperCase() === 'BANK' ? 'bg-sky-500/10 text-sky-400' : item.type?.toUpperCase() === 'INCOME' ? 'bg-[#bfff00]/10 text-[#bfff00]' : 'bg-white/5 text-white/20'}`}>
                                        {item.type?.toUpperCase() === 'BANK' ? <Landmark size={18} /> : <Receipt size={18} />}
                                      </div>
                                      <div>
                                        <p className="text-xs font-black uppercase">{item.description}</p>
                                        <p className="text-[7px] font-black opacity-20 uppercase">{item.category} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                      <p className={`text-md font-black ${item.type?.toUpperCase() === 'INCOME' ? 'text-[#bfff00]' : item.type?.toUpperCase() === 'BANK' ? 'text-sky-400' : 'text-white'}`}>{Number(item.amount).toLocaleString()}</p>
                                      <button onClick={() => deleteEntry(item.id)} className="p-2 text-rose-500 opacity-20 hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, TrendingUp, Edit3, ChevronDown, ChevronRight, Landmark, Receipt } from 'lucide-react';
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
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  const fetchLedger = async () => {
    const { data } = await supabase
      .from('ledger_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setEntries(data);
  };

  useEffect(() => {
    fetchLedger();
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' }).toUpperCase();
    setExpandedMonths([currentMonth]);
  }, []);

  function getWeekNumber(d: Date) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));
    const yearStart = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  const stats = useMemo(() => {
    return entries.reduce((acc, curr) => {
      const val = Number(curr.amount);
      if (curr.type === 'INCOME') acc.income += val;
      else if (curr.type === 'BANK') acc.bank += val;
      else acc.expense += val;
      return acc;
    }, { income: 0, expense: 0, bank: 0 });
  }, [entries]);

  const organizedData = useMemo(() => {
    const months: Record<string, any> = {};
    entries.forEach(e => {
      const date = new Date(e.created_at);
      const mKey = date.toLocaleString('default', { month: 'long' }).toUpperCase();
      const wKey = `WEEK ${getWeekNumber(date)}`;
      if (!months[mKey]) months[mKey] = { income: 0, expense: 0, bank: 0, weeks: {} };
      if (!months[mKey].weeks[wKey]) months[mKey].weeks[wKey] = { income: 0, expense: 0, bank: 0, entries: [] };
      months[mKey].weeks[wKey].entries.push(e);
      const val = Number(e.amount);
      if (e.type === 'INCOME') { months[mKey].income += val; months[mKey].weeks[wKey].income += val; }
      else if (e.type === 'BANK') { months[mKey].bank += val; months[mKey].weeks[wKey].bank += val; }
      else { months[mKey].expense += val; months[mKey].weeks[wKey].expense += val; }
    });
    return months;
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Safety check: Amount is always required. Description only required for Expense.
    if (!amt || (type === 'EXPENSE' && !desc)) return;

    let finalCategory = category;
    let finalDesc = desc.toUpperCase();

    // FORCE FEED DESCRIPTION: This ensures the database 'NOT NULL' constraint is met
    if (type === 'BANK') {
      finalCategory = `BANK: ${subCategory || 'SAVINGS'}`;
      finalDesc = `BANK DEPOSIT: ${subCategory || 'GENERAL'}`; // Fallback description
    } else if (type === 'INCOME') {
      finalCategory = 'REVENUE';
      finalDesc = 'INCOME LOG'; // Fallback description
    } else if ((category === "DATA" || category === "MISC") && subCategory) {
      finalCategory = `${category}: ${subCategory}`;
    }

    const payload = {
      description: finalDesc,
      amount: parseFloat(amt),
      type: type,
      category: finalCategory
    };

    if (editingId) {
      const { error } = await supabase.from('ledger_entries').update(payload).eq('id', editingId);
      if (!error) {
        setEntries(entries.map(item => item.id === editingId ? { ...item, ...payload } : item));
        setEditingId(null);
      }
    } else {
      const { data, error } = await supabase.from('ledger_entries').insert([payload]).select();
      if (error) {
        console.error("Supabase Error:", error.message);
        alert("Error saving: " + error.message);
      }
      if (data) setEntries([data[0], ...entries]);
    }
    setDesc(""); setAmt(""); setSubCategory("");
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setDesc(item.type === 'EXPENSE' ? item.description : "");
    setAmt(item.</amount.toString());
    setType(item.type);
    if (item.category.includes(':')) {
      const [cat, sub] = item.category.split(': ');
      setCategory(cat === 'BANK' ? 'BANK' : cat);
      setSubCategory(sub);
    } else {
      setCategory(item.category);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm("DELETE THIS LOG?")) return;
    const { error } = await supabase.from('ledger_entries').delete().eq('id', id);
    if (!error) fetchLedger();
  };

  return (
    <main className="min-h-screen bg-[#080808] text-[#e0e0e0] p-4 md:p-10 font-sans italic">
      <div className="max-w-5xl mx-auto">


        <div className="grid grid-cols-3 gap-2 mb-8 bg-white/[0.03] p-4 rounded-[2rem] border border-white/5 backdrop-blur-md">
          <div className="text-center border-r border-white/5">
            <p className="text-[7px] font-black opacity-40 uppercase tracking-[0.2em]">Income</p>
            <p className="text-lg font-black text-[#bfff00]">{stats.income.toLocaleString()}</p>
          </div>
          <div className="text-center border-r border-white/5">
            <p className="text-[7px] font-black opacity-40 uppercase tracking-[0.2em]">Expenses</p>
            <p className="text-lg font-black text-rose-500">{stats.expense.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-black opacity-40 uppercase tracking-[0.2em]">Banked</p>
            <p className="text-lg font-black text-sky-400">{stats.bank.toLocaleString()}</p>
          </div>
        </div>


        <div className={`p-8 rounded-[3rem] border transition-all mb-12 ${editingId ? 'bg-amber-500/10 border-amber-500/50' : 'bg-[#111] border-white/10'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2 p-1.5 bg-black/50 rounded-2xl border border-white/5">
              {['EXPENSE', 'INCOME', 'BANK'].map(t => (
                <button key={t} type="button" onClick={() => { setType(t); setCategory(t === 'INCOME' ? 'REVENUE' : t === 'BANK' ? 'BANK' : 'FOOD'); }}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black transition-all ${type === t ? 'bg-[#bfff00] text-black shadow-lg shadow-[#bfff00]/20' : 'opacity-30'}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className={`grid grid-cols-1 ${type === 'EXPENSE' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-8`}>
              {type === 'EXPENSE' && (
                <input placeholder="DESCRIPTION" className="bg-transparent border-b-2 border-white/10 p-2 outline-none focus:border-[#bfff00] font-bold uppercase text-xl" value={desc} onChange={e => setDesc(e.target.value)} />
              )}
              <input type="number" placeholder="AMOUNT (NGN)" className="bg-transparent border-b-2 border-white/10 p-2 outline-none focus:border-[#bfff00] font-black text-2xl" value={amt} onChange={e => setAmt(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {type === 'EXPENSE' && (
                <select className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] font-black outline-none" value={category} onChange={e => { setCategory(e.target.value); setSubCategory(""); }}>
                  <option value="FOOD">🍔 FOOD</option>
                  <option value="DATA">📡 DATA</option>
                  <option value="PETROL">⛽ PETROL</option>
                  <option value="NEPA">⚡ NEPA</option>
                  <option value="MISC">📦 MISC</option>
                </select>
              )}

              {(type === 'BANK' || (type === 'EXPENSE' && (category === 'DATA' || category === 'MISC'))) && (
                <select className="bg-black border border-[#bfff00]/30 rounded-2xl p-4 text-[10px] font-black outline-none text-[#bfff00]" value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                  <option value="">SELECT {type === 'BANK' ? 'BANK' : 'SUB-CATEGORY'}</option>
                  {type === 'BANK' ? (
                    <><option value="GTB">GTB</option><option value="ZENITH">ZENITH</option></>
                  ) : category === 'DATA' ? (
                    <><option value="MTN">MTN</option><option value="AIRTEL">AIRTEL</option></>
                  ) : (
                    <><option value="INVENTORY">📋 INVENTORY</option><option value="OTHERS">🌀 OTHERS</option></>
                  )}
                </select>
              )}
            </div>

            <button className={`w-full py-6 rounded-[1.5rem] font-black text-[11px] tracking-[0.3em] transition-all active:scale-95 ${editingId ? 'bg-amber-500 text-black' : 'bg-[#bfff00] text-black shadow-xl shadow-[#bfff00]/10 hover:shadow-[#bfff00]/20'}`}>
              {editingId ? 'UPDATE RECORD' : 'EXECUTE TRANSACTION'}
            </button>
          </form>
        </div>


        <div className="space-y-10 pb-32">
          {Object.keys(organizedData).map(mKey => (
            <div key={mKey}>
              <button onClick={() => setExpandedMonths(prev => prev.includes(mKey) ? prev.filter(k => k !== mKey) : [...prev, mKey])}
                className="w-full mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {expandedMonths.includes(mKey) ? <ChevronDown size="{18}" /> : <ChevronRight size="{18}" />}
                  <h2 className="text-3xl font-black uppercase tracking-tighter">{mKey}</h2>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black opacity-30">MONTHLY BANKED</p>
                  <p className="text-xs font-black text-sky-400">NGN {organizedData[mKey].bank.toLocaleString()}</p>
                </div>
              </button>

              {expandedMonths.includes(mKey) && (
                <div className="pl-4 border-l-2 border-white/5 space-y-6">
                  {Object.keys(organizedData[mKey].weeks).sort().reverse().map(wKey => (
                    <div key={wKey} className="bg-white/[0.01] rounded-[2rem] border border-white/[0.05] overflow-hidden">
                      <div className="p-6 flex justify-between items-center bg-white/[0.02]">
                        <span className="text-[10px] font-black text-[#bfff00] tracking-widest">{wKey}</span>
                        <p className="text-[10px] font-black text-sky-400 uppercase">Week Bank: {organizedData[mKey].weeks[wKey].bank.toLocaleString()}</p>
                      </div>
                      <div className="p-4 space-```y-3">
                        {organizedData[mKey].weeks[wKey].entries.map((item: any) => (
                          <div key={item.id} className="bg-black/40 p-5 rounded-2xl border border-white/[0.03] flex justify-between items-center group">
                            <div className="flex items-center gap-5">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'BANK' ? 'bg-sky-500/10 text-sky-400' : item.type === 'INCOME' ? 'bg-[#bfff00]/10 text-[#bfff00]' : 'bg-white/5 text-white/40'}`}>
                                {item.type === 'BANK' ? <Landmark size={18} /> : item.type === 'INCOME' ? <TrendingUp size={18} /> : <Receipt size={18} />}
                              </div>
                              <div>
                                <p className="text-xs font-black uppercase text-white tracking-wide">{item.description}</p>
                                <p className="text-[8px] font-black opacity-20 uppercase mt-0.5">{item.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className={`text-sm font-black ${item.type === 'BANK' ? 'text-sky-400' : item.type === 'INCOME' ? 'text-[#bfff00]' : 'text-rose-500'}`}>
                                {item.type === 'EXPENSE' ? '-' : '+'}{Number(item.amount).toLocaleString()}
                              </p>
                              <div className="flex gap-2">
                                <button onClick={() => startEdit(item)} className="p-2 text-sky-400 bg-sky-400/10 rounded-lg border border-sky-400/20"><Edit3 size={14} /></button>
                                <button onClick={() => deleteEntry(item.id)} className="p-2 text-rose-500 bg-rose-500/10 rounded-lg border border-rose-500/20"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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
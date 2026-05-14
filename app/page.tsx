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
    setExpandedMonths([now.toLocaleString('default', { month: 'long' }).toUpperCase()]);
  }, []);

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
      const weekNum = Math.ceil(date.getDate() / 7);
      const wKey = `WEEK ${weekNum}`;

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
    if (!amt) return;

    // Use description or fallback to sub-category/type to avoid empty strings
    let finalDesc = desc.trim().toUpperCase();
    if (!finalDesc) {
      finalDesc = subCategory ? `${subCategory} TRANSACTION` : `${type} ENTRY`;
    }

    let finalCategory = category;
    if (type === 'BANK') finalCategory = `BANK: ${subCategory || 'OTHER'}`;
    else if ((category === "DATA" || category === "MISC") && subCategory) finalCategory = `${category}: ${subCategory}`;

    const payload = {
      description: finalDesc,
      amount: parseFloat(amt),
      type,
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

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setDesc(item.description);
    setAmt(item.amount.toString());
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

        {/* STATS HEADER */}
        <div className="grid grid-cols-3 gap-2 mb-8 bg-white/[0.03] p-4 rounded-[2rem] border border-white/5 backdrop-blur-md">
          <div className="text-center border-r border-white/5">
            <p className="text-[7px] font-black opacity-40 uppercase tracking-[0.2em]">Income</p>
            <p className="text-lg font-black text-[#bfff00]">{stats.income.toLocaleString()}</p>
          </div>
          <div className="text-center border-r border-white/5">
            <p className="text-[7px] font-black opacity-40 uppercase tracking-[0.2em]">Expense</p>
            <p className="text-lg font-black text-rose-500">{stats.expense.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-black opacity-40 uppercase tracking-[0.2em]">Bank</p>
            <p className="text-lg font-black text-sky-400">{stats.bank.toLocaleString()}</p>
          </div>
        </div>

        {/* INPUT FORM */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <input placeholder="DESCRIPTION" className="bg-transparent border-b-2 border-white/10 p-2 outline-none focus:border-[#bfff00] font-bold uppercase text-xl" value={desc} onChange={e => setDesc(e.target.value)} />
              <input type="number" placeholder="AMOUNT" className="bg-transparent border-b-2 border-white/10 p-2 outline-none focus:border-[#bfff00] font-black text-2xl" value={amt} onChange={e => setAmt(e.target.value)} />
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

              {(type === 'BANK' || category === 'DATA' || category === 'MISC') && (
                <select className="bg-black border border-[#bfff00]/30 rounded-2xl p-4 text-[10px] font-black outline-none text-[#bfff00]" value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                  <option value="">SELECT SUB-CATEGORY</option>
                  {type === 'BANK' ? (
                    <><option value="GTB">GTB</option><option value="ZENITH">ZENITH</option><option value="OPAY">OPAY</option></>
                  ) : category === 'DATA' ? (
                    <><option value="MTN">MTN</option><option value="AIRTEL">AIRTEL</option></>
                  ) : (
                    <><option value="INVENTORY">📋 INVENTORY</option><option value="GIFT">🎁 GIFT</option></>
                  )}
                </select>
              )}
            </div>

            <button className={`w-full py-6 rounded-[1.5rem] font-black text-[11px] tracking-[0.3em] transition-all ${editingId ? 'bg-amber-500 text-black' : 'bg-[#bfff00] text-black'}`}>
              {editingId ? 'UPDATE RECORD' : 'EXECUTE'}
            </button>
          </form>
        </div>

        {/* LOGS */}
        <div className="space-y-10">
          {Object.keys(organizedData).map(mKey => (
            <div key={mKey}>
              <button onClick={() => setExpandedMonths(prev => prev.includes(mKey) ? prev.filter(k => k !== mKey) : [...prev, mKey])} className="w-full mb-4 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  {expandedMonths.includes(mKey) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <h2 className="text-3xl font-black uppercase tracking-tighter group-hover:text-[#bfff00] transition-colors">{mKey}</h2>
                </div>
              </button>

              {expandedMonths.includes(mKey) && (
                <div className="space-y-6">
                  {Object.keys(organizedData[mKey].weeks).sort().reverse().map(wKey => (
                    <div key={wKey} className="border-l border-white/5 pl-4">
                      <div className="p-4 mb-2 flex justify-between items-center opacity-40">
                        <span className="text-[10px] font-black tracking-widest">{wKey}</span>
                      </div>
                      <div className="space-y-2">
                        {organizedData[mKey].weeks[wKey].entries.map((item: any) => (
                          <div key={item.id} className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.03] flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className={item.type === 'BANK' ? 'text-sky-400' : item.type === 'INCOME' ? 'text-[#bfff00]' : 'text-white/20'}>
                                {item.type === 'BANK' ? <Landmark size={16} /> : <Receipt size={16} />}
                              </div>
                              <div>
                                <p className="text-xs font-black uppercase">{item.description}</p>
                                <p className="text-[7px] font-black opacity-20 uppercase tracking-widest">{item.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <p className={`text-sm font-black ${item.type === 'INCOME' ? 'text-[#bfff00]' : item.type === 'BANK' ? 'text-sky-400' : 'text-white'}`}>
                                {Number(item.amount).toLocaleString()}
                              </p>
                              <div className="flex gap-2">
                                <button onClick={() => startEdit(item)} className="p-2 text-sky-400 bg-sky-400/10 rounded-lg"><Edit3 size={12} /></button>
                                <button onClick={() => deleteEntry(item.id)} className="p-2 text-rose-500 bg-rose-500/10 rounded-lg"><Trash2 size={12} /></button>
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
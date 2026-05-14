"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, TrendingUp, Edit3, Landmark, Receipt, RefreshCw, CalendarDays } from 'lucide-react';
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
      const mKey = date.toLocaleString('default', { month: 'long' }).toUpperCase();
      const weekNum = Math.ceil(date.getDate() / 7);
      const wKey = `WEEK ${weekNum}`;

      if (!months[mKey]) months[mKey] = { income: 0, expense: 0, bank: 0, weeks: {} };
      if (!months[mKey].weeks[wKey]) months[mKey].weeks[wKey] = { income: 0, expense: 0, bank: 0, entries: [] };

      months[mKey].weeks[wKey].entries.push(e);
      const val = Number(e.amount);
      const t = e.type?.toUpperCase();
      if (t === 'INCOME') { months[mKey].income += val; months[mKey].weeks[wKey].income += val; }
      else if (t === 'BANK') { months[mKey].bank += val; months[mKey].weeks[wKey].bank += val; }
      else { months[mKey].expense += val; months[mKey].weeks[wKey].expense += val; }
    });
    return months;
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amt) return;

    let finalDesc = desc.trim().toUpperCase();
    if (!finalDesc) {
      finalDesc = subCategory ? `${subCategory} ${type}` : `${type} ENTRY`;
    }

    let finalCategory = category;
    if (type === 'BANK') finalCategory = `BANK: ${subCategory || 'GENERAL'}`;
    else if ((category === "DATA" || category === "MISC") && subCategory) finalCategory = `${category}: ${subCategory}`;

    const payload = {
      description: finalDesc,
      amount: parseFloat(amt),
      type: type.toUpperCase(),
      category: type === 'INCOME' ? 'REVENUE' : finalCategory
    };

    if (editingId) {
      const { error } = await supabase.from('ledger_entries').update(payload).eq('id', editingId);
      if (!error) {
        setEntries(entries.map(item => item.id === editingId ? { ...item, ...payload } : item));
        setEditingId(null);
        setDesc(""); setAmt(""); setSubCategory("");
      }
    } else {
      const { data, error } = await supabase.from('ledger_entries').insert([payload]).select();
      if (error) {
        alert(`Error: ${error.message}`);
      } else if (data) {
        setEntries([data[0], ...entries]);
        setDesc(""); setAmt(""); setSubCategory("");
      }
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setDesc(item.description);
    setAmt(item.amount.toString());
    setType(item.type.toUpperCase());
    if (item.category && item.category.includes(':')) {
      const [cat, sub] = item.category.split(': ');
      setCategory(cat === 'BANK' ? 'BANK' : cat);
      setSubCategory(sub);
    } else {
      setCategory(item.category || "FOOD");
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm("DELETE?")) return;
    const { error } = await supabase.from('ledger_entries').delete().eq('id', id);
    if (!error) fetchLedger();
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#f0f0f0] p-4 md:p-10 font-sans italic">
      <div className="max-w-4xl mx-auto">

        {/* Header Section */}
        <div className="flex justify-between items-center mb-8 px-4">
          <h1 className="text-[10px] font-black tracking-[0.5em] opacity-30 uppercase">Fintrac // 02</h1>
          <button onClick={fetchLedger} className={`p-2 transition-all ${isSyncing ? 'animate-spin opacity-100' : 'opacity-20 hover:opacity-100'}`}>
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: 'Income', val: stats.income, color: 'text-[#bfff00]' },
            { label: 'Spent', val: stats.expense, color: 'text-rose-500' },
            { label: 'In Bank', val: stats.bank, color: 'text-sky-400' }
          ].map((s, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 p-5 rounded-[2rem] text-center">
              <p className="text-[7px] font-black uppercase opacity-20 tracking-widest mb-1">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.val.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Input Form Section */}
        <div className={`p-8 rounded-[3rem] border transition-all mb-16 ${editingId ? 'bg-orange-500/10 border-orange-500/30' : 'bg-[#0a0a0a] border-white/5 shadow-2xl'}`}>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex gap-2 p-1.5 bg-black rounded-2xl border border-white/5">
              {['EXPENSE', 'INCOME', 'BANK'].map(t => (
                <button key={t} type="button" onClick={() => { setType(t); setCategory(t === 'INCOME' ? 'REVENUE' : t === 'BANK' ? 'BANK' : 'FOOD'); }}
                  className={`flex-1 py-3.5 rounded-xl text-[9px] font-black transition-all ${type === t ? 'bg-[#bfff00] text-black shadow-lg shadow-[#bfff00]/20' : 'opacity-20'}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <input placeholder="DESCRIPTION" className="bg-transparent border-b border-white/10 p-2 outline-none focus:border-[#bfff00] font-bold uppercase text-2xl" value={desc} onChange={e => setDesc(e.target.value)} />
              <input type="number" placeholder="AMOUNT" className="bg-transparent border-b border-white/10 p-2 outline-none focus:border-[#bfff00] font-black text-3xl" value={amt} onChange={e => setAmt(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {type === 'EXPENSE' && (
                <select className="bg-black border border-white/10 rounded-2xl p-5 text-[10px] font-black outline-none" value={category} onChange={e => { setCategory(e.target.value); setSubCategory(""); }}>
                  <option value="FOOD">🍔 FOOD</option>
                  <option value="DATA">📡 DATA</option>
                  <option value="PETROL">⛽ PETROL</option>
                  <option value="MISC">📦 MISC</option>
                </select>
              )}

              {(type === 'BANK' || category === 'DATA' || category === 'MISC') && (
                <select className="bg-white text-black rounded-2xl p-5 text-[10px] font-black outline-none" value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                  <option value="">SPECIFY TYPE</option>
                  {type === 'BANK' ? (
                    <><option value="GTB">GTB</option><option value="ZENITH">ZENITH</option><option value="OPAY">OPAY</option></>
                  ) : category === 'DATA' ? (
                    <><option value="MTN">MTN</option><option value="AIRTEL">AIRTEL</option></>
                  ) : (
                    <><option value="INVENTORY">INVENTORY</option><option value="GIFT">GIFT</option></>
                  )}
                </select>
              )}
            </div>

            <button className={`w-full py-6 rounded-2xl font-black text-[10px] tracking-[0.4em] transition-all ${editingId ? 'bg-orange-500 text-black' : 'bg-[#bfff00] text-black shadow-xl shadow-[#bfff00]/10'}`}>
              {editingId ? 'UPDATE LOG' : 'EXECUTE'}
            </button>
          </form>
        </div>

        {/* THE NESTED VIEW: Month -> Week -> Days */}
        <div className="space-y-16 pb-20">
          {Object.keys(organizedData).map(mKey => (
            <div key={mKey} className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-6 md:p-10 space-y-8">
              {/* Month Header */}
              <div className="flex justify-between items-end border-b border-white/5 pb-6">
                <h2 className="text-4xl font-black uppercase tracking-tighter">{mKey}</h2>
                <div className="text-right">
                  <p className="text-[8px] font-black opacity-30 tracking-[0.3em] mb-1 uppercase">Month Total</p>
                  <p className="text-xl font-black text-[#bfff00]">{organizedData[mKey].income.toLocaleString()}</p>
                </div>
              </div>

              {/* Weeks Nested in Month */}
              <div className="grid grid-cols-1 gap-8">
                {Object.keys(organizedData[mKey].weeks).sort().reverse().map(wKey => (
                  <div key={wKey} className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-6 space-y-6">
                    <div className="flex justify-between items-center px-2">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} className="opacity-20" />
                        <p className="text-[10px] font-black tracking-widest uppercase opacity-40">{wKey}</p>
                      </div>
                      <div className="flex gap-4">
                        <p className="text-[9px] font-black text-rose-500/50">-{organizedData[mKey].weeks[wKey].expense.toLocaleString()}</p>
                        <p className="text-[9px] font-black text-sky-400/50">+{organizedData[mKey].weeks[wKey].bank.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Entries Nested in Week */}
                    <div className="space-y-3">
                      {organizedData[mKey].weeks[wKey].entries.map((item: any) => (
                        <div key={item.id} className="bg-black/40 hover:bg-[#bfff00]/5 p-5 rounded-[1.5rem] border border-white/[0.03] transition-all flex justify-between items-center group">
                          <div className="flex items-center gap-5">
                            <div className={`p-3 rounded-xl ${item.type?.toUpperCase() === 'BANK' ? 'bg-sky-500/10 text-sky-400' : item.type?.toUpperCase() === 'INCOME' ? 'bg-[#bfff00]/10 text-[#bfff00]' : 'bg-white/5 text-white/20'}`}>
                              {item.type?.toUpperCase() === 'BANK' ? <Landmark size={18} /> : item.type?.toUpperCase() === 'INCOME' ? <TrendingUp size={18} /> : <Receipt size={18} />}
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-tight">{item.description}</p>
                              <p className="text-[7px] font-black opacity-20 uppercase mt-0.5">{item.category}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-5">
                            <p className={`text-md font-black ${item.type?.toUpperCase() === 'INCOME' ? 'text-[#bfff00]' : item.type?.toUpperCase() === 'BANK' ? 'text-sky-400' : 'text-white'}`}>
                              {Number(item.amount).toLocaleString()}
                            </p>
                            <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEdit(item)} className="p-2 text-sky-400 hover:scale-125 transition-transform"><Edit3 size={12} /></button>
                              <button onClick={() => deleteEntry(item.id)} className="p-2 text-rose-500 hover:scale-125 transition-transform"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
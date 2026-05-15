"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Landmark, Receipt, RefreshCw, ChevronDown, Clock, Plus, Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function FintracMobilePro() {
  const [entries, setEntries] = useState<any[]>([]);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [category, setCategory] = useState("FOOD");
  const [subCategory, setSubCategory] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [isSyncing, setIsSyncing] = useState(false);
  const [liveTime, setLiveTime] = useState("");

  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const toggleMonth = (mKey: string) => setExpandedMonths(prev => ({ ...prev, [mKey]: !prev[mKey] }));
  const toggleWeek = (weekId: string) => setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));

  const fetchLedger = async () => {
    setIsSyncing(true);
    const { data } = await supabase.from('ledger_entries').select('*').order('created_at', { ascending: false });
    if (data) setEntries(data);
    setIsSyncing(false);
  };

  useEffect(() => {
    fetchLedger();
    const timer = setInterval(() => {
      const now = new Date();
      setLiveTime(now.toLocaleString('default', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    return entries.reduce((acc, curr) => {
      const val = Number(curr.amount);
      const t = curr.type?.toUpperCase();
      if (t === 'INCOME') acc.income += val;
      else if (t === 'BANK') acc.bank += val;
      else if (t === 'EXPENSE') acc.expense += val;
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
      if (t === 'INCOME') {
        months[mKey].income += val;
        months[mKey].weeks[wKey].income += val;
      } else if (t === 'BANK') {
        months[mKey].bank += val;
        months[mKey].weeks[wKey].bank += val;
      } else if (t === 'EXPENSE') {
        months[mKey].expense += val;
        months[mKey].weeks[wKey].expense += val;
      }
    });
    return months;
  }, [entries]);

  const sortedMonthKeys = useMemo(() => {
    return Object.keys(organizedData).sort((a, b) => organizedData[b].sortVal - organizedData[a].sortVal);
  }, [organizedData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amt) return;

    let finalDesc = desc.trim().toUpperCase() || (type === 'EXPENSE' ? category : `${type} ENTRY`);

    let finalCategory = category;
    if (type === 'INCOME') {
      finalCategory = 'REVENUE';
    } else if (type === 'BANK') {
      finalCategory = 'BANK';
    } else if (category === "DATA" && subCategory) {
      finalCategory = `DATA: ${subCategory}`;
    }

    const payload = {
      description: finalDesc,
      amount: parseFloat(amt),
      type: type.toUpperCase(),
      category: finalCategory.toUpperCase()
    };

    const { data, error } = await supabase.from('ledger_entries').insert([payload]).select();
    if (!error && data) {
      setEntries([data[0], ...entries]);
      setDesc("");
      setAmt("");
      setSubCategory("");
    }
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm("Delete transaction?")) return;
    await supabase.from('ledger_entries').delete().eq('id', id);
    fetchLedger();
  };

  const getInputColorClass = () => {
    if (type === 'EXPENSE') return 'text-rose-500 focus:border-rose-500 placeholder-rose-900';
    if (type === 'BANK') return 'text-sky-400 focus:border-sky-400 placeholder-sky-900';
    return 'text-green-600 focus:border-green-600 placeholder-lime-900';
  };

  return (
    <main className="min-h-screen bg-[#F9F7F2] text-[#2D2D2D] p-4 md:p-8 font-sans antialiased">
      <style>{`
        .pop-accordion { display: grid; grid-template-rows: 0fr; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0; }
        .pop-accordion.open { grid-template-rows: 1fr; opacity: 1; margin-top: 15px; }
        .pop-content { overflow: hidden; }
      `}</style>

      <div className="max-w-md mx-auto space-y-6 pb-24">

        {/* TOP STATUS BAR */}
        <div className="flex justify-between items-center px-2">
          <p className="text-xs font-bold tracking-tight text-gray-400">{liveTime}</p>
          <button onClick={fetchLedger} className={`${isSyncing ? 'animate-spin' : ''}`}>
            <RefreshCw size={14} className="text-gray-400" />
          </button>
        </div>

        {/* GREETING SECTION */}
        <div className="px-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Hello, Admin</h1>
          <p className="text-sm text-gray-500 font-medium">Your financial overview is ready.</p>
        </div>

        {/* MAIN BALANCE CARD */}
        <div className="bg-[#FF7A45] rounded-[2.5rem] p-8 shadow-2xl shadow-orange-200 relative overflow-hidden text-white">
          <div className="relative z-10">
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Global Balance</p>
            <h2 className="text-4xl font-black mb-6">₦{(stats.income - stats.expense).toLocaleString()}</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold opacity-70 uppercase">In Bank</p>
                <p className="text-lg font-bold">₦{stats.bank.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <Plus size={20} />
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full"></div>
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-black/5 rounded-full"></div>
        </div>

        {/* QUICK STATS PILLS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Income</p>
              <p className="text-sm font-bold text-green-600">₦{stats.income.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
              <ArrowDownLeft size={18} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Spent</p>
              <p className="text-sm font-bold text-red-500">₦{stats.expense.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* INPUT ENGINE MODAL-STYLE CARD */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex bg-gray-50 p-1.5 rounded-2xl">
              {['EXPENSE', 'INCOME', 'BANK'].map(t => (
                <button key={t} type="button" onClick={() => { setType(t); setCategory(t === 'INCOME' ? 'REVENUE' : 'FOOD'); }}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${type === t ? 'bg-white text-[#FF7A45] shadow-sm' : 'text-gray-400'}`}>
                  {t}
                </button>
              ))}
            </div>

            {type === 'EXPENSE' && (
              <div className="grid grid-cols-2 gap-2">
                {['FOOD', 'DATA', 'PETROL', 'MISC'].map(c => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={`py-2 px-3 rounded-lg text-[9px] font-bold border transition-all ${category === c ? 'bg-[#FF7A45]/10 border-[#FF7A45] text-[#FF7A45]' : 'bg-gray-50 border-transparent text-gray-500'}`}>
                    {c}
                  </button>
                ))}
              </div>
            )}

            {type === 'EXPENSE' && category === 'DATA' && (
              <div className="flex gap-3 p-1 bg-gray-50 rounded-xl border border-gray-100">
                {['MTN', 'AIRTEL'].map(provider => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setSubCategory(provider)}
                    className={`flex-1 py-2 text-[9px] font-bold rounded-lg transition-all ${subCategory === provider ? 'bg-[#FF7A45]/10 text-[#FF7A45] border border-[#FF7A45]/20' : 'text-gray-400'}`}
                  >
                    {provider}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <input placeholder="What is this for?" className="w-full bg-transparent border-b border-gray-100 p-2 text-sm font-bold outline-none focus:border-[#FF7A45] transition-all" value={desc} onChange={e => setDesc(e.target.value)} />
              <input type="number" placeholder="Enter Amount" className="w-full bg-transparent border-b border-gray-100 p-2 text-2xl font-black outline-none focus:border-[#FF7A45] text-[#2D2D2D]" value={amt} onChange={e => setAmt(e.target.value)} />
            </div>

            <button className="w-full py-4 rounded-2xl bg-[#2D2D2D] text-white text-xs font-bold shadow-lg active:scale-95 transition-all">
              Execute Transaction
            </button>
          </form>
        </div>

        {/* NESTED TIMELINE (MONTH -> WEEK -> ENTRIES) */}
        <div className="space-y-6">
          {sortedMonthKeys.map(mKey => (
            <div key={mKey} className="space-y-4">
              <button onClick={() => toggleMonth(mKey)} className="w-full flex justify-between items-center group">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">{mKey}</h3>
                <ChevronDown size={14} className="text-gray-300" />
              </button>

              <div className={`pop-accordion ${expandedMonths[mKey] ? 'open' : ''}`}>
                <div className="pop-content space-y-4">
                  {Object.keys(organizedData[mKey].weeks).sort((a, b) => organizedData[mKey].weeks[b].sortVal - organizedData[mKey].weeks[a].sortVal).map(wKey => {
                    const weekId = `${mKey}-${wKey}`;
                    const isExp = expandedWeeks[weekId];
                    return (
                      <div key={wKey} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <button onClick={() => toggleWeek(weekId)} className="w-full p-6 flex justify-between items-center text-left">
                          <div>
                            <p className="text-[10px] font-black text-[#FF7A45] uppercase tracking-widest">{wKey}</p>
                            <p className="text-[9px] font-bold text-gray-400 mt-0.5">Summary of activity</p>
                          </div>
                          <div className="flex gap-4 text-right mr-2">
                            <div><p className="text-[7px] text-gray-400 font-bold uppercase">Income</p><p className="text-[10px] font-bold text-green-600">₦{organizedData[mKey].weeks[wKey].income.toLocaleString()}</p></div>
                            <div><p className="text-[7px] text-gray-400 font-bold uppercase">Spent</p><p className="text-[10px] font-bold text-red-500">₦{organizedData[mKey].weeks[wKey].expense.toLocaleString()}</p></div>
                          </div>
                        </button>

                        {isExp && (
                          <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-4">
                            {Object.keys(organizedData[mKey].weeks[wKey].days).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(dKey => (
                              <div key={dKey} className="space-y-3">
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-tighter ml-1">{dKey}</p>
                                {organizedData[mKey].weeks[wKey].days[dKey].map((item: any) => (
                                  <div key={item.id} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                      <div className={`w-11 h-11 rounded-full flex items-center justify-center ${item.type === 'INCOME' ? 'bg-green-50 text-green-600' :
                                          item.type === 'BANK' ? 'bg-sky-50 text-sky-500' : 'bg-orange-50 text-[#FF7A45]'
                                        }`}>
                                        {item.type === 'BANK' ? <Landmark size={18} /> : <Receipt size={18} />}
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-gray-800">{item.description}</p>
                                        <p className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter">
                                          {item.category} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <p className={`text-xs font-bold ${item.type === 'INCOME' ? 'text-green-600' : item.type === 'EXPENSE' ? 'text-red-500' : 'text-gray-700'}`}>
                                        {item.type === 'EXPENSE' ? '-' : ''}₦{Number(item.amount).toLocaleString()}
                                      </p>
                                      <button onClick={() => deleteEntry(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-200 hover:text-red-500 transition-all">
                                        <Trash2 size={12} />
                                      </button>
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
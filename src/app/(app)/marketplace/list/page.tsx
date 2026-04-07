"use client"
import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

export default function ListForSalePage() {
  const [price, setPrice] = useState<number>(0);
  const [qty, setQty] = useState<number>(0);
  const currency = 'INR';

  // Total value uses the standard calculation before minor-unit conversion sent to backend
  const displayTotal = price && qty ? formatCurrency(price * qty * 100, currency) : '₹0.00';

  return (
    <div className="bg-slate-900 min-h-screen p-8 flex items-start justify-center">
      <div className="bg-slate-800 max-w-2xl w-full rounded-xl shadow-xl border border-slate-700 p-8">
        <h2 className="text-2xl font-bold text-white mb-2">List Credits for Sale</h2>
        <p className="text-slate-400 mb-8 pb-6 border-b border-slate-700">Configure marketplace listing parameters and pricing structure.</p>

        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Select Batch</label>
              <select className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all">
                <option>Solar Array Alpha (1,000 active)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Minimum Purchase Qty</label>
              <input type="number" 
                onChange={(e) => setQty(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 outline-none focus:border-green-500 transition-all font-mono" 
                placeholder="e.g. 50" />
            </div>
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-sm font-medium text-slate-300">Price per Metric Ton (INR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
              <input 
                type="number" 
                step="0.01" 
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 pl-8 outline-none focus:border-green-500 transition-all font-mono" 
                placeholder="1250.50" 
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Value handled cleanly using Paisa integers on our backend to avoid math errors.</p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-700 flex justify-between items-center mb-6">
            <span className="text-slate-400 font-medium">Estimated Total Listing Value</span>
            <span className="text-2xl font-bold text-green-400">{displayTotal}</span>
          </div>

          <div className="border border-slate-700 border-dashed rounded-lg p-6 bg-slate-900/50 text-center mb-6">
             <h4 className="text-slate-300 font-medium mb-1">Payment Integration Placeholder</h4>
             <p className="text-sm text-slate-500">Secure gateway (Razorpay) will orchestrate the INR settlement phase.</p>
          </div>

          <button type="button" className="w-full bg-green-500 hover:bg-green-600 text-slate-900 font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all">
            Publish Listing
          </button>
        </form>
      </div>
    </div>
  );
}

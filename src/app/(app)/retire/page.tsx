"use client"
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function RetirementPage() {
  return (
    <div className="bg-slate-900 min-h-screen p-8 flex items-start justify-center text-slate-200">
      <div className="bg-slate-800 max-w-2xl w-full rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-slate-700 p-8">
        <h2 className="text-2xl font-bold mb-2">Retire Credits</h2>
        <p className="text-slate-400 mb-8 pb-6 border-b border-slate-700">Consume credits permanently to offset emissions.</p>

        {/* High Visibility Warning Callout */}
        <div className="bg-amber-900/20 border-l-4 border-amber-500 p-5 rounded-r-lg mb-8 flex gap-4 items-start shadow-inner">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-400 font-bold mb-1">Irreversible Action</h3>
            <p className="text-amber-500/80 text-sm leading-relaxed">
              Once retired, these serial numbers will be permanently removed from circulation and written to the public registry. This action cannot be undone.
            </p>
          </div>
        </div>

        <form className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">Retirement Reason</label>
            <select className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 outline-none focus:border-green-500 transition-all">
              <option value="">Select reason...</option>
              <option value="CCTS">CCTS Compliance Obligation</option>
              <option value="Voluntary">Voluntary Corporate Offset</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">Beneficiary Name</label>
            <input type="text" 
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 outline-none focus:border-green-500 transition-all" 
              placeholder="Entity claiming the offset..." />
            <p className="text-xs text-slate-500 mt-1">Required to prevent double-counting across registries.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">Quantity to Retire</label>
            <input type="number" 
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 outline-none focus:border-amber-500 transition-all font-mono" 
              placeholder="e.g. 500" />
          </div>

          <button type="button" className="w-full bg-slate-700 hover:bg-amber-600 text-white font-bold py-3 mt-4 rounded-lg transition-colors border border-slate-600 hover:border-amber-500">
            Confirm Permanent Retirement
          </button>
        </form>
      </div>
    </div>
  );
}

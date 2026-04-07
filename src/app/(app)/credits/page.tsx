'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Inbox } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CreditBatch {
  id: string;
  project: { name: string; methodology: string; location: string };
  vintageYear: number;
  serialBlockStart: string;
  serialBlockEnd: string;
  quantity: number;
  status: string;
}

export default function CreditsTablePage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<CreditBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/credits');
        if (response.ok) {
          const data = await response.json();
          setBatches(data.credits || []);
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchInventory();
  }, [user]);

  return (
    <div className="bg-slate-900 min-h-screen p-8 flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Inventory</h1>
        <p className="text-slate-400 mt-2">Manage your inventory of carbon credit volumes securely mapped from the native ledger.</p>
      </div>

      <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden text-slate-200">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold">Credit Batches</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-sm font-medium border border-slate-600">
            <Filter size={16} /> Filters
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="text-center p-12 text-slate-400">Syncing ledger records...</div>
          ) : batches.length === 0 ? (
             <div className="text-center p-16 flex flex-col items-center justify-center">
               <Inbox size={48} className="text-slate-600 mb-4" />
               <h3 className="text-slate-300 font-semibold text-lg">No active credits found</h3>
               <p className="text-slate-500 mt-2">Your inventory is empty. Purchase credits on the Marketplace or have a Verifier issue batches for your registered projects.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 border-b border-slate-700">Project</th>
                  <th className="p-4 border-b border-slate-700">Methodology</th>
                  <th className="p-4 border-b border-slate-700">Vintage</th>
                  <th className="p-4 border-b border-slate-700">Serial Range</th>
                  <th className="p-4 border-b border-slate-700 text-right">Quantity</th>
                  <th className="p-4 border-b border-slate-700 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-700/30 transition-colors border-b border-slate-700/50 last:border-0 relative">
                    <td className="p-4 font-medium">{batch.project.name}</td>
                    <td className="p-4 text-slate-400">{batch.project.methodology}</td>
                    <td className="p-4">{batch.vintageYear}</td>
                    <td className="p-4 text-xs font-mono text-emerald-400 opacity-80">{batch.serialBlockStart}</td>
                    <td className="p-4 text-right font-medium text-white">{batch.quantity.toLocaleString()}t</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                        batch.status === 'ACTIVE' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

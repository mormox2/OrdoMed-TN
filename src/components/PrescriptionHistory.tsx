/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Prescription, PrescriptionItem } from '../types';
import { 
  History, 
  Copy, 
  Eye, 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { logAudit } from '../data';

interface PrescriptionHistoryProps {
  patientId: string;
  prescriptions: Prescription[];
  prescriptionItems: PrescriptionItem[];
  onDuplicatePrescription: (items: PrescriptionItem[]) => void;
  onViewPrescription: (prescription: Prescription) => void;
}

export default function PrescriptionHistory({
  patientId,
  prescriptions,
  prescriptionItems,
  onDuplicatePrescription,
  onViewPrescription,
}: PrescriptionHistoryProps) {
  // Filter prescriptions for this specific patient
  const patientPrescriptions = prescriptions
    .filter((p) => p.patient_id === patientId)
    .sort((a, b) => new Date(b.prescription_date).getTime() - new Date(a.prescription_date).getTime());

  const getItemsForPrescription = (prescriptionId: string) => {
    return prescriptionItems
      .filter((item) => item.prescription_id === prescriptionId)
      .sort((a, b) => a.line_order - b.line_order);
  };

  const handleDuplicate = (p: Prescription) => {
    const items = getItemsForPrescription(p.id);
    if (items.length === 0) {
      alert("Cette ordonnance ne contient aucun médicament à dupliquer.");
      return;
    }
    onDuplicatePrescription(items);
    logAudit('DUPLICATE_HISTORIC_PRESCRIPTION', 'PRESCRIPTION', p.id, { origin_prescription_id: p.id }, null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4" id="prescription-history-widget">
      <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 uppercase text-slate-500 pb-2 border-b border-slate-100">
        <History className="w-4.5 h-4.5 text-sky-500" />
        Historique Thérapeutique
      </h2>

      {patientPrescriptions.length > 0 ? (
        <div className="space-y-3.5 max-h-[420px] overflow-y-auto">
          {patientPrescriptions.map((p) => {
            const items = getItemsForPrescription(p.id);
            return (
              <div 
                key={p.id} 
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors flex flex-col space-y-2.5"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">
                      {new Date(p.prescription_date).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">({p.prescription_number})</span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {p.status === 'signed' ? (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold rounded-md uppercase flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Signée
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold rounded-md uppercase">
                        Brouillon
                      </span>
                    )}
                  </div>
                </div>

                {/* Medicine lines preview */}
                <div className="space-y-1 pl-1 border-l-2 border-slate-200">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.id} className="text-xs text-slate-600 truncate font-medium">
                      • {item.medicine_label} <span className="text-[10px] text-slate-400 font-normal">({item.dosage})</span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="text-[10px] text-slate-400 italic font-medium pl-2">
                      + {items.length - 3} autre(s) médicament(s)
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100/60">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Mode : {p.print_language_mode === 'bilingual' ? 'Bilingue' : p.print_language_mode.toUpperCase()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewPrescription(p)}
                      className="px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:text-sky-600 hover:bg-white rounded border border-slate-200 hover:border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Visualiser et Imprimer"
                    >
                      <Eye className="w-3 h-3" />
                      Ouvrir
                    </button>
                    <button
                      onClick={() => handleDuplicate(p)}
                      className="px-2.5 py-1 text-[10px] font-bold text-sky-700 hover:text-white bg-sky-50 hover:bg-sky-600 border border-sky-100 hover:border-sky-600 rounded transition-all flex items-center gap-1 cursor-pointer"
                      title="Dupliquer les lignes sur l'ordonnance active"
                    >
                      <Copy className="w-3 h-3" />
                      Dupliquer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-1.5 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <History className="w-6 h-6 text-slate-300" />
          <div className="text-xs">Aucune ordonnance antérieure enregistrée pour ce patient</div>
        </div>
      )}
    </div>
  );
}

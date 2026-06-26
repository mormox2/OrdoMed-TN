/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Prescription, 
  PrescriptionItem, 
  Patient 
} from '../types';
import { 
  Users, 
  CheckCircle2, 
  FileEdit, 
  Search, 
  Eye, 
  UserPlus, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';

interface CabinetDashboardProps {
  prescriptions: Prescription[];
  prescriptionItems: PrescriptionItem[];
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onViewPrescription: (prescription: Prescription) => void;
}

export default function CabinetDashboard({
  prescriptions,
  prescriptionItems,
  patients,
  onSelectPatient,
  onViewPrescription,
}: CabinetDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cnamOnly, setCnamOnly] = useState(false);

  // Stats calculation
  const totalPatients = patients.length;
  const signedPrescriptions = prescriptions.filter(p => p.status === 'signed');
  const totalSignedCount = signedPrescriptions.length;
  const draftPrescriptions = prescriptions.filter(p => p.status === 'draft');
  const totalDraftCount = draftPrescriptions.length;

  // Filter prescriptions list
  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesQuery = p.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.prescription_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCnam = !cnamOnly || !!p.is_cnam_apci;
    return matchesQuery && matchesCnam;
  });

  return (
    <div className="space-y-6" id="cabinet-activity-dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-400 via-sky-900 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-300 text-[10px] font-bold rounded-full uppercase tracking-wider border border-sky-400/20">
                Cabinet Connecté
              </span>
              <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Tableau de Bord du Praticien</h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Bienvenue sur votre gestionnaire médical tunisien. Suivez l'activité de vos consultations, les ordonnances APCI et facilitez les démarches CNAM de vos patients.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-bold font-mono text-sky-400">{totalPatients}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Patients</span>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-bold font-mono text-emerald-400">{totalSignedCount}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Signées</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid (Bento style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Patients box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-sky-50 text-sky-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patients Enregistrés</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{totalPatients}</span>
          </div>
        </div>

        {/* Signed Prescriptions box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ordonnances Signées</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{totalSignedCount}</span>
          </div>
        </div>

        {/* Draft Prescriptions box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brouillons actifs</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{totalDraftCount}</span>
          </div>
        </div>
      </div>

      {/* Main Recent Activity Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header containing Filters */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Activité récente & Suivi de prescription</h3>
            <p className="text-xs text-slate-400">Recherchez ou gérez l'ensemble des ordonnances délivrées par le cabinet</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Patient ou N° ordonnance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 w-full sm:w-48 transition-all"
              />
            </div>

            {/* CNAM Coverage Toggle */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs text-slate-600 font-medium cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={cnamOnly}
                onChange={(e) => setCnamOnly(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Filtre CNAM APCI</span>
            </label>
          </div>
        </div>

        {/* Content list */}
        {filteredPrescriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">N° Ordonnance</th>
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-6">Statut</th>
                  <th className="py-3.5 px-6">CNAM APCI</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredPrescriptions.slice(0, 10).map((prescription) => {
                  const patientObj = patients.find(p => p.id === prescription.patient_id);
                  return (
                    <tr key={prescription.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-500">
                        {new Date(prescription.prescription_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {prescription.prescription_number}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {prescription.patient_name}
                        <span className="block text-[10px] text-slate-400 font-normal">{prescription.patient_age_str}</span>
                      </td>
                      <td className="py-4 px-6">
                        {prescription.status === 'signed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] uppercase">
                            <ShieldCheck className="w-3.5 h-3.5" /> Signée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[9px] uppercase">
                            <FileEdit className="w-3.5 h-3.5" /> Brouillon
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {prescription.is_cnam_apci ? (
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100 font-bold text-[9px] uppercase">
                            APCI (100%)
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[10px]">Non lié</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewPrescription(prescription)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg hover:text-slate-900 transition-colors cursor-pointer"
                            title="Prévisualiser l'ordonnance"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {patientObj && (
                            <button
                              onClick={() => onSelectPatient(patientObj)}
                              className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              Saisir
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Activity className="w-10 h-10 text-slate-200" />
            <div className="text-xs">Aucune ordonnance correspondante trouvée.</div>
          </div>
        )}
      </div>

      {/* Directives and Tunisian Clinical Best Practices Info */}
      <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 flex items-start gap-3.5 text-xs text-amber-900 leading-relaxed">
        <Activity className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-950 mb-1">Rappels Clíniques Ordonnancier Tunisien :</h4>
          <p className="text-amber-800">
            Veillez à respecter les nomenclatures officielles de la PCT (Pharmacie Centrale de Tunisie) lors des prescriptions de spécialités importées, et renseignez toujours le code APCI bilingue en cas de maladies de longue durée pour garantir un remboursement rapide par la CNAM.
          </p>
        </div>
      </div>
    </div>
  );
}

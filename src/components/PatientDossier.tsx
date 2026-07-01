import React from 'react';
import { Patient } from '../types';
import { Lock, Users } from 'lucide-react';

interface PatientDossierProps {
  patient: Patient | null;
  userRole: 'doctor' | 'secretary';
}

export default function PatientDossier({ patient, userRole }: PatientDossierProps) {
  if (!patient) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">
            {userRole === 'secretary' ? 'Gestion Patientèle Secrétariat' : 'Dossier Patient'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Sélectionnez un patient dans la colonne de gauche ou cliquez sur le bouton <strong className="text-slate-700">"Ajouter un Patient"</strong> pour enregistrer un nouveau dossier administratif dans le cabinet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 animate-fade-in">
      <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Dossier Patient Administratif</h2>
          <p className="text-xs text-slate-500">Informations administratives d'accueil enregistrées</p>
        </div>
        <span className={`px-3 py-1 font-semibold rounded-full text-[10px] tracking-wide uppercase border ${
          userRole === 'secretary' 
            ? 'bg-teal-50 text-teal-700 border-teal-100' 
            : 'bg-sky-50 text-sky-700 border-sky-100'
        }`}>
          {userRole === 'secretary' ? 'Accès Secrétariat' : 'Accès Médecin'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nom complet</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{patient.name_first} {patient.name_last}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date de naissance</span>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {new Date(patient.birth_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Genre</span>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">{patient.gender === 'M' ? 'Masculin (♂)' : 'Féminin (♀)'}</p>
          </div>
          {patient.phone && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">N° Téléphone</span>
              <p className="text-sm font-semibold text-teal-600 mt-0.5">{patient.phone}</p>
            </div>
          )}
          {patient.weight && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Poids</span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{patient.weight} kg</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Allergies déclarées</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {patient.allergies.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Aucune allergie enregistrée</span>
              ) : (
                patient.allergies.map((allergy, i) => (
                  <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-xs font-semibold">
                    {allergy}
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Traitements en cours</span>
            <div className="flex flex-col gap-1.5 mt-1.5">
              {!patient.current_medications || patient.current_medications.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Aucun traitement en cours renseigné</span>
              ) : (
                patient.current_medications.map((med) => (
                  <div key={med.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50 text-xs text-slate-700 font-semibold">
                    <span className="text-slate-800">{med.medicine_label}</span>
                    {med.dci_name && <span className="text-[10px] text-slate-400 font-normal">({med.dci_name})</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-500 flex gap-2.5">
        <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Conformément aux habilitations de sécurité de l'application, les ordonnances et données de prescription clinique sont strictement isolées et restent accessibles uniquement au médecin traitant habilité.
        </p>
      </div>
    </div>
  );
}

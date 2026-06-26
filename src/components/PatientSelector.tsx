/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Patient, CurrentMedication } from '../types';
import { 
  User, 
  Plus, 
  Search, 
  AlertTriangle, 
  Baby, 
  Activity, 
  Heart, 
  UserPlus, 
  Check, 
  Edit,
  Trash2,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import { logAudit, INITIAL_MEDICINES } from '../data';

const ALLERGEN_SUGGESTIONS = [
  'Pénicilline',
  'Amoxicilline',
  'Sulfamides',
  'Aspirine',
  'Kétoprofène',
  'Diclofénac',
  'Paracétamol',
  'Tramadol',
  'Codéine',
  'Furosémide',
  'Alprazolam',
  'Sildénafil',
  'Metformine',
  'Warfarine',
  'Méthotrexate',
  'Acide clavulanique',
  'Ibuprofène',
  'Lidocaïne',
  'Produit de contraste iodé',
  'Latex'
];

function cleanString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '') // Keep alphanumeric only
    .trim();
}

function getLevenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function isSubsequence(inputCleaned: string, targetCleaned: string): boolean {
  let inputIdx = 0;
  let targetIdx = 0;
  while (inputIdx < inputCleaned.length && targetIdx < targetCleaned.length) {
    if (inputCleaned[inputIdx] === targetCleaned[targetIdx]) {
      inputIdx++;
    }
    targetIdx++;
  }
  return inputIdx === inputCleaned.length;
}

function calculateFuzzyScore(input: string, suggestion: string): { score: number; matchType: 'exact' | 'prefix' | 'substring' | 'fuzzy' | 'none' } {
  const sClean = cleanString(suggestion);
  const iClean = cleanString(input);
  if (!iClean) return { score: 0, matchType: 'none' };
  
  if (sClean === iClean) return { score: 1.0, matchType: 'exact' };
  if (sClean.startsWith(iClean)) return { score: 0.9, matchType: 'prefix' };
  if (sClean.includes(iClean)) return { score: 0.8, matchType: 'substring' };
  
  // Levenshtein-based similarity
  const dist = getLevenshteinDistance(iClean, sClean);
  const maxLen = Math.max(iClean.length, sClean.length);
  const similarity = 1 - dist / maxLen;
  
  // Subsequence match bonus
  if (isSubsequence(iClean, sClean)) {
    const subsequenceScore = Math.max(similarity, 0.5 + (iClean.length / sClean.length) * 0.3);
    return { score: subsequenceScore, matchType: 'fuzzy' };
  }
  
  // If Levenshtein is close enough, treat as fuzzy
  if (similarity >= 0.45) {
    return { score: similarity, matchType: 'fuzzy' };
  }
  
  return { score: 0, matchType: 'none' };
}

interface PatientSelectorProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient | null) => void;
  onPatientsChange: (newPatients: Patient[]) => void;
}

export default function PatientSelector({
  patients,
  selectedPatient,
  onSelectPatient,
  onPatientsChange,
}: PatientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // New Patient Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [weight, setWeight] = useState('');
  const [isPregnant, setIsPregnant] = useState(false);
  const [hasRenal, setHasRenal] = useState(false);
  const [hasHepatic, setHasHepatic] = useState(false);
  const [allergiesText, setAllergiesText] = useState('');
  const [allergiesList, setAllergiesList] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [formError, setFormError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');

  // Current medications Form State
  const [currentMedicationsList, setCurrentMedicationsList] = useState<CurrentMedication[]>([]);
  const [medInputLabel, setMedInputLabel] = useState('');
  const [medInputDci, setMedInputDci] = useState('');
  const [showMedSuggestions, setShowMedSuggestions] = useState(false);

  const filteredPatients = patients.filter((p) => {
    const full = `${p.name_first} ${p.name_last}`.toLowerCase();
    const rev = `${p.name_last} ${p.name_first}`.toLowerCase();
    const query = searchTerm.toLowerCase();
    return full.includes(query) || rev.includes(query);
  });

  const getAge = (birthDateStr: string): number => {
    const today = new Date();
    const birth = new Date(birthDateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getAgeString = (birthDateStr: string): string => {
    const age = getAge(birthDateStr);
    if (age === 0) {
      const birth = new Date(birthDateStr);
      const today = new Date();
      const diffMs = today.getTime() - birth.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30.43);
      if (diffMonths === 0) {
        return `${diffDays} j`;
      }
      return `${diffMonths} mois`;
    }
    return `${age} ans`;
  };

  const startAddPatient = () => {
    setFirstName('');
    setLastName('');
    setBirthDate('');
    setGender('M');
    setWeight('');
    setIsPregnant(false);
    setHasRenal(false);
    setHasHepatic(false);
    setAllergiesText('');
    setAllergiesList([]);
    setAllergyInput('');
    setActiveSuggestionIndex(-1);
    setFormError(null);
    setPhone('');
    setCurrentMedicationsList([]);
    setMedInputLabel('');
    setMedInputDci('');
    setShowMedSuggestions(false);
    setIsAdding(true);
    setIsEditing(false);
  };

  const startEditPatient = () => {
    if (!selectedPatient) return;
    setFirstName(selectedPatient.name_first);
    setLastName(selectedPatient.name_last);
    setBirthDate(selectedPatient.birth_date);
    setGender(selectedPatient.gender);
    setWeight(selectedPatient.weight ? String(selectedPatient.weight) : '');
    setIsPregnant(selectedPatient.is_pregnant || false);
    setHasRenal(selectedPatient.has_renal_impairment || false);
    setHasHepatic(selectedPatient.has_hepatic_impairment || false);
    setAllergiesText(selectedPatient.allergies.join(', '));
    setAllergiesList([...selectedPatient.allergies]);
    setAllergyInput('');
    setActiveSuggestionIndex(-1);
    setFormError(null);
    setPhone(selectedPatient.phone || '');
    setCurrentMedicationsList(selectedPatient.current_medications || []);
    setMedInputLabel('');
    setMedInputDci('');
    setShowMedSuggestions(false);
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !birthDate) {
      setFormError('Veuillez remplir tous les champs obligatoires (Prénom, Nom, Date de naissance).');
      return;
    }

    setFormError(null);
    const parsedWeight = weight ? parseFloat(weight) : undefined;

    if (isAdding) {
      const newPatient: Patient = {
        id: 'pat-' + Math.random().toString(36).substr(2, 9),
        name_first: firstName.trim(),
        name_last: lastName.trim(),
        birth_date: birthDate,
        gender,
        weight: parsedWeight,
        allergies: allergiesList,
        is_pregnant: gender === 'F' ? isPregnant : false,
        has_renal_impairment: hasRenal,
        has_hepatic_impairment: hasHepatic,
        phone: phone.trim(),
        current_medications: currentMedicationsList,
      };

      const updated = [...patients, newPatient];
      onPatientsChange(updated);
      onSelectPatient(newPatient);
      logAudit('CREATE_PATIENT', 'PATIENT', newPatient.id, null, newPatient);
      setIsAdding(false);
    } else if (isEditing && selectedPatient) {
      const updatedPatient: Patient = {
        ...selectedPatient,
        name_first: firstName.trim(),
        name_last: lastName.trim(),
        birth_date: birthDate,
        gender,
        weight: parsedWeight,
        allergies: allergiesList,
        is_pregnant: gender === 'F' ? isPregnant : false,
        has_renal_impairment: hasRenal,
        has_hepatic_impairment: hasHepatic,
        phone: phone.trim(),
        current_medications: currentMedicationsList,
      };

      const updated = patients.map((p) => (p.id === selectedPatient.id ? updatedPatient : p));
      onPatientsChange(updated);
      onSelectPatient(updatedPatient);
      logAudit('UPDATE_PATIENT', 'PATIENT', selectedPatient.id, selectedPatient, updatedPatient);
      setIsEditing(false);
    }
  };

  const handleAddCurrentMedication = () => {
    if (!medInputLabel.trim()) return;
    const newItem: CurrentMedication = {
      id: 'cm-' + Math.random().toString(36).substr(2, 9),
      medicine_label: medInputLabel.trim(),
      dci_name: medInputDci.trim() || undefined
    };
    setCurrentMedicationsList([...currentMedicationsList, newItem]);
    setMedInputLabel('');
    setMedInputDci('');
    setShowMedSuggestions(false);
  };

  const handleRemoveCurrentMedication = (id: string) => {
    setCurrentMedicationsList(currentMedicationsList.filter(m => m.id !== id));
  };

  const handleTogglePregnancy = () => {
    if (!selectedPatient) return;
    const nextVal = !selectedPatient.is_pregnant;
    const updatedPatient = { ...selectedPatient, is_pregnant: nextVal };
    const updated = patients.map((p) => (p.id === selectedPatient.id ? updatedPatient : p));
    onPatientsChange(updated);
    onSelectPatient(updatedPatient);
    logAudit('TOGGLE_PREGNANCY_PATIENT', 'PATIENT', selectedPatient.id, selectedPatient, updatedPatient);
  };

  const handleToggleRenal = () => {
    if (!selectedPatient) return;
    const nextVal = !selectedPatient.has_renal_impairment;
    const updatedPatient = { ...selectedPatient, has_renal_impairment: nextVal };
    const updated = patients.map((p) => (p.id === selectedPatient.id ? updatedPatient : p));
    onPatientsChange(updated);
    onSelectPatient(updatedPatient);
    logAudit('TOGGLE_RENAL_PATIENT', 'PATIENT', selectedPatient.id, selectedPatient, updatedPatient);
  };

  const handleToggleHepatic = () => {
    if (!selectedPatient) return;
    const nextVal = !selectedPatient.has_hepatic_impairment;
    const updatedPatient = { ...selectedPatient, has_hepatic_impairment: nextVal };
    const updated = patients.map((p) => (p.id === selectedPatient.id ? updatedPatient : p));
    onPatientsChange(updated);
    onSelectPatient(updatedPatient);
    logAudit('TOGGLE_HEPATIC_PATIENT', 'PATIENT', selectedPatient.id, selectedPatient, updatedPatient);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5" id="patient-selector-widget">
      {/* Search and Selection Row */}
      <div className="flex items-center gap-2 justify-between">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 uppercase text-slate-500">
          <User className="w-4.5 h-4.5 text-sky-500" />
          Dossier Patient
        </h2>
        <button
          onClick={startAddPatient}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau Patient
        </button>
      </div>

      {!isAdding && !isEditing && (
        <div className="space-y-4">
          {/* Patient Finder */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un patient (ex: Trabelsi)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-slate-50">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPatient(p);
                        setSearchTerm('');
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="font-semibold text-slate-700">
                        {p.name_last.toUpperCase()} {p.name_first}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{p.gender === 'M' ? 'Homme' : 'Femme'}</span>
                        <span>•</span>
                        <span>{getAgeString(p.birth_date)}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-xs text-slate-400 text-center">Aucun patient trouvé</div>
                )}
              </div>
            )}
          </div>

          {/* Selected Patient Card */}
          {selectedPatient ? (
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-3 relative overflow-hidden group">
              {/* Profile Main info */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-base font-bold text-slate-800">
                    {selectedPatient.name_last.toUpperCase()} {selectedPatient.name_first}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                    <span>{selectedPatient.gender === 'M' ? 'Masculin' : 'Féminin'}</span>
                    <span>•</span>
                    <span>Né(e) le {new Date(selectedPatient.birth_date).toLocaleDateString('fr-FR')} ({getAgeString(selectedPatient.birth_date)})</span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={startEditPatient}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                    title="Modifier le dossier patient"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Voulez-vous retirer ce patient ?')) {
                        const updated = patients.filter((p) => p.id !== selectedPatient.id);
                        onPatientsChange(updated);
                        onSelectPatient(null);
                        logAudit('DELETE_PATIENT', 'PATIENT', selectedPatient.id, selectedPatient, null);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                    title="Supprimer le patient"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Patient Contacts & Vital Info */}
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-medium">Poids:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPatient.weight ? `${selectedPatient.weight} kg` : (
                      <span className="text-rose-500 font-medium flex items-center gap-0.5 animate-pulse">
                        Non renseigné <AlertCircle className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </span>
                </div>
                {selectedPatient.phone && (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-medium">Tél:</span>
                    <span className="font-semibold text-slate-800">{selectedPatient.phone}</span>
                  </div>
                )}
              </div>

              {/* Pediatric Warning */}
              {getAge(selectedPatient.birth_date) < 15 && !selectedPatient.weight && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs flex gap-2">
                  <Baby className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <span className="font-bold">Alerte pédiatrique :</span> L'âge du patient est inférieur à 15 ans. Le poids est impérativement requis pour l'ajustement de la posologie.
                  </div>
                </div>
              )}

              {/* Dynamic Warning Badges & Impairment Toggles */}
              <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-100">
                <button
                  onClick={handleToggleRenal}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                    selectedPatient.has_renal_impairment
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                  title="Activer/Désactiver l'insuffisance rénale"
                >
                  <Activity className="w-3 h-3" />
                  Insuff. Rénale
                </button>
                <button
                  onClick={handleToggleHepatic}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                    selectedPatient.has_hepatic_impairment
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                  title="Activer/Désactiver l'insuffisance hépatique"
                >
                  <Activity className="w-3 h-3" />
                  Insuff. Hépatique
                </button>
                {selectedPatient.gender === 'F' && (
                  <button
                    onClick={handleTogglePregnancy}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                      selectedPatient.is_pregnant
                        ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Heart className="w-3 h-3" />
                    Grossesse active
                  </button>
                )}
              </div>

              {/* Allergies Block */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-600 mb-1">Allergies déclarées :</div>
                {selectedPatient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedPatient.allergies.map((allergy, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[10px] font-bold"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">Aucune allergie connue</div>
                )}
              </div>

              {/* Current Medications Block */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                  <span>Médicaments en cours :</span>
                </div>
                {selectedPatient.current_medications && selectedPatient.current_medications.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedPatient.current_medications.map((med) => (
                      <span
                        key={med.id}
                        className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-100 rounded text-[10px] font-bold flex items-center gap-1"
                        title={med.dci_name ? `DCI : ${med.dci_name}` : 'Saisie libre'}
                      >
                        <span>{med.medicine_label}</span>
                        {med.dci_name && (
                          <span className="text-[8px] font-semibold text-sky-500">({med.dci_name})</span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">Aucun traitement déclaré</div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
              <User className="w-8 h-8 text-slate-300" />
              <div className="text-xs text-slate-500 font-medium">Sélectionnez un patient existant ou créez un nouveau dossier pour commencer la prescription.</div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Patient Drawer/Form */}
      {(isAdding || isEditing) && (
        <form onSubmit={handleSavePatient} className="space-y-4 border border-slate-100 bg-slate-50/40 p-4 rounded-xl animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <UserPlus className="w-4 h-4 text-sky-600" />
              {isAdding ? 'Ajouter un patient' : 'Modifier le patient'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setIsEditing(false);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-medium"
            >
              Annuler
            </button>
          </div>

          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs flex gap-2 font-medium animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Nom *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Ex: Trabelsi"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Prénom *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Ex: Mohamed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Date Naissance *</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Sexe *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Poids (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Ex: 84"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Téléphone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Ex: +216 98 765 432"
              />
            </div>
          </div>

          {/* Saisie Assistée des Allergies */}
          <div className="space-y-2 border border-slate-100 bg-white p-3 rounded-xl">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Allergies du Patient / الحساسية</span>
              <span className="text-[9px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100/50 normal-case font-bold">Aide à la saisie 100%</span>
            </label>

            {/* Visual Tags list */}
            {allergiesList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-100/80 rounded-lg min-h-[36px]">
                {allergiesList.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-rose-50 border border-rose-100/80 text-rose-800 text-[10px] font-bold rounded-md animate-fadeIn"
                  >
                    <span>{allergy}</span>
                    <button
                      type="button"
                      onClick={() => setAllergiesList(allergiesList.filter((_, i) => i !== idx))}
                      className="p-0.5 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 italic p-2.5 bg-slate-50 border border-dashed border-slate-200/60 text-center rounded-lg">
                Aucune allergie déclarée pour le moment.
              </div>
            )}

            {/* Input with real-time suggestions list */}
            <div className="relative">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => {
                  setAllergyInput(e.target.value);
                  setShowSuggestions(true);
                  setActiveSuggestionIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Keep a tiny timeout to allow click actions to complete first
                  setTimeout(() => setShowSuggestions(false), 250);
                }}
                onKeyDown={(e) => {
                  const scored = ALLERGEN_SUGGESTIONS.map(s => {
                    const res = calculateFuzzyScore(allergyInput, s);
                    return { suggestion: s, ...res };
                  })
                  .filter(item => item.score > 0 && !allergiesList.some((existing) => existing.toLowerCase() === item.suggestion.toLowerCase()))
                  .sort((a, b) => b.score - a.score);

                  const dropdownOptions: { type: 'suggestion' | 'custom'; label: string; score: number; matchType: string }[] = scored.map(item => ({
                    type: 'suggestion' as const,
                    label: item.suggestion,
                    score: item.score,
                    matchType: item.matchType
                  }));

                  if (allergyInput.trim() && !scored.some(s => s.suggestion.toLowerCase() === allergyInput.trim().toLowerCase())) {
                    dropdownOptions.push({
                      type: 'custom' as const,
                      label: allergyInput.trim(),
                      score: 0,
                      matchType: 'none'
                    });
                  }

                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setShowSuggestions(true);
                    setActiveSuggestionIndex(prev => 
                      prev < dropdownOptions.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (activeSuggestionIndex >= 0 && activeSuggestionIndex < dropdownOptions.length) {
                      const selectedOpt = dropdownOptions[activeSuggestionIndex];
                      if (!allergiesList.some((a) => a.toLowerCase() === selectedOpt.label.toLowerCase())) {
                        setAllergiesList([...allergiesList, selectedOpt.label]);
                      }
                      setAllergyInput('');
                      setShowSuggestions(false);
                      setActiveSuggestionIndex(-1);
                    } else if (allergyInput.trim()) {
                      const trimmed = allergyInput.trim();
                      if (!allergiesList.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
                        setAllergiesList([...allergiesList, trimmed]);
                      }
                      setAllergyInput('');
                      setShowSuggestions(false);
                      setActiveSuggestionIndex(-1);
                    }
                  } else if (e.key === ',') {
                    e.preventDefault();
                    if (allergyInput.trim()) {
                      const trimmed = allergyInput.trim();
                      if (!allergiesList.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
                        setAllergiesList([...allergiesList, trimmed]);
                      }
                      setAllergyInput('');
                      setShowSuggestions(false);
                      setActiveSuggestionIndex(-1);
                    }
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                    setActiveSuggestionIndex(-1);
                  }
                }}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition-all placeholder:text-slate-400"
                placeholder="Chercher une molécule ou un produit (ex: Amoxicilline...)"
              />

              {/* Suggestions dropdown */}
              {showSuggestions && allergyInput.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-50">
                  {(() => {
                    const scored = ALLERGEN_SUGGESTIONS.map(s => {
                      const res = calculateFuzzyScore(allergyInput, s);
                      return { suggestion: s, ...res };
                    })
                    .filter(item => item.score > 0 && !allergiesList.some((existing) => existing.toLowerCase() === item.suggestion.toLowerCase()))
                    .sort((a, b) => b.score - a.score);

                    const dropdownOptions: { type: 'suggestion' | 'custom'; label: string; score: number; matchType: string }[] = scored.map(item => ({
                      type: 'suggestion' as const,
                      label: item.suggestion,
                      score: item.score,
                      matchType: item.matchType
                    }));

                    if (allergyInput.trim() && !scored.some(s => s.suggestion.toLowerCase() === allergyInput.trim().toLowerCase())) {
                      dropdownOptions.push({
                        type: 'custom' as const,
                        label: allergyInput.trim(),
                        score: 0,
                        matchType: 'none'
                      });
                    }

                    if (dropdownOptions.length === 0) {
                      return (
                        <div className="px-3 py-2 text-slate-400 text-[10px] italic">
                          Aucune suggestion trouvée (Appuyez sur Entrée pour ajouter l'allergène personnalisé)
                        </div>
                      );
                    }

                    return dropdownOptions.map((opt, idx) => {
                      const isFocused = idx === activeSuggestionIndex;
                      if (opt.type === 'suggestion') {
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onMouseDown={() => {
                              if (!allergiesList.some((a) => a.toLowerCase() === opt.label.toLowerCase())) {
                                setAllergiesList([...allergiesList, opt.label]);
                              }
                              setAllergyInput('');
                              setShowSuggestions(false);
                              setActiveSuggestionIndex(-1);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              isFocused 
                                ? 'bg-rose-50 text-rose-900 border-l-2 border-rose-500 font-medium' 
                                : 'hover:bg-rose-50/40 text-slate-700 hover:text-rose-900'
                            }`}
                          >
                            <span className="font-semibold flex items-center gap-1.5">
                              <span>{opt.label}</span>
                              {opt.score < 0.95 && (
                                <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded-sm border ${
                                  isFocused 
                                    ? 'text-amber-700 bg-amber-50/70 border-amber-200/50' 
                                    : 'text-amber-600 bg-amber-50 border-amber-100/50'
                                }`}>
                                  Suggestion intelligente ({(opt.score * 100).toFixed(0)}%)
                                </span>
                              )}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${
                              isFocused 
                                ? 'text-rose-800 bg-rose-100/80 border-rose-200' 
                                : 'text-rose-500 bg-rose-50 border-rose-100'
                            }`}>
                              {opt.matchType === 'exact' ? 'Exact' : 'Allergène'}
                            </span>
                          </button>
                        );
                      } else {
                        return (
                          <button
                            key="custom-allergy-option"
                            type="button"
                            onMouseDown={() => {
                              if (!allergiesList.some((a) => a.toLowerCase() === opt.label.toLowerCase())) {
                                setAllergiesList([...allergiesList, opt.label]);
                              }
                              setAllergyInput('');
                              setShowSuggestions(false);
                              setActiveSuggestionIndex(-1);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between cursor-pointer italic ${
                              isFocused 
                                ? 'bg-sky-50 text-sky-900 border-l-2 border-sky-500 font-semibold' 
                                : 'hover:bg-slate-50 text-sky-700 font-semibold'
                            }`}
                          >
                            <span>Ajouter l'allergène personnalisé "{opt.label}"</span>
                            <span className={`text-[9px] px-1 py-0.5 rounded border ${
                              isFocused 
                                ? 'text-sky-800 bg-sky-100/80 border-sky-200' 
                                : 'text-slate-400 bg-slate-50 border-slate-200'
                            }`}>
                              Nouveau
                            </span>
                          </button>
                        );
                      }
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Quick click helper allergens */}
            <div>
              <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse animate-duration-1000" />
                <span>Allergènes fréquents (Clic rapide) :</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {['Pénicilline', 'Amoxicilline', 'Sulfamides', 'Aspirine', 'Kétoprofène', 'Paracétamol', 'Tramadol', 'Codéine'].map((q) => {
                  const alreadyAdded = allergiesList.some((existing) => existing.toLowerCase() === q.toLowerCase());
                  return (
                    <button
                      key={q}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => {
                        setAllergiesList([...allergiesList, q]);
                      }}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded-md border transition-all cursor-pointer ${
                        alreadyAdded
                          ? 'bg-slate-100 text-slate-300 border-slate-200/50 cursor-not-allowed line-through'
                          : 'bg-rose-50/50 text-rose-700 border-rose-100/60 hover:bg-rose-100 hover:border-rose-200 hover:shadow-xs'
                      }`}
                    >
                      + {q}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-100">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pathologies & Facteurs de Risque</div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasRenal}
                  onChange={(e) => setHasRenal(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-sky-400"
                />
                Insuffisance rénale
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasHepatic}
                  onChange={(e) => setHasHepatic(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-sky-400"
                />
                Insuffisance hépatique
              </label>
              {gender === 'F' && (
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={(e) => setIsPregnant(e.target.checked)}
                    className="rounded text-sky-500 focus:ring-sky-400"
                  />
                  Grossesse en cours / Allaitement
                </label>
              )}
            </div>
          </div>

          {/* Current Medications Selection Sub-form */}
          <div className="space-y-3 bg-white p-2.5 rounded-lg border border-slate-100">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
              <span>Médicaments en cours d'utilisation</span>
              <span className="text-slate-400 normal-case font-normal">(pour éviter les interactions)</span>
            </div>

            {/* List of current medications being added */}
            {currentMedicationsList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-100/50">
                {currentMedicationsList.map((m) => (
                  <span
                    key={m.id}
                    className="pl-2 pr-1.5 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-100/85 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span>{m.medicine_label}</span>
                    {m.dci_name && <span className="text-[9px] font-semibold text-sky-500">({m.dci_name})</span>}
                    <button
                      type="button"
                      onClick={() => handleRemoveCurrentMedication(m.id)}
                      className="text-slate-400 hover:text-rose-600 rounded-full hover:bg-white p-0.5 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 italic">Aucun traitement en cours déclaré.</div>
            )}

            {/* Add current medication inputs */}
            <div className="space-y-2 pt-1 border-t border-slate-100/50 relative">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Nom commercial</label>
                  <input
                    type="text"
                    placeholder="Ex: DOLIPRANE ou Saisie libre"
                    value={medInputLabel}
                    onChange={(e) => {
                      setMedInputLabel(e.target.value);
                      setShowMedSuggestions(true);
                    }}
                    onFocus={() => setShowMedSuggestions(true)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition-all placeholder:text-slate-400"
                  />

                  {/* Autocomplete dropdown for medicines */}
                  {showMedSuggestions && medInputLabel.trim() && (
                    <div className="absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto divide-y divide-slate-100">
                      {(() => {
                        const filtered = INITIAL_MEDICINES.filter(med => {
                          const brand = med.name_brand.toLowerCase();
                          const dci = med.dci_name.toLowerCase();
                          const query = medInputLabel.toLowerCase();
                          return brand.includes(query) || dci.includes(query);
                        }).slice(0, 5);

                        if (filtered.length === 0) {
                          return (
                            <div className="px-2.5 py-1.5 text-slate-400 text-[10px] italic">
                              Ajouter comme médicament personnalisé
                            </div>
                          );
                        }

                        return filtered.map((med) => (
                          <button
                            key={med.id}
                            type="button"
                            onMouseDown={() => {
                              setMedInputLabel(med.name_brand);
                              setMedInputDci(med.dci_name);
                              setShowMedSuggestions(false);
                            }}
                            className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-sky-50 text-slate-700 flex flex-col transition-colors cursor-pointer"
                          >
                            <span className="font-bold text-slate-800 text-[11px]">{med.name_brand}</span>
                            <span className="text-[9px] text-slate-400 font-medium">DCI : {med.dci_name}</span>
                          </button>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">DCI (Substance)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Ex: Paracétamol"
                      value={medInputDci}
                      onChange={(e) => setMedInputDci(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddCurrentMedication}
                      disabled={!medInputLabel.trim()}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        medInputLabel.trim()
                          ? 'bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100'
                          : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Enregistrer le dossier patient
          </button>
        </form>
      )}
    </div>
  );
}

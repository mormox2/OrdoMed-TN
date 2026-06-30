/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Medicine, 
  DosageTemplate, 
  Patient, 
  Prescription, 
  PrescriptionItem, 
  LanguageMode,
  SourceType
} from '../types';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  FileText, 
  Check, 
  Info, 
  Sparkles, 
  PenTool, 
  Lock, 
  Unlock,
  PlusCircle,
  Eye,
  AlertCircle,
  Globe,
  Languages,
  ShieldAlert,
  Skull,
  Scale,
  Activity
} from 'lucide-react';
import { logAudit, normalizeSearchText } from '../data';
import { 
  checkMedicineAllergies, 
  checkDrugInteractions, 
  checkTherapeuticOverlaps 
} from '../interactionsData';

interface PrescriptionFormProps {
  patient: Patient | null;
  medicines: Medicine[];
  dosageTemplates: DosageTemplate[];
  activePrescription: Prescription | null;
  activeItems: PrescriptionItem[];
  onSaveDraft: (prescription: Prescription, items: PrescriptionItem[]) => void;
  onSignAndLock: (prescription: Prescription, items: PrescriptionItem[]) => void;
  onOpenPrintPreview: (prescription: Prescription, items: PrescriptionItem[]) => void;
  onReset: () => void;
}

function createPrescriptionNumber(): string {
  const year = new Date().getFullYear();
  const randomPart = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replaceAll('-', '').slice(0, 16)
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.slice(0, 16);
  return `ORD-${year}-${randomPart.toUpperCase()}`;
}

function isTableBMedicine(medicine?: Medicine): boolean {
  const tableau = medicine?.tableau?.trim().toUpperCase();
  if (tableau) return tableau === 'B';
  return medicine?.requires_special_prescription === true;
}

function hasOralOrTransdermalForm(medicine?: Medicine): boolean {
  if (!medicine) return false;
  const route = medicine.route?.trim().toLowerCase() || '';
  const form = medicine.pharmaceutical_form.trim().toLowerCase();
  return route === 'oral' || route === 'orale' || form.includes('transderm') || form.includes('patch');
}

export default function PrescriptionForm({
  patient,
  medicines,
  dosageTemplates,
  activePrescription,
  activeItems,
  onSaveDraft,
  onSignAndLock,
  onOpenPrintPreview,
  onReset,
}: PrescriptionFormProps) {
  // Autocomplete & input state for adding medicines
  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<Medicine[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Active items list
  const [items, setItems] = useState<PrescriptionItem[]>([...activeItems]);

  // General Prescription options
  const [printMode, setPrintMode] = useState<LanguageMode>('bilingual');
  const [notesPrivate, setNotesPrivate] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isCnamApci, setIsCnamApci] = useState(false);

  // Autocomplete debounce timer
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Modal / Drawer state for Suggestion choices
  const [selectedTemplateMed, setSelectedTemplateMed] = useState<Medicine | null>(null);
  const [matchedTemplates, setMatchedTemplates] = useState<DosageTemplate[]>([]);
  const [activeSuggestionItemIndex, setActiveSuggestionItemIndex] = useState<number | null>(null);

  // Reset items when active items change externally (e.g. duplicating)
  useEffect(() => {
    setItems([...activeItems]);
  }, [activeItems]);

  useEffect(() => {
    if (activePrescription) {
      setPrintMode(activePrescription.print_language_mode);
      setNotesPrivate(activePrescription.notes_private || '');
      setPrescriptionDate(activePrescription.prescription_date);
      setIsCnamApci(!!activePrescription.is_cnam_apci);
    } else {
      setPrintMode('bilingual');
      setNotesPrivate('');
      setPrescriptionDate(new Date().toISOString().split('T')[0]);
      setIsCnamApci(false);
    }
  }, [activePrescription]);

  // Debounced search logic for Tunisian medicines
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.trim().length < 2) {
      setAutocompleteResults([]);
      setTotalMatches(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      const normalizedQuery = normalizeSearchText(searchQuery);

      // Perform matching
      const results = medicines.filter((m) => {
        const matchesBrand = m.name_normalized.includes(normalizedQuery) || m.name_brand.toLowerCase().includes(normalizedQuery);
        const matchesDCI = m.dci_normalized.includes(normalizedQuery) || m.dci_name.toLowerCase().includes(normalizedQuery);
        const matchesPCT = m.pct_code && m.pct_code.includes(normalizedQuery);
        const matchesClass = m.therapeutic_class && m.therapeutic_class.toLowerCase().includes(normalizedQuery);

        return matchesBrand || matchesDCI || matchesPCT || matchesClass;
      });

      setTotalMatches(results.length);
      setAutocompleteResults(results.slice(0, 15)); // Limit to a maximum of 15 suggestions
      setIsSearching(false);
    }, 180); // Debounce time in ms

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, medicines]);

  // Calculate age for target patient
  const getPatientAge = (birthDateStr: string): number => {
    const today = new Date();
    const birth = new Date(birthDateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Check duplicate active ingredients (DCI) inside active items list
  const getDciDuplicateAlert = (dciName?: string, currentId?: string): boolean => {
    if (!dciName) return false;
    const currentDummyItems = items.map(it => ({
      id: it.id,
      medicine_label: it.medicine_label,
      dci_name: it.dci_name
    }));
    const overlaps = checkTherapeuticOverlaps(currentDummyItems);
    return overlaps.some(o => 
      (o.medicineALabel === currentDummyItems.find(it => it.id === currentId)?.medicine_label ||
       o.medicineBLabel === currentDummyItems.find(it => it.id === currentId)?.medicine_label)
    );
  };

  // Check patient allergy matching active ingredient (DCI) or brand
  const getAllergyAlert = (medicine: Medicine | string): boolean => {
    if (!patient) return false;
    const name = typeof medicine === 'string' ? medicine : medicine.name_brand;
    const dci = typeof medicine === 'string' ? undefined : medicine.dci_name;
    const result = checkMedicineAllergies(name, dci, patient.allergies);
    return result.isAllergic;
  };

  // Allergy warning for a text input
  const getAllergyAlertForLine = (line: PrescriptionItem): boolean => {
    if (!patient) return false;
    const result = checkMedicineAllergies(line.medicine_label, line.dci_name, patient.allergies);
    return result.isAllergic;
  };

  // Get specific allergy details for displaying a clear label
  const getAllergyDetailsForLine = (line: PrescriptionItem): string | null => {
    if (!patient) return null;
    const result = checkMedicineAllergies(line.medicine_label, line.dci_name, patient.allergies);
    return result.isAllergic ? result.matchedAllergen : null;
  };

  // Handle adding a medicine from database
  const handleSelectMedicine = (med: Medicine) => {
    const newItem: PrescriptionItem = {
      id: 'item-' + Math.random().toString(36).substr(2, 9),
      prescription_id: activePrescription?.id || 'draft-current',
      medicine_id: med.id,
      line_order: items.length + 1,
      medicine_label: `${med.name_brand} ${med.dosage_strength} ${med.pharmaceutical_form}`,
      dci_name: med.dci_name,
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      instructions_fr: '',
      instructions_ar: '',
      is_suggestion_used: false,
      doctor_modified_suggestion: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newItems = [...items, newItem];
    setItems(newItems);
    setSearchQuery('');
    setShowResults(false);

    // Look for matching dosage templates
    const templates = dosageTemplates.filter(
      (t) => t.medicine_id === med.id || (t.dci_name && t.dci_name.toLowerCase() === med.dci_name.toLowerCase())
    );

    if (templates.length > 0) {
      setSelectedTemplateMed(med);
      setMatchedTemplates(templates);
      setActiveSuggestionItemIndex(newItems.length - 1);
    }
  };

  // Add custom manual "hors-base" medicine
  const handleAddManualMedicine = () => {
    if (!searchQuery.trim()) return;

    const newItem: PrescriptionItem = {
      id: 'item-' + Math.random().toString(36).substr(2, 9),
      prescription_id: activePrescription?.id || 'draft-current',
      custom_medicine_name: searchQuery.trim(),
      line_order: items.length + 1,
      medicine_label: `${searchQuery.trim()} (Hors Base)`,
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      instructions_fr: '',
      instructions_ar: '',
      is_suggestion_used: false,
      doctor_modified_suggestion: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setItems([...items, newItem]);
    setSearchQuery('');
    setShowResults(false);
  };

  // Trigger recommendations for an existing item
  const handleTriggerSuggestionsForLine = (index: number) => {
    const item = items[index];
    if (!item.medicine_id) {
      alert("Les suggestions ne sont pas disponibles pour les médicaments saisis hors base.");
      return;
    }

    const med = medicines.find((m) => m.id === item.medicine_id);
    if (!med) return;

    const templates = dosageTemplates.filter(
      (t) => t.medicine_id === med.id || (t.dci_name && t.dci_name.toLowerCase() === med.dci_name.toLowerCase())
    );

    if (templates.length > 0) {
      setSelectedTemplateMed(med);
      setMatchedTemplates(templates);
      setActiveSuggestionItemIndex(index);
    } else {
      alert("Aucun protocole thérapeutique validé n'a été trouvé pour cette formule.");
    }
  };

  // Apply suggestions
  const handleApplySuggestion = (template: DosageTemplate, modifyBefore: boolean) => {
    if (activeSuggestionItemIndex === null) return;

    const item = items[activeSuggestionItemIndex];

    // Pediatric check
    if (template.patient_group === 'child' && (!patient || !patient.weight)) {
      alert("Saisie impossible : Le poids du patient pédiatrique est requis pour charger cette posologie.");
      return;
    }

    const updatedItem: PrescriptionItem = {
      ...item,
      dosage: template.dose_text_fr,
      frequency: template.frequency_text_fr,
      duration: template.duration_text_fr,
      instructions_fr: template.warnings_fr || '',
      instructions_ar: template.warnings_ar || '',
      is_suggestion_used: true,
      doctor_modified_suggestion: modifyBefore, // Flagged if doctor clicks edit
      updated_at: new Date().toISOString(),
    };

    const updatedList = [...items];
    updatedList[activeSuggestionItemIndex] = updatedItem;
    setItems(updatedList);

    // Reset suggest screen
    setSelectedTemplateMed(null);
    setMatchedTemplates([]);
    setActiveSuggestionItemIndex(null);
  };

  // Input editing changes for prescription lines
  const handleLineChange = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // If suggestion was used, flag doctor_modified_suggestion as true
    if (item.is_suggestion_used && (field === 'dosage' || field === 'frequency' || field === 'duration' || field === 'instructions_fr')) {
      item.doctor_modified_suggestion = true;
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveLine = (index: number) => {
    const updated = items.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      line_order: idx + 1
    }));
    setItems(updated);
  };

  // Check general clinical status for alerts
  const isFormLocked = activePrescription?.status === 'signed';

  const handleSave = () => {
    if (!patient) return;
    const presId = activePrescription?.id || 'pres-' + Math.random().toString(36).substr(2, 9);
    const presNumber = activePrescription?.prescription_number || createPrescriptionNumber();
    const ageStr = patient ? `${getPatientAge(patient.birth_date)} ans` : '';

    const prescription: Prescription = {
      id: presId,
      patient_id: patient.id,
      doctor_id: 'doc-current',
      prescription_number: presNumber,
      prescription_date: prescriptionDate,
      notes_private: notesPrivate,
      print_language_mode: printMode,
      status: 'draft',
      created_at: activePrescription?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      patient_name: `${patient.name_last.toUpperCase()} ${patient.name_first}`,
      patient_age_str: ageStr,
      patient_gender: patient.gender,
      patient_weight: patient.weight,
      patient_allergies: patient.allergies,
      is_cnam_apci: isCnamApci,
    };

    const updatedItems = items.map(item => ({
      ...item,
      prescription_id: presId
    }));

    onSaveDraft(prescription, updatedItems);
  };

  const handleSign = () => {
    if (!patient) return;
    if (items.length === 0) {
      alert("Vous ne pouvez pas signer une ordonnance vide.");
      return;
    }

    // Pediatric critical check
    const isPediatric = getPatientAge(patient.birth_date) < 15;
    if (isPediatric && !patient.weight) {
      alert("Alerte Bloquante : Le poids du patient pédiatrique doit être saisi dans le dossier avant de signer l'ordonnance.");
      return;
    }

    // Double check suspended AMMs in active items
    const hasSuspended = items.some((item) => {
      if (!item.medicine_id) return false;
      const med = medicines.find((m) => m.id === item.medicine_id);
      return med && (med.status === 'suspended' || med.status === 'removed');
    });

    if (hasSuspended) {
      const confirmForce = confirm(
         "ATTENTION : Cette ordonnance contient un médicament suspendu ou radié par le ministère (AMM révoquée). Souhaitez-vous outrepasser l'alerte sous votre entière responsabilité médicale ?"
      );
      if (!confirmForce) return;
    }

    // Check for patient allergies
    const allergicLines = items.filter(it => getAllergyAlertForLine(it));
    if (allergicLines.length > 0) {
      const allergicDetailsList = allergicLines.map(it => {
        const allergen = getAllergyDetailsForLine(it);
        return `• ${it.medicine_label} (Allergène détecté : ${allergen || 'DCI'})`;
      }).join('\n');

      const patientName = patient ? `${patient.name_first} ${patient.name_last}` : 'Sélectionné';
      const confirmAllergy = confirm(
        `ALERTE ALLERGIE PATIENT :\n\nLe patient ${patientName} est signalé comme allergique à un ou plusieurs composants prescrits :\n${allergicDetailsList}\n\nSouhaitez-vous forcer la signature et assumer la responsabilité médicale de cette prescription ?`
      );
      if (!confirmAllergy) return;
    }

    // Check for critical drug-drug interactions including patient's current medications
    const allItemsForInteractionCheck = [
      ...items.map(it => ({
        id: it.id,
        medicine_label: it.medicine_label,
        dci_name: it.dci_name
      })),
      ...(patient?.current_medications || []).map((cm, idx) => ({
        id: `cm-${cm.id || idx}`,
        medicine_label: `${cm.medicine_label} (En cours)`,
        dci_name: cm.dci_name
      }))
    ];

    const criticalInteractions = checkDrugInteractions(allItemsForInteractionCheck)
      .filter(int => int.severity === 'critical')
      .filter(int => {
        const isMedA_Current = int.medicineALabel.endsWith('(En cours)');
        const isMedB_Current = int.medicineBLabel.endsWith('(En cours)');
        return !(isMedA_Current && isMedB_Current);
      });

    if (criticalInteractions.length > 0) {
      const interactionDetailsList = criticalInteractions.map(int => 
        `• ${int.title_fr} (${int.medicineALabel} ↔ ${int.medicineBLabel})`
      ).join('\n');

      const confirmInteraction = confirm(
        `DANGER - INTERACTION MÉDICAMENTEUSE CRITIQUE :\n\nDes interactions graves à risque vital ont été détectées :\n${interactionDetailsList}\n\nÊtes-vous certain de vouloir signer cette prescription malgré ce risque clinique majeur ?`
      );
      if (!confirmInteraction) return;
    }

    // Tableau B medicines in oral or transdermal form are limited to 28 days.
    const controlledItemsWithLongDuration = items.filter(it => {
      const medicine = medicines.find((m) => m.id === it.medicine_id);
      if (!isTableBMedicine(medicine) || !hasOralOrTransdermalForm(medicine)) return false;
      
      // Parse duration to check if it exceeds 28 days
      const durationStr = it.duration.toLowerCase();
      const numMatch = durationStr.match(/\d+/);
      if (numMatch) {
        const days = parseInt(numMatch[0]);
        if (durationStr.includes('jour') && days > 28) return true;
        if (durationStr.includes('semaine') && days > 4) return true;
        if (durationStr.includes('moi') && days >= 1) return true;
      }
      return false;
    });

    if (controlledItemsWithLongDuration.length > 0) {
      alert(
        `ERREUR RÉGLEMENTAIRE (LOI TUNISIENNE) :\n\nLe(s) médicament(s) suivant(s) :\n${controlledItemsWithLongDuration.map(it => `• ${it.medicine_label} (Durée : ${it.duration})`).join('\n')}\nsont classés au tableau B (stupéfiants) sous forme orale ou transdermique. La durée maximale de prescription est limitée à 28 jours.\n\nVeuillez modifier la durée de traitement avant de pouvoir signer l'ordonnance.`
      );
      return;
    }

    const presId = activePrescription?.id || 'pres-' + Math.random().toString(36).substr(2, 9);
    const presNumber = activePrescription?.prescription_number || createPrescriptionNumber();
    const ageStr = `${getPatientAge(patient.birth_date)} ans`;

    const prescription: Prescription = {
      id: presId,
      patient_id: patient.id,
      doctor_id: 'doc-current',
      prescription_number: presNumber,
      prescription_date: prescriptionDate,
      notes_private: notesPrivate,
      print_language_mode: printMode,
      status: 'signed',
      created_at: activePrescription?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      signed_at: new Date().toISOString(),
      patient_name: `${patient.name_last.toUpperCase()} ${patient.name_first}`,
      patient_age_str: ageStr,
      patient_gender: patient.gender,
      patient_weight: patient.weight,
      patient_allergies: patient.allergies,
      is_cnam_apci: isCnamApci,
    };

    const updatedItems = items.map(item => ({
      ...item,
      prescription_id: presId
    }));

    onSignAndLock(prescription, updatedItems);
  };

  const handleOpenPrint = () => {
    if (!patient) return;
    if (items.length === 0) return;

    const presId = activePrescription?.id || 'pres-draft-' + Math.random().toString(36).substr(2, 9);
    const presNumber = activePrescription?.prescription_number || `ORD-${new Date().getFullYear()}-BROUILLON`;
    const ageStr = `${getPatientAge(patient.birth_date)} ans`;

    const prescription: Prescription = {
      id: presId,
      patient_id: patient.id,
      doctor_id: 'doc-current',
      prescription_number: presNumber,
      prescription_date: prescriptionDate,
      notes_private: notesPrivate,
      print_language_mode: printMode,
      status: activePrescription?.status || 'draft',
      created_at: activePrescription?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      patient_name: `${patient.name_last.toUpperCase()} ${patient.name_first}`,
      patient_age_str: ageStr,
      patient_gender: patient.gender,
      patient_weight: patient.weight,
      patient_allergies: patient.allergies,
      is_cnam_apci: isCnamApci,
    };

    const updatedItems = items.map(item => ({
      ...item,
      prescription_id: presId
    }));

    onOpenPrintPreview(prescription, updatedItems);
  };

  // Combine drafting items with patient's current medications for UI alerts
  const allItemsForInteractionCheckUI = [
    ...items.map(it => ({
      id: it.id,
      medicine_label: it.medicine_label,
      dci_name: it.dci_name
    })),
    ...(patient?.current_medications || []).map((cm, idx) => ({
      id: `cm-${cm.id || idx}`,
      medicine_label: `${cm.medicine_label} (En cours)`,
      dci_name: cm.dci_name
    }))
  ];

  const detectedInteractions = checkDrugInteractions(allItemsForInteractionCheckUI).filter(int => {
    const isMedA_Current = int.medicineALabel.endsWith('(En cours)');
    const isMedB_Current = int.medicineBLabel.endsWith('(En cours)');
    return !(isMedA_Current && isMedB_Current);
  });

  const detectedOverlaps = checkTherapeuticOverlaps(allItemsForInteractionCheckUI).filter(ov => {
    const isMedA_Current = ov.medicineALabel.endsWith('(En cours)');
    const isMedB_Current = ov.medicineBLabel.endsWith('(En cours)');
    return !(isMedA_Current && isMedB_Current);
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="prescription-drafting-form">
      {/* Block Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isFormLocked ? 'Ordonnance Signée & Verrouillée' : 'Nouvelle Ordonnance médicale'}
            </h2>
            <p className="text-xs text-slate-500">
              {isFormLocked ? 'Consultation archivée, non modifiable.' : 'Rédigez les consignes cliniques ci-dessous'}
            </p>
          </div>
        </div>

        {/* Date, CNAM & Print language options */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Date d'Ordonnance</label>
            <input
              type="date"
              disabled={isFormLocked}
              value={prescriptionDate}
              onChange={(e) => setPrescriptionDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 text-slate-700 font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Prise en charge CNAM</label>
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 text-slate-700 font-semibold focus-within:ring-1 focus-within:ring-sky-500 cursor-pointer h-[26px]">
              <input
                type="checkbox"
                disabled={isFormLocked}
                checked={isCnamApci}
                onChange={(e) => setIsCnamApci(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span>APCI (100%)</span>
            </label>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Langue d'Impression</label>
            <select
              disabled={isFormLocked}
              value={printMode}
              onChange={(e) => setPrintMode(e.target.value as LanguageMode)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="bilingual">Bilingue (Français/Arabe)</option>
              <option value="fr">Français uniquement</option>
              <option value="ar">Arabe uniquement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Drafting Section */}
      <div className="p-6 space-y-6">
        {patient ? (
          <>
            {/* Auto-complete input for medicines */}
            {!isFormLocked && (
              <div className="space-y-2 relative">
                <label className="block text-xs font-bold text-slate-600 uppercase">Ajouter un médicament du catalogue PCT :</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Tapez la marque ou la DCI (ex: Doliprane, Amoxicilline)..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowResults(true);
                      }}
                      onFocus={() => setShowResults(true)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all placeholder:text-slate-400"
                    />
                    {isSearching && (
                      <span className="absolute right-3 top-3.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Autocomplete Dropdown */}
                {showResults && searchQuery.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-18 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 divide-y divide-slate-50 overflow-hidden max-h-80 overflow-y-auto">
                    {autocompleteResults.length > 0 && (
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                        <span>Suggestions ({autocompleteResults.length} sur {totalMatches} trouvées)</span>
                        <span className="text-[9px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 normal-case font-bold">
                          Max 15 affichées
                        </span>
                      </div>
                    )}
                    {autocompleteResults.length > 0 ? (
                      <>
                        {autocompleteResults.map((med) => {
                          const isAllergic = getAllergyAlert(med);
                          return (
                            <button
                              key={med.id}
                              type="button"
                              onClick={() => handleSelectMedicine(med)}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 text-sm">{med.name_brand}</span>
                                  <span className="text-xs text-slate-500 font-medium">({med.dosage_strength} {med.pharmaceutical_form})</span>
                                  {isTableBMedicine(med) && (
                                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[9px] font-bold uppercase animate-pulse">
                                      Stupéfiant · Tableau B
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 font-medium italic">DCI : {med.dci_name}</div>
                              </div>

                              {/* Indicators / Warnings */}
                              <div className="flex items-center gap-2">
                                {isAllergic && (
                                  <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-bold rounded-lg flex items-center gap-0.5 animate-pulse">
                                    <AlertCircle className="w-3 h-3" /> Allergie Patient
                                  </span>
                                )}
                                {med.status === 'suspended' && (
                                  <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold rounded-lg">
                                    AMM Suspendue
                                  </span>
                                )}
                                {med.status === 'removed' && (
                                  <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-bold rounded-lg">
                                    AMM Retirée
                                  </span>
                                )}
                                {med.status === 'active' && (
                                  <span className="text-[10px] text-slate-400 font-semibold">{med.laboratory}</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        {totalMatches > autocompleteResults.length && (
                          <div className="px-4 py-2.5 bg-amber-50/60 text-amber-800 text-xs text-center border-t border-slate-100 font-semibold flex items-center justify-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse animate-duration-1000"></span>
                            <span>{totalMatches - autocompleteResults.length} autres suggestions disponibles. Affinez votre recherche.</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                        <div className="text-xs text-slate-500 font-medium">
                          Aucun médicament trouvé pour "{searchQuery}" dans le catalogue.
                        </div>
                        <button
                          type="button"
                          onClick={handleAddManualMedicine}
                          className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Ajouter hors-base (Saisie libre)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Added lines table/list */}
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Lignes de prescription :</h3>

              {/* Directives de Sécurité Clinique / Clinical Decision Support Panel */}
              {items.length > 0 && (detectedInteractions.length > 0 || detectedOverlaps.length > 0 || items.some(it => getAllergyAlertForLine(it)) || items.some(it => isTableBMedicine(medicines.find((m) => m.id === it.medicine_id)))) && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-4 animate-fadeIn shadow-sm" id="clinical-decision-support-panel">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Aide à la Décision Clinique & Sécurité</h4>
                        <p className="text-[10px] text-slate-500">Analyse automatisée en temps réel des risques iatrogènes et réglementaires</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-bold rounded-lg uppercase">
                      OrdoCheck® Actif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Column 1: Critical Alerts (Allergies & Critical Interactions) */}
                    {(items.some(it => getAllergyAlertForLine(it)) || detectedInteractions.some(int => int.severity === 'critical')) ? (
                      <div className="p-3 bg-red-50/60 border border-red-100 rounded-xl space-y-3">
                        <div className="flex items-center gap-1.5 text-red-800 font-bold uppercase text-[10px] tracking-wider">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                          <span>🔴 Risques Majeurs / Contre-indications</span>
                        </div>
                        <div className="space-y-2.5 divide-y divide-red-100/50">
                          {/* Allergies Alerts */}
                          {items.map((item, idx) => {
                            const allergen = getAllergyDetailsForLine(item);
                            if (!allergen) return null;
                            return (
                              <div key={`all-${idx}`} className="pt-2.5 first:pt-0 flex items-start gap-2 text-red-950">
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-bold flex items-center gap-1">
                                    <span>Allergie : {item.medicine_label}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 mt-0.5">
                                    Substance allergisante : <strong className="text-red-700">{allergen}</strong>. Risque de choc anaphylactique.
                                  </p>
                                </div>
                              </div>
                            );
                          })}

                          {/* Critical Interactions */}
                          {detectedInteractions.filter(int => int.severity === 'critical').map((int, idx) => (
                            <div key={`int-crit-${idx}`} className="pt-2.5 first:pt-0 flex items-start gap-2 text-red-950">
                              <Skull className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="font-bold flex items-center justify-between">
                                  <span>Interaction Critique : {int.title_fr}</span>
                                  <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1 rounded uppercase">Danger</span>
                                </div>
                                <p className="font-semibold text-red-950 text-[10px] mt-0.5 p-1 bg-white/60 rounded border border-red-100">
                                  {int.medicineALabel} ↔ {int.medicineBLabel}
                                </p>
                                <p className="text-slate-600 text-[11px] mt-1 font-medium italic">{int.description_fr}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center text-slate-400">
                        <Check className="w-6 h-6 text-emerald-500 mb-1" />
                        <span className="text-[10px] font-bold uppercase text-slate-500">Aucun Risque Majeur Détecté</span>
                        <p className="text-[10px] max-w-[200px] mt-0.5 leading-snug">Aucune allergie ni interaction critique n'a été signalée.</p>
                      </div>
                    )}

                    {/* Column 2: Precautions & Doublements & psychotropes */}
                    <div className="space-y-3">
                      {/* Overlaps & Moderate Interactions */}
                      {(detectedOverlaps.length > 0 || detectedInteractions.some(int => int.severity !== 'critical')) && (
                        <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl space-y-2.5">
                          <div className="flex items-center gap-1.5 text-amber-800 font-bold uppercase text-[10px] tracking-wider">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <span>🟠 Précautions & Redondances</span>
                          </div>
                          <div className="space-y-2 divide-y divide-amber-100/50">
                            {/* Overlaps */}
                            {detectedOverlaps.map((overlap, idx) => (
                              <div key={`ov-${idx}`} className="pt-2 first:pt-0 flex items-start gap-2 text-amber-950">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <div className="font-bold flex items-center justify-between">
                                    <span>Doublement : {overlap.substance}</span>
                                    <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1 rounded">Overdose</span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 mt-0.5">
                                    Substance prescrite plusieurs fois : <strong className="text-amber-700">{overlap.medicineALabel}</strong> et <strong className="text-amber-700">{overlap.medicineBLabel}</strong>.
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Moderate Interactions */}
                            {detectedInteractions.filter(int => int.severity !== 'critical').map((int, idx) => (
                              <div key={`int-mod-${idx}`} className="pt-2 flex items-start gap-2 text-amber-950">
                                <Activity className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <div className="font-bold flex items-center justify-between">
                                    <span>Précaution : {int.title_fr}</span>
                                    <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1 rounded">Suivi</span>
                                  </div>
                                  <p className="font-semibold text-amber-900 text-[10px] mt-0.5">
                                    {int.medicineALabel} ↔ {int.medicineBLabel}
                                  </p>
                                  <p className="text-slate-600 text-[10px] mt-0.5 italic">{int.description_fr}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tableau B regulatory block */}
                      {items.some(item => isTableBMedicine(medicines.find((m) => m.id === item.medicine_id))) && (
                        <div className="p-3 bg-violet-50/60 border border-violet-100 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 text-violet-800 font-bold uppercase text-[10px] tracking-wider">
                            <Scale className="w-4 h-4 text-violet-600 shrink-0 mt-0.5 animate-pulse" />
                            <span>🟣 Stupéfiants réglementés (Tableau B)</span>
                          </div>
                          <div className="text-[11px] text-violet-950 space-y-1">
                            <p className="font-semibold">Substance soumise au régime tunisien des stupéfiants :</p>
                            <ul className="list-disc list-inside text-slate-600 text-[10px] space-y-0.5 pl-1">
                              <li>Formes orales ou transdermiques : <strong>28 jours maximum</strong>.</li>
                              <li>Écrire obligatoirement les doses et boîtes en toutes lettres.</li>
                              <li>Respecter les exigences de prescription et de délivrance propres à la substance.</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const isAllergicLine = getAllergyAlertForLine(item);
                    const isSubstanceDuplicate = getDciDuplicateAlert(item.dci_name, item.id);
                    const isControlledMedicine = isTableBMedicine(medicines.find((m) => m.id === item.medicine_id));

                    return (
                      <div 
                        key={item.id} 
                        className={`p-4 rounded-2xl border transition-all ${
                          isAllergicLine 
                            ? 'bg-rose-50/40 border-rose-200' 
                            : isSubstanceDuplicate
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-slate-50/30 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {/* Title and Header alerts */}
                        <div className="flex items-start justify-between mb-3 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <h4 className="text-sm font-bold text-slate-800">{item.medicine_label}</h4>
                              
                              {isControlledMedicine && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-bold rounded uppercase">
                                  Stupéfiant / Tableau B
                                </span>
                              )}
                            </div>
                            {item.dci_name && (
                              <p className="text-[11px] text-slate-400 italic pl-7">DCI : {item.dci_name}</p>
                            )}
                          </div>

                          {/* Delete line action */}
                          {!isFormLocked && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(index)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                              title="Retirer cette ligne"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </div>

                        {/* Warnings banner */}
                        {(isAllergicLine || isSubstanceDuplicate) && (
                          <div className={`mb-3.5 p-2.5 rounded-lg text-xs flex gap-2 pl-7 ${isAllergicLine ? 'bg-rose-50/70 border border-rose-100' : 'bg-amber-50/70 border border-amber-100'}`}>
                            <AlertCircle className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${isAllergicLine ? 'text-rose-600' : 'text-amber-600'}`} />
                            <div>
                              {isAllergicLine && (
                                <div className="text-rose-800 font-semibold">
                                  ALERTE ALLERGIE : Ce médicament correspond à une allergie déclarée ({getAllergyDetailsForLine(item)}) dans le dossier du patient !
                                </div>
                              )}
                              {isSubstanceDuplicate && (
                                <div className="text-amber-800 font-semibold">
                                  ALERTE DUPLICATA / REDONDANCE : Une molécule identique ou similaire est déjà présente sur cette ordonnance !
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pl-7">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Posologie (Dose)</label>
                            <input
                              type="text"
                              disabled={isFormLocked}
                              required
                              value={item.dosage}
                              onChange={(e) => handleLineChange(index, 'dosage', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                              placeholder="Ex: 1 gélule"
                            />
                            <div className="flex flex-wrap gap-1 mt-1">
                              {["1 comp.", "2 comp.", "1 gélule", "1 sachet", "1 mesure"].map((badge) => (
                                <button
                                  key={badge}
                                  type="button"
                                  disabled={isFormLocked}
                                  onClick={() => handleLineChange(index, 'dosage', badge.replace('comp.', 'comprimé'))}
                                  className="text-[9px] px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-200/40 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-colors cursor-pointer"
                                >
                                  {badge}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Fréquence</label>
                            <input
                              type="text"
                              disabled={isFormLocked}
                              required
                              value={item.frequency}
                              onChange={(e) => handleLineChange(index, 'frequency', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                              placeholder="Ex: 3 fois par jour"
                            />
                            <div className="flex flex-wrap gap-1 mt-1">
                              {["1x/j (matin)", "2x/j (M-S)", "3x/j (M-M-S)", "toutes 8h", "si besoin"].map((badge) => (
                                <button
                                  key={badge}
                                  type="button"
                                  disabled={isFormLocked}
                                  onClick={() => {
                                    const valMap: Record<string, string> = {
                                      "1x/j (matin)": "1 fois par jour (le matin)",
                                      "2x/j (M-S)": "2 fois par jour (matin et soir)",
                                      "3x/j (M-M-S)": "3 fois par jour (matin, midi et soir)",
                                      "toutes 8h": "toutes les 8 heures",
                                      "si besoin": "en cas de besoin"
                                    };
                                    handleLineChange(index, 'frequency', valMap[badge] || badge);
                                  }}
                                  className="text-[9px] px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-200/40 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-colors cursor-pointer"
                                >
                                  {badge}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Durée</label>
                            <input
                              type="text"
                              disabled={isFormLocked}
                              required
                              value={item.duration}
                              onChange={(e) => handleLineChange(index, 'duration', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                              placeholder="Ex: 6 jours"
                            />
                            <div className="flex flex-wrap gap-1 mt-1">
                              {["5 j", "7 j", "10 j", "1 mois", "3 mois", "À vie"].map((badge) => (
                                <button
                                  key={badge}
                                  type="button"
                                  disabled={isFormLocked}
                                  onClick={() => {
                                    const valMap: Record<string, string> = {
                                      "5 j": "5 jours",
                                      "7 j": "7 jours",
                                      "10 j": "10 jours",
                                      "1 mois": "1 mois",
                                      "3 mois": "3 mois",
                                      "À vie": "À vie"
                                    };
                                    handleLineChange(index, 'duration', valMap[badge] || badge);
                                  }}
                                  className="text-[9px] px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-200/40 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-colors cursor-pointer"
                                >
                                  {badge}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Quantité (Boites)</label>
                            <input
                              type="text"
                              disabled={isFormLocked}
                              required
                              value={item.quantity}
                              onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                              placeholder="Ex: 2 Boites"
                            />
                            <div className="flex flex-wrap gap-1 mt-1">
                              {["1 Boite", "2 Boites", "3 Boites", "QSP 1 mois"].map((badge) => (
                                <button
                                  key={badge}
                                  type="button"
                                  disabled={isFormLocked}
                                  onClick={() => handleLineChange(index, 'quantity', badge)}
                                  className="text-[9px] px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-200/40 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-colors cursor-pointer"
                                >
                                  {badge}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Instructions Bilingues */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7 pt-3 mt-3 border-t border-slate-100">
                          <div>
                            <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1">
                              Instructions (Français)
                            </label>
                            <input
                              type="text"
                              disabled={isFormLocked}
                              value={item.instructions_fr || ''}
                              onChange={(e) => handleLineChange(index, 'instructions_fr', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                              placeholder="Avertissements ou conseils en français..."
                            />
                          </div>
                          <div dir="rtl" className="text-right">
                            <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1 justify-end">
                              الإرشادات والتحذيرات (بالعربية)
                            </label>
                            <input
                              type="text"
                              disabled={isFormLocked}
                              value={item.instructions_ar || ''}
                              onChange={(e) => handleLineChange(index, 'instructions_ar', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-right"
                              placeholder="التحذيرات الطبية باللغة العربية..."
                            />
                          </div>
                        </div>

                        {/* Suggestion Re-Trigger / Status info */}
                        {item.medicine_id && !isFormLocked && (
                          <div className="mt-3.5 pl-7 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleTriggerSuggestionsForLine(index)}
                              className="text-[11px] font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 py-1 px-2.5 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-100/40 transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Calculer posologie validée PCT
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
                  <PenTool className="w-7 h-7 text-slate-300" />
                  <div className="text-xs">Aucun médicament n'est encore inscrit sur cette ordonnance</div>
                </div>
              )}
            </div>

            {/* Note médicale privée optionnelle */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Note Clinique Privée (Non imprimée) :</label>
              <textarea
                disabled={isFormLocked}
                rows={2}
                value={notesPrivate}
                onChange={(e) => setNotesPrivate(e.target.value)}
                className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Diagnostic, motif, constantes de surveillance clinique à conserver dans l'historique du cabinet..."
              />
            </div>

            {/* Prescription Action Footer */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4">
              <div>
                {isFormLocked ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 py-1.5 px-3 rounded-lg">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    Signée par l'ordre le {activePrescription?.signed_at ? new Date(activePrescription.signed_at).toLocaleDateString('fr-FR') : ''}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Unlock className="w-4 h-4 text-slate-400" />
                    Mode Modification Actif
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {/* Reset button */}
                <button
                  type="button"
                  onClick={onReset}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Fermer la session
                </button>

                {/* Print button (enabled always if items exist) */}
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenPrint}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    Prévisualiser / Imprimer A4
                  </button>
                )}

                {/* Draft save & Sign (Only if unlocked) */}
                {!isFormLocked && (
                  <>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-4 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Sauvegarder Brouillon
                    </button>
                    <button
                      type="button"
                      onClick={handleSign}
                      className="px-5 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 shadow-sm shadow-sky-100 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Signer et Archiver l'ordonnance
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-16 text-center text-slate-400 border border-slate-100 bg-slate-50/20 rounded-2xl flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300" />
            <div className="text-sm font-semibold">Aucun patient sélectionné</div>
            <p className="text-xs max-w-sm">Vous devez obligatoirement lier un patient à l'ordonnance avant d'accéder à l'espace de prescription bilingue.</p>
          </div>
        )}
      </div>

      {/* POSOLOGY SUGGESTION SELECTION DRAWER */}
      {selectedTemplateMed && matchedTemplates.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-600 animate-pulse" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Régulateur Thérapeutique PCT & DPM</h3>
                  <p className="text-xs text-slate-500">Sélectionnez le protocole validé pour {selectedTemplateMed.name_brand}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplateMed(null);
                  setMatchedTemplates([]);
                  setActiveSuggestionItemIndex(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Ignorer
              </button>
            </div>

            {/* Protocol recommendations list */}
            <div className="p-6 overflow-y-auto space-y-4 divide-y divide-slate-100 flex-1">
              {matchedTemplates.map((template) => {
                // Match client factors
                let isGroupMatch = true;
                if (patient) {
                  const age = getPatientAge(patient.birth_date);
                  if (template.patient_group === 'child' && age >= 15) isGroupMatch = false;
                  if (template.patient_group === 'adult' && age < 15) isGroupMatch = false;
                  if (template.contraindication_flags?.pregnancy_alert && patient.is_pregnant) isGroupMatch = false;
                  if (template.contraindication_flags?.renal_alert && patient.has_renal_impairment) isGroupMatch = false;
                  if (template.contraindication_flags?.hepatic_alert && patient.has_hepatic_impairment) isGroupMatch = false;
                }

                return (
                  <div key={template.id} className="pt-4 first:pt-0 space-y-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          template.patient_group === 'child' 
                            ? 'bg-amber-50 text-amber-700' 
                            : template.patient_group === 'pregnant'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-sky-50 text-sky-700'
                        }`}>
                          Groupe : {template.patient_group === 'child' ? 'Pédiatrique' : template.patient_group.toUpperCase()}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">Indication : {template.indication}</h4>
                      </div>

                      {!isGroupMatch && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded flex items-center gap-0.5 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" /> Profil à risque
                        </span>
                      )}
                    </div>

                    {/* Bilingual description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                      <div className="text-xs space-y-1">
                        <div className="text-slate-400 font-bold uppercase text-[9px]">FRANÇAIS :</div>
                        <div className="font-bold text-slate-800">{template.dose_text_fr}</div>
                        <div className="text-slate-600">{template.frequency_text_fr}</div>
                        <div className="text-slate-600">Durée : {template.duration_text_fr}</div>
                        {template.warnings_fr && (
                          <div className="text-slate-500 italic mt-1 pt-1 border-t border-slate-200/50">Consigne : {template.warnings_fr}</div>
                        )}
                      </div>
                      <div dir="rtl" className="text-right text-xs space-y-1">
                        <div className="text-slate-400 font-bold uppercase text-[9px] text-right">العربية :</div>
                        <div className="font-bold text-slate-800">{template.dose_text_ar}</div>
                        <div className="text-slate-600">{template.frequency_text_ar}</div>
                        <div className="text-slate-600">المدة : {template.duration_text_ar}</div>
                        {template.warnings_ar && (
                          <div className="text-slate-500 italic mt-1 pt-1 border-t border-slate-200/50 text-right">ملاحظة : {template.warnings_ar}</div>
                        )}
                      </div>
                    </div>

                    {/* Meta info & authority source */}
                    <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400">
                      <span>Source : {template.source_reference}</span>
                      <span>Approuvé le : {new Date(template.validated_at || '').toLocaleDateString('fr-FR')} par {template.validated_by}</span>
                    </div>

                    {/* Action buttons for this specific template */}
                    <div className="flex justify-end gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApplySuggestion(template, true)}
                        className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                      >
                        Modifier avant insertion
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplySuggestion(template, false)}
                        className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Utiliser cette suggestion
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Official clinical warning (mandated by prescription security) */}
            <div className="p-4 bg-amber-50/50 border-t border-slate-100 text-center text-[10px] text-amber-900 leading-tight flex items-center justify-center gap-2">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Avertissement réglementaire :</strong> Suggestion à vérifier et adapter par le médecin. Chaque ordonnance finale engage la seule responsabilité du médecin praticien.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

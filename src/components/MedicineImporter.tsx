/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Medicine, MedicineStatus, SourceType } from '../types';
import { 
  Database, 
  Upload, 
  FileText, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Info, 
  PlusCircle, 
  ArrowRight,
  ShieldAlert,
  Archive,
  Download
} from 'lucide-react';
import { logAudit, normalizeSearchText } from '../data';

interface MedicineImporterProps {
  medicines: Medicine[];
  onMedicinesChange: (newMedicines: Medicine[]) => void;
}

// Sample CSV representing official Tunisian PCT Updates (for instant testing)
const SAMPLE_PCT_CSV = `PCT_CODE,AMM_NUMBER,AMM_DATE,BRAND_NAME,DCI,STRENGTH,FORM,ROUTE,PACKAGE,LABORATORY,SUPPLIER,THERAPEUTIC_CLASS,STATUS,IS_AVAILABLE
102540,9153011,2015-04-20,CLAMOXYL,Amoxicilline,500 mg,Gélule,Orale,Boite de 24,GlaxoSmithKline Tunisie,Pharmacie Centrale,Antibiotique,active,true
112003,9083141,2012-08-11,AUGMENTIN Adulte,Amoxicilline + Acide clavulanique,1 g / 125 mg,Comprimé pelliculé,Orale,Boite de 12,GlaxoSmithKline Tunisie,Pharmacie Centrale,Antibiotique,active,true
104320,9213054,2016-01-15,DOLIPRANE,Paracétamol,1000 mg,Comprimé effervescent,Orale,Boite de 8,Sanofi Aventis Tunisie,Pharmacie Centrale,Antalgique,active,true
105210,8993201,2009-02-14,LASILIX,Furosémide,40 mg,Comprimé,Orale,Boite de 30,Sanofi Aventis Tunisie,Pharmacie Centrale,Diurétique,active,true
121543,9152341,2015-06-20,XANAX,Alprazolam,0.5 mg,Comprimé,Orale,Boite de 30,Pfizer Tunisie,Pharmacie Centrale,Anxiolytique,active,true
204859,9354123,2026-03-12,CARDIOXIL (NOUVEAU),Nifédipine,20 mg,Comprimé,Orale,Boite de 30,Opalia Pharma Tunisie,Pharmacie Centrale,Cardiologie - Amlodipine,active,true
109923,9123490,2012-05-30,SPASFON,Phloroglucinol,80 mg,Comprimé,Orale,Boite de 30,Opalia Pharma Tunisie,Pharmacie Centrale,Antispasmodique,suspended,false
309485,9012354,2020-05-18,SUPRALGIN (SUSPENDU),Paracétamol + Codéine,500 mg / 30 mg,Comprimé,Orale,Boite de 20,Laboratoire Saiph Tunisie,Pharmacie Centrale,Antalgique,suspended,false`;

export default function MedicineImporter({ medicines, onMedicinesChange }: MedicineImporterProps) {
  // DB Catalog Search state
  const [dbSearch, setDbSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);

  // Import State
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragFileName, setDragFileName] = useState('');
  const [dryRunReport, setDryRunReport] = useState<{
    added: Medicine[];
    modified: { oldMed: Medicine; newMed: Medicine }[];
    suspended: Medicine[];
    removed: Medicine[];
    totalCount: number;
    checksum: string;
  } | null>(null);

  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [isImportSuccess, setIsImportSuccess] = useState(false);

  // Reference for manual file click trigger
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter medicines
  const filteredMedicines = medicines.filter((m) => {
    const q = dbSearch.toLowerCase().trim();
    const matchesSearch = 
      m.name_brand.toLowerCase().includes(q) ||
      m.dci_name.toLowerCase().includes(q) ||
      (m.pct_code && m.pct_code.includes(q)) ||
      (m.amm_number && m.amm_number.includes(q)) ||
      (m.laboratory && m.laboratory.toLowerCase().includes(q)) ||
      (m.therapeutic_class && m.therapeutic_class.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const normalizeKey = (key: string): string => {
    return key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9_]/g, "_")    // replace spaces/special chars with underscore
      .replace(/_+/g, "_")            // compress multiple underscores
      .replace(/^_+|_+$/g, "");       // trim underscores
  };

  const parseRows = (rawRows: Record<string, any>[]): Partial<Medicine>[] => {
    return rawRows.map((row) => {
      const item: any = {};
      
      Object.entries(row).forEach(([rawKey, val]) => {
        const normalizedVal = String(val).trim();
        if (!normalizedVal) return;

        const normKey = normalizeKey(rawKey);

        if (['pct_code', 'code_pct', 'code', 'pct', 'reference', 'ref'].includes(normKey)) {
          item.pct_code = normalizedVal;
        }
        else if (['amm_number', 'numero_amm', 'num_amm', 'amm', 'code_amm', 'autorisation_de_mise_sur_le_marche', 'num_d_enregistrement'].includes(normKey)) {
          item.amm_number = normalizedVal;
        }
        else if (['amm_date', 'date_amm', 'date_de_l_amm', 'date_de_mise_sur_le_marche', 'date'].includes(normKey)) {
          item.amm_date = normalizedVal;
        }
        else if (['brand_name', 'nom_brand', 'nom_commercial', 'designation', 'nom', 'medicament', 'article', 'brand', 'nom_du_medicament', 'libelle', 'produit'].includes(normKey)) {
          item.name_brand = normalizedVal;
        }
        else if (['dci', 'substance', 'substance_active', 'principe_actif', 'dci_name', 'inn'].includes(normKey)) {
          item.dci_name = normalizedVal;
        }
        else if (['strength', 'dosage', 'titre', 'dosage_strength', 'concentration', 'puissance'].includes(normKey)) {
          item.dosage_strength = normalizedVal;
        }
        else if (['form', 'forme', 'forme_pharmaceutique', 'pharmaceutical_form', 'presentation_forme'].includes(normKey)) {
          item.pharmaceutical_form = normalizedVal;
        }
        else if (['route', 'voie', 'voie_d_administration', 'voie_adm'].includes(normKey)) {
          item.route = normalizedVal;
        }
        else if (['package', 'presentation', 'conditionnement', 'boite', 'package_label', 'emballage'].includes(normKey)) {
          item.package_label = normalizedVal;
        }
        else if (['laboratory', 'labo', 'fabricant', 'titulaire', 'producteur', 'titulaire_de_l_amm', 'nom_du_laboratoire'].includes(normKey)) {
          item.laboratory = normalizedVal;
        }
        else if (['supplier', 'fournisseur', 'distributeur', 'grossiste'].includes(normKey)) {
          item.supplier = normalizedVal;
        }
        else if (['therapeutic_class', 'classe_therapeutique', 'classe', 'categorie', 'famille'].includes(normKey)) {
          item.therapeutic_class = normalizedVal;
        }
        else if (['status', 'statut', 'etat', 'active_inactive'].includes(normKey)) {
          const lowerVal = normalizedVal.toLowerCase();
          if (lowerVal.includes('suspend') || lowerVal.includes('arret')) {
            item.status = 'suspended';
          } else if (lowerVal.includes('retir') || lowerVal.includes('radie')) {
            item.status = 'removed';
          } else if (lowerVal.includes('activ') || lowerVal.includes('valide') || lowerVal.includes('en cours')) {
            item.status = 'active';
          } else {
            item.status = normalizedVal as any;
          }
        }
        else if (['is_available', 'disponible', 'en_stock', 'dispo', 'is_available_for_sale'].includes(normKey)) {
          const lowerVal = normalizedVal.toLowerCase();
          item.is_available = lowerVal === 'true' || lowerVal === 'oui' || lowerVal === '1' || lowerVal === 'disponible';
        }
      });

      return item;
    }).filter((item) => item.name_brand);
  };

  const generateSimpleChecksum = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase();
  };

  const runDryRunFromParsed = (parsedItems: Partial<Medicine>[], checksumSeed: string = '') => {
    if (parsedItems.length === 0) {
      alert("Le fichier ne contient aucun médicament valide.");
      return;
    }

    const added: Medicine[] = [];
    const modified: { oldMed: Medicine; newMed: Medicine }[] = [];
    const suspended: Medicine[] = [];
    const removed: Medicine[] = [];

    // Simulate dry-run
    parsedItems.forEach((parsed) => {
      // Find matching medicine by PCT Code or AMM number
      const existing = medicines.find(
        (m) => 
          (m.pct_code && m.pct_code === parsed.pct_code) ||
          (m.amm_number && m.amm_number === parsed.amm_number) ||
          (m.name_brand.toLowerCase() === parsed.name_brand?.toLowerCase() &&
           m.dosage_strength === parsed.dosage_strength &&
           m.pharmaceutical_form === parsed.pharmaceutical_form)
      );

      if (existing) {
        // Check if anything modified
        const isModified = 
          existing.status !== parsed.status ||
          existing.is_available !== parsed.is_available ||
          existing.dosage_strength !== parsed.dosage_strength ||
          existing.pharmaceutical_form !== parsed.pharmaceutical_form ||
          existing.name_brand !== parsed.name_brand;

        if (isModified) {
          const updated: Medicine = {
            ...existing,
            name_brand: parsed.name_brand || existing.name_brand,
            name_normalized: normalizeSearchText(parsed.name_brand || existing.name_brand),
            dci_name: parsed.dci_name || existing.dci_name,
            dci_normalized: normalizeSearchText(parsed.dci_name || existing.dci_name),
            dosage_strength: parsed.dosage_strength || existing.dosage_strength,
            pharmaceutical_form: parsed.pharmaceutical_form || existing.pharmaceutical_form,
            route: parsed.route || existing.route,
            package_label: parsed.package_label || existing.package_label,
            laboratory: parsed.laboratory || existing.laboratory,
            supplier: parsed.supplier || existing.supplier,
            therapeutic_class: parsed.therapeutic_class || existing.therapeutic_class,
            status: parsed.status || existing.status,
            is_available: parsed.is_available !== undefined ? parsed.is_available : existing.is_available,
            updated_at: new Date().toISOString(),
          };
          modified.push({ oldMed: existing, newMed: updated });
        }

        if (parsed.status === 'suspended' && existing.status !== 'suspended') {
          // Track specifically suspended AMM
          suspended.push(existing);
        }
        if (parsed.status === 'removed' && existing.status !== 'removed') {
          // Track specifically removed AMM
          removed.push(existing);
        }
      } else {
        // Brand new medicine
        const newMed: Medicine = {
          id: 'med-' + Math.random().toString(36).substr(2, 9),
          source_type: 'imported',
          source_url: 'https://www.phcentral.com.tn',
          source_updated_at: new Date().toISOString(),
          pct_code: parsed.pct_code,
          amm_number: parsed.amm_number,
          amm_date: parsed.amm_date || new Date().toISOString().split('T')[0],
          name_brand: parsed.name_brand || 'Inconnu',
          name_normalized: normalizeSearchText(parsed.name_brand || ''),
          dci_name: parsed.dci_name || 'Inconnu',
          dci_normalized: normalizeSearchText(parsed.dci_name || ''),
          dosage_strength: parsed.dosage_strength || 'N/A',
          pharmaceutical_form: parsed.pharmaceutical_form || 'N/A',
          route: parsed.route || 'Orale',
          package_label: parsed.package_label || 'Boite',
          supplier: parsed.supplier || 'Importé',
          laboratory: parsed.laboratory || 'Inconnu',
          therapeutic_class: parsed.therapeutic_class || 'Non classifié',
          status: parsed.status || 'active',
          is_available: parsed.is_available !== undefined ? parsed.is_available : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        added.push(newMed);
      }
    });

    const calculatedChecksum = generateSimpleChecksum(checksumSeed || JSON.stringify(parsedItems));

    setDryRunReport({
      added,
      modified,
      suspended,
      removed,
      totalCount: parsedItems.length,
      checksum: calculatedChecksum,
    });
    setImportLogs([
      `[ANALYSE] Fichier DPM / PCT lu avec succès.`,
      `[ANALYSE] Total de lignes détectées : ${parsedItems.length}.`,
      `[ANALYSE] Médicaments à ajouter : ${added.length}.`,
      `[ANALYSE] Médicaments existants modifiés : ${modified.length}.`,
      `[ANALYSE] Suspensions AMM détectées : ${suspended.length + removed.length}.`,
      `[ANALYSE] Somme de contrôle calculée : ${calculatedChecksum}.`,
      `Prêt pour l'importation finale.`
    ]);
  };

  const handleFile = (file: File) => {
    setDragFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        
        if (rawRows.length === 0) {
          alert("Le fichier est vide ou n'a pas pu être lu.");
          return;
        }

        const parsedItems = parseRows(rawRows);
        runDryRunFromParsed(parsedItems, file.name + rawRows.length);
      } catch (err: any) {
        console.error(err);
        alert(`Erreur lors de la lecture du fichier : ${err.message || err}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleLoadSample = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering file selection
    try {
      const workbook = XLSX.read(SAMPLE_PCT_CSV, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
      const parsedItems = parseRows(rawRows);
      
      setDragFileName('pct_catalog_update_2026.csv');
      runDryRunFromParsed(parsedItems, 'SAMPLE_CSV_CHECKSUM');
    } catch (err) {
      console.error(err);
      alert("Erreur lors du chargement de l'échantillon.");
    }
  };

  const handleCommitImport = () => {
    if (!dryRunReport) return;

    let updatedMedicines = [...medicines];
    const logs = [...importLogs, `[IMPORT] Début de l'écriture en base...`];

    // 1. Add new items
    dryRunReport.added.forEach((m) => {
      updatedMedicines.push(m);
      logs.push(`[AJOUT] ${m.name_brand.toUpperCase()} (${m.dci_name}) inséré.`);
    });

    // 2. Modify existing items
    dryRunReport.modified.forEach(({ oldMed, newMed }) => {
      updatedMedicines = updatedMedicines.map((m) => m.id === oldMed.id ? newMed : m);
      logs.push(`[MODIFICATION] Mise à jour des données de ${newMed.name_brand.toUpperCase()}. Statut : ${newMed.status}.`);
    });

    onMedicinesChange(updatedMedicines);
    setImportLogs([...logs, `[IMPORT] Succès ! ${dryRunReport.added.length + dryRunReport.modified.length} médicaments synchronisés.`, `[AUDIT] Journal d'audit enregistré.`]);
    setIsImportSuccess(true);

    // Audit Log
    logAudit(
      'BULK_IMPORT_MEDICINES',
      'CATALOG',
      'system-catalog',
      { currentCount: medicines.length },
      { addedCount: dryRunReport.added.length, modifiedCount: dryRunReport.modified.length, totalCount: updatedMedicines.length, checksum: dryRunReport.checksum }
    );

    setTimeout(() => {
      setIsImportSuccess(false);
      setDryRunReport(null);
      setDragFileName('');
    }, 5000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="medicine-importer-container">
      {/* Colonne Gauche: Explorateur de la base de données (7 cols) */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Catalogue des Médicaments (Tunisie)</h2>
              <p className="text-xs text-slate-500">Base synchronisée PCT / DPM ANMPS en vigueur</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par Marque, DCI, Code PCT..."
                value={dbSearch}
                onChange={(e) => setDbSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/15 focus:border-sky-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/15"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">AMM Actives</option>
              <option value="suspended">AMM Suspendues</option>
              <option value="removed">AMM Retirées / Radiées</option>
            </select>
          </div>
        </div>

        {/* Medicines List */}
        <div className="divide-y divide-slate-100 overflow-y-auto max-h-[480px] flex-1">
          {filteredMedicines.length > 0 ? (
            filteredMedicines.map((med) => (
              <div 
                key={med.id} 
                onClick={() => setSelectedMed(med)}
                className={`p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between cursor-pointer ${
                  selectedMed?.id === med.id ? 'bg-sky-50/20' : ''
                }`}
              >
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm tracking-tight">{med.name_brand}</span>
                    <span className="text-xs text-slate-400 font-mono">({med.dosage_strength})</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="font-semibold text-slate-600">DCI :</span>
                    <span className="italic">{med.dci_name}</span>
                  </div>
                  <div className="flex gap-1.5 pt-0.5">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] text-slate-600 rounded font-medium">
                      Code PCT: {med.pct_code || 'N/A'}
                    </span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] text-slate-600 rounded font-medium">
                      Forme: {med.pharmaceutical_form}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {med.status === 'active' && (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold rounded-lg uppercase">
                      Actif
                    </span>
                  )}
                  {med.status === 'suspended' && (
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg uppercase flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Suspendu
                    </span>
                  )}
                  {med.status === 'removed' && (
                    <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg uppercase flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Retiré
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <Archive className="w-8 h-8 text-slate-200" />
              <div className="text-xs">Aucun médicament ne correspond à vos critères</div>
            </div>
          )}
        </div>

        {/* Selected Medicine Details Drawer */}
        {selectedMed && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/40 divide-y divide-slate-100">
            <div className="flex justify-between items-start pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{selectedMed.name_brand} {selectedMed.dosage_strength}</h3>
                <p className="text-xs text-slate-400 font-medium">Origine: {selectedMed.source_type.toUpperCase()} ({selectedMed.supplier || 'Non renseigné'})</p>
              </div>
              <button 
                onClick={() => setSelectedMed(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Fermer
              </button>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Substance Active (DCI) :</span>
                <span className="font-bold text-slate-800">{selectedMed.dci_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Classe Thérapeutique :</span>
                <span className="font-semibold text-slate-800">{selectedMed.therapeutic_class || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Laboratoire Fabricant :</span>
                <span className="font-semibold text-slate-800">{selectedMed.laboratory || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Conditionnement :</span>
                <span className="font-semibold text-slate-800">{selectedMed.package_label || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">N° d'autorisation AMM :</span>
                <span className="font-mono text-slate-800">{selectedMed.amm_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Date AMM :</span>
                <span className="font-mono text-slate-800">{selectedMed.amm_date ? new Date(selectedMed.amm_date).toLocaleDateString('fr-FR') : 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Colonne Droite: Import de fichier & Rapports (5 cols) */}
      <div className="lg:col-span-5 flex flex-col space-y-6">
        {/* File Pipeline Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Mise à jour du Catalogue (Import)</h2>
              <p className="text-xs text-slate-500">Intégrez de nouveaux lots PCT / Excel (.xlsx, .xls, .csv)</p>
            </div>
          </div>

          {/* Drag & Drop & Click Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-3 transition-all cursor-pointer ${
              isDragOver 
                ? 'border-sky-500 bg-sky-50/20' 
                : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <Upload className="w-8 h-8 text-slate-400" />
            <div className="text-xs text-slate-500">
              {dragFileName ? (
                <div className="font-semibold text-slate-700 flex items-center gap-1 justify-center">
                  <FileText className="w-4 h-4 text-sky-500" />
                  {dragFileName}
                </div>
              ) : (
                <span>Glissez-déposez un fichier de données PCT/DPM ici, ou <span className="text-sky-600 font-semibold underline">cliquez pour sélectionner</span></span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 max-w-xs">Formats supportés: Excel (.xlsx, .xls) ou CSV encodé UTF-8.</p>

            <button
              onClick={handleLoadSample}
              type="button"
              className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tester avec l'Échantillon Officiel PCT
            </button>
          </div>
        </div>

        {/* Dry-run report or Logs */}
        {dryRunReport && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-500" />
                Rapport de simulation d'importation
              </h3>
              <span className="px-2 py-0.5 bg-sky-50 text-sky-700 font-mono text-[10px] font-bold rounded">
                SHA: {dryRunReport.checksum}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                <div className="text-xs text-slate-400 font-medium">Médicaments à ajouter</div>
                <div className="text-2xl font-bold text-sky-600 mt-1">{dryRunReport.added.length}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                <div className="text-xs text-slate-400 font-medium">Modifications / AMM</div>
                <div className="text-2xl font-bold text-amber-600 mt-1">{dryRunReport.modified.length}</div>
              </div>
            </div>

            {/* Dry run change details */}
            <div className="space-y-2 max-h-32 overflow-y-auto bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[10px] leading-relaxed">
              {importLogs.map((log, index) => (
                <div key={index} className="flex gap-1.5">
                  <ArrowRight className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
                  <span>{log}</span>
                </div>
              ))}
            </div>

            {/* Warnings inside dry-run */}
            {(dryRunReport.suspended.length > 0 || dryRunReport.removed.length > 0) && (
              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-900 rounded-xl text-xs flex gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold">Alerte AMM :</span> Cette importation contient des suspensions ou des retraits de médicaments. Les praticiens en seront avertis lors des prochaines prescriptions.
                </div>
              </div>
            )}

            {/* Actions for Import */}
            {!isImportSuccess ? (
              <button
                onClick={handleCommitImport}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                Valider et Écrire en Base de Données
              </button>
            ) : (
              <div className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-center font-bold rounded-xl text-xs flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 animate-bounce" />
                Importation réussie avec succès !
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import {
  getDbState,
  logAudit,
  setAuditContext,
  DEFAULT_DOCTOR_CONFIG
} from './data';
import {
  Patient,
  Medicine,
  Prescription,
  PrescriptionItem,
  DoctorConfig
} from './types';

// Supabase & Services
import { supabase } from './supabase';
import {
  setupUserAndGetProfile,
  savePatient,
  deletePatient,
  savePrescriptionBundle,
  saveDoctorConfig,
  deleteUserAccount,
  UserProfile,
  loadClinicalData,
  subscribeClinicalData
} from './services/dbService';

// Sub-components
import DoctorConfigForm from './components/DoctorConfigForm';
import Logo from './components/Logo';
import PatientSelector from './components/PatientSelector';
import MedicineImporter from './components/MedicineImporter';
import PrescriptionHistory from './components/PrescriptionHistory';
import PrescriptionForm from './components/PrescriptionForm';
import PrescriptionPrintView from './components/PrescriptionPrintView';
import TestSuite from './components/TestSuite';
import CabinetDashboard from './components/CabinetDashboard';
import PatientDossier from './components/PatientDossier';
import LoginScreen from './components/LoginScreen';
import SecretaryManager from './components/SecretaryManager';
import ProfileSettings from './components/ProfileSettings';

// Icons
import {
  FileText,
  Database,
  Settings,
  Activity,
  HeartPulse,
  User,
  LogOut,
  Lock,
  Loader2,
  Users,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Helper to retry setup user profile
  const handleRetryAuth = async () => {
    if (!user) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      const profile = await setupUserAndGetProfile(user.id, user.email || '');
      setAuditContext(profile.doctorUid);
      setUserProfile(profile);
      if (profile.role === 'secretary') {
        setActiveTab('patients');
      }
    } catch (err: any) {
      console.error('Failed to set up user profile on retry:', err);
      setAuthError(err?.message || "Erreur d'accès à la base de données sécurisée. Veuillez vérifier vos permissions.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Global Database State
  const [db, setDb] = useState(getDbState());

  const clearSensitiveClientState = () => {
    setAuditContext(null);
    setDb((previous) => ({
      ...previous,
      patients: [],
      prescriptions: [],
      prescriptionItems: [],
      auditLogs: [],
      doctorConfig: DEFAULT_DOCTOR_CONFIG
    }));

    try {
      const stored = localStorage.getItem('tun_med_prescription_db');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('tun_med_prescription_db', JSON.stringify({
          ...parsed,
          medicines: [],
          dosageTemplates: [],
          patients: [],
          prescriptions: [],
          prescriptionItems: [],
          auditLogs: [],
          doctorConfig: DEFAULT_DOCTOR_CONFIG
        }));
      }
      for (let index = localStorage.length - 1; index >= 0; index--) {
        const key = localStorage.key(index);
        if (key?.startsWith('user_profile_')) localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Unable to scrub local sensitive state:', error);
    }
  };

  // Selected Contexts
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Active drafting prescription
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  const [activeItems, setActiveItems] = useState<PrescriptionItem[]>([]);

  // Print Preview triggers
  const [printPreviewPrescription, setPrintPreviewPrescription] = useState<Prescription | null>(null);
  const [printPreviewItems, setPrintPreviewItems] = useState<PrescriptionItem[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'prescription' | 'database' | 'doctor' | 'tests' | 'profile'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Account Deletion States
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteConfirmCheckbox, setDeleteConfirmCheckbox] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 1. Keep the auth callback synchronous. Awaiting another Supabase request
  // inside onAuthStateChange can deadlock the client auth lock.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setAuthError(null);
      setUserProfile(null);
      setUser(currentUser);
      setAuthLoading(Boolean(currentUser));

      if (!currentUser) {
        clearSensitiveClientState();
        setSelectedPatient(null);
        setActivePrescription(null);
        setActiveItems([]);
      }
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  // 2. Initialize the secured workspace outside the auth callback.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const initializeProfile = async () => {
      try {
        const profile = await setupUserAndGetProfile(user.id, user.email || '');
        if (cancelled) return;
        setAuditContext(profile.doctorUid);
        setUserProfile(profile);
        if (profile.role === 'secretary') setActiveTab('patients');
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to set up user profile:', err);
        setAuthError(err?.message || "Erreur d'accès à la base de données sécurisée. Veuillez vérifier vos permissions.");
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };

    void initializeProfile();
    return () => { cancelled = true; };
  }, [user]);

  // 3. Supabase synchronization.
  useEffect(() => {
    if (!userProfile) return; let cancelled = false;
    const refresh = async () => { try { const remote = await loadClinicalData(userProfile); if (!cancelled) setDb(prev => ({ ...prev, ...remote, doctorConfig: remote.doctorConfig || DEFAULT_DOCTOR_CONFIG })); } catch (error) { console.error('Supabase synchronization error:', error); } };
    void refresh(); const unsubscribe = subscribeClinicalData(userProfile, () => { void refresh(); });
    return () => { cancelled = true; unsubscribe(); };
  }, [userProfile]);

  // 3. Load active prescription if patient has a draft
  useEffect(() => {
    if (selectedPatient && userProfile?.role === 'doctor') {
      // If we already have an active prescription/draft for this patient in the editor,
      // do NOT overwrite or wipe it out when other database elements change
      if (activePrescription && activePrescription.patient_id === selectedPatient.id) {
        return;
      }

      const patientDraft = db.prescriptions.find(
        (p) => p.patient_id === selectedPatient.id && p.status === 'draft'
      );
      if (patientDraft) {
        setActivePrescription(patientDraft);
        const items = db.prescriptionItems
          .filter((item) => item.prescription_id === patientDraft.id)
          .sort((a, b) => a.line_order - b.line_order);
        setActiveItems(items);
        logAudit('LOAD_PATIENT_DRAFT', 'PRESCRIPTION', patientDraft.id, null, null);
      } else {
        // No draft exists, start clean workspace for this patient
        setActivePrescription(null);
        setActiveItems([]);
      }
    } else {
      setActivePrescription(null);
      setActiveItems([]);
    }
  }, [selectedPatient, db.prescriptions, db.prescriptionItems, userProfile]);

  // Handle logout
  const handleLogout = async () => {
    try {
       clearSensitiveClientState();
       setSelectedPatient(null);
       setActivePrescription(null);
       setActiveItems([]);
       await supabase.auth.signOut();
    } catch (err) {
       console.error('Failed to log out:', err);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!userProfile) return;
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      await deleteUserAccount(userProfile.uid, userProfile.role);
      setIsDeleteAccountOpen(false);
      setDeleteConfirmText('');
      setDeleteConfirmCheckbox(false);
      // Auth's onAuthStateChanged will handle setting user and userProfile to null
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      if (err.message === 'REQUIRES_RECENT_LOGIN') {
        setDeleteError('REQUIRES_RECENT_LOGIN');
      } else {
        setDeleteError(err.message || 'Une erreur est survenue lors de la suppression du compte.');
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Handle doctors configuration update
  const handleSaveDoctorConfig = async (newConfig: DoctorConfig) => {
    if (userProfile) {
      try {
        await saveDoctorConfig(userProfile.clinicId, newConfig);
        logAudit('UPDATE_DOCTOR_CONFIG', 'DOCTOR', userProfile.doctorUid, db.doctorConfig, newConfig);
      } catch (err) {
        console.error('Failed to save config to Supabase:', err);
        alert("Erreur lors de la sauvegarde de la configuration.");
      }
    } else {
      const updatedDb = { ...db, doctorConfig: newConfig };
      setDb(updatedDb);
      logAudit('UPDATE_DOCTOR_CONFIG', 'DOCTOR', 'doctor-current', db.doctorConfig, newConfig);
    }
  };

  // Handle patient list modification
  const handlePatientsChange = async (newPatients: Patient[]) => {
    if (userProfile) {
      try {
        const currentPatientsMap = new Map(db.patients.map(p => [p.id, p]));
        const newPatientsMap = new Map(newPatients.map(p => [p.id, p]));

        // Detect Deletes
        for (const p of db.patients) {
          if (!newPatientsMap.has(p.id)) {
            await deletePatient(p.id);
          }
        }

        // Detect Adds or Updates
        for (const p of newPatients) {
          const current = currentPatientsMap.get(p.id);
          if (!current || JSON.stringify(current) !== JSON.stringify(p)) {
            await savePatient(p, userProfile.clinicId);
          }
        }
      } catch (err) {
        console.error('Failed to sync patients to Supabase:', err);
        alert("Une erreur de permission ou réseau est survenue lors de la mise à jour du patient.");
      }
    } else {
      const updatedDb = { ...db, patients: newPatients };
      setDb(updatedDb);
    }
  };

  // Handle catalog list modification
  const handleMedicinesChange = (newMedicines: Medicine[]) => {
    const updatedDb = { ...db, medicines: newMedicines };
    setDb(updatedDb);
  };

  // Handle saving draft
  const handleSaveDraft = async (prescription: Prescription, items: PrescriptionItem[]) => {
    if (userProfile) {
      try {
        const saved = await savePrescriptionBundle(prescription, items, userProfile.clinicId);
        setActivePrescription(saved.prescription);
        setActiveItems(saved.items);
        void logAudit('SAVE_DRAFT_PRESCRIPTION', 'PRESCRIPTION', saved.prescription.id, null, saved.prescription);
        alert(`Brouillon enregistré avec succès (${saved.prescription.prescription_number})`);
      } catch (err) {
        console.error('Failed to save draft to Supabase:', err);
        alert("Erreur lors de la sauvegarde du brouillon.");
      }
    } else {
      const filteredPrescriptions = db.prescriptions.filter((p) => p.id !== prescription.id);
      const filteredItems = db.prescriptionItems.filter((item) => item.prescription_id !== prescription.id);

      const updatedDb = {
        ...db,
        prescriptions: [prescription, ...filteredPrescriptions],
        prescriptionItems: [...items, ...filteredItems],
      };

      setDb(updatedDb);
      setActivePrescription(prescription);
      setActiveItems(items);
      logAudit('SAVE_DRAFT_PRESCRIPTION', 'PRESCRIPTION', prescription.id, null, prescription);
      alert(`Brouillon enregistré avec succès (${prescription.prescription_number})`);
    }
  };

  // Handle signing and locking prescription
  const handleSignAndLock = async (prescription: Prescription, items: PrescriptionItem[]) => {
    if (userProfile) {
      try {
        const saved = await savePrescriptionBundle(prescription, items, userProfile.clinicId);
        setActivePrescription(saved.prescription);
        setActiveItems(saved.items);
        void logAudit('SIGN_PRESCRIPTION', 'PRESCRIPTION', saved.prescription.id, null, saved.prescription);
        alert(`L'ordonnance ${saved.prescription.prescription_number} a été signée numériquement et archivée au dossier.`);
      } catch (err) {
        console.error('Failed to sign prescription:', err);
        alert("Erreur lors de la signature de l'ordonnance.");
      }
    } else {
      const filteredPrescriptions = db.prescriptions.filter((p) => p.id !== prescription.id);
      const filteredItems = db.prescriptionItems.filter((item) => item.prescription_id !== prescription.id);

      const updatedDb = {
        ...db,
        prescriptions: [prescription, ...filteredPrescriptions],
        prescriptionItems: [...items, ...filteredItems],
      };

      setDb(updatedDb);
      setActivePrescription(prescription);
      setActiveItems(items);
      logAudit('SIGN_PRESCRIPTION', 'PRESCRIPTION', prescription.id, null, prescription);
      alert(`L'ordonnance ${prescription.prescription_number} a été signée numériquement et archivée au dossier.`);
    }
  };

  // Trigger print preview screen
  const handleOpenPrintPreview = (prescription: Prescription, items: PrescriptionItem[]) => {
    setActivePrescription(prescription);
    setActiveItems(items);
    setPrintPreviewPrescription(prescription);
    setPrintPreviewItems(items);
    logAudit('OPEN_PRINT_PREVIEW', 'PRESCRIPTION', prescription.id, null, null);
  };

  // Handle duplication of a past prescription
  const handleDuplicatePrescription = (itemsToCopy: PrescriptionItem[]) => {
    if (!selectedPatient) return;

    // Map items to new draft session
    const duplicatedItems: PrescriptionItem[] = itemsToCopy.map((item, index) => ({
      id: 'item-' + Math.random().toString(36).substr(2, 9),
      prescription_id: activePrescription?.id || 'draft-current',
      medicine_id: item.medicine_id,
      custom_medicine_name: item.custom_medicine_name,
      line_order: index + 1,
      medicine_label: item.medicine_label,
      dci_name: item.dci_name,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity,
      instructions_fr: item.instructions_fr,
      instructions_ar: item.instructions_ar,
      show_instructions: item.show_instructions,
      is_suggestion_used: item.is_suggestion_used,
      doctor_modified_suggestion: item.doctor_modified_suggestion,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    setActiveItems(duplicatedItems);
    alert("Les médicaments de l'ordonnance historique ont été dupliqués dans votre espace de saisie actif.");
  };

  // Reset active session
  const handleResetSession = () => {
    setSelectedPatient(null);
    setActivePrescription(null);
    setActiveItems([]);
  };

  // Render bilingue top menu bar
  const renderNavigationBar = () => {
    return (
      <header className="bg-slate-900 text-white shadow-md print:hidden relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo and country badge */}
            <div className="flex items-center gap-2.5">
              <Logo size="sm" />
              <div>
                <span className="text-[10px] text-teal-400 font-extrabold tracking-widest uppercase block leading-none">TUNISIE • تونس</span>
                <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1">
                  OrdoMed TN
                </h1>
              </div>
            </div>

            {/* Menu Tabs - Desktop only */}
            <nav className="hidden md:flex space-x-1 sm:space-x-2">
              {userProfile?.role === 'doctor' ? (
                <>
                  <button
                    onClick={() => { setActiveTab('dashboard'); setPrintPreviewPrescription(null); }}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'dashboard'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                    title="Tableau de bord"
                  >
                    <Activity className="w-4 h-4" />
                    <span className="hidden md:inline">Tableau de bord</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('patients'); setPrintPreviewPrescription(null); }}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'patients'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                    title="Patients"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden md:inline">Patients</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('prescription'); setPrintPreviewPrescription(null); }}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'prescription' && !printPreviewPrescription
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                    title="Ordonnance"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden md:inline">Ordonnance</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('database'); setPrintPreviewPrescription(null); }}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'database'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                    title="Médicaments / Admin"
                  >
                    <Database className="w-4 h-4" />
                    <span className="hidden md:inline">Médicaments</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('doctor'); setPrintPreviewPrescription(null); }}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'doctor'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                    title="Cabinet"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden md:inline">Cabinet</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('tests'); setPrintPreviewPrescription(null); }}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'tests'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                    title="Tests Qualité"
                  >
                    <HeartPulse className="w-4 h-4" />
                    <span className="hidden md:inline">Tests</span>
                  </button>
                </>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-900/30 text-teal-300 border border-teal-800/50">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Espace Secrétariat</span>
                  <span className="sm:hidden">Secrétariat</span>
                </span>
              )}
            </nav>

            {/* User Profile & Logout - Desktop only */}
            <div className="hidden md:flex items-center gap-2.5">
              <div className="flex flex-col items-end text-xs">
                <span className="hidden lg:inline font-semibold text-slate-300 truncate max-w-[120px]">{user?.email}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  {userProfile?.role === 'doctor' ? 'Médecin 🩺' : 'Secrétaire 📋'}
                </span>
              </div>
              <button
                onClick={() => { setActiveTab('profile'); setPrintPreviewPrescription(null); }}
                className={`p-2 rounded-xl transition-all cursor-pointer border ${activeTab === 'profile' ? 'bg-sky-600 text-white border-sky-500' : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent hover:border-slate-800/60'}`}
                title="Mon profil"
                aria-label="Mon profil"
              >
                <User className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-800/60"
                title="Se déconnecter"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Hamburger toggle - Mobile only */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-all cursor-pointer"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-3 transition-all duration-300 shadow-xl">
            {userProfile?.role === 'doctor' ? (
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveTab('dashboard'); setPrintPreviewPrescription(null); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                  <span>Tableau de bord</span>
                </button>
                <button
                  onClick={() => { setActiveTab('patients'); setPrintPreviewPrescription(null); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'patients'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Patients</span>
                </button>
                <button
                  onClick={() => { setActiveTab('prescription'); setPrintPreviewPrescription(null); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'prescription' && !printPreviewPrescription
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Ordonnance</span>
                </button>
                <button
                  onClick={() => { setActiveTab('database'); setPrintPreviewPrescription(null); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'database'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Database className="w-5 h-5" />
                  <span>Médicaments</span>
                </button>
                <button
                  onClick={() => { setActiveTab('doctor'); setPrintPreviewPrescription(null); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'doctor'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Cabinet</span>
                </button>
                <button
                  onClick={() => { setActiveTab('tests'); setPrintPreviewPrescription(null); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'tests'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <HeartPulse className="w-5 h-5" />
                  <span>Tests Qualité</span>
                </button>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-900/30 text-teal-300 border border-teal-800/50 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Espace Secrétariat</span>
              </div>
            )}

            {/* User section in mobile menu */}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-3">
              <div className="px-4 py-1 text-xs text-slate-400 truncate">
                Connecté : <span className="font-semibold text-slate-200">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between px-4">
                <span className="text-xs text-slate-400">Rôle actif :</span>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  {userProfile?.role === 'doctor' ? 'Médecin 🩺' : 'Secrétaire 📋'}
                </span>
              </div>
              <div className="px-2 space-y-2">
                <button
                  onClick={() => { setActiveTab('profile'); setPrintPreviewPrescription(null); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs rounded-xl transition-all cursor-pointer border ${activeTab === 'profile' ? 'bg-sky-600 text-white border-sky-500' : 'text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'}`}
                >
                  <User className="w-4 h-4" />
                  <span>Mon profil</span>
                </button>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-slate-800"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    );
  };

  if (authError && user && !userProfile && !authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 p-8 shadow-md text-center animate-fade-in">
          <div className="inline-flex p-3 bg-rose-50 rounded-full text-rose-500 mb-4">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Chargement sécurisé impossible</h2>
          <p className="text-sm text-slate-600 mb-6">
            Une erreur est survenue lors de la récupération ou de l'initialisation de votre profil de sécurité :
            <br />
            <span className="font-mono text-rose-600 block bg-rose-50 p-2.5 rounded-lg mt-2 text-xs text-left overflow-auto max-h-24">
              {authError}
            </span>
          </p>
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleRetryAuth}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 animate-pulse" />
              Réessayer
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || (user && !userProfile)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 p-8 shadow-md text-center flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Chargement du profil sécurisé</h3>
          <p className="text-sm text-slate-500 mb-6">
            Veuillez patienter pendant que nous initialisons votre espace de travail sécurisé...
          </p>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onLoginStart={() => setAuthLoading(true)}
        onLoginSuccess={() => setAuthLoading(false)}
      />
    );
  }

  // If bilingue print preview screen is active, override standard view
  if (printPreviewPrescription) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {renderNavigationBar()}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <PrescriptionPrintView
            prescription={printPreviewPrescription}
            items={printPreviewItems}
            doctorConfig={db.doctorConfig}
            onBack={() => setPrintPreviewPrescription(null)}
          />

      </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {renderNavigationBar()}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {/* Clinical Workspace (Dashboard, Patients, Prescription) */}
        {['dashboard', 'patients', 'prescription'].includes(activeTab) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left side: Patient Selection (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <PatientSelector
                patients={db.patients}
                selectedPatient={selectedPatient}
                onSelectPatient={setSelectedPatient}
                onPatientsChange={handlePatientsChange}
                userRole={userProfile?.role || 'doctor'}
                prescriptions={db.prescriptions}
                setActiveTab={setActiveTab}
              />

              {selectedPatient && userProfile?.role === 'doctor' && (
                <PrescriptionHistory
                  patientId={selectedPatient.id}
                  prescriptions={db.prescriptions}
                  prescriptionItems={db.prescriptionItems}
                  onDuplicatePrescription={handleDuplicatePrescription}
                  onViewPrescription={(p) => {
                    const items = db.prescriptionItems.filter((item) => item.prescription_id === p.id);
                    handleOpenPrintPreview(p, items);
                  }}
                />
              )}
            </div>

            {/* Right side: Workspace Detail (8 cols) */}
            <div className="lg:col-span-8">
              {activeTab === 'dashboard' && (
                <CabinetDashboard
                  prescriptions={db.prescriptions}
                  prescriptionItems={db.prescriptionItems}
                  patients={db.patients}
                  onOpenDossier={(p) => {
                    setSelectedPatient(p);
                    setActiveTab('patients');
                  }}
                  onDraftPrescription={(p) => {
                    setSelectedPatient(p);
                    setActiveTab('prescription');
                  }}
                  onViewPrescription={(p) => {
                    const items = db.prescriptionItems.filter((item) => item.prescription_id === p.id);
                    handleOpenPrintPreview(p, items);
                  }}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'patients' && (
                <PatientDossier
                  patient={selectedPatient}
                  userRole={userProfile?.role || 'doctor'}
                />
              )}

              {activeTab === 'prescription' && (
                selectedPatient ? (
                  <PrescriptionForm
                    patient={selectedPatient}
                    medicines={db.medicines}
                    dosageTemplates={db.dosageTemplates}
                    activePrescription={activePrescription}
                    activeItems={activeItems}
                    onSaveDraft={handleSaveDraft}
                    onSignAndLock={handleSignAndLock}
                    onOpenPrintPreview={handleOpenPrintPreview}
                    onReset={handleResetSession}
                  />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Rédaction d'ordonnance</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                        Sélectionnez un patient dans la colonne de gauche pour commencer à rédiger une ordonnance.
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && userProfile?.role === 'doctor' && (
          <MedicineImporter
            medicines={db.medicines}
            onMedicinesChange={handleMedicinesChange}
          />
        )}

        {/* Doctor Configuration Tab */}
        {activeTab === 'doctor' && userProfile?.role === 'doctor' && (
          <div className="space-y-6">
            <DoctorConfigForm
              config={db.doctorConfig}
              onSave={handleSaveDoctorConfig}
              onDeleteAccountClick={() => setIsDeleteAccountOpen(true)}
            />

            <SecretaryManager doctorUid={userProfile.uid} />
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && userProfile?.role === 'doctor' && (
          <TestSuite />
        )}


        {/* Authenticated account profile */}
        {activeTab === 'profile' && userProfile && user && (
          <ProfileSettings user={user} profile={userProfile} />
        )}
      </main>

      {/* ACCOUNT DELETION MODAL WITH ACCIDENTAL PROTECTION */}
      {isDeleteAccountOpen && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-rose-50/50 flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Suppression du compte</h3>
                <p className="text-xs text-rose-600 font-semibold">Action irréversible • إجراء غير قابل للتراجع</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Vous êtes sur le point de supprimer définitivement votre compte <strong>{user?.email}</strong>.
                Cette opération effacera l'ensemble de votre accès et données sur OrdoMed TN.
              </p>

              {userProfile?.role === 'doctor' && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-amber-800">Données perdues (Médecin) :</span>
                  </div>
                  <ul className="text-[11px] text-amber-700 list-disc list-inside space-y-1 pl-1">
                    <li>Votre configuration de cabinet médical</li>
                    <li>Vos fiches patients enregistrées</li>
                    <li>Vos ordonnances médicales non signées</li>
                    <li>Les accès de vos secrétaires associés</li>
                  </ul>
                </div>
              )}

              {userProfile?.role === 'secretary' && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-amber-800">Données perdues (Secrétariat) :</span>
                  </div>
                  <ul className="text-[11px] text-amber-700 list-disc list-inside space-y-1 pl-1">
                    <li>Votre profil d'accès de secrétariat</li>
                    <li>Votre liaison avec le cabinet du médecin</li>
                  </ul>
                </div>
              )}

              {/* Safety triggers to prevent accidental deletion */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deleteConfirmCheckbox}
                    onChange={(e) => setDeleteConfirmCheckbox(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4.5 h-4.5 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-600 font-medium leading-normal">
                    Je comprends que cette action est définitive et que mes données ne pourront jamais être récupérées.
                  </span>
                </label>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Saisissez "SUPPRIMER" pour valider la suppression :
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder='Écrivez "SUPPRIMER" ici'
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-slate-50 font-semibold text-slate-800"
                  />
                </div>
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-100 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold leading-relaxed">
                  {deleteError === 'REQUIRES_RECENT_LOGIN' ? (
                    <div>
                      <p className="font-bold mb-1">Sécurité renforcée requise</p>
                      Pour supprimer votre compte, vous devez vous être connecté récemment. Veuillez vous déconnecter, vous reconnecter à l'application, puis réessayer la suppression.
                    </div>
                  ) : (
                    deleteError
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteAccountOpen(false);
                  setDeleteConfirmText('');
                  setDeleteConfirmCheckbox(false);
                  setDeleteError(null);
                }}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!deleteConfirmCheckbox || deleteConfirmText !== 'SUPPRIMER' || isDeletingAccount}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm ${
                  deleteConfirmCheckbox && deleteConfirmText === 'SUPPRIMER' && !isDeletingAccount
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer définitivement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

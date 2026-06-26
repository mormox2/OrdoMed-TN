/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { 
  getDbState, 
  logAudit 
} from './data';
import { 
  Patient, 
  Medicine, 
  Prescription, 
  PrescriptionItem, 
  DoctorConfig 
} from './types';

// Firebase & Services
import { db as dbFirestore, auth } from './firebase';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDocs,
  setDoc
} from 'firebase/firestore';
import { 
  setupUserAndGetProfile, 
  savePatientToFirestore, 
  deletePatientFromFirestore, 
  savePrescriptionToFirestore, 
  deletePrescriptionFromFirestore, 
  savePrescriptionItemToFirestore, 
  deletePrescriptionItemFromFirestore, 
  saveDoctorConfig as saveDoctorConfigToFirestore, 
  UserProfile 
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
import LoginScreen from './components/LoginScreen';
import SecretaryManager from './components/SecretaryManager';

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
  Users
} from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global Database State
  const [db, setDb] = useState(getDbState());
  
  // Selected Contexts
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Active drafting prescription
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  const [activeItems, setActiveItems] = useState<PrescriptionItem[]>([]);

  // Print Preview triggers
  const [printPreviewPrescription, setPrintPreviewPrescription] = useState<Prescription | null>(null);
  const [printPreviewItems, setPrintPreviewItems] = useState<PrescriptionItem[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'prescription' | 'database' | 'doctor' | 'tests'>('prescription');

  // 1. Auth state change listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setAuthLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          const profile = await setupUserAndGetProfile(currentUser.uid, currentUser.email || '');
          setUserProfile(profile);
          // Default secretary to prescription tab (which is adjusted to only show Patients)
          if (profile.role === 'secretary') {
            setActiveTab('prescription');
          }
        } catch (err) {
          console.error('Failed to set up user profile:', err);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setSelectedPatient(null);
        setActivePrescription(null);
        setActiveItems([]);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time synchronization with Firestore
  useEffect(() => {
    if (!userProfile) return;

    // A. Listen to Doctor Config
    const configUnsub = onSnapshot(doc(dbFirestore, 'doctorConfigs', userProfile.doctorUid), (docSnap) => {
      if (docSnap.exists()) {
        setDb(prev => ({ ...prev, doctorConfig: docSnap.data() as DoctorConfig }));
      }
    }, (err) => {
      console.error('Config snapshot error:', err);
    });

    // B. Listen to Patients
    const patientsQuery = query(collection(dbFirestore, 'patients'), where('doctorUid', '==', userProfile.doctorUid));
    const patientsUnsub = onSnapshot(patientsQuery, (snap) => {
      const patientList: Patient[] = [];
      snap.forEach((docSnap) => {
        patientList.push(docSnap.data() as Patient);
      });
      setDb(prev => ({ ...prev, patients: patientList }));
    }, (err) => {
      console.error('Patients snapshot error:', err);
    });

    let prescriptionsUnsub = () => {};
    let itemsUnsub = () => {};

    // C. Listen to Prescriptions & PrescriptionItems (Only if Doctor, Secretary is blocked by rules)
    if (userProfile.role === 'doctor') {
      const prescriptionsQuery = query(collection(dbFirestore, 'prescriptions'), where('doctorUid', '==', userProfile.doctorUid));
      prescriptionsUnsub = onSnapshot(prescriptionsQuery, (snap) => {
        const presList: Prescription[] = [];
        snap.forEach((docSnap) => {
          presList.push(docSnap.data() as Prescription);
        });
        setDb(prev => ({ ...prev, prescriptions: presList }));
      }, (err) => {
        console.error('Prescriptions snapshot error:', err);
      });

      const itemsQuery = query(collection(dbFirestore, 'prescriptionItems'), where('doctorUid', '==', userProfile.doctorUid));
      itemsUnsub = onSnapshot(itemsQuery, (snap) => {
        const itemList: PrescriptionItem[] = [];
        snap.forEach((docSnap) => {
          itemList.push(docSnap.data() as PrescriptionItem);
        });
        setDb(prev => ({ ...prev, prescriptionItems: itemList }));
      }, (err) => {
        console.error('Items snapshot error:', err);
      });
    } else {
      // Secretary gets empty prescriptions local arrays
      setDb(prev => ({ ...prev, prescriptions: [], prescriptionItems: [] }));
    }

    return () => {
      configUnsub();
      patientsUnsub();
      prescriptionsUnsub();
      itemsUnsub();
    };
  }, [userProfile]);

  // 3. Load active prescription if patient has a draft
  useEffect(() => {
    if (selectedPatient && userProfile?.role === 'doctor') {
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
       await signOut(auth);
    } catch (err) {
       console.error('Failed to log out:', err);
    }
  };

  // Toggle role in database for convenient developer and clinic testing
  const handleToggleRole = async () => {
    if (!userProfile) return;
    const newRole = userProfile.role === 'doctor' ? 'secretary' : 'doctor';
    
    // When becoming doctor, doctorUid becomes user's own uid.
    // When becoming secretary, we keep their own uid or existing doctorUid to maintain test integrity.
    const updatedProfile: UserProfile = {
      ...userProfile,
      role: newRole,
      doctorUid: newRole === 'doctor' ? userProfile.uid : userProfile.doctorUid
    };

    try {
      const userDocRef = doc(dbFirestore, 'users', userProfile.uid);
      await setDoc(userDocRef, updatedProfile);
      setUserProfile(updatedProfile);
      
      if (newRole === 'secretary') {
        setActiveTab('prescription');
      }
    } catch (err) {
      console.error('Failed to toggle role:', err);
      alert("Erreur lors de la mise à jour du rôle.");
    }
  };

  // Handle doctors configuration update
  const handleSaveDoctorConfig = async (newConfig: DoctorConfig) => {
    if (userProfile) {
      try {
        await saveDoctorConfigToFirestore(userProfile.doctorUid, newConfig);
        logAudit('UPDATE_DOCTOR_CONFIG', 'DOCTOR', userProfile.doctorUid, db.doctorConfig, newConfig);
      } catch (err) {
        console.error('Failed to save config to Firestore:', err);
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
            await deletePatientFromFirestore(p.id);
          }
        }

        // Detect Adds or Updates
        for (const p of newPatients) {
          const current = currentPatientsMap.get(p.id);
          if (!current || JSON.stringify(current) !== JSON.stringify(p)) {
            await savePatientToFirestore(p, userProfile.doctorUid);
          }
        }
      } catch (err) {
        console.error('Failed to sync patients to Firestore:', err);
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
        // Save the prescription
        await savePrescriptionToFirestore(prescription, userProfile.doctorUid);
        
        // Retrieve and delete any lines no longer in the list to prevent orphaned items
        const existingItemsQuery = query(
          collection(dbFirestore, 'prescriptionItems'),
          where('doctorUid', '==', userProfile.doctorUid),
          where('prescription_id', '==', prescription.id)
        );
        const existingSnap = await getDocs(existingItemsQuery);
        const newItemsIds = new Set(items.map(i => i.id));
        
        for (const docSnap of existingSnap.docs) {
          if (!newItemsIds.has(docSnap.id)) {
            await deletePrescriptionItemFromFirestore(docSnap.id);
          }
        }

        // Save each item
        for (const item of items) {
          await savePrescriptionItemToFirestore(item, userProfile.doctorUid);
        }

        setActivePrescription(prescription);
        setActiveItems(items);
        logAudit('SAVE_DRAFT_PRESCRIPTION', 'PRESCRIPTION', prescription.id, null, prescription);
        alert(`Brouillon enregistré avec succès (${prescription.prescription_number})`);
      } catch (err) {
        console.error('Failed to save draft to Firestore:', err);
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
        await savePrescriptionToFirestore(prescription, userProfile.doctorUid);
        
        const existingItemsQuery = query(
          collection(dbFirestore, 'prescriptionItems'),
          where('doctorUid', '==', userProfile.doctorUid),
          where('prescription_id', '==', prescription.id)
        );
        const existingSnap = await getDocs(existingItemsQuery);
        const newItemsIds = new Set(items.map(i => i.id));
        
        for (const docSnap of existingSnap.docs) {
          if (!newItemsIds.has(docSnap.id)) {
            await deletePrescriptionItemFromFirestore(docSnap.id);
          }
        }

        for (const item of items) {
          await savePrescriptionItemToFirestore(item, userProfile.doctorUid);
        }

        setActivePrescription(prescription);
        setActiveItems(items);
        logAudit('SIGN_PRESCRIPTION', 'PRESCRIPTION', prescription.id, null, prescription);
        alert(`L'ordonnance ${prescription.prescription_number} a été signée numériquement et archivée au dossier.`);
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
      <header className="bg-slate-900 text-white shadow-md print:hidden">
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

            {/* Menu Tabs */}
            <nav className="flex space-x-1 sm:space-x-2">
              {userProfile?.role === 'doctor' ? (
                <>
                  <button
                    onClick={() => { setActiveTab('prescription'); setPrintPreviewPrescription(null); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'prescription' && !printPreviewPrescription
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Ordonnancer
                  </button>
                  <button
                    onClick={() => { setActiveTab('database'); setPrintPreviewPrescription(null); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'database'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    Médicaments / Admin
                  </button>
                  <button
                    onClick={() => { setActiveTab('doctor'); setPrintPreviewPrescription(null); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'doctor'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Cabinet settings
                  </button>
                  <button
                    onClick={() => { setActiveTab('tests'); setPrintPreviewPrescription(null); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'tests'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    Tests Qualité
                  </button>
                </>
              ) : (
                <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-900/30 text-teal-300 border border-teal-800/50">
                  <Users className="w-4 h-4" />
                  Espace Secrétariat
                </span>
              )}
            </nav>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="font-semibold text-slate-200 truncate max-w-[150px] text-slate-300">{user?.email}</span>
                <button
                  type="button"
                  onClick={handleToggleRole}
                  className={`mt-0.5 px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider transition-all border cursor-pointer ${
                    userProfile?.role === 'doctor'
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50 hover:text-emerald-200'
                      : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50 hover:text-amber-200'
                  }`}
                  title="Changer de rôle (Médecin <-> Secrétaire) • تبديل الدور"
                >
                  {userProfile?.role === 'doctor' ? 'Médecin 🩺' : 'Secrétaire 📋'}
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-800/60"
                title="Se déconnecter"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>

          </div>
        </div>
      </header>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
        <p className="text-sm font-semibold text-slate-600">Chargement de la session sécurisée...</p>
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
        
        {/* Prescription Tab */}
        {activeTab === 'prescription' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side: Patient Selection (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <PatientSelector
                patients={db.patients}
                selectedPatient={selectedPatient}
                onSelectPatient={setSelectedPatient}
                onPatientsChange={handlePatientsChange}
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

            {/* Right side: Workspace or Secretary Detail (8 cols) */}
            <div className="lg:col-span-8">
              {userProfile?.role === 'secretary' ? (
                selectedPatient ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 animate-fade-in">
                    <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-800">Dossier Patient Administratif</h2>
                        <p className="text-xs text-slate-500">Informations administratives d'accueil enregistrées</p>
                      </div>
                      <span className="px-3 py-1 bg-teal-50 text-teal-700 font-semibold rounded-full text-[10px] tracking-wide uppercase border border-teal-100">
                        Accès Secrétariat
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nom complet</span>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedPatient.name_first} {selectedPatient.name_last}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date de naissance</span>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5">
                            {new Date(selectedPatient.birth_date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Genre</span>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedPatient.gender === 'M' ? 'Masculin (♂)' : 'Féminin (♀)'}</p>
                        </div>
                        {selectedPatient.phone && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">N° Téléphone</span>
                            <p className="text-sm font-semibold text-teal-600 mt-0.5">{selectedPatient.phone}</p>
                          </div>
                        )}
                        {selectedPatient.weight && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Poids</span>
                            <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedPatient.weight} kg</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Allergies déclarées</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {selectedPatient.allergies.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">Aucune allergie enregistrée</span>
                            ) : (
                              selectedPatient.allergies.map((allergy, i) => (
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
                            {!selectedPatient.current_medications || selectedPatient.current_medications.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">Aucun traitement en cours renseigné</span>
                            ) : (
                              selectedPatient.current_medications.map((med) => (
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
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto">
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Gestion Patientèle Secrétariat</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                        Sélectionnez un patient dans la colonne de gauche ou cliquez sur le bouton <strong className="text-slate-700">"Ajouter un Patient"</strong> pour enregistrer un nouveau dossier administratif dans le cabinet de votre médecin.
                      </p>
                    </div>
                  </div>
                )
              ) : selectedPatient ? (
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
                <CabinetDashboard
                  prescriptions={db.prescriptions}
                  prescriptionItems={db.prescriptionItems}
                  patients={db.patients}
                  onSelectPatient={setSelectedPatient}
                  onViewPrescription={(p) => {
                    const items = db.prescriptionItems.filter((item) => item.prescription_id === p.id);
                    handleOpenPrintPreview(p, items);
                  }}
                />
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
            />
            
            <SecretaryManager doctorUid={userProfile.uid} />
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && userProfile?.role === 'doctor' && (
          <TestSuite />
        )}

      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { UserPlus, UserX, Shield, Mail, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { createSecretaryAccount, fetchSecretaries, deleteSecretaryProfile, UserProfile } from '../services/dbService';

interface SecretaryManagerProps {
  doctorUid: string;
}

export default function SecretaryManager({ doctorUid }: SecretaryManagerProps) {
  const [secretaries, setSecretaries] = useState<UserProfile[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSecretaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchSecretaries(doctorUid);
      setSecretaries(list);
    } catch (err: any) {
      setError("Impossible de charger la liste des secrétaires.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecretaries();
  }, [doctorUid]);

  const handleAddSecretary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    const targetEmail = emailInput.trim().toLowerCase();

    // Prevent duplicate secretary email
    if (secretaries.some(s => s.email === targetEmail)) {
      setError("Cette adresse e-mail est déjà associée à un profil secrétaire.");
      setActionLoading(false);
      return;
    }

    try {
      await createSecretaryAccount(doctorUid, targetEmail);
      setEmailInput('');
      setSuccess(`L'invitation de "${targetEmail}" est prête. Elle sera liée au cabinet lors de sa première connexion.`);
      
      await loadSecretaries();
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la création du compte secrétaire. Assurez-vous que l'adresse email est valide.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSecretary = async (uidOrEmailKey: string, email: string) => {
    if (!confirm(`Voulez-vous révoquer définitivement l'accès pour la secrétaire "${email}" ?`)) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteSecretaryProfile(uidOrEmailKey);
      setSuccess(`L'accès pour la secrétaire "${email}" a été révoqué.`);
      await loadSecretaries();
    } catch (err: any) {
      setError("Erreur lors de la suppression du profil.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6" id="secretary-manager-panel">
      <div className="border-b border-slate-100 bg-slate-50/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Gestion du Secrétariat (RBAC)</h2>
              <p className="text-xs text-slate-500">Ajoutez des secrétaires habilitées à renseigner vos patients uniquement</p>
            </div>
          </div>
          <button 
            onClick={loadSecretaries}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-red-800">Erreur : </span>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-teal-50 border border-teal-100 text-teal-700 rounded-xl text-xs flex items-start gap-2.5">
            <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-teal-800">Succès : </span>
              {success}
            </div>
          </div>
        )}

        {/* Form to Add Secretary */}
        <form onSubmit={handleAddSecretary} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Adresse e-mail de la secrétaire *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  placeholder="Ex: secretaire.cabinet@gmail.com"
                />
              </div>
            </div>

          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="text-[11px] text-slate-500 max-w-xl space-y-1">
              <p>
                ⚡ <strong>Accès contrôlé :</strong> l'invitation est réclamée automatiquement à la première connexion Google ou inscription e-mail effectuée avec cette adresse. Le médecin ne définit jamais le mot de passe de la secrétaire.
              </p>
              <p className="text-right text-[10px] text-slate-400 font-medium" dir="rtl">
                ⚡ <strong>وصول آمن:</strong> يتم ربط الدعوة تلقائياً عند أول تسجيل دخول أو إنشاء حساب بنفس عنوان البريد الإلكتروني. لا يحدد الطبيب كلمة مرور السكرتيرة.
              </p>
            </div>
            <button
              type="submit"
              disabled={actionLoading || !emailInput}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all shadow-sm shadow-teal-100 cursor-pointer shrink-0"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Inviter la secrétaire
            </button>
          </div>
        </form>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Comptes Secrétaires Validés & Actifs ({secretaries.length})
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              Chargement des profils secrétariat...
            </div>
          ) : secretaries.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center text-xs text-slate-500">
              Aucun profil secrétaire configuré pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {secretaries.map((s) => {
                const isPendingGoogle = s.uid.startsWith('email:') || s.uid.startsWith('invite:');
                return (
                  <div
                    key={s.uid}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{s.email}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-md text-[9px] font-semibold tracking-wide">
                          {isPendingGoogle ? 'Invitation en attente' : 'Compte validé et actif'}
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-100 rounded-md text-[9px] font-medium">
                          {isPendingGoogle ? 'Invitation e-mail' : 'Compte lié'}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 pt-0.5">
                        Ajouté le {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSecretary(s.uid, s.email)}
                      disabled={actionLoading}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Révoquer l'accès"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

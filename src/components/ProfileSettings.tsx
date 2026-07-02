import { useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { supabase } from '../supabase';
import type { UserProfile } from '../services/dbService';

interface ProfileSettingsProps {
  user: {
    email?: string;
    app_metadata?: { provider?: string; providers?: string[] };
    identities?: Array<{ provider?: string }>;
  };
  profile: UserProfile;
}

const providerLabels: Record<string, string> = {
  email: 'E-mail et mot de passe',
  google: 'Google',
};

export default function ProfileSettings({ user, profile }: ProfileSettingsProps) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const providers = useMemo(() => {
    const values = [
      ...(user.app_metadata?.providers || []),
      user.app_metadata?.provider,
      ...(user.identities || []).map((identity) => identity.provider),
    ].filter((value): value is string => Boolean(value));
    return [...new Set(values)];
  }, [user]);

  const handlePasswordUpdate = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError('Utilisez au moins une minuscule, une majuscule et un chiffre.');
      return;
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message || 'Le mot de passe n’a pas pu être modifié.');
      return;
    }

    setPassword('');
    setConfirmation('');
    setSuccess('Votre mot de passe a été mis à jour.');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-500/15 p-2.5 text-teal-300">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Mon profil</h2>
              <p className="mt-0.5 text-xs text-slate-300">Compte, connexion et sécurité</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Mail className="h-4 w-4 text-teal-600" /> Adresse e-mail
            </div>
            <p className="break-all text-sm font-semibold text-slate-800">{user.email || profile.email}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <ShieldCheck className="h-4 w-4 text-teal-600" /> Accès
            </div>
            <p className="text-sm font-semibold capitalize text-slate-800">
              {profile.role === 'doctor' ? 'Médecin' : 'Secrétaire'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Méthodes de connexion</p>
            <div className="flex flex-wrap gap-2">
              {(providers.length ? providers : ['email']).map((provider) => (
                <span key={provider} className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                  {providerLabels[provider] || provider}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-sky-50 p-2.5 text-sky-600"><KeyRound className="h-5 w-5" /></div>
          <div>
            <h3 className="font-bold text-slate-800">Définir ou modifier le mot de passe</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Vous pourrez ensuite utiliser votre e-mail et ce mot de passe, même si le compte a été créé avec Google.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-xs font-bold text-slate-600">Nouveau mot de passe</label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                placeholder="8 caractères minimum"
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 rounded-lg p-1 text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-bold text-slate-600">Confirmer le mot de passe</label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
              required
            />
          </div>

          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
          {success && <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />{success}</p>}

          <button type="submit" disabled={saving} className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            {saving ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </section>
    </div>
  );
}

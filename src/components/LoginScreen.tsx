import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '../firebase';
import { registerNewDoctor } from '../services/dbService';
import Logo from './Logo';
import { 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Globe,
  Database,
  LockKeyhole,
  Users,
  Languages
} from 'lucide-react';

interface LoginScreenProps {
  onLoginStart: () => void;
  onLoginSuccess: (user: any) => void;
}

type AuthMode = 'signin' | 'signup';
type Language = 'fr' | 'ar';

const translations = {
  fr: {
    republic: "RÉPUBLIQUE TUNISIENNE",
    brandTitle: "OrdoMed TN",
    tagline: "Prescription Assistée Smart",
    mainTitle: "Simplifiez vos consultations. Sécurisez vos patients.",
    mainDesc: "La plateforme moderne tunisienne conçue pour les praticiens exigeants : aide au dosage, génération bilingue, et conformité de pharmacopée tunisienne instantanée.",
    feat1Title: "Traductions bilingues",
    feat1Desc: "Génération automatique des posologies en français et en arabe dialectal tunisien pour limiter les risques d'incompréhension.",
    feat2Title: "Base de Données PCT",
    feat2Desc: "Importation et recherche simplifiée dans le catalogue tunisien officiel de médicaments et de spécialités.",
    feat3Title: "Confidentialité RLS",
    feat3Desc: "Silo de données patients et ordonnances cryptées par compte praticien. Pas de fuites ni d'accès transversaux.",
    feat4Title: "Espace Collaboratif",
    feat4Desc: "Créez des accès restreints pour vos secrétaires médicales : saisie des fiches d'accueil sans accès aux historiques cliniques.",
    footerTrust: "Développé en conformité avec les directives de prescription de l'ordre des médecins de Tunisie.",
    footerCopyright: "© 2026 OrdoMed TN. Serveurs cliniques sécurisés. Version 2.4.0 • Tunisie.",
    signinTab: "Se connecter",
    signupTab: "Créer un compte",
    titleSignin: "Accès Praticien & Secrétariat",
    titleSignup: "Nouvel Enregistrement Praticien",
    descSignin: "Saisissez vos identifiants de cabinet sécurisés",
    descSignup: "Créez votre compte médecin pour démarrer l'ordonnancement",
    labelEmail: "Adresse E-mail",
    labelPassword: "Mot de passe",
    labelConfirmPassword: "Confirmer le mot de passe",
    placeholderEmail: "dr.nom@example.com",
    placeholderPassword: "••••••••",
    btnSubmitSignin: "Se connecter",
    btnSubmitSignup: "Créer mon compte",
    btnProcessing: "Traitement en cours...",
    orContinue: "Ou continuer avec",
    btnGoogle: "Authentification Google",
    alertPrefix: "Alerte : ",
    securityHeader: "Normes d'Inviolabilité Clinique :",
    securityRule1: "Les comptes praticiens bénéficient d'un Cabinet Médical isolé.",
    securityRule2: "Le partage sécurisé s'effectue via des invitations e-mail directes à vos secrétaires.",
  },
  ar: {
    republic: "الجمهورية التونسية",
    brandTitle: "أوردوميد تونس",
    tagline: "إصدار الوصفات الذكي",
    mainTitle: "سهّل عيادتك. احمِ مرضاك.",
    mainDesc: "المنصة التونسية الحديثة والمصممة للأطباء المحترفين: مساعدة في تحديد الجرعات، لغة مزدوجة، ومطابقة فورية لمدونة الأدوية التونسية.",
    feat1Title: "ترجمة فورية مزدوجة",
    feat1Desc: "توليد تلقائي للجرعات باللغتين الفرنسية والدارجة التونسية للحد من مخاطر سوء فهم الوصفة.",
    feat2Title: "قاعدة بيانات الأدوية التونسية",
    feat2Desc: "استيراد وبحث مبسط في الكتالوج الرسمي للأدوية والمستحضرات بتونس.",
    feat3Title: "خصوصية وأمان تام (RLS)",
    feat3Desc: "عزل كامل لبيانات المرضى والوصفات الطبية لكل طبيب على حدة دون أي تداخل.",
    feat4Title: "فضاء عمل تعاوني",
    feat4Desc: "حسابات خاصة ومحدودة للأمانة الطبية: تسجيل المرضى والملفات الإدارية دون الاطلاع على التفاصيل السريرية.",
    footerTrust: "تم التطوير بالتوافق مع توجيهات عمادة الأطباء التونسيين والعمادات الجهوية.",
    footerCopyright: "© 2026 أوردوميد تونس. خوادم طبية آمنة. إصدار 2.4.0 • تونس.",
    signinTab: "تسجيل الدخول",
    signupTab: "إنشاء حساب",
    titleSignin: "دخول الأطباء والأمانة الطبية",
    titleSignup: "تسجيل طبيب جديد",
    descSignin: "أدخل بيانات عيادتك الآمنة للولوج",
    descSignup: "أنشئ حسابك الطبي الآن لبدء إصدار الوصفات",
    labelEmail: "البريد الإلكتروني",
    labelPassword: "كلمة المرور",
    labelConfirmPassword: "تأكيد كلمة المرور",
    placeholderEmail: "dr.name@example.com",
    placeholderPassword: "••••••••",
    btnSubmitSignin: "تسجيل الدخول",
    btnSubmitSignup: "إنشاء حسابي الطبي",
    btnProcessing: "جاري المعالجة...",
    orContinue: "أو الاستمرار باستخدام",
    btnGoogle: "المصادقة عبر جوجل",
    alertPrefix: "تنبيه: ",
    securityHeader: "معايير السلامة السريرية:",
    securityRule1: "تتمتع حسابات الأطباء بعزل تام لقاعدة البيانات والملفات الطبية الخاصة بالعيادة.",
    securityRule2: "تتم مشاركة الولوج الآمن للأمانة عبر إرسال دعوات بريد إلكتروني مباشرة ومحمية.",
  }
};

export default function LoginScreen({ onLoginStart, onLoginSuccess }: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [lang, setLang] = useState<Language>('fr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetFields = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const t = translations[lang];

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    onLoginStart();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        onLoginSuccess(result.user);
      }
    } catch (err: any) {
      console.error('Google Auth error:', err);
      let errMsg = lang === 'fr' 
        ? "Échec de l'authentification avec Google."
        : "فشلت المصادقة باستخدام جوجل.";
      if (err.code === 'auth/popup-blocked') {
        errMsg = lang === 'fr'
          ? "Le pop-up d'authentification a été bloqué par votre navigateur. Veuillez autoriser les pop-ups."
          : "تم حظر النافذة المنبثقة من قبل متصفحك. يرجى السماح بالنوافذ المنبثقة.";
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError(lang === 'fr' ? "Veuillez remplir tous les champs." : "يرجى ملء جميع الحقول.");
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError(lang === 'fr' ? "Les mots de passe ne correspondent pas." : "كلمتا المرور غير متطابقتين.");
      return;
    }

    if (password.length < 6) {
      setError(lang === 'fr' ? "Le mot de passe doit contenir au moins 6 caractères." : "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.");
      return;
    }

    setLoading(true);
    onLoginStart();

    try {
      if (mode === 'signin') {
        // Sign In
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (result.user) {
          onLoginSuccess(result.user);
        }
      } else {
        // Sign Up
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (result.user) {
          try {
            await registerNewDoctor(result.user.uid, result.user.email || '');
          } catch (profileErr) {
            console.error("Failed to initialize doctor profile upon signup:", profileErr);
          }
          onLoginSuccess(result.user);
        }
      }
    } catch (err: any) {
      console.error('Email Auth error:', err);
      let errMsg = lang === 'fr' ? "Une erreur est survenue." : "حدث خطأ غير متوقع.";
      if (err.code === 'auth/email-already-in-use') {
        errMsg = lang === 'fr' 
          ? "Cette adresse e-mail est déjà associée à un compte."
          : "البريد الإلكتروني مستخدم بالفعل.";
      } else if (err.code === 'auth/wrong-password') {
        errMsg = lang === 'fr' ? "Mot de passe incorrect." : "كلمة المرور غير صحيحة.";
      } else if (err.code === 'auth/user-not-found') {
        errMsg = lang === 'fr' 
          ? "Aucun utilisateur trouvé avec cette adresse e-mail."
          : "لا يوجد مستخدم مسجل بهذا البريد الإلكتروني.";
      } else if (err.code === 'auth/invalid-email') {
        errMsg = lang === 'fr' ? "Format d'adresse e-mail invalide." : "تنسيق البريد الإلكتروني غير صالح.";
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const isRtl = lang === 'ar';

  return (
    <div 
      className="min-h-screen bg-slate-900 flex flex-col lg:grid lg:grid-cols-12 relative overflow-hidden font-sans"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      
      {/* Language Switcher Float Button at top corner */}
      <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-50`}>
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setLang('fr')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              lang === 'fr' 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            FR
          </button>
          <button
            type="button"
            onClick={() => setLang('ar')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              lang === 'ar' 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            عربي
            <Languages className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Decorative background gradients for high-end look */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* LEFT COLUMN: Visual clinical panels and rich content (lg:col-span-7) */}
      <div className={`hidden lg:flex lg:col-span-7 flex-col justify-between p-12 bg-slate-950/40 ${isRtl ? 'border-l' : 'border-r'} border-slate-800/60 relative z-10`}>
        
        {/* Top brand header */}
        <div className="flex items-center gap-3.5">
          <Logo size="md" />
          <div>
            <span className="text-[10px] text-teal-400 font-extrabold tracking-widest uppercase block leading-none">{t.republic}</span>
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              {t.brandTitle}
            </h1>
          </div>
        </div>

        {/* Feature grid & value props */}
        <div className="my-auto max-w-xl space-y-10">
          <div className="space-y-4">
            <span className="px-3.5 py-1 bg-teal-500/10 text-teal-400 font-bold rounded-full text-xs uppercase tracking-wider border border-teal-500/20 inline-block">
              {t.tagline}
            </span>
            <h2 className="text-4xl font-extrabold text-slate-100 tracking-tight leading-snug">
              {t.mainTitle}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t.mainDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Feature 1 */}
            <div className="flex gap-3">
              <div className="p-2.5 bg-slate-900 border border-slate-800 text-teal-400 rounded-xl shrink-0 h-11 w-11 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">{t.feat1Title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t.feat1Desc}
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-3">
              <div className="p-2.5 bg-slate-900 border border-slate-800 text-teal-400 rounded-xl shrink-0 h-11 w-11 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">{t.feat2Title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t.feat2Desc}
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-3">
              <div className="p-2.5 bg-slate-900 border border-slate-800 text-teal-400 rounded-xl shrink-0 h-11 w-11 flex items-center justify-center">
                <LockKeyhole className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">{t.feat3Title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t.feat3Desc}
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-3">
              <div className="p-2.5 bg-slate-900 border border-slate-800 text-teal-400 rounded-xl shrink-0 h-11 w-11 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">{t.feat4Title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t.feat4Desc}
                </p>
              </div>
            </div>

          </div>

          {/* Quick trust metrics */}
          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between gap-4">
            <div className="text-slate-400 text-xs leading-relaxed">
              {t.footerTrust}
            </div>
            <div className="flex -space-x-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 text-[10px] font-bold">100%</div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-[10px] font-bold">TLS</div>
              <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 text-[10px] font-bold">GDPR</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500">
          {t.footerCopyright}
        </div>

      </div>

      {/* RIGHT COLUMN: The login/signup Card itself (lg:col-span-5) */}
      <div className="flex-1 lg:col-span-5 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 bg-slate-900 lg:bg-transparent">
        
        {/* On Mobile/Tablet: Show brand header inside the form area */}
        <div className="lg:hidden text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {t.brandTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            {t.mainTitle}
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-950/60 py-8 px-6 sm:px-10 shadow-2xl shadow-slate-950/80 rounded-3xl border border-slate-800/80 backdrop-blur-md">
            
            {/* Mode Tabs */}
            <div className="flex p-1.5 bg-slate-900 rounded-2xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => { setMode('signin'); resetFields(); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-gradient-to-tr from-teal-600 to-teal-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                {t.signinTab}
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); resetFields(); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-gradient-to-tr from-teal-600 to-teal-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                {t.signupTab}
              </button>
            </div>

            <div className="space-y-5">
              
              {/* Form title based on mode */}
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-100">
                  {mode === 'signin' ? t.titleSignin : t.titleSignup}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {mode === 'signin' ? t.descSignin : t.descSignup}
                </p>
              </div>

              {/* Error messages */}
              {error && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-850 text-rose-200 rounded-xl text-xs flex items-start gap-2.5 shadow-sm">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-400" />
                  <div className="flex-1">
                    <span className="font-bold text-rose-300">{t.alertPrefix}</span>
                    {error}
                  </div>
                </div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                    {t.labelEmail}
                  </label>
                  <div className="relative">
                    <Mail className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-3.5 w-4.5 h-4.5 text-slate-500`} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 text-sm border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-900/60 hover:bg-slate-900 focus:bg-slate-900 transition-all text-slate-100 font-medium placeholder:text-slate-500`}
                      placeholder={t.placeholderEmail}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                    {t.labelPassword}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-3.5 w-4.5 h-4.5 text-slate-500`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full ${isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 text-sm border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-900/60 hover:bg-slate-900 focus:bg-slate-900 transition-all text-slate-100 font-medium placeholder:text-slate-500`}
                      placeholder={t.placeholderPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-3 py-1 px-1.5 text-slate-500 hover:text-slate-300 rounded`}
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                      {t.labelConfirmPassword}
                    </label>
                    <div className="relative">
                      <Lock className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-3.5 w-4.5 h-4.5 text-slate-500`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 text-sm border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-900/60 hover:bg-slate-900 focus:bg-slate-900 transition-all text-slate-100 font-medium placeholder:text-slate-500`}
                        placeholder={t.placeholderPassword}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-teal-500/20 cursor-pointer"
                >
                  {loading ? t.btnProcessing : mode === 'signin' ? t.btnSubmitSignin : t.btnSubmitSignup}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase tracking-wider font-bold">{t.orContinue}</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Google Authentication Option */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-800 rounded-xl shadow-sm text-sm font-semibold text-slate-300 bg-slate-900/40 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.68 14.9 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.6 2.8C6.05 6.7 8.75 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.47-1.11 2.72-2.36 3.56l3.6 2.8c2.1-1.94 3.46-4.8 3.46-8.51z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.1 14.7c-.24-.7-.38-1.45-.38-2.2s.14-1.5.38-2.2L1.5 7.5C.54 9.41 0 11.64 0 14s.54 4.59 1.5 6.5l3.6-2.8z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.6-2.8c-1.1.74-2.5 1.18-4.36 1.18-3.25 0-5.95-1.66-6.93-4.46l-3.6 2.8C3.4 20.35 7.35 23 12 23z"
                  />
                </svg>
                <span>{t.btnGoogle}</span>
              </button>

              {/* Dynamic Security compliance footer inside the card */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2 mt-4">
                <h4 className="text-[11px] font-bold text-teal-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  {t.securityHeader}
                </h4>
                <ul className="text-[10.5px] text-slate-400 space-y-1 pl-3.5 pr-3.5 list-disc leading-relaxed">
                  <li>{t.securityRule1}</li>
                  <li>{t.securityRule2}</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

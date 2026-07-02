import React, { useState } from 'react';
import { supabase } from '../supabase';
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

const MOCKUP_DATA = {
  cardio: {
    doctorName: "Dr. Nour Ben Amor",
    doctorSpecialty: "Cardiologue • طبيب أمراض القلب",
    patientName: "Yassine Ben Ali (48 ans)",
    med1Name: "1. CLOPIDOGREL 75mg",
    med1Qty: "1 Boîte • علبة",
    med1PosFr: "1 comprimé par jour au dîner pendant 3 mois.",
    med1PosAr: "قرص واحد يومياً خلال العشاء لمدة 3 أشهر.",
    med2Name: "2. ATORVASTATINE 20mg",
    med2Qty: "2 Boîtes • علبتان",
    med2PosFr: "1 comprimé par jour le soir au coucher.",
    med2PosAr: "قرص واحد يومياً في الليل قبل النوم.",
  },
  pediatrie: {
    doctorName: "Dr. Selim Gharbi",
    doctorSpecialty: "Pédiatre • طبيب الأطفال",
    patientName: "Sarra Trabelsi (6 ans)",
    med1Name: "1. AUGMENTIN Enfant 400mg/57mg",
    med1Qty: "2 Flacons • قارورتان",
    med1PosFr: "2 cuillères-mesure matin et soir pendant 7 jours.",
    med1PosAr: "ملعقتان قياسيتان صباحاً ومساءً لمدة 7 أيام.",
    med2Name: "2. PARACÉTAMOL Sirop 3%",
    med2Qty: "1 Flacon • قارورة",
    med2PosFr: "1 dose-poids toutes les 6 heures en cas de fièvre.",
    med2PosAr: "جرعة-وزن واحدة كل 6 ساعات في حالة الحمى.",
  },
  generale: {
    doctorName: "Dr. Amine Bouziri",
    doctorSpecialty: "Médecin Généraliste • طب عام",
    patientName: "Mohamed Mansour (62 ans)",
    med1Name: "1. METFORMINE 850mg",
    med1Qty: "3 Boîtes • ثلاث علب",
    med1PosFr: "1 comprimé au milieu de chacun des 3 repas principaux.",
    med1PosAr: "قرص واحد في وسط كل وجبة من الوجبات الثلاث الرئيسية.",
    med2Name: "2. ASPIRINE CARDIO 100mg",
    med2Qty: "1 Boîte • علبة",
    med2PosFr: "1 comprimé par jour à midi au milieu du déjeuner.",
    med2PosAr: "قرص واحد يومياً في الغداء.",
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
  const [activeMockupTab, setActiveMockupTab] = useState<'cardio' | 'pediatrie' | 'generale'>('cardio');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin } });
      if (error) throw error;
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
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        if (data.user) onLoginSuccess(data.user);
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (data.user) onLoginSuccess(data.user);
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

      {/* Subtle Dot Matrix Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      {/* Decorative background gradients for high-end look */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

      {/* LEFT COLUMN: Visual clinical panels and rich content (lg:col-span-7) */}
      <div className={`hidden lg:flex lg:col-span-7 flex-col justify-between p-12 bg-slate-950/20 ${isRtl ? 'border-l' : 'border-r'} border-slate-800/40 relative z-10 overflow-y-auto max-h-screen`}>
        
        {/* Top brand header */}
        <div className="flex items-center gap-3.5">
          <Logo size="md" />
          <div>
            <span className="text-[9px] text-teal-400 font-extrabold tracking-widest uppercase block leading-none">{t.republic}</span>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-0.5">
              {t.brandTitle}
            </h1>
          </div>
        </div>

        {/* Feature grid & value props */}
        <div className="my-auto max-w-xl space-y-8 py-6">
          <div className="space-y-4">
            <span className="px-3.5 py-1 bg-gradient-to-r from-teal-500/10 to-sky-500/10 text-teal-400 font-extrabold rounded-full text-[10px] uppercase tracking-wider border border-teal-500/20 inline-block">
              {t.tagline}
            </span>
            <h2 className="text-4xl font-extrabold text-white tracking-tight leading-snug">
              {lang === 'fr' ? (
                <>
                  Simplifiez vos <span className="bg-gradient-to-r from-teal-400 to-sky-400 bg-clip-text text-transparent">consultations</span>.<br />Sécurisez vos patients.
                </>
              ) : (
                <>
                  سهّل <span className="bg-gradient-to-r from-teal-400 to-sky-400 bg-clip-text text-transparent">عيادتك</span>.<br />واحمِ مرضاك.
                </>
              )}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t.mainDesc}
            </p>
          </div>

          {/* Interactive Bilingual Prescription Mockup - CATEGORY SELECTOR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-teal-400 uppercase tracking-wider">
                {lang === 'fr' ? "Simulateur Interactif" : "المحاكي التفاعلي"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {lang === 'fr' ? "Cliquez pour tester" : "اضغط للتجربة"}
              </span>
            </div>
            
            <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800/60 w-full sm:max-w-md">
              <button
                type="button"
                onClick={() => setActiveMockupTab('cardio')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeMockupTab === 'cardio'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                🫀 Cardiologie
              </button>
              <button
                type="button"
                onClick={() => setActiveMockupTab('pediatrie')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeMockupTab === 'pediatrie'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                👶 Pédiatrie
              </button>
              <button
                type="button"
                onClick={() => setActiveMockupTab('generale')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeMockupTab === 'generale'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                🩺 Général
              </button>
            </div>
          </div>

          {/* Interactive Bilingual Prescription Mockup */}
          <div className="relative group">
            {/* Ambient neon border glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-sky-500 rounded-2xl blur opacity-15 group-hover:opacity-25 transition duration-1000" />
            
            {(() => {
              const currentMock = MOCKUP_DATA[activeMockupTab];
              return (
                <div className="relative bg-white text-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-100 transform group-hover:scale-[1.002] transition-all duration-300">
                  {/* Header block */}
                  <div className="flex justify-between items-start border-b border-sky-100 pb-3 mb-3 text-[11px] text-slate-500">
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs">{currentMock.doctorName}</p>
                      <p className="text-teal-600 font-bold text-[10px]">{currentMock.doctorSpecialty}</p>
                      <p className="text-[10px] mt-0.5">Tél : +216 71 234 567</p>
                    </div>
                    <div className="text-right font-mono text-[9px] text-slate-400">
                      <p className="font-bold text-slate-700">Tunis, Tunisie</p>
                      <p>N° Ordre: 19842</p>
                    </div>
                  </div>

                  {/* Patient details & date */}
                  <div className="flex justify-between text-xs font-semibold mb-3 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p>Patient : <span className="text-slate-900">{currentMock.patientName}</span></p>
                    <p>Date : <span className="text-slate-900">28/06/2026</span></p>
                  </div>

                  {/* Rx prescription items */}
                  <div className="space-y-4 my-3">
                    <div className="text-base font-black text-sky-700 font-serif tracking-wider">Rp/</div>
                    
                    {/* Prescription Item 1 */}
                    <div className="pl-3 border-l-2 border-teal-500 space-y-1">
                      <div className="flex justify-between text-[11.5px] font-bold text-slate-900">
                        <span>{currentMock.med1Name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{currentMock.med1Qty}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        <span className="font-semibold text-teal-600">Posologie :</span> {currentMock.med1PosFr}
                      </p>
                      <p className="text-[11px] text-slate-500 text-right leading-normal font-sans" dir="rtl">
                        <span className="font-bold text-teal-600">الجرعة:</span> {currentMock.med1PosAr}
                      </p>
                    </div>

                    {/* Prescription Item 2 */}
                    <div className="pl-3 border-l-2 border-sky-500 space-y-1">
                      <div className="flex justify-between text-[11.5px] font-bold text-slate-900">
                        <span>{currentMock.med2Name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{currentMock.med2Qty}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        <span className="font-semibold text-sky-600">Posologie :</span> {currentMock.med2PosFr}
                      </p>
                      <p className="text-[11px] text-slate-500 text-right leading-normal font-sans" dir="rtl">
                        <span className="font-bold text-sky-600">الجرعة:</span> {currentMock.med2PosAr}
                      </p>
                    </div>
                  </div>

                  {/* Footer watermark & Stamp */}
                  <div className="flex justify-between items-end mt-4 pt-3 border-t border-slate-100 text-[10px]">
                    <div className="text-[9px] text-slate-400 leading-tight">
                      <p>Ordonnance sécurisée bilingue</p>
                      <p className="font-mono mt-0.5">ID: OM-2026-9842</p>
                    </div>
                    <div className="relative shrink-0 flex flex-col items-center justify-center py-1 px-3 border-2 border-emerald-500/40 rounded-xl bg-emerald-50/40 transform rotate-2">
                      <span className="text-[7px] font-bold uppercase tracking-wider text-emerald-600 leading-none">Cabinet Médical</span>
                      <span className="text-[9.5px] font-extrabold text-emerald-700 leading-tight">{currentMock.doctorName}</span>
                      <span className="text-[6.5px] text-emerald-500 font-bold font-mono">TUNISIE • تونس</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Testimonial Quote */}
          {(() => {
            const testimonial = lang === 'fr' 
              ? { quote: "OrdoMed a divisé par deux le temps de mes consultations. La génération bilingue rassure énormément les familles tunisiennes.", author: "Pr. K. Ben Rejeb", role: "Cardiologue, Clinique de l'Ariana" }
              : { quote: "أوردوميد قلص وقت فحص المريض إلى النصف. الترجمة التلقائية للدارجة التونسية تقدم طمأنينة كبيرة للأهالي والمسنين.", author: "أ. د. خليل بن رجب", role: "طبيب قلب، مصحة أريانة" };
            return (
              <div className="bg-slate-950/30 border border-slate-800/50 p-4.5 rounded-2xl relative overflow-hidden">
                <p className="text-slate-300 text-xs italic leading-relaxed relative z-10">
                  "{testimonial.quote}"
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-teal-400">{testimonial.author}</span>
                  <span className="text-slate-500">{testimonial.role}</span>
                </div>
                <div className="absolute -bottom-4 right-2 text-7xl font-serif text-teal-500/5 select-none font-black">”</div>
              </div>
            );
          })()}

          {/* Core Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            
            {/* Feature 1 */}
            <div className="flex gap-3">
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 text-teal-400 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                <Globe className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">{t.feat1Title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {t.feat1Desc}
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-3">
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 text-teal-400 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                <Database className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">{t.feat2Title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {t.feat2Desc}
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-3">
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 text-teal-400 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                <LockKeyhole className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">{t.feat3Title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {t.feat3Desc}
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-3">
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 text-teal-400 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">{t.feat4Title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {t.feat4Desc}
                </p>
              </div>
            </div>

          </div>

          {/* FAQ Accordion Section */}
          <div className="pt-6 border-t border-slate-800/60 space-y-3">
            <h3 className="text-sm font-extrabold text-white tracking-tight uppercase">
              {lang === 'fr' ? "Questions Fréquentes" : "الأسئلة الشائعة"}
            </h3>
            
            <div className="space-y-2">
              {[
                {
                  q: lang === 'fr' ? "Comment fonctionne l'importation de la base PCT ?" : "كيف يعمل استيراد قاعدة الأدوية التونسية؟",
                  a: lang === 'fr' 
                    ? "Vous pouvez importer instantanément le catalogue officiel tunisien des médicaments (plus de 5000 spécialités) via notre importateur intelligent ou ajouter vos médicaments personnalisés."
                    : "يمكنك استيراد الكتالوج الرسمي للأدوية في تونس (أكثر من 5000 دواء) فوراً بضغطة واحدة، أو إضافة أدويتك الخاصة يدوياً."
                },
                {
                  q: lang === 'fr' ? "Puis-je l'utiliser hors-ligne ?" : "هل يمكنني استخدامه دون إنترنت؟",
                  a: lang === 'fr'
                    ? "Oui ! L'application met en cache vos données localement pour que vous puissiez continuer à consulter et rédiger des ordonnances même en cas de coupure réseau."
                    : "نعم! يقوم التطبيق بحفظ بياناتك محلياً بشكل آمن حتى تتمكن من مواصلة فحص المرضى وكتابة الوصفات الطبية حتى عند انقطاع الشبكة."
                },
                {
                  q: lang === 'fr' ? "Comment fonctionne l'Espace Secrétariat ?" : "كيف تعمل مساحة الأمانة الطبية؟",
                  a: lang === 'fr'
                    ? "Depuis vos paramètres, invitez votre secrétaire avec son e-mail. Elle aura son propre accès restreint pour enregistrer les fiches d'accueil des patients et gérer la liste d'attente, sans jamais accéder à vos antécédents cliniques ou ordonnances."
                    : "من إعداداتك، يمكنك دعوة السكرتير(ة) عبر بريده الإلكتروني. سيكون له حساب خاص ومحدود الصلاحيات لتسجيل المرضى وإدارة قائمة الانتظار، دون الاطلاع على التاريخ الطبي أو تفاصيل الوصفات."
                }
              ].map((faq, i) => (
                <div 
                  key={i} 
                  className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <span className={lang === 'ar' ? 'text-right w-full font-bold' : 'font-bold'}>{faq.q}</span>
                    <span className="text-teal-400 shrink-0 font-bold ml-2">
                      {activeFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {activeFaq === i && (
                    <div className="px-4 pb-4 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/40 pt-2 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick trust metrics */}
          <div className="pt-5 border-t border-slate-800/80 flex items-center justify-between gap-4">
            <div className="text-slate-400 text-[11px] leading-relaxed">
              {t.footerTrust}
            </div>
            <div className="flex -space-x-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 text-[10px] font-bold">100%</div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px] font-bold">TLS</div>
              <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-[10px] font-bold">GDPR</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 pt-4">
          {t.footerCopyright}
        </div>

      </div>

      {/* RIGHT COLUMN: The login/signup Card itself (lg:col-span-5) */}
      <div className="flex-1 lg:col-span-5 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 bg-slate-900 lg:bg-transparent overflow-y-auto max-h-screen">
        
        {/* On Mobile/Tablet: Show brand header inside the form area */}
        <div className="lg:hidden text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {t.brandTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
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
              <p className="text-center text-[11px] leading-relaxed text-slate-500">
                En continuant, vous acceptez nos{' '}
                <a
                  href="/conditions-utilisation"
                  className="font-semibold text-teal-400 underline underline-offset-2 hover:text-teal-300"
                >
                  conditions d’utilisation
                </a>.
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

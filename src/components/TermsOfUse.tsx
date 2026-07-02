import { ArrowLeft, ShieldCheck } from 'lucide-react';

const sections = [
  ['1. Objet', "Les présentes conditions encadrent l’accès et l’utilisation d’OrdoMed TN, un outil numérique de gestion de cabinet et d’aide à la rédaction d’ordonnances destiné aux professionnels de santé en Tunisie."],
  ['2. Utilisateurs autorisés', "Le service est réservé aux professionnels de santé et à leurs collaborateurs expressément autorisés. L’utilisateur garantit l’exactitude des informations fournies et demeure responsable de la confidentialité de son compte."],
  ['3. Responsabilité médicale', "OrdoMed TN constitue un outil d’assistance. Il ne remplace ni le jugement clinique, ni la vérification des contre-indications, interactions, posologies et obligations réglementaires. Le professionnel prescripteur reste seul responsable de ses décisions médicales et des documents qu’il valide."],
  ['4. Données et confidentialité', "L’utilisateur ne doit saisir que les données nécessaires à la prise en charge. Il doit disposer d’une base légale appropriée et respecter le secret professionnel ainsi que la réglementation tunisienne applicable aux données personnelles et de santé. Les accès sont protégés par authentification et contrôles d’autorisation."],
  ['5. Usages interdits', "Il est interdit de contourner les mesures de sécurité, d’accéder aux données d’un tiers sans autorisation, d’utiliser le service à des fins frauduleuses ou illégales, ou de perturber son fonctionnement."],
  ['6. Disponibilité', "Le service peut être modifié, suspendu ou interrompu pour maintenance, sécurité ou évolution technique. L’utilisateur doit conserver les procédures de continuité nécessaires à son activité médicale."],
  ['7. Propriété intellectuelle', "L’interface, le code, les contenus et les éléments distinctifs d’OrdoMed TN sont protégés. Aucun droit de reproduction, d’extraction ou de redistribution n’est accordé en dehors de l’usage normal du service."],
  ['8. Suspension et résiliation', "Un accès peut être suspendu en cas de risque de sécurité, d’usage abusif ou de violation des présentes conditions. L’utilisateur peut demander la suppression de son compte depuis l’application lorsque cette fonction est disponible."],
  ['9. Évolution des conditions', "Ces conditions peuvent évoluer afin de tenir compte des changements fonctionnels, réglementaires ou de sécurité. La date de mise à jour publiée sur cette page fait foi."],
  ['10. Droit applicable', "Les présentes conditions sont régies par le droit tunisien. Tout différend sera recherché d’abord par voie amiable avant saisine de la juridiction compétente."],
];

export default function TermsOfUse() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 px-4 py-10 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl sm:p-10">
        <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal-400 hover:text-teal-300">
          <ArrowLeft className="h-4 w-4" /> Retour à OrdoMed TN
        </a>
        <div className="mb-8 flex items-start gap-4">
          <div className="rounded-2xl bg-teal-500/10 p-3 text-teal-400"><ShieldCheck className="h-7 w-7" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">OrdoMed TN</p>
            <h1 className="mt-1 text-3xl font-extrabold text-white sm:text-4xl">Conditions d’utilisation</h1>
            <p className="mt-2 text-sm text-slate-400">Dernière mise à jour : 2 juillet 2026</p>
          </div>
        </div>
        <p className="mb-8 leading-7 text-slate-300">En créant un compte ou en utilisant OrdoMed TN, vous acceptez les présentes conditions. Si vous n’y consentez pas, vous ne devez pas utiliser le service.</p>
        <div className="space-y-7">
          {sections.map(([title, body]) => (
            <section key={title}>
              <h2 className="mb-2 text-lg font-bold text-white">{title}</h2>
              <p className="leading-7 text-slate-300">{body}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 border-t border-slate-800 pt-6 text-sm text-slate-400">
          Consultez également notre <a href="/confidentialite" className="font-semibold text-teal-400 underline underline-offset-2 hover:text-teal-300">politique de confidentialité</a>.
        </div>
      </article>
    </main>
  );
}

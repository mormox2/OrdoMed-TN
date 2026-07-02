import { ArrowLeft, Database, ExternalLink } from 'lucide-react';

const sections = [
  ['1. Responsable et champ d’application', "La présente politique décrit la manière dont OrdoMed TN traite les données personnelles des professionnels de santé, de leurs collaborateurs et des patients dont les informations sont enregistrées dans le service."],
  ['2. Données traitées', "Nous pouvons traiter les données de compte (adresse e-mail, identifiant, rôle et fournisseur de connexion), les paramètres du cabinet, les données nécessaires au dossier patient et aux ordonnances, les journaux techniques et de sécurité, ainsi que les informations que l’utilisateur choisit de saisir."],
  ['3. Finalités', "Ces données servent à authentifier les utilisateurs, gérer les autorisations, fournir les fonctions de cabinet et de prescription, synchroniser et sécuriser les dossiers, prévenir les abus, diagnostiquer les incidents et respecter les obligations légales applicables."],
  ['4. Base et responsabilité du professionnel', "Le professionnel de santé détermine la base légale autorisant le traitement des données de ses patients et agit comme responsable de ce traitement dans le cadre de son activité. OrdoMed TN traite ces informations uniquement pour fournir et sécuriser le service, conformément aux instructions et aux droits d’accès configurés."],
  ['5. Services techniques', "L’application utilise Supabase pour l’authentification, la base de données et les contrôles d’accès, Vercel pour l’hébergement de l’interface, et Google lorsque l’utilisateur choisit la connexion Google. Ces prestataires peuvent traiter des données techniques nécessaires à leurs services selon leurs propres engagements de sécurité et de confidentialité."],
  ['6. Partage des données', "Les données ne sont ni vendues ni utilisées à des fins de publicité ciblée. Elles sont accessibles uniquement aux utilisateurs autorisés du cabinet, aux prestataires techniques indispensables et, lorsque la loi l’exige, aux autorités légalement habilitées."],
  ['7. Conservation et suppression', "Les données sont conservées pendant la durée nécessaire à l’utilisation du service et aux obligations professionnelles ou légales applicables. La suppression du compte peut être demandée ou déclenchée depuis l’application. Certaines traces peuvent être conservées temporairement pour la sécurité, la sauvegarde ou le respect d’une obligation légale."],
  ['8. Sécurité', "OrdoMed TN met en œuvre une authentification sécurisée, le chiffrement des communications, des règles d’accès au niveau de la base de données et une séparation des cabinets. Aucun système n’étant totalement exempt de risque, l’utilisateur doit protéger ses identifiants et signaler rapidement toute suspicion d’accès non autorisé."],
  ['9. Transferts et hébergement', "Les prestataires techniques peuvent héberger ou traiter des données hors de Tunisie. Lorsque cela s’applique, l’utilisateur doit s’assurer que les formalités et garanties requises par la réglementation tunisienne sur les données personnelles et de santé sont respectées."],
  ['10. Droits des personnes', "Sous réserve des obligations médicales et légales, une personne peut demander l’accès, la rectification, la limitation ou la suppression de ses données. Les demandes concernant un dossier patient doivent d’abord être adressées au professionnel de santé ou au cabinet qui l’a créé."],
  ['11. Mineurs', "Le service n’est pas destiné à la création autonome de comptes par des mineurs. Les données médicales d’un patient mineur ne peuvent être traitées que par un professionnel autorisé dans le cadre de sa prise en charge."],
  ['12. Modifications', "Cette politique peut évoluer pour refléter les changements du service, de nos prestataires ou de la réglementation. La version publiée sur cette page et sa date de mise à jour font foi."],
];

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-200 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl sm:p-10">
        <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal-400 hover:text-teal-300">
          <ArrowLeft className="h-4 w-4" /> Retour à OrdoMed TN
        </a>
        <div className="mb-8 flex items-start gap-4">
          <div className="rounded-2xl bg-teal-500/10 p-3 text-teal-400"><Database className="h-7 w-7" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">OrdoMed TN</p>
            <h1 className="mt-1 text-3xl font-extrabold text-white sm:text-4xl">Politique de confidentialité</h1>
            <p className="mt-2 text-sm text-slate-400">Dernière mise à jour : 2 juillet 2026</p>
          </div>
        </div>
        <p className="mb-8 leading-7 text-slate-300">La confidentialité des données médicales est au cœur d’OrdoMed TN. Cette politique explique quelles données sont traitées, pourquoi elles le sont et quels contrôles sont disponibles.</p>
        <div className="space-y-7">
          {sections.map(([title, body]) => (
            <section key={title}>
              <h2 className="mb-2 text-lg font-bold text-white">{title}</h2>
              <p className="leading-7 text-slate-300">{body}</p>
            </section>
          ))}
          <section>
            <h2 className="mb-2 text-lg font-bold text-white">13. Contact</h2>
            <p className="leading-7 text-slate-300">
              Pour une question générale sur cette politique, utilisez le{' '}
              <a href="https://github.com/mormox2/OrdoMed-TN/issues" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-teal-400 underline underline-offset-2 hover:text-teal-300">
                canal d’assistance public <ExternalLink className="h-3.5 w-3.5" />
              </a>. Ne publiez jamais de données médicales ou personnelles dans une demande publique.
            </p>
          </section>
        </div>
        <div className="mt-10 border-t border-slate-800 pt-6 text-sm text-slate-400">
          Consultez également nos <a href="/conditions-utilisation" className="font-semibold text-teal-400 underline underline-offset-2 hover:text-teal-300">conditions d’utilisation</a>.
        </div>
      </article>
    </main>
  );
}


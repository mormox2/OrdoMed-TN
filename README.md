# Ordonnancier Médical Tunisien & Cabinet Connecté 🇹🇳🩺

Une application web moderne, bilingue (Français / Arabe) et hautement sécurisée, conçue sur mesure pour les cabinets médicaux et praticiens de santé en Tunisie. Cet ordonnancier intelligent rationalise la rédaction de prescriptions tout en garantissant la sécurité clinique des patients et la conformité avec la réglementation sanitaire tunisienne.

---
Dr Rtimi Mossaab

## 🌟 Fonctionnalités Principales

### 1. Tableau de Bord du Cabinet (Bento Dashboard)
* **Suivi de l'activité** : Vue d'ensemble instantanée des statistiques clés (nombre de patients enregistrés, ordonnances signées, brouillons en cours).
* **Filtres de recherche avancés** : Recherche dynamique de dossiers patients ou de numéros d'ordonnances.
* **Filtre CNAM APCI** : Isolement rapide des ordonnances bénéficiant de la couverture intégrale (Maladies de Longue Durée / Affections de Longue Durée).

### 2. Éditeur d'Ordonnance Intelligent & Bilingue
* **Saisie intuitive** : Autocomplétion et recherche de médicaments parmi une base de données de spécialités pharmaceutiques tunisiennes.
* **Modèles de posologie** : Insertion rapide de schémas de prises (ex: *1 comp 3 fois par jour pendant 7 jours*).
* **Double langue automatique** : Génération bilingue (Français/Arabe) des en-têtes, des instructions patients et des libellés réglementaires.
* **Brouillons & Verrouillage** : Sauvegarde des ordonnances sous forme de brouillons modifiables, puis signature définitive ("Signer et Verrouiller") empêchant toute altération ultérieure.

### 3. Module d'Alerte Clinique & Sécurité Thérapeutique
* **Interactions Médicamenteuses (DDI)** : Détection temps réel des interactions dangereuses entre les nouvelles prescriptions et le traitement de fond habituel du patient (ex: interaction critique entre l'**Aspirine** et le **Sintrom / Acénocoumarol**).
* **Détection des Doublons Thérapeutiques** : Alerte en cas de superposition de molécules ou de classes thérapeutiques similaires (ex: cumul de deux anti-inflammatoires non stéroïdiens).
* **Gestion des Allergies** : Croisement instantané entre les substances prescrites et le profil allergique déclaré du patient.

### 4. Réglementation Sanitaire Tunisienne & CNAM
* **Prise en charge CNAM (APCI / ALD)** : Case à cocher dédiée pour les traitements à 100% (Affections de Longue Durée). L'activation de l'APCI fait apparaître automatiquement le **Code CNAM unique du médecin** sur l'ordonnance imprimée.
* **Limitation Légale des Psychotropes (Tableau A)** : Les substances contrôlées (ex: Alprazolam) sont bridées à une durée maximale légale de **28 jours** (loi tunisienne sur les stupéfiants et psychotropes). La signature de l'ordonnance est strictement bloquée au-delà de cette durée, invitant le praticien à adapter sa prescription.

### 5. Intégration de la Base de Données PCT (6000+ Médicaments)
* **Base de données PCT officielle intégrée** : Plus de 6000 spécialités pharmaceutiques de la Pharmacie Centrale de Tunisie (PCT) sont incluses par défaut et accessibles hors-ligne instantanément.
* **Données médicales complètes** : Dénomination Commune Internationale (DCI), dosage, forme pharmaceutique, présentation, laboratoire fabricant, numéro d'AMM, classe et sous-classe thérapeutique.
* **Sécurité réglementaire automatisée** : Identification des médicaments du **Tableau B** (psychotropes) pour appliquer automatiquement le verrouillage légal de prescription de 28 jours maximum.

### 6. Personnalisation & Cachet Officiel Virtuel
* **Profil Médecin Complet** : Configuration des informations légales (Nom, spécialité bilingue, adresse, téléphone, matricule fiscal, numéro d'inscription à l'Ordre des Médecins, Code CNAM, et **Site Web du cabinet**).
* **Simulation de Cachet Violet** : Génération visuelle du cachet officiel rond traditionnel (encre violette) du cabinet médical.
* **Contrôle d'Affichage** : Option pour afficher ou masquer l'impression du cachet automatique (utile pour les praticiens utilisant déjà du papier à en-tête ou des carnets à souche pré-imprimés).

### 7. Impression Optimisée (Format A5 par défaut et A4)
* **Format A5 par Défaut** : L'ordonnance s'affiche et s'imprime par défaut au format **demi-feuille (A5)**, avec une option en un clic pour basculer sur le format **Standard (A4)** selon le support papier disponible.
* **QR Code Interactif de Contact (vCard)** : Intégration d'un **vrai QR Code dans le pied de page** de l'ordonnance. Lors du scan avec l'appareil photo d'un smartphone, il déclenche instantanément l'ajout du médecin dans le répertoire de contacts (contenant son Nom, spécialité, téléphone, e-mail, adresse, et site internet officiel).
* Rendu haute fidélité optimisé pour l'impression physique ou l'export PDF.

### 8. Application Web Progressive (PWA) Installable
* **Installation Multi-plateforme** : Entièrement compatible PWA (Progressive Web App). L'application peut être installée en un clic comme un logiciel natif sur Windows, macOS, Android et iOS.
* **Fonctionnement Hors-Ligne & Cache** : Les fichiers d'interface essentiels (assets, scripts, styles) sont gérés par un Service Worker intelligent pour assurer un lancement ultra-rapide et l'accès à l'application même sans connexion internet stable.
* **Intégration au Système** : Raccourci sur l'écran d'accueil/bureau, lancement en mode autonome sans barre de navigation de navigateur, et respect du thème de couleur médical soigné.

### 9. Gestion Multi-Comptes & Secrétariat Connecté
* **Restriction de l'inscription** : Seul un médecin peut s'enregistrer initialement et posséder le compte principal du cabinet.
* **Comptes Secrétaires Annexes** : Depuis son espace de travail, le médecin peut ajouter et lier des comptes de secrétariat en saisissant leur adresse e-mail.
* **Invitation à Usage Unique** : Le médecin invite une secrétaire par e-mail. Elle réclame automatiquement l'invitation lors de sa première connexion Google ou inscription e-mail avec cette adresse ; le médecin ne choisit jamais son mot de passe.

---

## 📋 Exigences & Spécifications de l'Application (App Requirements)

### Spécifications Techniques
* **Framework** : React 18+ (avec TypeScript)
* **Outil de Build** : Vite
* **Styling & Design** : Tailwind CSS (moderne, épuré, haute lisibilité et contrastes soignés)
* **Animations** : Transitions fluides (via `motion/react`)
* **Icônes** : `lucide-react` (exclusif)

### Règles Métier & Réglementaires Validées
1. **Validation Clinique** : Les alertes d'interactions, de surdosage, d'allergies ou de doublons doivent être évaluées et affichées en temps réel sur l'interface de rédaction de l'ordonnance.
2. **Durée de Prescription** : Tout médicament identifié comme substance réglementée (psychotropes, stupéfiants) fait l'objet d'un contrôle automatique bloquant à **28 jours** (Loi Tunisienne relative aux substances vénéneuses).
3. **Identifiants CNAM** : Le code médecin de convention CNAM doit obligatoirement être visible sur le document imprimé dès lors que la case "APCI (100%)" est cochée.
4. **Intégrité de la Signature** : Une fois signée, une ordonnance est verrouillée (lecture seule) pour garantir la traçabilité légale.

---

## 🛠️ Installation et Démarrage

### Prérequis
* Node.js 20 ou supérieur (Node.js 22 LTS recommandé)
* npm ou yarn
* Supabase CLI pour appliquer et tester le schema PostgreSQL

### Instructions

1. **Installer les dépendances** :
   ```bash
   npm install
   ```

2. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
   L'application sera accessible localement sur le port `3000` (ou port configuré par l'environnement).

3. **Compiler pour la production** :
   ```bash
   npm run build
   ```

4. **Lancer le linter** :
   ```bash
   npm run lint
   ```

5. **Exécuter tous les contrôles (types, tests applicatifs et build)** :
   ```bash
   npm run check
   ```

---

## 🧪 Validation & Tests Intégrés

L'application inclut une console de tests automatisés accessible directement en bas de page pour valider l'intégrité de l'algorithme médical. Elle exécute et valide les scénarios clés :
* Le calcul exact de l'âge des patients à partir de leur date de naissance.
* La détection rigoureuse des allergies médicamenteuses.
* La détection précise des interactions critiques (ex: **Aspirine** et **Sintrom / Acénocoumarol**).
* Le blocage strict des prescriptions de psychotropes supérieures à 28 jours.

Les politiques RLS Supabase sont definies par migration et testees dans `supabase/tests/rls.test.sql`. Lancez `supabase test db` sur une instance locale demarree.

---

*Développé avec soin pour accompagner les professionnels de santé tunisiens vers une transition numérique fluide, sécurisée et conforme.*

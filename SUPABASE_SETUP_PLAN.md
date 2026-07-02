# Plan de mise en service Supabase

## Objectif

Demarrer avec une base clinique vide : nouveaux comptes, cabinets, patients, ordonnances et audits.

## Etapes

1. Appliquer les migrations SQL versionnees.
2. Activer Auth Email/Password et Google, puis configurer les URL de redirection.
3. Renseigner les variables Supabase du frontend.
4. Executer les tests RLS et les controles applicatifs.
5. Deployer le frontend.
6. Creer un compte medecin ; le cabinet est initialise automatiquement.
7. Tester connexion, patient, signature, invitation secretaire et isolation inter-cabinets.

## Securite

- aucune cle service_role dans le navigateur ;
- RLS sur toutes les tables exposees ;
- roles issus des affiliations serveur ;
- ordonnances signees immuables ;
- secretaires sans acces aux ordonnances ;
- audit append-only lie a auth.uid().

## Critere de production

Les migrations SQL et tests RLS passent, npm run check passe et les scenarios medecin/secretaire sont valides sur le projet cible.

# Mise en service Supabase - base vide

1. Creer le projet Supabase.
2. Activer Email/Password et Google dans Authentication.
3. Ajouter les URL localhost et production dans Authentication > URL Configuration.
4. Lier le depot : supabase link --project-ref <ref>.
5. Controler les migrations : supabase migration list.
6. Appliquer le schema : supabase db push.
7. Lancer les tests SQL : supabase test db.
8. Copier .env.example vers .env.local et renseigner la cle publishable uniquement.
9. Executer npm run check, puis deployer.
10. Creer le premier compte medecin et effectuer les tests de fumee.


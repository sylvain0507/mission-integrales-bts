# Mission Intégrales — BTS

Serious game pédagogique en contexte électrique. Deux parcours progressifs de six missions : BTS 1re année (polynômes, condition initiale, charge, énergie, moyenne, morceaux) et BTS 2e année (exponentielle, logarithme, sinus, valeur efficace, énergie d’un condensateur).

## Jouer et utiliser en classe

- Ouvrir `index.html` dans un navigateur pour l’entraînement local, même hors connexion.
- Site élèves : https://sylvain0507.github.io/mission-integrales-bts/
- Espace enseignant : https://mission-integrales-bts-volt-261118.sylvainbeq.chatgpt.site/?teacher=1
- Dans l’espace enseignant, se connecter avec ChatGPT, créer une classe, puis ajouter un identifiant pédagogique par élève.
- Les clés personnelles comptent 8 caractères lisibles (ex. `K7MP-4R8T`). La saisie accepte les minuscules, avec ou sans tiret et espaces. Pour les élèves existants, le bouton « Simplifier les anciennes clés » conserve leurs parties et notes ; les anciennes clés restent aussi valables.
- Télécharger les accès et distribuer **individuellement** chaque clé. Ne pas diffuser le fichier complet aux élèves.
- Publier le lien du jeu dans un devoir Classroom. La note reste dans le tableau de bord du jeu ; aucune synchronisation automatique du carnet de notes Classroom n’est incluse.
- Le guide complet est intégré au jeu (bouton « Mode d’emploi ») et peut être imprimé.

Durée indicative : 35 à 50 minutes par parcours, puis débriefing. Calculatrice et brouillon autorisés. Pas de chronomètre. La progression 1re/2e année est une proposition pédagogique à adapter au référentiel de la spécialité de BTS.

## Note et suivi

Chaque mission vaut 10 points : résultat numérique 6, choix de justification 4. Une mission est réussie lorsque les deux sont corrects. Deux indices possibles, chacun coûtant 2 points. Chaque essai incorrect coûte 1 point, avec une pénalité d’essais plafonnée à 2. Score minimum 0. Demander la correction avant réussite termine la mission à 0 et permet de poursuivre. **Note finale sur 20 = somme des six scores / 3**, arrondie au centième. Les notes avant la fin sont signalées comme provisoires (missions non terminées comptées à zéro).

Le texte de démarche est visible par l’enseignant, sans notation automatique du texte libre. Le tableau de bord conserve les parties successives, essais, indices, réponses et résultats par compétence. Actualisation toutes les 15 secondes lorsque le suivi de classe est ouvert. Export CSV des notes et des accès. Les données renouvelées au rejeu ne constituent pas une banque illimitée ; les paramètres sont tirés dans des ensembles finis.

Outil d’apprentissage et d’évaluation formative : les corrections et le code sont consultables dans le navigateur. Pour une évaluation certificative, l’enseignant doit vérifier personnellement la démarche.

## Hébergement et données

GitHub Pages sert uniquement les fichiers publics du jeu. Le service Sites ci-dessus héberge le suivi dans un stockage R2 ; aucune donnée élève, clé privée ou résultat ne doit être ajouté à ce dépôt. Le serveur contrôle les accès et recalcule les scores. Un compte enseignant ne peut consulter que ses classes. Une clé élève ne donne accès qu’aux parties de cet élève. Privilégier des pseudonymes. Quitter l’accès élève sur un poste partagé.

Une classe et toutes ses données peuvent être supprimées depuis le tableau de bord, après confirmation du code de classe. Exporter auparavant les résultats à conserver. Limites de cette version : 30 classes par compte, 200 élèves par classe, 50 parties par accès élève. Une connexion Internet est nécessaire pour le suivi centralisé. Le mode local conserve les résultats sur l’ordinateur et permet un export texte.

## Sources et maintenance

`app.html` : interface et guide ; `math.js` : rendu MathML natif des exposants, fractions et intégrales (sans connexion requise) ; `engine.js` : missions, calculs et barème ; `server.js` : API et contrôle d’accès ; `build.mjs` : génération du HTML autonome et du Worker ; `test.mjs` : contrôles numériques et isolation des accès.

Node.js suffit, sans dépendances :

```sh
npm run build
npm test
```

Le Worker cible Cloudflare Workers via Sites avec une liaison R2 `BUCKET`. Le fichier `index.html` est généré : modifier les sources puis reconstruire. L’origine du service est configurée dans `app.html` ; les origines autorisées pour les requêtes sont dans `server.js`. Le déploiement du service s’effectue par Sites et celui du jeu par GitHub Pages (branche `main`, racine du dépôt). Les routes de connexion enseignant sont gérées par la plateforme Sites.

Les tests couvrent 1 200 missions générées, les calculs d’intégrales par quadrature indépendante, le barème, la progression, l’isolation entre comptes et la suppression. Ils ne remplacent pas un essai de classe réel ni une validation du référentiel pédagogique.

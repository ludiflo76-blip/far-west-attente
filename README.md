far-west-attente
Un mod pour Claude Code. Dès que Claude réfléchit sans avoir encore écrit sa réponse, des cow-boys du Far West, dessinés comme par un enfant (visage, chapeau, chemise de couleur, bottes, chevaux avec crinière, queue et sabots), viennent se promener derrière la conversation, sur fond transparent, l'un après l'autre :

un cow-boy traverse à cheval en faisant tourner son lasso, avec une bulle « Yiii-haaa ! », « Hue ! », son cheval qui hennit « Hiiiii ! » et un « tagada tagada » derrière ;
un shérif, chapeau noir, moustache et étoile dorée, se plante dans la marge sombre à gauche du texte et le fouette pile au bord, avec des traits d'impact et un « CLAC ! » à chaque coup ;
un cow-boy arrive dans la marge de droite, s'arrête pour se gratter la tête avec une bulle « Hmmm… », « Euh… », puis repart ;
un deuxième cow-boy, sur un cheval clair, passe dans l'autre sens en bas de la fenêtre ;
un dernier penseur s'installe dans la marge de gauche (« Pfff… », « Hum ? ») ;
un virevoltant roule en bas de l'écran, poussé par le vent (« Fffiouuu… »).
Le seul texte, ce sont des onomatopées dans des bulles : jamais de phrases.

Ils s'en vont dès que la réponse commence à s'afficher.

Dans l'app de bureau (onglet Code) et sur mobile : les bonshommes se promènent dans toute la fenêtre, derrière la conversation. Pour qu'on les voie à travers, les panneaux de l'app sont rendus un peu transparents.
Dans le terminal : la même scène en caractères ASCII, dans un bandeau au-dessus du champ de saisie.
Dans VS Code : la scène en dessin, dans un bandeau au-dessus du champ de saisie.
Le délai (60 ms par défaut, presque tout de suite) se règle avec DELAI_MS en haut de hooks/register.tsx.

Les mods ne marchent que dans Claude Code, pas dans les conversations claude.ai.

Installation
À l'invite d'une session Claude Code dans un terminal :

/plugin install far-west-attente --marketplace ludiflo76-blip/far-west-attente
Réponds y pour ajouter la source, puis choisis la portée « user » avec Entrée.

Depuis un shell :

claude plugin install far-west-attente --marketplace ludiflo76-blip/far-west-attente
Dans l'app de bureau, où /plugin ne marche pas : clique sur + à côté du champ de saisie, puis Plugins, Add marketplace avec ludiflo76-blip/far-west-attente, puis Add plugin.


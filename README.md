# far-west-attente

Un mod pour Claude Code. Quand Claude réfléchit depuis plus d'une minute sans avoir encore écrit sa réponse, des bonshommes bâtons du Far West viennent se promener derrière la conversation, sur fond transparent, l'un après l'autre :

- un cow-boy traverse à cheval en faisant tourner son lasso ;
- un shérif, chapeau de cow-boy et étoile dorée, se plante à côté du texte et le fouette, avec des traits d'impact et un « CLAC ! » à chaque coup ;
- un bonhomme arrive, s'arrête pour se gratter la tête sous un gribouillis de réflexion, puis repart ;
- un deuxième cow-boy passe dans l'autre sens ;
- un dernier penseur arrive de l'autre côté.

Ils s'en vont dès que la réponse commence à s'afficher.

- Dans l'app de bureau (onglet Code) et sur mobile : les bonshommes se promènent dans toute la fenêtre, derrière la conversation. Pour qu'on les voie à travers, les panneaux de l'app sont rendus un peu transparents.
- Dans le terminal : la même scène en caractères ASCII, dans un bandeau au-dessus du champ de saisie.
- Dans VS Code : la scène en dessin, dans un bandeau au-dessus du champ de saisie.

Le délai se règle avec `DELAI_MS` en haut de `hooks/register.tsx`.

Les mods ne marchent que dans Claude Code, pas dans les conversations claude.ai.

## Installation

À l'invite d'une session Claude Code dans un terminal :

```
/plugin install far-west-attente --marketplace ludiflo76-blip/far-west-attente
```

Réponds `y` pour ajouter la source, puis choisis la portée « user » avec Entrée.

Depuis un shell :

```bash
claude plugin install far-west-attente --marketplace ludiflo76-blip/far-west-attente
```

Dans l'app de bureau, où `/plugin` ne marche pas : clique sur + à côté du champ de saisie, puis Plugins, Add marketplace avec `ludiflo76-blip/far-west-attente`, puis Add plugin.

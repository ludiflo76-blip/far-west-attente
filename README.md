# far-west-attente

Un mod pour Claude Code. Quand Claude réfléchit depuis plus d'une minute sans avoir encore écrit sa réponse, une petite scène Far West apparaît au-dessus du champ de saisie : des cow-boys bâtons au galop font tourner leur lasso, et des bonshommes se grattent la tête sous un gribouillis de réflexion. La scène disparaît dès que la réponse commence à s'afficher.

- Dans l'app de bureau (onglet Code), l'éditeur et le mobile : un dessin vectoriel animé, adapté au thème clair ou sombre.
- Dans le terminal : une version en caractères ASCII animée.

Le délai se règle avec `DELAI_MS` en haut de `hooks/register.tsx`.

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

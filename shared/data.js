/**
 * O'PTI NOISY PIZZA — Base de données partagée (shared/data.js)
 * Direction Artistique : Trattoria Éditoriale (Crème Farine #F6F1E9, Brun Espresso #432918, Terracotta #B83A24)
 * TP Web Mobile - Capacitor - MMI3 2026 (Cahier des charges N°3)
 */

window.OPTINOISY_DATA = {
  restaurant: {
    nom: "O'Pti Noisy",
    slogan: "Forno a Legna & Pizzeria Artisanale",
    adresse: "14 Rue de la République, 93160 Noisy-le-Grand",
    telephone: "01 43 05 26 40",
    horaires: "Ouvert 7j/7 • 11h30 – 14h30 & 18h30 – 23h00",
    coords: {
      lat: 48.8486,
      lng: 2.5528
    },
    livraisonInterne: {
      rayonMaxKm: 5.0,
      fraisStandard: 2.50,
      seuilGratuit: 18.00,
      tempsMoyenMin: 25
    },
    passerelles: {
      ubereats: {
        nom: "Uber Eats",
        couleur: "#06C167",
        frais: 3.49,
        delai: "20 - 30 min",
        note: "4,8 / 5 (640 avis)",
        url: "https://www.ubereats.com/fr"
      },
      deliveroo: {
        nom: "Deliveroo",
        couleur: "#00CCBC",
        frais: 2.99,
        delai: "25 - 35 min",
        note: "4,7 / 5 (510 avis)",
        url: "https://deliveroo.fr/fr/"
      }
    }
  },

  heroSlides: [
    {
      id: "slide-1",
      badge: "Levain Naturel • Maturation 48h",
      titre: "Nos Pizzas au Feu de Bois en 26, 31 & 40 cm",
      sousTitre: "Farine italienne Tipo 00, mozzarella fior di latte et produits frais livrés à Noisy.",
      ctaTexte: "Découvrir la carte",
      ctaCategorie: "pizzas",
      image: "../assets/img/OPTINOISY-Mob-visuel-intro3.jpg"
    },
    {
      id: "slide-2",
      badge: "Recette du Maître Pizzaiolo",
      titre: "Quattro Formaggi AOP & Miel de Fleurs",
      sousTitre: "Mozzarella filante, gorgonzola crémeux, chèvre affiné, emmental grand cru et romarin.",
      ctaTexte: "Choisir ma taille",
      ctaCategorie: "pizzas",
      image: "../assets/img/OPTINOISY-Mob-visuel-intro4.jpg"
    },
    {
      id: "slide-3",
      badge: "Spécialités du Four",
      titre: "Baguette Gratinée & Pain Pita Maison",
      sousTitre: "Cuits sur pierre réfractaire et servis avec leur panier de frites dorées.",
      ctaTexte: "Voir les spécialités",
      ctaCategorie: "four-pates",
      image: "../assets/img/OPTINOISY-Mob-visuel-intro.jpg"
    },
    {
      id: "slide-4",
      badge: "Grands Formats à Partager",
      titre: "Formule Conviviale : 2 Familiales 40 cm",
      sousTitre: "Livraison interne offerte dès 18 € ou via nos passerelles Uber Eats et Deliveroo.",
      ctaTexte: "Voir les formules",
      ctaCategorie: "menus",
      image: "../assets/img/OPTINOISY-Mob-visuel-intro7.jpg"
    }
  ],

  taillesPizza: [
    {
      code: "junior",
      nom: "Junior",
      diametre: 26,
      parts: "1 pers. (6 parts)",
      supplement: 0.00,
      svgMarron: "../assets/icons/picto-pizza-junior-26.svg",
      svgBlanc: "../assets/icons/picto-pizza-junior-26-blanc.svg"
    },
    {
      code: "moyenne",
      nom: "Moyenne",
      diametre: 31,
      parts: "1-2 pers. (8 parts)",
      supplement: 3.50,
      svgMarron: "../assets/icons/picto-pizza-moyenne-31.svg",
      svgBlanc: "../assets/icons/picto-pizza-moyenne-31-blanc.svg"
    },
    {
      code: "familiale",
      nom: "Familiale",
      diametre: 40,
      parts: "3-4 pers. (12 parts)",
      supplement: 7.00,
      svgMarron: "../assets/icons/picto-pizza-familiale-40.svg",
      svgBlanc: "../assets/icons/picto-pizza-familiale-40-blanc.svg"
    }
  ],

  basesPizza: [
    { code: "tomate", nom: "Sauce Tomate San Marzano AOP", supplement: 0.00 },
    { code: "creme", nom: "Crème Fraîche Fermière d'Isigny", supplement: 0.00 },
    { code: "bbq", nom: "Sauce Fumée Maison", supplement: 0.50 }
  ],

  supplementsPizza: [
    { id: "sup-mozzarella", nom: "Fior di Latte supplémentaire", prix: 1.50 },
    { id: "sup-oeuf", nom: "Œuf fermier plein air", prix: 1.20 },
    { id: "sup-chevre", nom: "Chèvre affiné", prix: 1.50 },
    { id: "sup-pepperoni", nom: "Spianata / Pepperoni", prix: 1.80 },
    { id: "sup-miel", nom: "Filet de miel artisanal", prix: 1.00 }
  ],

  categories: [
    { id: "tous", nom: "Toute la Carte", iconType: "grid" },
    { id: "pizzas", nom: "Pizzas (26 / 31 / 40 cm)", iconType: "pizza" },
    { id: "menus", nom: "Formules & Menus", iconType: "menu" },
    { id: "four-pates", nom: "Four & Pâtes Fraîches", iconType: "oven" },
    { id: "salades", nom: "Salades Composées", iconType: "salad" }
  ],

  produits: [
    // ==================== PIZZAS ====================
    {
      id: "piz-noisy-speciale",
      categorieId: "pizzas",
      nom: "La Noisy Spéciale",
      description: "Sauce tomate San Marzano, mozzarella fior di latte, bœuf haché aux herbes, lanières de poivrons grillés, olives noires de Kalamata, origan.",
      prixBase: 9.90,
      image: "../assets/img/OPTINOISY-Mob-visuel-intro3.jpg",
      aTaillesPizza: true,
      baseDefaut: "tomate",
      badge: "Incontournable",
      note: 4.9,
      tempsPreparation: "12 min",
      vegetarien: false
    },
    {
      id: "piz-4-fromages",
      categorieId: "pizzas",
      nom: "La Quattro Formaggi Fondante",
      description: "Double mozzarella filante, gorgonzola AOP, chèvre affiné, emmental grand cru, maïs doux et brin de romarin frais.",
      prixBase: 10.50,
      image: "../assets/img/OPTINOISY-Mob-visuel-intro4.jpg",
      aTaillesPizza: true,
      baseDefaut: "tomate",
      badge: "4 Fromages AOP",
      note: 4.9,
      tempsPreparation: "12 min",
      vegetarien: true
    },
    {
      id: "piz-pepperoni-conviviale",
      categorieId: "pizzas",
      nom: "La Diavola Pepperoni",
      description: "Sauce tomate parfumée à l'origan, mozzarella fondante, généreuses tranches de pepperoni légèrement fumé et champignons de Paris.",
      prixBase: 9.50,
      image: "../assets/img/OPTINOISY-Mob-visuel-intro7.jpg",
      aTaillesPizza: true,
      baseDefaut: "tomate",
      badge: "Tradition",
      note: 4.8,
      tempsPreparation: "10 min",
      vegetarien: false
    },
    {
      id: "piz-authentique-chef",
      categorieId: "pizzas",
      nom: "L'Authentique du Pizzaiolo",
      description: "Pâte maturée 48h, sauce tomate maison, mozzarella, bœuf mariné, merguez artisanale, duo de poivrons doux et olives noires.",
      prixBase: 10.90,
      image: "../assets/img/OPTINOISY-visuel-intro1.jpg",
      aTaillesPizza: true,
      baseDefaut: "tomate",
      badge: "Signature",
      note: 5.0,
      tempsPreparation: "14 min",
      vegetarien: false
    },
    {
      id: "piz-chevre-miel",
      categorieId: "pizzas",
      nom: "La Chèvre, Miel & Noix",
      description: "Base crème fraîche d'Isigny, mozzarella fior di latte, bûche de chèvre, miel de fleurs doré et cerneaux de noix torréfiés.",
      prixBase: 9.90,
      image: "../assets/img/OPTINOISY-Mob-visuel-intro4.jpg",
      aTaillesPizza: true,
      baseDefaut: "creme",
      badge: "Végétarienne",
      note: 4.8,
      tempsPreparation: "11 min",
      vegetarien: true
    },
    {
      id: "piz-reine-tradition",
      categorieId: "pizzas",
      nom: "La Regina Classica",
      description: "Sauce tomate San Marzano, mozzarella fior di latte, jambon supérieur, champignons de Paris émincés minute et olives noires.",
      prixBase: 8.90,
      image: "../assets/img/OPTINOISY-Mob-visuel-intro7.jpg",
      aTaillesPizza: true,
      baseDefaut: "tomate",
      badge: "Classique",
      note: 4.7,
      tempsPreparation: "10 min",
      vegetarien: false
    },

    // ==================== MENUS & FORMULES ====================
    {
      id: "menu-solo-express",
      categorieId: "menus",
      nom: "Formule Solo Déjeuner & Soir",
      description: "1 Pizza Junior 26 cm au choix (ou 1 Pizza Baguette + Panier de Frites) accompagnée d'une boisson 33 cl.",
      prixBase: 12.90,
      image: "../assets/img/OPTINOISY-Mob-visuel-intro.jpg",
      aTaillesPizza: false,
      badge: "Formule Solo",
      note: 4.9,
      tempsPreparation: "15 min",
      vegetarien: false
    },
    {
      id: "menu-duo-lovers",
      categorieId: "menus",
      nom: "Formule Duo Dégustation (2 Moyennes 31 cm)",
      description: "2 Pizzas Moyennes 31 cm au choix + 1 Salade composée à partager + 2 Boissons 33 cl.",
      prixBase: 26.90,
      image: "../assets/img/OPTINOISY-Mob-visuel-intro3.jpg",
      aTaillesPizza: false,
      badge: "Pour 2 Personnes",
      note: 4.9,
      tempsPreparation: "18 min",
      vegetarien: false
    },
    {
      id: "menu-soiree-match",
      categorieId: "menus",
      nom: "Formule Famille & Partage (2 Familiales 40 cm)",
      description: "2 Pizzas Familiales 40 cm (24 parts au total) + 1 Grand Panier de Frites + 1 Boisson 1,5 L.",
      prixBase: 34.90,
      image: "../assets/img/OPTINOISY-Mob-visuel-intro7.jpg",
      aTaillesPizza: false,
      badge: "4 à 6 Personnes",
      note: 5.0,
      tempsPreparation: "20 min",
      vegetarien: false
    },

    // ==================== FOUR, BAGUETTES & PÂTES ====================
    {
      id: "spe-baguette-frites",
      categorieId: "four-pates",
      nom: "Baguette Rustique au Four & Panier de Frites",
      description: "Pain baguette artisanal gratiné au four à bois, mozzarella fondante, volaille marinée, poivrons, olives noires et frites maison.",
      prixBase: 10.50,
      image: "../assets/img/OPTINOISY-Mob-visuel-intro.jpg",
      aTaillesPizza: false,
      badge: "Servi avec Frites",
      note: 4.8,
      tempsPreparation: "12 min",
      vegetarien: false
    },
    {
      id: "spe-pita-four-frites",
      categorieId: "four-pates",
      nom: "Pain Pita Grillé au Four & Panier de Frites",
      description: "Pain pita pétri maison cuit au four à bois, émincé grillé, fromage fondant, crudités, poivrons doux, olives et frites dorées.",
      prixBase: 9.90,
      image: "../assets/img/OPTINOISY-Mob-visuel-intro2.jpg",
      aTaillesPizza: false,
      badge: "Spécialité Four",
      note: 4.8,
      tempsPreparation: "12 min",
      vegetarien: false
    },
    {
      id: "pat-spaghetti-bolognaise",
      categorieId: "four-pates",
      nom: "Spaghetti alla Bolognese Mijotée 4h",
      description: "Spaghetti al dente nappés de notre ragù bolognaise maison au bœuf frais, tomates San Marzano, persil plat et Parmigiano Reggiano.",
      prixBase: 11.50,
      image: "../assets/img/OPTINOISY-Mob-visuel-intro5.jpg",
      aTaillesPizza: false,
      badge: "Pâtes Fraîches",
      note: 4.9,
      tempsPreparation: "10 min",
      vegetarien: false
    },

    // ==================== SALADES FRAÎCHEUR ====================
    {
      id: "sal-oceane-thon",
      categorieId: "salades",
      nom: "Insalata Océane (Thon, Œuf Fermier & Olives)",
      description: "Jeunes pousses, thon albacore émietté, œufs durs au piment doux, tomates fraîches, concombre croquant, oignon rouge et olives de Kalamata.",
      prixBase: 8.90,
      image: "../assets/img/OPTINOISY-Mob-salade-oceane.jpg",
      aTaillesPizza: false,
      badge: "Fraîcheur",
      note: 4.8,
      tempsPreparation: "8 min",
      vegetarien: false
    },
    {
      id: "sal-gambas-roquette",
      categorieId: "salades",
      nom: "Insalata Gamberi & Roquette Sauvage",
      description: "Lit de roquette sauvage, queues de crevettes sautées à l'ail doux, tomates cerises, oignon rouge et vinaigrette aux agrumes.",
      prixBase: 10.90,
      image: "../assets/img/OPTINOISY-Mob-visuel-intro6.jpg",
      aTaillesPizza: false,
      badge: "Gourmet",
      note: 4.9,
      tempsPreparation: "9 min",
      vegetarien: false
    }
  ],

  positionsGeolocPreset: [
    {
      id: "pos-noisy-centre",
      label: "Noisy-le-Grand Centre (1,2 km)",
      adresse: "28 Avenue Émile Cossonneau, 93160 Noisy-le-Grand",
      lat: 48.8435,
      lng: 2.5612,
      description: "Éligible Livraison Interne O'Pti Noisy (20 min)"
    },
    {
      id: "pos-champs-marne",
      label: "Cité Descartes / Champs-sur-Marne (3,6 km)",
      adresse: "5 Boulevard Descartes, 77420 Champs-sur-Marne",
      lat: 48.8398,
      lng: 2.5876,
      description: "Éligible Livraison Interne O'Pti Noisy (28 min)"
    },
    {
      id: "pos-hors-zone",
      label: "Vincennes / Paris Est (8,4 km — Hors Zone)",
      adresse: "12 Avenue de Paris, 94300 Vincennes",
      lat: 48.8472,
      lng: 2.4388,
      description: "Hors rayon 5 km — Bascule Passerelle Uber Eats / Deliveroo"
    }
  ],

  codesPromos: {
    "MMI2026": { code: "MMI2026", reductionPct: 15, label: "-15 % Offre Jury MMI3 2026" },
    "NOISY": { code: "NOISY", reductionPct: 10, label: "-10 % Fidélité O'Pti Noisy" }
  },

  clientDemo: {
    id: "USR-2026-01",
    prenom: "Lucas",
    nom: "Martin",
    email: "lucas.martin@etudiant.uvsq.fr",
    telephone: "06 52 84 19 30",
    adresse: "28 Avenue Émile Cossonneau",
    codePostal: "93160",
    ville: "Noisy-le-Grand",
    pointsFidelite: 85,
    commandesPrecedentes: [
      {
        numero: "OPN-2026-712",
        date: "14 Octobre 2026 • 20h15",
        articles: "1x La Noisy Spéciale (Moyenne 31 cm), 1x Insalata Océane",
        mode: "Livraison Interne O'Pti Noisy",
        total: 22.30,
        statut: "Livrée"
      },
      {
        numero: "OPN-2026-649",
        date: "02 Octobre 2026 • 12h40",
        articles: "1x Baguette Rustique au Four & Panier de Frites",
        mode: "Retrait sur place",
        total: 10.50,
        statut: "Retirée"
      }
    ]
  },

  panierInitialAmorce: [
    {
      uid: "init-1",
      produitId: "piz-noisy-speciale",
      nom: "La Noisy Spéciale",
      image: "../assets/img/OPTINOISY-Mob-visuel-intro3.jpg",
      aTaillesPizza: true,
      tailleCode: "moyenne",
      tailleLabel: "Moyenne 31 cm",
      diametre: 31,
      baseLabel: "Sauce Tomate San Marzano AOP",
      supplements: ["Fior di Latte supplémentaire"],
      prixUnitaire: 14.90,
      quantite: 1
    },
    {
      uid: "init-2",
      produitId: "spe-baguette-frites",
      nom: "Baguette Rustique au Four & Panier de Frites",
      image: "../assets/img/OPTINOISY-Mob-visuel-intro.jpg",
      aTaillesPizza: false,
      tailleCode: null,
      tailleLabel: "Portion complète avec frites",
      diametre: null,
      baseLabel: null,
      supplements: [],
      prixUnitaire: 10.50,
      quantite: 1
    }
  ]
};

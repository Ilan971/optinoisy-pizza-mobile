/**
 * O'PTI NOISY PIZZA — Contrôleur JS (Version 1 : Bootstrap 5.3 — Trattoria Éditoriale)
 * Fichier : version-bootstrap/js/app-bootstrap.js
 */

(function () {
  "use strict";

  const DATA = window.OPTINOISY_DATA;

  const state = {
    categorieActive: "tous",
    recherche: "",
    selectedSizesByProduct: {},
    panier: [],
    codePromoActif: null,
    modeReception: "livraison_interne",
    clientConnecte: null,
    positionClient: {
      lat: 48.8435,
      lng: 2.5612,
      adresse: "28 Avenue Émile Cossonneau, 93160 Noisy-le-Grand",
      distanceKm: 1.2,
      eligibleInterne: true
    },
    modalCustomState: {
      produit: null,
      tailleCode: "moyenne",
      baseCode: "tomate",
      supplementsIds: []
    }
  };

  let leafletMap = null;
  let clientMarker = null;
  let routePolyline = null;

  function formatEuro(val) {
    return Number(val).toFixed(2).replace(".", ",") + " €";
  }

  function computeHaversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  function showToast(message) {
    const toastEl = document.getElementById("appToast");
    const msgEl = document.getElementById("appToastMessage");
    if (!toastEl || !msgEl) return;
    msgEl.textContent = message;
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2500 });
    toast.show();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initDefaultSizes();
    loadPersistedState();
    renderHeroCarousel();
    renderCategoryPills();
    renderProductsGrid();
    renderGeoPresets();
    initLeafletMap();
    updateDeliveryUI();
    renderCart();
    renderAccountView();
    bindEvents();
  });

  function initDefaultSizes() {
    DATA.produits.forEach((p) => {
      if (p.aTaillesPizza) {
        state.selectedSizesByProduct[p.id] = "moyenne";
      }
    });
  }

  function loadPersistedState() {
    try {
      const savedCart = localStorage.getItem("opn_cart_v2");
      if (savedCart) {
        state.panier = JSON.parse(savedCart);
      } else {
        state.panier = JSON.parse(JSON.stringify(DATA.panierInitialAmorce));
        saveCart();
      }

      const savedUser = localStorage.getItem("opn_user_v2");
      if (savedUser) {
        state.clientConnecte = JSON.parse(savedUser);
      } else {
        state.clientConnecte = JSON.parse(JSON.stringify(DATA.clientDemo));
      }
    } catch (e) {
      state.panier = JSON.parse(JSON.stringify(DATA.panierInitialAmorce));
      state.clientConnecte = JSON.parse(JSON.stringify(DATA.clientDemo));
    }
  }

  function saveCart() {
    try {
      localStorage.setItem("opn_cart_v2", JSON.stringify(state.panier));
    } catch (e) {}
  }

  function saveUser() {
    try {
      if (state.clientConnecte) {
        localStorage.setItem("opn_user_v2", JSON.stringify(state.clientConnecte));
      } else {
        localStorage.removeItem("opn_user_v2");
      }
    } catch (e) {}
  }

  // 1. HERO CAROUSEL ÉDITORIAL
  function renderHeroCarousel() {
    const indicators = document.getElementById("heroCarouselIndicators");
    const inner = document.getElementById("heroCarouselInner");
    if (!indicators || !inner) return;

    indicators.innerHTML = DATA.heroSlides
      .map(
        (slide, idx) =>
          `<button type="button" data-bs-target="#heroPizzaCarousel" data-bs-slide-to="${idx}" class="${
            idx === 0 ? "active" : ""
          }" aria-current="${idx === 0 ? "true" : "false"}" aria-label="Slide ${idx + 1}"></button>`
      )
      .join("");

    inner.innerHTML = DATA.heroSlides
      .map(
        (slide, idx) => `
        <div class="carousel-item ${idx === 0 ? "active" : ""}">
          <div class="opn-hero-slide">
            <img src="${slide.image}" alt="${slide.titre}">
            <div class="opn-hero-overlay">
              <div>
                <span class="opn-hero-tag">${slide.badge}</span>
              </div>
              <div>
                <h1 class="opn-hero-title">${slide.titre}</h1>
                <p class="opn-hero-subtitle">${slide.sousTitre}</p>
                <button type="button" class="opn-hero-cta" onclick="filterByCategory('${slide.ctaCategorie}')">
                  ${slide.ctaTexte} →
                </button>
              </div>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  }

  // 2. CATÉGORIES
  function renderCategoryPills() {
    const container = document.getElementById("categoryPillsContainer");
    if (!container) return;

    container.innerHTML = DATA.categories
      .map(
        (cat) => `
        <button type="button" class="opn-cat-btn ${state.categorieActive === cat.id ? "active" : ""}" onclick="filterByCategory('${cat.id}')">
          ${cat.nom}
        </button>
      `
      )
      .join("");
  }

  window.filterByCategory = function (catId) {
    state.categorieActive = catId;
    renderCategoryPills();
    renderProductsGrid();
    const catObj = DATA.categories.find((c) => c.id === catId);
    const titleEl = document.getElementById("activeCategoryTitle");
    if (titleEl && catObj) {
      titleEl.textContent = catObj.nom;
    }
  };

  // 3. GRILLE PRODUITS & SÉLECTEUR DE TAILLE 26 / 31 / 40 CM AVEC LES SVG OFFICIELS
  function getTailleInfo(code) {
    return DATA.taillesPizza.find((t) => t.code === code) || DATA.taillesPizza[0];
  }

  function computeProductCardPrice(produit, tailleCode) {
    if (!produit.aTaillesPizza) return produit.prixBase;
    const taille = getTailleInfo(tailleCode);
    return produit.prixBase + taille.supplement;
  }

  function renderProductsGrid() {
    const grid = document.getElementById("productsGrid");
    const countBadge = document.getElementById("productCountBadge");
    if (!grid) return;

    const query = state.recherche.trim().toLowerCase();
    const filtered = DATA.produits.filter((p) => {
      const matchCat = state.categorieActive === "tous" || p.categorieId === state.categorieActive;
      const matchSearch =
        !query ||
        p.nom.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query);
      return matchCat && matchSearch;
    });

    if (countBadge) {
      countBadge.textContent = `${filtered.length} recette${filtered.length > 1 ? "s" : ""}`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center py-4">
          <p class="mb-2" style="color: var(--opn-espresso-soft);">Aucune recette ne correspond à votre recherche.</p>
          <button type="button" class="btn btn-sm btn-opn-outline" onclick="resetFilters()">Afficher toute la carte</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((produit) => {
        const selectedSizeCode = state.selectedSizesByProduct[produit.id] || "moyenne";
        const currentPrice = computeProductCardPrice(produit, selectedSizeCode);

        let sizeSelectorHtml = "";
        if (produit.aTaillesPizza) {
          sizeSelectorHtml = `
            <div class="opn-size-selector" role="group" aria-label="Choisir la taille de la pizza">
              ${DATA.taillesPizza
                .map((t) => {
                  const isActive = t.code === selectedSizeCode;
                  const svgSrc = isActive ? t.svgBlanc : t.svgMarron;
                  const priceForSize = produit.prixBase + t.supplement;
                  return `
                    <button type="button"
                      class="opn-size-btn ${isActive ? "active" : ""}"
                      onclick="selectPizzaCardSize('${produit.id}', '${t.code}')"
                      aria-pressed="${isActive}">
                      <img src="${svgSrc}" alt="${t.nom} ${t.diametre} cm" class="opn-size-svg">
                      <span class="size-title">${t.nom} ${t.diametre} cm</span>
                      <span class="size-price">${formatEuro(priceForSize)}</span>
                    </button>
                  `;
                })
                .join("")}
            </div>
          `;
        }

        return `
          <div class="col-12">
            <article class="opn-product-card">
              <div class="opn-product-img-wrap">
                <img src="${produit.image}" alt="${produit.nom}" loading="lazy">
                <span class="position-absolute top-0 start-0 m-2 opn-badge-editorial">
                  ${produit.badge}
                </span>
                <span class="position-absolute top-0 end-0 m-2 opn-badge-rating">
                  ${produit.note.toFixed(1).replace(".", ",")} / 5 • ${produit.tempsPreparation}
                </span>
              </div>

              <div class="p-3">
                <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                  <h3 class="h6 fw-bold mb-0 font-heading">${produit.nom}</h3>
                  <span class="opn-price-tag text-nowrap" id="price-${produit.id}">
                    ${formatEuro(currentPrice)}
                  </span>
                </div>

                <p class="small mb-2" style="color: var(--opn-espresso-soft);">${produit.description}</p>

                ${sizeSelectorHtml}

                <div class="d-flex gap-2 mt-2">
                  ${
                    produit.aTaillesPizza
                      ? `<button type="button" class="btn btn-opn-outline btn-sm px-3" onclick="openCustomizeModal('${produit.id}')">
                          <i class="bi bi-sliders me-1"></i>Options
                        </button>`
                      : ""
                  }
                  <button type="button" class="btn btn-opn-terracotta btn-sm flex-grow-1 py-2" onclick="quickAddToCart('${produit.id}')">
                    <i class="bi bi-plus-lg me-1"></i>Ajouter ${
                      produit.aTaillesPizza
                        ? `(${getTailleInfo(selectedSizeCode).diametre} cm)`
                        : "au panier"
                    }
                  </button>
                </div>
              </div>
            </article>
          </div>
        `;
      })
      .join("");
  }

  window.resetFilters = function () {
    state.categorieActive = "tous";
    state.recherche = "";
    const sInput = document.getElementById("searchInput");
    if (sInput) sInput.value = "";
    renderCategoryPills();
    renderProductsGrid();
  };

  window.selectPizzaCardSize = function (produitId, tailleCode) {
    state.selectedSizesByProduct[produitId] = tailleCode;
    renderProductsGrid();
  };

  // 4. AJOUT AU PANIER ET PERSONNALISATION
  window.quickAddToCart = function (produitId) {
    const produit = DATA.produits.find((p) => p.id === produitId);
    if (!produit) return;

    if (produit.aTaillesPizza) {
      const tailleCode = state.selectedSizesByProduct[produit.id] || "moyenne";
      const taille = getTailleInfo(tailleCode);
      const baseObj = DATA.basesPizza.find((b) => b.code === produit.baseDefaut) || DATA.basesPizza[0];

      addItemToCart({
        produitId: produit.id,
        nom: produit.nom,
        image: produit.image,
        aTaillesPizza: true,
        tailleCode: taille.code,
        tailleLabel: `${taille.nom} ${taille.diametre} cm`,
        diametre: taille.diametre,
        baseLabel: baseObj.nom,
        supplements: [],
        prixUnitaire: produit.prixBase + taille.supplement
      });
    } else {
      addItemToCart({
        produitId: produit.id,
        nom: produit.nom,
        image: produit.image,
        aTaillesPizza: false,
        tailleCode: null,
        tailleLabel: "Portion complète",
        diametre: null,
        baseLabel: null,
        supplements: [],
        prixUnitaire: produit.prixBase
      });
    }
  };

  window.openCustomizeModal = function (produitId) {
    const produit = DATA.produits.find((p) => p.id === produitId);
    if (!produit) return;

    state.modalCustomState = {
      produit: produit,
      tailleCode: state.selectedSizesByProduct[produit.id] || "moyenne",
      baseCode: produit.baseDefaut || "tomate",
      supplementsIds: []
    };

    document.getElementById("modalCustomizePizzaLabel").textContent = produit.nom;
    renderCustomizeModalContent();

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalCustomizePizza"));
    modal.show();
  };

  function renderCustomizeModalContent() {
    const { produit, tailleCode, baseCode, supplementsIds } = state.modalCustomState;
    if (!produit) return;

    const sizeContainer = document.getElementById("modalSizeSelector");
    sizeContainer.innerHTML = DATA.taillesPizza
      .map((t) => {
        const isActive = t.code === tailleCode;
        const svgSrc = isActive ? t.svgBlanc : t.svgMarron;
        return `
          <button type="button" class="opn-size-btn ${isActive ? "active" : ""}" onclick="setModalPizzaSize('${t.code}')">
            <img src="${svgSrc}" alt="${t.nom} ${t.diametre} cm" class="opn-size-svg">
            <span class="size-title">${t.nom} ${t.diametre} cm</span>
            <span class="size-price">${formatEuro(produit.prixBase + t.supplement)}</span>
          </button>
        `;
      })
      .join("");

    const baseSelect = document.getElementById("modalBaseSelect");
    baseSelect.innerHTML = DATA.basesPizza
      .map(
        (b) =>
          `<option value="${b.code}" ${b.code === baseCode ? "selected" : ""}>${b.nom} ${
            b.supplement > 0 ? `(+${formatEuro(b.supplement)})` : "(Incluse)"
          }</option>`
      )
      .join("");

    const supContainer = document.getElementById("modalSupplementsList");
    supContainer.innerHTML = DATA.supplementsPizza
      .map((sup) => {
        const checked = supplementsIds.includes(sup.id);
        return `
          <label class="d-flex align-items-center justify-content-between p-2 rounded-2 small" style="background: var(--opn-paper-surface); border: 1px solid var(--opn-border);">
            <span>
              <input type="checkbox" class="form-check-input me-2" value="${sup.id}" ${
          checked ? "checked" : ""
        } onchange="toggleModalSupplement('${sup.id}')">
              ${sup.nom}
            </span>
            <span class="fw-bold" style="color: var(--opn-terracotta);">+${formatEuro(sup.prix)}</span>
          </label>
        `;
      })
      .join("");

    updateModalComputedPrice();
  }

  window.setModalPizzaSize = function (code) {
    state.modalCustomState.tailleCode = code;
    renderCustomizeModalContent();
  };

  window.toggleModalSupplement = function (supId) {
    const idx = state.modalCustomState.supplementsIds.indexOf(supId);
    if (idx === -1) {
      state.modalCustomState.supplementsIds.push(supId);
    } else {
      state.modalCustomState.supplementsIds.splice(idx, 1);
    }
    updateModalComputedPrice();
  };

  function getModalTotalUnitaire() {
    const { produit, tailleCode, baseCode, supplementsIds } = state.modalCustomState;
    if (!produit) return 0;
    const taille = getTailleInfo(tailleCode);
    const baseObj = DATA.basesPizza.find((b) => b.code === baseCode) || DATA.basesPizza[0];
    const supTotal = supplementsIds.reduce((acc, id) => {
      const s = DATA.supplementsPizza.find((x) => x.id === id);
      return acc + (s ? s.prix : 0);
    }, 0);
    return produit.prixBase + taille.supplement + baseObj.supplement + supTotal;
  }

  function updateModalComputedPrice() {
    const priceEl = document.getElementById("modalComputedPrice");
    if (priceEl) {
      priceEl.textContent = formatEuro(getModalTotalUnitaire());
    }
  }

  // 5. PANIER
  function addItemToCart(newItem) {
    const existing = state.panier.find(
      (item) =>
        item.produitId === newItem.produitId &&
        item.tailleCode === newItem.tailleCode &&
        item.baseLabel === newItem.baseLabel &&
        JSON.stringify(item.supplements) === JSON.stringify(newItem.supplements)
    );

    if (existing) {
      existing.quantite += 1;
    } else {
      state.panier.push({
        uid: "item-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        ...newItem,
        quantite: 1
      });
    }

    saveCart();
    renderCart();
    showToast(`${newItem.nom} (${newItem.tailleLabel}) ajouté au panier`);
  }

  window.updateCartItemQty = function (uid, delta) {
    const item = state.panier.find((x) => x.uid === uid);
    if (!item) return;
    item.quantite += delta;
    if (item.quantite <= 0) {
      state.panier = state.panier.filter((x) => x.uid !== uid);
    }
    saveCart();
    renderCart();
  };

  function calculateCartTotals() {
    const sousTotal = state.panier.reduce((acc, item) => acc + item.prixUnitaire * item.quantite, 0);
    const nbArticles = state.panier.reduce((acc, item) => acc + item.quantite, 0);

    let remise = 0;
    if (state.codePromoActif && DATA.codesPromos[state.codePromoActif]) {
      remise = sousTotal * (DATA.codesPromos[state.codePromoActif].reductionPct / 100);
    }

    const apresRemise = Math.max(0, sousTotal - remise);
    let fraisLivraison = 0;
    let labelLivraison = "Frais de livraison (Zone Interne)";

    if (nbArticles === 0) {
      fraisLivraison = 0;
    } else if (state.modeReception === "click_collect") {
      fraisLivraison = 0;
      labelLivraison = "Retrait au comptoir (15 min)";
    } else if (state.modeReception === "ubereats") {
      fraisLivraison = DATA.restaurant.passerelles.ubereats.frais;
      labelLivraison = "Frais Passerelle Uber Eats";
    } else if (state.modeReception === "deliveroo") {
      fraisLivraison = DATA.restaurant.passerelles.deliveroo.frais;
      labelLivraison = "Frais Passerelle Deliveroo";
    } else {
      if (apresRemise >= DATA.restaurant.livraisonInterne.seuilGratuit) {
        fraisLivraison = 0;
        labelLivraison = "Livraison Interne (Offerte dès 18 €)";
      } else {
        fraisLivraison = DATA.restaurant.livraisonInterne.fraisStandard;
        labelLivraison = "Livraison Interne O'Pti Noisy";
      }
    }

    const totalTtc = apresRemise + fraisLivraison;
    return { sousTotal, nbArticles, remise, fraisLivraison, labelLivraison, totalTtc };
  }

  function renderCart() {
    const container = document.getElementById("cartItemsContainer");
    const totals = calculateCartTotals();

    document.getElementById("bottomCartCount").textContent = totals.nbArticles;
    document.getElementById("bottomCartTotal").textContent = formatEuro(totals.totalTtc);
    document.getElementById("checkoutBtnAmount").textContent = formatEuro(totals.totalTtc);
    document.getElementById("payModalSubmitAmount").textContent = formatEuro(totals.totalTtc);
    document.getElementById("gatewayCartCount").textContent = `${totals.nbArticles} article${
      totals.nbArticles > 1 ? "s" : ""
    } (${formatEuro(totals.sousTotal)})`;

    if (!container) return;

    if (state.panier.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4" style="color: var(--opn-espresso-soft);">
          <i class="bi bi-bag-x display-6 d-block mb-2"></i>
          Votre panier est vide. Sélectionnez une pizza 26, 31 ou 40 cm.
        </div>
      `;
    } else {
      container.innerHTML = state.panier
        .map(
          (item) => `
          <div class="d-flex align-items-center justify-content-between gap-2 p-2 rounded-2 mb-2" style="background: var(--opn-paper-surface); border: 1px solid var(--opn-border);">
            <img src="${item.image}" alt="${item.nom}" class="rounded-2" style="width: 54px; height: 54px; object-fit: cover;">
            <div class="flex-grow-1">
              <div class="fw-bold small font-heading">${item.nom}</div>
              <div style="font-size: 0.72rem; color: var(--opn-terracotta); font-weight: 600;">
                ${item.tailleLabel} ${item.baseLabel ? `• ${item.baseLabel}` : ""}
              </div>
              ${
                item.supplements && item.supplements.length > 0
                  ? `<div style="font-size: 0.68rem; color: var(--opn-espresso-soft);">+ ${item.supplements.join(", ")}</div>`
                  : ""
              }
              <div class="fw-bold small mt-1">${formatEuro(item.prixUnitaire * item.quantite)}</div>
            </div>
            <div class="d-flex align-items-center gap-1">
              <button type="button" class="btn btn-sm btn-opn-outline px-2 py-0" onclick="updateCartItemQty('${item.uid}', -1)">-</button>
              <span class="fw-bold small px-1">${item.quantite}</span>
              <button type="button" class="btn btn-sm btn-opn-espresso px-2 py-0" onclick="updateCartItemQty('${item.uid}', 1)">+</button>
            </div>
          </div>
        `
        )
        .join("");
    }

    document.getElementById("summarySubtotal").textContent = formatEuro(totals.sousTotal);
    const discRow = document.getElementById("summaryDiscountRow");
    if (totals.remise > 0) {
      discRow.style.setProperty("display", "flex", "important");
      document.getElementById("summaryDiscount").textContent = "-" + formatEuro(totals.remise);
    } else {
      discRow.style.setProperty("display", "none", "important");
    }

    document.getElementById("summaryDeliveryLabel").textContent = totals.labelLivraison;
    document.getElementById("summaryDeliveryFee").textContent =
      totals.fraisLivraison === 0 ? "Offerte" : formatEuro(totals.fraisLivraison);
    document.getElementById("summaryTotalTtc").textContent = formatEuro(totals.totalTtc);
  }

  // 6. GÉOLOCALISATION INTERNE & PASSERELLES UBER EATS / DELIVEROO
  function renderGeoPresets() {
    const container = document.getElementById("presetGeoButtons");
    if (!container) return;
    container.innerHTML = DATA.positionsGeolocPreset
      .map(
        (preset) => `
        <button type="button" class="btn btn-sm btn-opn-outline text-start d-flex justify-content-between align-items-center py-1 px-2" onclick="applyGeoPreset('${preset.id}')">
          <span class="small"><i class="bi bi-geo-alt me-1"></i>${preset.label}</span>
          <span class="opn-badge-editorial" style="font-size: 0.62rem;">Tester</span>
        </button>
      `
      )
      .join("");
  }

  function initLeafletMap() {
    const mapEl = document.getElementById("bootstrapGeoMap");
    if (!mapEl || typeof L === "undefined") return;

    const restoCoords = [DATA.restaurant.coords.lat, DATA.restaurant.coords.lng];
    leafletMap = L.map("bootstrapGeoMap").setView(restoCoords, 13);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 19,
      attribution: "© OpenStreetMap • © CARTO"
    }).addTo(leafletMap);

    L.marker(restoCoords)
      .addTo(leafletMap)
      .bindPopup("<b>O'Pti Noisy — Forno a Legna</b><br>Départ Livraison Interne")
      .openPopup();

    L.circle(restoCoords, {
      color: "#2E4A36",
      fillColor: "#2E4A36",
      fillOpacity: 0.14,
      radius: DATA.restaurant.livraisonInterne.rayonMaxKm * 1000
    }).addTo(leafletMap);

    leafletMap.on("click", (e) => {
      setClientCoordinates(
        e.latlng.lat,
        e.latlng.lng,
        `Point sélectionné sur la carte (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`
      );
    });

    updateMapMarkers();
  }

  function updateMapMarkers() {
    if (!leafletMap || typeof L === "undefined") return;
    const restoCoords = [DATA.restaurant.coords.lat, DATA.restaurant.coords.lng];
    const clientCoords = [state.positionClient.lat, state.positionClient.lng];

    if (clientMarker) leafletMap.removeLayer(clientMarker);
    if (routePolyline) leafletMap.removeLayer(routePolyline);

    clientMarker = L.marker(clientCoords)
      .addTo(leafletMap)
      .bindPopup(`<b>Votre adresse (${state.positionClient.distanceKm} km)</b><br>${state.positionClient.adresse}`)
      .openPopup();

    routePolyline = L.polyline([restoCoords, clientCoords], {
      color: state.positionClient.eligibleInterne ? "#2E4A36" : "#B83A24",
      weight: 3,
      dashArray: "6, 6"
    }).addTo(leafletMap);

    leafletMap.fitBounds(L.latLngBounds([restoCoords, clientCoords]), { padding: [28, 28] });
  }

  function setClientCoordinates(lat, lng, adresseLabel) {
    const dist = computeHaversineKm(
      DATA.restaurant.coords.lat,
      DATA.restaurant.coords.lng,
      lat,
      lng
    );
    const eligible = dist <= DATA.restaurant.livraisonInterne.rayonMaxKm;

    state.positionClient = {
      lat,
      lng,
      adresse: adresseLabel,
      distanceKm: dist,
      eligibleInterne: eligible
    };

    if (!eligible && state.modeReception === "livraison_interne") {
      state.modeReception = "ubereats";
      showToast("Hors rayon interne (5 km) : bascule sur la passerelle Uber Eats");
    } else if (eligible && (state.modeReception === "ubereats" || state.modeReception === "deliveroo")) {
      state.modeReception = "livraison_interne";
    }

    updateMapMarkers();
    updateDeliveryUI();
    renderCart();
  }

  window.applyGeoPreset = function (presetId) {
    const preset = DATA.positionsGeolocPreset.find((p) => p.id === presetId);
    if (!preset) return;
    setClientCoordinates(preset.lat, preset.lng, preset.adresse);
  };

  function updateDeliveryUI() {
    const { distanceKm, adresse, eligibleInterne } = state.positionClient;
    const badgeEl = document.getElementById("currentDistanceBadge");
    const etaEl = document.getElementById("currentEtaLabel");
    const alertBox = document.getElementById("geoResultAlert");
    const titleEl = document.getElementById("geoStatusTitle");
    const descEl = document.getElementById("geoStatusDesc");

    const estMin = Math.max(15, Math.round(14 + distanceKm * 3.5));

    if (badgeEl) {
      badgeEl.textContent = eligibleInterne
        ? `${distanceKm.toFixed(1).replace(".", ",")} km • Zone Interne`
        : `${distanceKm.toFixed(1).replace(".", ",")} km • Hors Zone`;
    }
    if (etaEl) {
      etaEl.innerHTML = `<i class="bi bi-clock me-1"></i>${estMin} min`;
    }

    if (alertBox && titleEl && descEl) {
      if (eligibleInterne) {
        alertBox.style.background = "var(--opn-olive-bg)";
        alertBox.style.borderColor = "rgba(46, 74, 54, 0.3)";
        alertBox.style.color = "var(--opn-olive)";
        titleEl.textContent = `Éligible Livraison Interne O'Pti Noisy (${distanceKm} km)`;
        descEl.textContent = `${adresse} • Livraison par notre livreur interne en ~${estMin} min (Offerte dès 18 €).`;
      } else {
        alertBox.style.background = "#FDF2EF";
        alertBox.style.borderColor = "rgba(184, 58, 36, 0.35)";
        alertBox.style.color = "var(--opn-terracotta)";
        titleEl.textContent = `Hors Rayon Interne 5 km (${distanceKm} km de Noisy)`;
        descEl.textContent = `${adresse} • Commandez via nos passerelles partenaires Uber Eats ou Deliveroo ci-dessous.`;
      }
    }

    document.querySelectorAll("#deliveryChannelSelector .opn-mode-pill").forEach((pill) => {
      const m = pill.getAttribute("data-mode");
      pill.classList.remove("active-interne", "active-ubereats", "active-deliveroo");
      if (m === state.modeReception) {
        if (m === "ubereats") pill.classList.add("active-ubereats");
        else if (m === "deliveroo") pill.classList.add("active-deliveroo");
        else pill.classList.add("active-interne");
      }
    });

    const subtitleMap = {
      livraison_interne: "Mode : Livraison Interne Géolocalisée O'Pti Noisy",
      click_collect: "Mode : Retrait au comptoir (15 min)",
      ubereats: "Mode : Passerelle Partenaire Uber Eats",
      deliveroo: "Mode : Passerelle Partenaire Deliveroo"
    };
    const subEl = document.getElementById("cartDeliveryModeSubtitle");
    if (subEl) subEl.textContent = subtitleMap[state.modeReception] || "";
  }

  window.selectDeliveryMode = function (mode) {
    if (mode === "livraison_interne" && !state.positionClient.eligibleInterne) {
      showToast("Votre adresse est à plus de 5 km : ouverture de la passerelle Uber Eats");
      openGatewayModal("ubereats");
      return;
    }
    state.modeReception = mode;
    updateDeliveryUI();
    renderCart();

    if (mode === "ubereats" || mode === "deliveroo") {
      openGatewayModal(mode);
    } else {
      showToast(
        mode === "click_collect"
          ? "Mode Retrait au comptoir sélectionné (15 min)"
          : "Mode Livraison Interne O'Pti Noisy activé"
      );
    }
  };

  window.openGatewayModal = function (partnerKey) {
    const partner = DATA.restaurant.passerelles[partnerKey];
    if (!partner) return;

    state.modeReception = partnerKey;
    updateDeliveryUI();
    renderCart();

    const badge = document.getElementById("gatewayModalBadge");
    const heading = document.getElementById("gatewayModalHeading");
    const desc = document.getElementById("gatewayModalDesc");
    const eta = document.getElementById("gatewayEta");
    const fee = document.getElementById("gatewayFee");
    const link = document.getElementById("gatewayExternalLink");

    badge.textContent = partner.nom.toUpperCase();
    badge.style.backgroundColor = partner.couleur;
    badge.style.color = "#051B10";

    heading.textContent = `Passerelle Officielle O'Pti Noisy × ${partner.nom}`;
    desc.textContent = `Votre sélection est prête à être transmise au coursier ${partner.nom} (${partner.note}).`;
    eta.textContent = partner.delai;
    fee.textContent = formatEuro(partner.frais);
    link.href = partner.url;
    link.style.backgroundColor = partner.couleur;
    link.style.color = "#051B10";
    link.innerHTML = `Continuer sur ${partner.nom} <i class="bi bi-box-arrow-up-right ms-1"></i>`;

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalExternalGateway"));
    modal.show();
  };

  // 7. COMPTE CLIENT
  function renderAccountView() {
    const outView = document.getElementById("accountLoggedOutView");
    const inView = document.getElementById("accountLoggedInView");
    const headerLabel = document.getElementById("headerAccountLabel");
    const bottomLabel = document.getElementById("bottomAccountLabel");

    if (!state.clientConnecte) {
      outView.classList.remove("d-none");
      inView.classList.add("d-none");
      headerLabel.textContent = "Connexion";
      bottomLabel.textContent = "Compte";
      return;
    }

    outView.classList.add("d-none");
    inView.classList.remove("d-none");
    headerLabel.textContent = state.clientConnecte.prenom;
    bottomLabel.textContent = state.clientConnecte.prenom;

    const initials =
      (state.clientConnecte.prenom[0] || "U") + (state.clientConnecte.nom[0] || "P");
    document.getElementById("userAvatarInitials").textContent = initials.toUpperCase();
    document.getElementById("userFullName").textContent = `${state.clientConnecte.prenom} ${state.clientConnecte.nom}`;
    document.getElementById("userEmailDisplay").textContent = state.clientConnecte.email;
    document.getElementById("userPhoneDisplay").textContent = state.clientConnecte.telephone;
    document.getElementById("userAddressDisplay").textContent = `${state.clientConnecte.adresse}, ${state.clientConnecte.codePostal} ${state.clientConnecte.ville}`;

    const pts = Math.min(100, state.clientConnecte.pointsFidelite || 50);
    document.getElementById("userPointsBadge").textContent = `${pts} / 100 pts`;
    document.getElementById("userPointsBar").style.width = `${pts}%`;

    const historyEl = document.getElementById("userOrderHistoryList");
    const commandes = state.clientConnecte.commandesPrecedentes || [];
    if (commandes.length === 0) {
      historyEl.innerHTML = `<div class="small" style="color: var(--opn-espresso-soft);">Aucune commande passée pour le moment.</div>`;
    } else {
      historyEl.innerHTML = commandes
        .map(
          (cmd) => `
          <div class="p-2 rounded-2 small" style="background: var(--opn-paper-surface); border: 1px solid var(--opn-border);">
            <div class="d-flex justify-content-between fw-bold">
              <span style="color: var(--opn-terracotta);">${cmd.numero}</span>
              <span>${formatEuro(cmd.total)}</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--opn-espresso-soft);">${cmd.date} • ${cmd.mode}</div>
            <div class="mt-1" style="font-size: 0.78rem;">${cmd.articles}</div>
            <span class="opn-status-pill mt-1">${cmd.statut}</span>
          </div>
        `
        )
        .join("");
    }
  }

  // 8. ÉVÉNEMENTS
  function bindEvents() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        state.recherche = e.target.value;
        renderProductsGrid();
      });
    }

    const baseSelect = document.getElementById("modalBaseSelect");
    if (baseSelect) {
      baseSelect.addEventListener("change", (e) => {
        state.modalCustomState.baseCode = e.target.value;
        updateModalComputedPrice();
      });
    }

    const btnConfirmCustom = document.getElementById("btnConfirmCustomPizza");
    if (btnConfirmCustom) {
      btnConfirmCustom.addEventListener("click", () => {
        const { produit, tailleCode, baseCode, supplementsIds } = state.modalCustomState;
        if (!produit) return;
        const taille = getTailleInfo(tailleCode);
        const baseObj = DATA.basesPizza.find((b) => b.code === baseCode) || DATA.basesPizza[0];
        const supNames = supplementsIds
          .map((id) => {
            const s = DATA.supplementsPizza.find((x) => x.id === id);
            return s ? s.nom : "";
          })
          .filter(Boolean);

        addItemToCart({
          produitId: produit.id,
          nom: produit.nom,
          image: produit.image,
          aTaillesPizza: true,
          tailleCode: taille.code,
          tailleLabel: `${taille.nom} ${taille.diametre} cm`,
          diametre: taille.diametre,
          baseLabel: baseObj.nom,
          supplements: supNames,
          prixUnitaire: getModalTotalUnitaire()
        });

        bootstrap.Modal.getInstance(document.getElementById("modalCustomizePizza")).hide();
      });
    }

    const btnRealGeo = document.getElementById("btnRealGeoloc");
    if (btnRealGeo) {
      btnRealGeo.addEventListener("click", () => {
        if (!navigator.geolocation) {
          showToast("Géolocalisation non supportée par ce navigateur.");
          return;
        }
        btnRealGeo.disabled = true;
        btnRealGeo.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Recherche du signal GPS...`;

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            btnRealGeo.disabled = false;
            btnRealGeo.innerHTML = `<i class="bi bi-crosshair me-1"></i> Me géolocaliser via le GPS de l'appareil`;
            setClientCoordinates(
              pos.coords.latitude,
              pos.coords.longitude,
              `Position GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
            );
            showToast("Position GPS détectée avec succès");
          },
          () => {
            btnRealGeo.disabled = false;
            btnRealGeo.innerHTML = `<i class="bi bi-crosshair me-1"></i> Me géolocaliser via le GPS de l'appareil`;
            window.applyGeoPreset("pos-noisy-centre");
            showToast("Simulation sur Noisy-le-Grand activée");
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      });
    }

    const btnPromo = document.getElementById("btnApplyPromo");
    if (btnPromo) {
      btnPromo.addEventListener("click", () => {
        const input = document.getElementById("promoCodeInput");
        const feedback = document.getElementById("promoFeedback");
        const code = (input.value || "").trim().toUpperCase();
        if (DATA.codesPromos[code]) {
          state.codePromoActif = code;
          feedback.className = "small mb-2 fw-semibold";
          feedback.style.color = "var(--opn-olive)";
          feedback.textContent = `Code ${code} appliqué : ${DATA.codesPromos[code].label}`;
          renderCart();
        } else {
          state.codePromoActif = null;
          feedback.className = "small mb-2 fw-semibold";
          feedback.style.color = "var(--opn-terracotta)";
          feedback.textContent = "Code non reconnu (essayez MMI2026 ou NOISY).";
          renderCart();
        }
      });
    }

    const btnCheckout = document.getElementById("btnProceedCheckout");
    if (btnCheckout) {
      btnCheckout.addEventListener("click", () => {
        if (state.panier.length === 0) {
          showToast("Ajoutez au moins un article avant de régler");
          return;
        }
        const offcanvasEl = document.getElementById("offcanvasPanier");
        const offcanvasInst = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (offcanvasInst) offcanvasInst.hide();

        document.getElementById("paymentStepForm").classList.remove("d-none");
        document.getElementById("paymentStepSuccess").classList.add("d-none");

        const checkoutModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalCheckout"));
        checkoutModal.show();
      });
    }

    const inputHolder = document.getElementById("inputCardHolder");
    const inputNum = document.getElementById("inputCardNumber");
    const inputExp = document.getElementById("inputCardExpiry");

    if (inputHolder) {
      inputHolder.addEventListener("input", (e) => {
        document.getElementById("cardPreviewHolder").textContent =
          (e.target.value || "CLIENT O'PTI NOISY").toUpperCase();
      });
    }
    if (inputNum) {
      inputNum.addEventListener("input", (e) => {
        let digits = e.target.value.replace(/\D/g, "").substring(0, 16);
        let formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
        e.target.value = formatted;
        document.getElementById("cardPreviewNumber").textContent = formatted || "4970 •••• •••• 2026";
      });
    }
    if (inputExp) {
      inputExp.addEventListener("input", (e) => {
        let digits = e.target.value.replace(/\D/g, "").substring(0, 4);
        if (digits.length >= 3) {
          digits = digits.substring(0, 2) + "/" + digits.substring(2);
        }
        e.target.value = digits;
        document.getElementById("cardPreviewExpiry").textContent = digits || "10/28";
      });
    }

    const paymentForm = document.getElementById("onlinePaymentForm");
    if (paymentForm) {
      paymentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const totals = calculateCartTotals();
        const orderNum = "OPN-2026-" + Math.floor(100 + Math.random() * 899);
        document.getElementById("confirmedOrderNumber").textContent = orderNum;

        if (state.clientConnecte) {
          const resume = state.panier
            .map((i) => `${i.quantite}x ${i.nom} (${i.tailleLabel})`)
            .join(", ");
          state.clientConnecte.commandesPrecedentes = state.clientConnecte.commandesPrecedentes || [];
          state.clientConnecte.commandesPrecedentes.unshift({
            numero: orderNum,
            date: "Aujourd'hui • En direct",
            articles: resume,
            mode:
              state.modeReception === "click_collect"
                ? "Retrait sur place"
                : "Livraison Géolocalisée",
            total: totals.totalTtc,
            statut: "En cuisson"
          });
          state.clientConnecte.pointsFidelite = Math.min(
            100,
            (state.clientConnecte.pointsFidelite || 50) + 15
          );
          saveUser();
          renderAccountView();
        }

        state.panier = [];
        saveCart();
        renderCart();

        document.getElementById("paymentStepForm").classList.add("d-none");
        document.getElementById("paymentStepSuccess").classList.remove("d-none");
        showToast("Paiement validé : votre commande est au four");
      });
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newClient = {
          id: "USR-" + Date.now(),
          prenom: document.getElementById("regPrenom").value.trim(),
          nom: document.getElementById("regNom").value.trim(),
          email: document.getElementById("regEmail").value.trim(),
          telephone: document.getElementById("regTel").value.trim(),
          adresse: document.getElementById("regAdresse").value.trim(),
          codePostal: document.getElementById("regCp").value.trim(),
          ville: document.getElementById("regVille").value.trim(),
          pointsFidelite: 50,
          commandesPrecedentes: []
        };
        state.clientConnecte = newClient;
        saveUser();
        renderAccountView();
        showToast(`Bienvenue ${newClient.prenom}, 50 points crédités`);
      });
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        state.clientConnecte = JSON.parse(JSON.stringify(DATA.clientDemo));
        saveUser();
        renderAccountView();
        showToast(`Bon retour ${state.clientConnecte.prenom}`);
      });
    }

    const btnDemo = document.getElementById("btnQuickDemoLogin");
    if (btnDemo) {
      btnDemo.addEventListener("click", () => {
        state.clientConnecte = JSON.parse(JSON.stringify(DATA.clientDemo));
        saveUser();
        renderAccountView();
        showToast("Profil étudiant Lucas Martin chargé");
      });
    }

    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        state.clientConnecte = null;
        saveUser();
        renderAccountView();
        showToast("Session déconnectée");
      });
    }
  }

  window.scrollToSection = function (sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (sectionId === "sectionLivraisonGeoloc" && leafletMap) {
      setTimeout(() => leafletMap.invalidateSize(), 300);
    }
  };
})();

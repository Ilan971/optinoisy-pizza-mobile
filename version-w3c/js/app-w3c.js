/**
 * O'PTI NOISY PIZZA — Contrôleur JS Vanilla (Version 2 : W3C Standard — Trattoria Éditoriale)
 * Fichier : version-w3c/js/app-w3c.js
 */

(function () {
  "use strict";

  const DATA = window.OPTINOISY_DATA;

  const state = {
    heroIndex: 0,
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
  let toastTimeout = null;

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

  function showToast(msg) {
    const t = document.getElementById("w3cToast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      t.classList.remove("show");
    }, 2500);
  }

  document.addEventListener("DOMContentLoaded", () => {
    DATA.produits.forEach((p) => {
      if (p.aTaillesPizza) state.selectedSizesByProduct[p.id] = "moyenne";
    });
    loadPersistedState();
    renderHeroSlider();
    renderCategoryNav();
    renderProductsGrid();
    renderGeoPresets();
    initLeafletMap();
    updateDeliveryUI();
    renderCart();
    renderAccountView();
    bindEvents();

    setInterval(() => {
      setHeroSlide((state.heroIndex + 1) % DATA.heroSlides.length);
    }, 5000);
  });

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

  // 1. HERO SLIDER W3C
  function renderHeroSlider() {
    const track = document.getElementById("w3cHeroTrack");
    const dots = document.getElementById("w3cHeroDots");
    if (!track || !dots) return;

    track.innerHTML = DATA.heroSlides
      .map(
        (s, idx) => `
        <div class="w3c-hero-slide ${idx === state.heroIndex ? "active" : ""}" data-slide-idx="${idx}">
          <img src="${s.image}" alt="${s.titre}">
          <div class="w3c-hero-overlay">
            <div>
              <span class="w3c-tag w3c-tag-paper">${s.badge}</span>
            </div>
            <div>
              <h1 style="font-size: 1.45rem; font-weight: 700; margin-bottom: 0.35rem; color: #ffffff;">${s.titre}</h1>
              <p style="font-size: 0.82rem; color: #f0ebe3; margin: 0 0 0.85rem 0;">${s.sousTitre}</p>
              <button type="button" class="w3c-btn w3c-btn-terracotta" data-hero-cat="${s.ctaCategorie}">
                ${s.ctaTexte} →
              </button>
            </div>
          </div>
        </div>
      `
      )
      .join("");

    dots.innerHTML = DATA.heroSlides
      .map(
        (_, idx) =>
          `<button type="button" class="w3c-hero-dot ${
            idx === state.heroIndex ? "active" : ""
          }" data-dot-idx="${idx}" aria-label="Diapositive ${idx + 1}"></button>`
      )
      .join("");

    track.querySelectorAll("[data-hero-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setCategory(btn.getAttribute("data-hero-cat"));
      });
    });

    dots.querySelectorAll("[data-dot-idx]").forEach((dot) => {
      dot.addEventListener("click", () => {
        setHeroSlide(Number(dot.getAttribute("data-dot-idx")));
      });
    });
  }

  function setHeroSlide(idx) {
    state.heroIndex = idx;
    document.querySelectorAll(".w3c-hero-slide").forEach((el, i) => {
      el.classList.toggle("active", i === idx);
    });
    document.querySelectorAll(".w3c-hero-dot").forEach((el, i) => {
      el.classList.toggle("active", i === idx);
    });
  }

  // 2. CATÉGORIES
  function renderCategoryNav() {
    const nav = document.getElementById("w3cCategoryNav");
    if (!nav) return;
    nav.innerHTML = DATA.categories
      .map(
        (c) => `
        <button type="button" class="w3c-cat-pill ${
          state.categorieActive === c.id ? "active" : ""
        }" data-cat-id="${c.id}">
          ${c.nom}
        </button>
      `
      )
      .join("");

    nav.querySelectorAll("[data-cat-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setCategory(btn.getAttribute("data-cat-id"));
      });
    });
  }

  function setCategory(catId) {
    state.categorieActive = catId;
    renderCategoryNav();
    renderProductsGrid();
    const cat = DATA.categories.find((c) => c.id === catId);
    const heading = document.getElementById("w3cActiveCategoryHeading");
    if (heading && cat) heading.textContent = cat.nom;
  }

  // 3. GRILLE PRODUITS & SÉLECTEUR DE TAILLES 26 / 31 / 40 CM
  function getTailleInfo(code) {
    return DATA.taillesPizza.find((t) => t.code === code) || DATA.taillesPizza[0];
  }

  function renderProductsGrid() {
    const grid = document.getElementById("w3cProductsGrid");
    const countEl = document.getElementById("w3cProductCount");
    if (!grid) return;

    const q = state.recherche.trim().toLowerCase();
    const filtered = DATA.produits.filter((p) => {
      const matchCat = state.categorieActive === "tous" || p.categorieId === state.categorieActive;
      const matchQ =
        !q || p.nom.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    if (countEl) {
      countEl.textContent = `${filtered.length} recette${filtered.length > 1 ? "s" : ""}`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--espresso-soft);">Aucune recette ne correspond à votre recherche.</div>`;
      return;
    }

    grid.innerHTML = filtered
      .map((p) => {
        const selCode = state.selectedSizesByProduct[p.id] || "moyenne";
        const selTaille = getTailleInfo(selCode);
        const currentPrice = p.aTaillesPizza ? p.prixBase + selTaille.supplement : p.prixBase;

        let sizesHtml = "";
        if (p.aTaillesPizza) {
          sizesHtml = `
            <div class="w3c-size-selector" role="group" aria-label="Sélectionner la taille de la pizza">
              ${DATA.taillesPizza
                .map((t) => {
                  const isAct = t.code === selCode;
                  const svgSrc = isAct ? t.svgBlanc : t.svgMarron;
                  const tPrice = p.prixBase + t.supplement;
                  return `
                    <button type="button" class="w3c-size-btn ${isAct ? "active" : ""}" data-size-prod="${
                    p.id
                  }" data-size-code="${t.code}" aria-pressed="${isAct}">
                      <img src="${svgSrc}" alt="${t.nom} ${t.diametre} cm">
                      <span class="s-name">${t.nom} ${t.diametre} cm</span>
                      <span class="s-price">${formatEuro(tPrice)}</span>
                    </button>
                  `;
                })
                .join("")}
            </div>
          `;
        }

        return `
          <article class="w3c-card">
            <div class="w3c-card-media">
              <img src="${p.image}" alt="${p.nom}" loading="lazy">
              <span class="w3c-tag w3c-tag-paper w3c-card-badge-left">${p.badge}</span>
              <span class="w3c-card-badge-right">${p.note.toFixed(1).replace(".", ",")} / 5 • ${p.tempsPreparation}</span>
            </div>
            <div class="w3c-card-body">
              <div class="w3c-card-title-row">
                <h3 class="w3c-card-title">${p.nom}</h3>
                <span class="w3c-card-price">${formatEuro(currentPrice)}</span>
              </div>
              <p class="w3c-card-desc">${p.description}</p>
              ${sizesHtml}
              <div class="w3c-card-actions">
                ${
                  p.aTaillesPizza
                    ? `<button type="button" class="w3c-btn w3c-btn-outline" data-cust-prod="${p.id}" title="Options base & suppléments"><i class="bi bi-sliders me-1"></i>Options</button>`
                    : ""
                }
                <button type="button" class="w3c-btn w3c-btn-terracotta w3c-btn-block" data-add-prod="${p.id}">
                  <i class="bi bi-plus-lg me-1"></i>Ajouter ${p.aTaillesPizza ? `(${selTaille.diametre} cm)` : "au panier"}
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    grid.querySelectorAll("[data-size-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const prodId = btn.getAttribute("data-size-prod");
        const code = btn.getAttribute("data-size-code");
        state.selectedSizesByProduct[prodId] = code;
        renderProductsGrid();
      });
    });

    grid.querySelectorAll("[data-cust-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openCustomizeDialog(btn.getAttribute("data-cust-prod"));
      });
    });

    grid.querySelectorAll("[data-add-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        quickAddProduct(btn.getAttribute("data-add-prod"));
      });
    });
  }

  function quickAddProduct(prodId) {
    const p = DATA.produits.find((x) => x.id === prodId);
    if (!p) return;

    if (p.aTaillesPizza) {
      const code = state.selectedSizesByProduct[p.id] || "moyenne";
      const t = getTailleInfo(code);
      const b = DATA.basesPizza.find((x) => x.code === p.baseDefaut) || DATA.basesPizza[0];
      addItemToCart({
        produitId: p.id,
        nom: p.nom,
        image: p.image,
        aTaillesPizza: true,
        tailleCode: t.code,
        tailleLabel: `${t.nom} ${t.diametre} cm`,
        diametre: t.diametre,
        baseLabel: b.nom,
        supplements: [],
        prixUnitaire: p.prixBase + t.supplement
      });
    } else {
      addItemToCart({
        produitId: p.id,
        nom: p.nom,
        image: p.image,
        aTaillesPizza: false,
        tailleCode: null,
        tailleLabel: "Portion complète",
        diametre: null,
        baseLabel: null,
        supplements: [],
        prixUnitaire: p.prixBase
      });
    }
  }

  // 4. DIALOG DE PERSONNALISATION DE PIZZA
  function openCustomizeDialog(prodId) {
    const p = DATA.produits.find((x) => x.id === prodId);
    if (!p) return;

    state.modalCustomState = {
      produit: p,
      tailleCode: state.selectedSizesByProduct[p.id] || "moyenne",
      baseCode: p.baseDefaut || "tomate",
      supplementsIds: []
    };

    document.getElementById("dialogCustomizeTitle").textContent = p.nom;
    renderCustomizeDialogContent();
    document.getElementById("dialogCustomize").showModal();
  }

  function renderCustomizeDialogContent() {
    const { produit, tailleCode, baseCode, supplementsIds } = state.modalCustomState;
    if (!produit) return;

    const sizeBox = document.getElementById("w3cModalSizeSelector");
    sizeBox.innerHTML = DATA.taillesPizza
      .map((t) => {
        const isAct = t.code === tailleCode;
        const svgSrc = isAct ? t.svgBlanc : t.svgMarron;
        return `
          <button type="button" class="w3c-size-btn ${isAct ? "active" : ""}" data-modal-size="${t.code}">
            <img src="${svgSrc}" alt="${t.nom} ${t.diametre} cm">
            <span class="s-name">${t.nom} ${t.diametre} cm</span>
            <span class="s-price">${formatEuro(produit.prixBase + t.supplement)}</span>
          </button>
        `;
      })
      .join("");

    sizeBox.querySelectorAll("[data-modal-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.modalCustomState.tailleCode = btn.getAttribute("data-modal-size");
        renderCustomizeDialogContent();
      });
    });

    const baseSelect = document.getElementById("w3cModalBaseSelect");
    baseSelect.innerHTML = DATA.basesPizza
      .map(
        (b) =>
          `<option value="${b.code}" ${b.code === baseCode ? "selected" : ""}>${b.nom}</option>`
      )
      .join("");

    const supBox = document.getElementById("w3cModalSupplements");
    supBox.innerHTML = DATA.supplementsPizza
      .map((s) => {
        const checked = supplementsIds.includes(s.id);
        return `
          <label style="display: flex; justify-content: space-between; padding: 0.45rem 0.65rem; background: var(--surface-paper); border-radius: 6px; border: 1px solid var(--border-subtle); font-size: 0.8rem;">
            <span>
              <input type="checkbox" value="${s.id}" ${checked ? "checked" : ""} data-modal-sup="${s.id}">
              ${s.nom}
            </span>
            <strong style="color: var(--terracotta);">+${formatEuro(s.prix)}</strong>
          </label>
        `;
      })
      .join("");

    supBox.querySelectorAll("[data-modal-sup]").forEach((chk) => {
      chk.addEventListener("change", () => {
        const id = chk.getAttribute("data-modal-sup");
        const idx = state.modalCustomState.supplementsIds.indexOf(id);
        if (idx === -1) state.modalCustomState.supplementsIds.push(id);
        else state.modalCustomState.supplementsIds.splice(idx, 1);
        updateModalCustomPrice();
      });
    });

    updateModalCustomPrice();
  }

  function computeModalCustomPrice() {
    const { produit, tailleCode, baseCode, supplementsIds } = state.modalCustomState;
    if (!produit) return 0;
    const t = getTailleInfo(tailleCode);
    const b = DATA.basesPizza.find((x) => x.code === baseCode) || DATA.basesPizza[0];
    const supSum = supplementsIds.reduce((acc, id) => {
      const s = DATA.supplementsPizza.find((x) => x.id === id);
      return acc + (s ? s.prix : 0);
    }, 0);
    return produit.prixBase + t.supplement + b.supplement + supSum;
  }

  function updateModalCustomPrice() {
    document.getElementById("w3cModalTotalPrice").textContent = formatEuro(computeModalCustomPrice());
  }

  // 5. PANIER & TOTAUX
  function addItemToCart(newItem) {
    const existing = state.panier.find(
      (i) =>
        i.produitId === newItem.produitId &&
        i.tailleCode === newItem.tailleCode &&
        i.baseLabel === newItem.baseLabel &&
        JSON.stringify(i.supplements) === JSON.stringify(newItem.supplements)
    );
    if (existing) existing.quantite += 1;
    else {
      state.panier.push({
        uid: "w3c-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        ...newItem,
        quantite: 1
      });
    }
    saveCart();
    renderCart();
    showToast(`${newItem.nom} (${newItem.tailleLabel}) ajouté au panier`);
  }

  function calculateTotals() {
    const sousTotal = state.panier.reduce((acc, i) => acc + i.prixUnitaire * i.quantite, 0);
    const nbArticles = state.panier.reduce((acc, i) => acc + i.quantite, 0);

    let remise = 0;
    if (state.codePromoActif && DATA.codesPromos[state.codePromoActif]) {
      remise = sousTotal * (DATA.codesPromos[state.codePromoActif].reductionPct / 100);
    }
    const apresRemise = Math.max(0, sousTotal - remise);

    let fraisLivraison = 0;
    let labelLivraison = "Livraison Interne O'Pti Noisy";

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
      }
    }

    const totalTtc = apresRemise + fraisLivraison;
    return { sousTotal, nbArticles, remise, fraisLivraison, labelLivraison, totalTtc };
  }

  function renderCart() {
    const list = document.getElementById("w3cCartItemsList");
    const totals = calculateTotals();

    document.getElementById("w3cBottomCartCount").textContent = totals.nbArticles;
    document.getElementById("w3cBottomCartTotal").textContent = formatEuro(totals.totalTtc);
    document.getElementById("w3cCheckoutBtnAmount").textContent = formatEuro(totals.totalTtc);
    document.getElementById("w3cPaySubmitAmount").textContent = formatEuro(totals.totalTtc);
    document.getElementById("w3cGatewayCartSummary").textContent = `${totals.nbArticles} article${
      totals.nbArticles > 1 ? "s" : ""
    } (${formatEuro(totals.sousTotal)})`;

    if (!list) return;

    if (state.panier.length === 0) {
      list.innerHTML = `<div style="text-align: center; padding: 1.5rem; color: var(--espresso-soft);"><i class="bi bi-bag-x" style="font-size: 1.5rem; display: block; margin-bottom: 0.25rem;"></i>Votre panier est vide.</div>`;
    } else {
      list.innerHTML = state.panier
        .map(
          (item) => `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; padding: 0.6rem; background: var(--surface-paper); border: 1px solid var(--border-subtle); border-radius: 8px; margin-bottom: 0.5rem;">
            <img src="${item.image}" alt="${item.nom}" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover;">
            <div style="flex: 1;">
              <div style="font-family: var(--font-heading); font-size: 0.86rem; font-weight: 700;">${item.nom}</div>
              <div style="font-size: 0.72rem; color: var(--terracotta); font-weight: 600;">${item.tailleLabel}</div>
              <div style="font-size: 0.8rem; font-weight: 700; margin-top: 2px;">${formatEuro(
                item.prixUnitaire * item.quantite
              )}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <button type="button" class="w3c-btn w3c-btn-sm w3c-btn-outline" data-qty-uid="${item.uid}" data-qty-delta="-1">-</button>
              <strong style="font-size: 0.85rem;">${item.quantite}</strong>
              <button type="button" class="w3c-btn w3c-btn-sm w3c-btn-espresso" data-qty-uid="${item.uid}" data-qty-delta="1">+</button>
            </div>
          </div>
        `
        )
        .join("");

      list.querySelectorAll("[data-qty-uid]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const uid = btn.getAttribute("data-qty-uid");
          const delta = Number(btn.getAttribute("data-qty-delta"));
          const target = state.panier.find((x) => x.uid === uid);
          if (!target) return;
          target.quantite += delta;
          if (target.quantite <= 0) {
            state.panier = state.panier.filter((x) => x.uid !== uid);
          }
          saveCart();
          renderCart();
        });
      });
    }

    document.getElementById("w3cSummarySubtotal").textContent = formatEuro(totals.sousTotal);
    const discRow = document.getElementById("w3cSummaryDiscountRow");
    if (totals.remise > 0) {
      discRow.classList.remove("hidden");
      document.getElementById("w3cSummaryDiscount").textContent = "-" + formatEuro(totals.remise);
    } else {
      discRow.classList.add("hidden");
    }
    document.getElementById("w3cSummaryDeliveryLabel").textContent = totals.labelLivraison;
    document.getElementById("w3cSummaryDeliveryFee").textContent =
      totals.fraisLivraison === 0 ? "Offerte" : formatEuro(totals.fraisLivraison);
    document.getElementById("w3cSummaryTotal").textContent = formatEuro(totals.totalTtc);
  }

  // 6. GÉOLOCALISATION INTERNE & PASSERELLES UBER EATS / DELIVEROO
  function renderGeoPresets() {
    const box = document.getElementById("w3cGeoPresetsList");
    if (!box) return;
    box.innerHTML = DATA.positionsGeolocPreset
      .map(
        (p) => `
        <button type="button" class="w3c-btn w3c-btn-outline" style="justify-content: space-between; font-size: 0.76rem; padding: 0.4rem 0.65rem;" data-geo-preset="${p.id}">
          <span>${p.label}</span>
          <span class="w3c-tag w3c-tag-paper" style="font-size: 0.6rem;">Tester</span>
        </button>
      `
      )
      .join("");

    box.querySelectorAll("[data-geo-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = DATA.positionsGeolocPreset.find(
          (x) => x.id === btn.getAttribute("data-geo-preset")
        );
        if (preset) setClientCoordinates(preset.lat, preset.lng, preset.adresse);
      });
    });
  }

  function initLeafletMap() {
    const mapEl = document.getElementById("w3cGeoMap");
    if (!mapEl || typeof L === "undefined") return;

    const restoCoords = [DATA.restaurant.coords.lat, DATA.restaurant.coords.lng];
    leafletMap = L.map("w3cGeoMap").setView(restoCoords, 13);

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

  function setClientCoordinates(lat, lng, adresse) {
    const dist = computeHaversineKm(DATA.restaurant.coords.lat, DATA.restaurant.coords.lng, lat, lng);
    const eligible = dist <= DATA.restaurant.livraisonInterne.rayonMaxKm;

    state.positionClient = { lat, lng, adresse, distanceKm: dist, eligibleInterne: eligible };

    if (!eligible && state.modeReception === "livraison_interne") {
      state.modeReception = "ubereats";
      showToast("Hors rayon 5 km : bascule automatique sur Uber Eats");
    } else if (eligible && (state.modeReception === "ubereats" || state.modeReception === "deliveroo")) {
      state.modeReception = "livraison_interne";
    }

    updateMapMarkers();
    updateDeliveryUI();
    renderCart();
  }

  function updateDeliveryUI() {
    const { distanceKm, adresse, eligibleInterne } = state.positionClient;
    const estMin = Math.max(15, Math.round(14 + distanceKm * 3.5));

    document.getElementById("w3cDistanceBadge").textContent = eligibleInterne
      ? `${distanceKm.toFixed(1).replace(".", ",")} km • Zone Interne`
      : `${distanceKm.toFixed(1).replace(".", ",")} km • Hors Zone`;
    document.getElementById("w3cEtaBadge").innerHTML = `<i class="bi bi-clock me-1"></i>${estMin} min`;

    const alertBox = document.getElementById("w3cGeoAlertBox");
    const alertTitle = document.getElementById("w3cGeoAlertTitle");
    const alertDesc = document.getElementById("w3cGeoAlertDesc");

    if (eligibleInterne) {
      alertBox.className = "w3c-alert w3c-alert-success";
      alertTitle.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i>Éligible Livraison Interne O'Pti Noisy (${distanceKm} km)`;
      alertDesc.textContent = `${adresse} • Livraison par notre livreur interne en ~${estMin} min (Offerte dès 18 €).`;
    } else {
      alertBox.className = "w3c-alert w3c-alert-warning";
      alertTitle.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i>Hors Rayon Interne 5 km (${distanceKm} km de Noisy)`;
      alertDesc.textContent = `${adresse} • Commandez via nos passerelles partenaires Uber Eats ou Deliveroo.`;
    }

    document.querySelectorAll("#w3cChannelGrid .w3c-channel-pill").forEach((btn) => {
      const m = btn.getAttribute("data-mode");
      btn.classList.remove("active-interne", "active-ubereats", "active-deliveroo");
      if (m === state.modeReception) {
        if (m === "ubereats") btn.classList.add("active-ubereats");
        else if (m === "deliveroo") btn.classList.add("active-deliveroo");
        else btn.classList.add("active-interne");
      }
    });

    const modeLabels = {
      livraison_interne: "Mode : Livraison Interne Géolocalisée",
      click_collect: "Mode : Retrait au comptoir (15 min)",
      ubereats: "Mode : Passerelle Uber Eats",
      deliveroo: "Mode : Passerelle Deliveroo"
    };
    document.getElementById("w3cCartModeSubtitle").textContent = modeLabels[state.modeReception] || "";
  }

  function openGatewayDialog(partnerKey) {
    const p = DATA.restaurant.passerelles[partnerKey];
    if (!p) return;
    state.modeReception = partnerKey;
    updateDeliveryUI();
    renderCart();

    const badge = document.getElementById("w3cGatewayBadge");
    badge.textContent = p.nom.toUpperCase();
    badge.style.backgroundColor = p.couleur;
    badge.style.color = "#051B10";

    document.getElementById("w3cGatewayHeading").textContent = `Passerelle O'Pti Noisy × ${p.nom}`;
    document.getElementById("w3cGatewayDesc").textContent = `Transférez votre commande vers notre boutique officielle ${p.nom} (${p.note}).`;
    document.getElementById("w3cGatewayEta").textContent = p.delai;
    document.getElementById("w3cGatewayFee").textContent = formatEuro(p.frais);

    const link = document.getElementById("w3cGatewayLink");
    link.href = p.url;
    link.style.backgroundColor = p.couleur;
    link.style.color = "#051B10";
    link.innerHTML = `Continuer sur ${p.nom} <i class="bi bi-box-arrow-up-right ms-1"></i>`;

    const cartDialog = document.getElementById("dialogCart");
    if (cartDialog.open) cartDialog.close();

    document.getElementById("dialogGateway").showModal();
  }

  // 7. COMPTE CLIENT
  function renderAccountView() {
    const outBox = document.getElementById("w3cAccountLoggedOut");
    const inBox = document.getElementById("w3cAccountLoggedIn");
    const hLabel = document.getElementById("w3cHeaderUserLabel");
    const bLabel = document.getElementById("w3cBottomUserLabel");

    if (!state.clientConnecte) {
      outBox.classList.remove("hidden");
      inBox.classList.add("hidden");
      hLabel.textContent = "Connexion";
      bLabel.textContent = "Compte";
      return;
    }

    outBox.classList.add("hidden");
    inBox.classList.remove("hidden");
    hLabel.textContent = state.clientConnecte.prenom;
    bLabel.textContent = state.clientConnecte.prenom;

    document.getElementById("w3cUserFullName").textContent = `${state.clientConnecte.prenom} ${state.clientConnecte.nom}`;
    document.getElementById("w3cUserEmail").textContent = state.clientConnecte.email;
    document.getElementById("w3cUserPhone").textContent = state.clientConnecte.telephone;
    document.getElementById("w3cUserAddress").textContent = `${state.clientConnecte.adresse}, ${state.clientConnecte.codePostal} ${state.clientConnecte.ville}`;

    const pts = Math.min(100, state.clientConnecte.pointsFidelite || 50);
    document.getElementById("w3cUserPointsLabel").textContent = `${pts} / 100 pts`;
    document.getElementById("w3cUserPointsBar").style.width = `${pts}%`;

    const histBox = document.getElementById("w3cOrderHistory");
    const list = state.clientConnecte.commandesPrecedentes || [];
    histBox.innerHTML = list
      .map(
        (c) => `
        <div style="padding: 0.65rem; background: var(--surface-paper); border: 1px solid var(--border-subtle); border-radius: 8px; font-size: 0.78rem;">
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span style="color: var(--terracotta);">${c.numero}</span>
            <span>${formatEuro(c.total)}</span>
          </div>
          <div style="color: var(--espresso-soft); font-size: 0.72rem;">${c.date} • ${c.mode}</div>
          <div style="margin-top: 0.25rem;">${c.articles}</div>
          <span class="w3c-tag w3c-tag-olive" style="margin-top: 0.35rem;">${c.statut}</span>
        </div>
      `
      )
      .join("");
  }

  // 8. ÉVÉNEMENTS GLOBAUX
  function bindEvents() {
    document.getElementById("w3cSearchInput").addEventListener("input", (e) => {
      state.recherche = e.target.value;
      renderProductsGrid();
    });

    document.querySelectorAll("#w3cChannelGrid .w3c-channel-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-mode");
        if (mode === "livraison_interne" && !state.positionClient.eligibleInterne) {
          showToast("Adresse hors rayon 5 km : ouverture de la passerelle Uber Eats");
          openGatewayDialog("ubereats");
          return;
        }
        state.modeReception = mode;
        updateDeliveryUI();
        renderCart();
        if (mode === "ubereats" || mode === "deliveroo") {
          openGatewayDialog(mode);
        } else {
          showToast(
            mode === "click_collect"
              ? "Mode Retrait au comptoir sélectionné"
              : "Livraison Interne O'Pti Noisy activée"
          );
        }
      });
    });

    document.getElementById("btnCloseCustomize").addEventListener("click", () => {
      document.getElementById("dialogCustomize").close();
    });
    document.getElementById("btnCloseCart").addEventListener("click", () => {
      document.getElementById("dialogCart").close();
    });
    document.getElementById("btnCloseAccount").addEventListener("click", () => {
      document.getElementById("dialogAccount").close();
    });
    document.getElementById("btnCloseCheckout").addEventListener("click", () => {
      document.getElementById("dialogCheckout").close();
    });
    document.getElementById("btnCloseGateway").addEventListener("click", () => {
      document.getElementById("dialogGateway").close();
    });

    document.getElementById("w3cModalBaseSelect").addEventListener("change", (e) => {
      state.modalCustomState.baseCode = e.target.value;
      updateModalCustomPrice();
    });

    document.getElementById("w3cBtnConfirmCustomize").addEventListener("click", () => {
      const { produit, tailleCode, baseCode, supplementsIds } = state.modalCustomState;
      if (!produit) return;
      const t = getTailleInfo(tailleCode);
      const b = DATA.basesPizza.find((x) => x.code === baseCode) || DATA.basesPizza[0];
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
        tailleCode: t.code,
        tailleLabel: `${t.nom} ${t.diametre} cm`,
        diametre: t.diametre,
        baseLabel: b.nom,
        supplements: supNames,
        prixUnitaire: computeModalCustomPrice()
      });
      document.getElementById("dialogCustomize").close();
    });

    document.getElementById("w3cNavMenu").addEventListener("click", () => {
      document.getElementById("w3cSectionMenu").scrollIntoView({ behavior: "smooth" });
    });
    document.getElementById("w3cNavGeo").addEventListener("click", () => {
      document.getElementById("w3cSectionGeoloc").scrollIntoView({ behavior: "smooth" });
      if (leafletMap) setTimeout(() => leafletMap.invalidateSize(), 300);
    });
    document.getElementById("w3cNavCart").addEventListener("click", () => {
      document.getElementById("dialogCart").showModal();
    });
    document.getElementById("w3cNavAccount").addEventListener("click", () => {
      document.getElementById("dialogAccount").showModal();
    });
    document.getElementById("btnOpenAccount").addEventListener("click", () => {
      document.getElementById("dialogAccount").showModal();
    });

    const btnGeo = document.getElementById("w3cBtnRealGeoloc");
    btnGeo.addEventListener("click", () => {
      if (!navigator.geolocation) {
        showToast("Géolocalisation non disponible.");
        return;
      }
      btnGeo.innerHTML = `<i class="bi bi-arrow-repeat me-1"></i> Recherche du signal GPS...`;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          btnGeo.innerHTML = `<i class="bi bi-crosshair me-1"></i> Me géolocaliser via le GPS de l'appareil`;
          setClientCoordinates(
            pos.coords.latitude,
            pos.coords.longitude,
            `Position GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
          );
          showToast("Position GPS détectée");
        },
        () => {
          btnGeo.innerHTML = `<i class="bi bi-crosshair me-1"></i> Me géolocaliser via le GPS de l'appareil`;
          const def = DATA.positionsGeolocPreset[0];
          setClientCoordinates(def.lat, def.lng, def.adresse);
          showToast("Simulation GPS Noisy-le-Grand activée");
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    });

    document.getElementById("btnGatewayUber").addEventListener("click", () => openGatewayDialog("ubereats"));
    document.getElementById("btnGatewayDeliveroo").addEventListener("click", () => openGatewayDialog("deliveroo"));
    document.getElementById("w3cCartUberBtn").addEventListener("click", () => openGatewayDialog("ubereats"));
    document.getElementById("w3cCartDeliverooBtn").addEventListener("click", () => openGatewayDialog("deliveroo"));
    document.getElementById("w3cBtnPreferInternal").addEventListener("click", () => {
      document.getElementById("dialogGateway").close();
      state.modeReception = "livraison_interne";
      updateDeliveryUI();
      renderCart();
    });

    document.getElementById("w3cBtnApplyPromo").addEventListener("click", () => {
      const code = (document.getElementById("w3cPromoInput").value || "").trim().toUpperCase();
      const fb = document.getElementById("w3cPromoFeedback");
      if (DATA.codesPromos[code]) {
        state.codePromoActif = code;
        fb.style.color = "var(--olive)";
        fb.textContent = `Code appliqué : ${DATA.codesPromos[code].label}`;
        renderCart();
      } else {
        state.codePromoActif = null;
        fb.style.color = "var(--terracotta)";
        fb.textContent = "Code non reconnu (essayez MMI2026 ou NOISY)";
        renderCart();
      }
    });

    document.getElementById("w3cBtnOpenCheckout").addEventListener("click", () => {
      if (state.panier.length === 0) {
        showToast("Votre panier est vide");
        return;
      }
      document.getElementById("dialogCart").close();
      document.getElementById("w3cPaymentFormWrap").classList.remove("hidden");
      document.getElementById("w3cPaymentSuccessWrap").classList.add("hidden");
      document.getElementById("dialogCheckout").showModal();
    });

    document.getElementById("w3cInputCardName").addEventListener("input", (e) => {
      document.getElementById("w3cCardPreviewName").textContent = (
        e.target.value || "CLIENT"
      ).toUpperCase();
    });
    document.getElementById("w3cInputCardNum").addEventListener("input", (e) => {
      const digits = e.target.value.replace(/\D/g, "").substring(0, 16);
      const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
      e.target.value = formatted;
      document.getElementById("w3cCardPreviewNum").textContent = formatted || "4970 •••• •••• 2026";
    });
    document.getElementById("w3cInputCardExp").addEventListener("input", (e) => {
      let digits = e.target.value.replace(/\D/g, "").substring(0, 4);
      if (digits.length >= 3) digits = digits.substring(0, 2) + "/" + digits.substring(2);
      e.target.value = digits;
      document.getElementById("w3cCardPreviewExp").textContent = digits || "10/28";
    });

    document.getElementById("w3cPaymentForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const totals = calculateTotals();
      const orderNum = "OPN-2026-" + Math.floor(100 + Math.random() * 899);
      document.getElementById("w3cConfirmedOrderNum").textContent = orderNum;

      if (state.clientConnecte) {
        const resume = state.panier.map((i) => `${i.quantite}x ${i.nom} (${i.tailleLabel})`).join(", ");
        state.clientConnecte.commandesPrecedentes = state.clientConnecte.commandesPrecedentes || [];
        state.clientConnecte.commandesPrecedentes.unshift({
          numero: orderNum,
          date: "Aujourd'hui • En direct",
          articles: resume,
          mode: state.modeReception === "click_collect" ? "Retrait sur place" : "Livraison Géolocalisée",
          total: totals.totalTtc,
          statut: "En cuisson"
        });
        state.clientConnecte.pointsFidelite = Math.min(100, (state.clientConnecte.pointsFidelite || 50) + 15);
        saveUser();
        renderAccountView();
      }

      state.panier = [];
      saveCart();
      renderCart();

      document.getElementById("w3cPaymentFormWrap").classList.add("hidden");
      document.getElementById("w3cPaymentSuccessWrap").classList.remove("hidden");
      showToast("Paiement validé : votre commande est au four");
    });

    document.getElementById("w3cBtnDoneOrder").addEventListener("click", () => {
      document.getElementById("dialogCheckout").close();
    });

    const tabReg = document.getElementById("w3cTabBtnRegister");
    const tabLog = document.getElementById("w3cTabBtnLogin");
    const formReg = document.getElementById("w3cRegisterForm");
    const formLog = document.getElementById("w3cLoginForm");

    tabReg.addEventListener("click", () => {
      tabReg.className = "w3c-btn w3c-btn-espresso";
      tabLog.className = "w3c-btn w3c-btn-outline";
      formReg.classList.remove("hidden");
      formLog.classList.add("hidden");
    });

    tabLog.addEventListener("click", () => {
      tabLog.className = "w3c-btn w3c-btn-espresso";
      tabReg.className = "w3c-btn w3c-btn-outline";
      formLog.classList.remove("hidden");
      formReg.classList.add("hidden");
    });

    formReg.addEventListener("submit", (e) => {
      e.preventDefault();
      state.clientConnecte = {
        id: "USR-" + Date.now(),
        prenom: document.getElementById("w3cRegPrenom").value.trim(),
        nom: document.getElementById("w3cRegNom").value.trim(),
        email: document.getElementById("w3cRegEmail").value.trim(),
        telephone: document.getElementById("w3cRegTel").value.trim(),
        adresse: document.getElementById("w3cRegAdresse").value.trim(),
        codePostal: document.getElementById("w3cRegCp").value.trim(),
        ville: document.getElementById("w3cRegVille").value.trim(),
        pointsFidelite: 50,
        commandesPrecedentes: []
      };
      saveUser();
      renderAccountView();
      showToast(`Compte créé pour ${state.clientConnecte.prenom}`);
    });

    formLog.addEventListener("submit", (e) => {
      e.preventDefault();
      state.clientConnecte = JSON.parse(JSON.stringify(DATA.clientDemo));
      saveUser();
      renderAccountView();
      showToast(`Bon retour ${state.clientConnecte.prenom}`);
    });

    document.getElementById("w3cBtnDemoLogin").addEventListener("click", () => {
      state.clientConnecte = JSON.parse(JSON.stringify(DATA.clientDemo));
      saveUser();
      renderAccountView();
      showToast("Profil démo chargé");
    });

    document.getElementById("w3cBtnLogout").addEventListener("click", () => {
      state.clientConnecte = null;
      saveUser();
      renderAccountView();
      showToast("Session déconnectée");
    });
  }
})();

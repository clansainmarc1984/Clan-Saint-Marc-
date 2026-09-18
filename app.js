const emptyData = {
  news: [],
  birthdays: [],
  gallery: [],
  videos: [],
  promotions: []
};

let data = structuredClone(emptyData);
let supabaseClient = null;

const TABLES = Object.keys(emptyData);
const ADMIN_CODE = "SaintMarc1984";

/* ================================
   CONFIGURATION SUPABASE
================================ */

function configured() {
  return (
    window.SUPABASE_URL &&
    window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes("TON-PROJET") &&
    !window.SUPABASE_ANON_KEY.includes("TON_ANON_KEY") &&
    !window.SUPABASE_ANON_KEY.includes("TON_PUBLISHABLE_KEY")
  );
}

function initDb() {
  if (!configured()) {
    console.error("Supabase n'est pas correctement configuré.");
    return;
  }

  if (!window.supabase) {
    console.error("La bibliothèque Supabase n'est pas chargée.");
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );

    console.log("Supabase connecté avec succès.");
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation de Supabase :",
      error
    );

    supabaseClient = null;
  }
}

/* ================================
   CHARGEMENT DES DONNÉES
================================ */

async function loadData() {
  if (!supabaseClient) {
    renderAll();
    return;
  }

  try {
    const results = await Promise.all(
      TABLES.map(async (table) => {
        const {
          data: rows,
          error
        } = await supabaseClient
          .from(table)
          .select("*")
          .order("created_at", {
            ascending: false
          });

        if (error) {
          throw error;
        }

        return [table, rows || []];
      })
    );

    data = Object.fromEntries(results);

    renderAll();

    if (isAdmin()) {
      renderAdmin();
    }

    console.log("Données Supabase chargées.");
  } catch (error) {
    console.error(
      "Erreur lors du chargement des données :",
      error
    );

    renderAll();

    const loginMsg =
      document.getElementById("login-msg");

    if (loginMsg) {
      loginMsg.textContent =
        "Base de données non disponible : " +
        error.message;
    }
  }
}

/* ================================
   ADMINISTRATION
================================ */

function isAdmin() {
  return (
    sessionStorage.getItem(
      "clanSaintMarcAdmin"
    ) === "true"
  );
}

function requireAuth() {
  if (!supabaseClient) {
    alert(
      "Supabase n'est pas disponible. Vérifie config.js."
    );

    return false;
  }

  if (!isAdmin()) {
    alert(
      "Connecte-toi d'abord à l'administration."
    );

    return false;
  }

  return true;
}

/* ================================
   CONNEXION ADMIN
================================ */

function loginAdmin() {
  const passwordInput =
    document.getElementById("admin-pass");

  const message =
    document.getElementById("login-msg");

  if (!passwordInput) {
    return;
  }

  const password =
    passwordInput.value.trim();

  if (!password) {
    if (message) {
      message.textContent =
        "Entre le code administrateur.";
    }

    return;
  }

  if (password !== ADMIN_CODE) {
    if (message) {
      message.textContent =
        "Code administrateur incorrect.";
    }

    passwordInput.value = "";

    return;
  }

  sessionStorage.setItem(
    "clanSaintMarcAdmin",
    "true"
  );

  const loginBox =
    document.getElementById("login-box");

  const dashboard =
    document.getElementById("dashboard");

  if (loginBox) {
    loginBox.hidden = true;
  }

  if (dashboard) {
    dashboard.hidden = false;
  }

  if (message) {
    message.textContent = "";
  }

  renderAdmin();

  console.log(
    "Administrateur connecté."
  );
}

/* ================================
   DÉCONNEXION
================================ */

function logoutAdmin() {
  sessionStorage.removeItem(
    "clanSaintMarcAdmin"
  );

  const loginBox =
    document.getElementById("login-box");

  const dashboard =
    document.getElementById("dashboard");

  if (loginBox) {
    loginBox.hidden = false;
  }

  if (dashboard) {
    dashboard.hidden = true;
  }

  const password =
    document.getElementById("admin-pass");

  if (password) {
    password.value = "";
  }
}

/* ================================
   MENU
================================ */

function toggleMenu() {
  const menu =
    document.getElementById("menu");

  if (menu) {
    menu.classList.toggle("open");
  }
}

function closeMenu() {
  const menu =
    document.getElementById("menu");

  if (menu) {
    menu.classList.remove("open");
  }
}

/* ================================
   ONGLETS
================================ */

function showTab(name) {
  document
    .querySelectorAll(".tab-panel")
    .forEach((panel) => {
      panel.hidden = true;
    });

  const selected =
    document.getElementById(
      "tab-" + name
    );

  if (selected) {
    selected.hidden = false;
  }
}

/* ================================
   UTILITAIRE INPUT
================================ */

function val(id) {
  const element =
    document.getElementById(id);

  if (!element) {
    return "";
  }

  return element.value.trim();
}

/* ================================
   AJOUT DANS SUPABASE
================================ */

async function addRow(table, row) {
  if (!requireAuth()) {
    return;
  }

  try {
    const {
      error
    } = await supabaseClient
      .from(table)
      .insert(row);

    if (error) {
      throw error;
    }

    alert(
      "Élément ajouté avec succès."
    );

    await loadData();
    renderAdmin();

  } catch (error) {
    console.error(error);

    alert(
      "Erreur lors de l'enregistrement : " +
      error.message
    );
  }
}

/* ================================
   ACTUALITÉS
================================ */

async function addNews() {
  if (
    !val("news-title") ||
    !val("news-text")
  ) {
    alert(
      "Ajoute un titre et un texte."
    );

    return;
  }

  await addRow("news", {
    title: val("news-title"),
    date:
      val("news-date") || null,
    text: val("news-text"),
    image:
      val("news-image") || null
  });

  [
    "news-title",
    "news-date",
    "news-text",
    "news-image"
  ].forEach((id) => {
    const element =
      document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });
}

/* ================================
   ANNIVERSAIRES
================================ */

async function addBirthday() {
  if (
    !val("bd-name") ||
    !val("bd-date")
  ) {
    alert(
      "Ajoute le nom et la date."
    );

    return;
  }

  await addRow("birthdays", {
    name: val("bd-name"),
    date: val("bd-date"),
    promo:
      val("bd-promo") || null
  });

  [
    "bd-name",
    "bd-date",
    "bd-promo"
  ].forEach((id) => {
    const element =
      document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });
}

/* ================================
   GALERIE
================================ */

async function addGallery() {
  if (!val("gal-image")) {
    alert(
      "Ajoute l'URL de l'image."
    );

    return;
  }

  await addRow("gallery", {
    title:
      val("gal-title") || null,
    image: val("gal-image"),
    date:
      val("gal-date") || null
  });

  [
    "gal-title",
    "gal-image",
    "gal-date"
  ].forEach((id) => {
    const element =
      document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });
}

/* ================================
   VIDÉOS
================================ */

async function addVideo() {
  if (
    !val("vid-title") ||
    !val("vid-url")
  ) {
    alert(
      "Ajoute le titre et le lien."
    );

    return;
  }

  await addRow("videos", {
    title: val("vid-title"),
    url: val("vid-url")
  });

  [
    "vid-title",
    "vid-url"
  ].forEach((id) => {
    const element =
      document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });
}

/* ================================
   PROMOTIONS
================================ */

async function addPromotion() {
  if (
    !val("promo-number") ||
    !val("promo-year")
  ) {
    alert(
      "Ajoute le numéro et l'année."
    );

    return;
  }

  await addRow("promotions", {
    number: val("promo-number"),
    year: val("promo-year"),
    text:
      val("promo-text") || null
  });

  [
    "promo-number",
    "promo-year",
    "promo-text"
  ].forEach((id) => {
    const element =
      document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });
}

/* ================================
   SUPPRESSION
================================ */

async function del(type, id) {
  if (!isAdmin()) {
    alert(
      "Connecte-toi d'abord à l'administration."
    );

    return;
  }

  if (
    !confirm(
      "Supprimer cet élément ?"
    )
  ) {
    return;
  }

  if (!supabaseClient) {
    alert(
      "Supabase n'est pas disponible."
    );

    return;
  }

  try {
    const {
      error
    } = await supabaseClient
      .from(type)
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    await loadData();
    renderAdmin();

  } catch (error) {
    console.error(error);

    alert(
      "Erreur lors de la suppression : " +
      error.message
    );
  }
}

/* ================================
   AFFICHAGE DES DONNÉES
================================ */

function renderAll() {

  /* -------- ACTUALITÉS -------- */

  const news =
    document.getElementById(
      "news-list"
    );

  if (news) {
    news.innerHTML =
      data.news.length
        ? data.news
            .map(
              (x) => `
                <article class="card">

                  <p class="eyebrow">
                    ${esc(x.date || "")}
                  </p>

                  <h3>
                    ${esc(x.title)}
                  </h3>

                  <p>
                    ${esc(x.text)}
                  </p>

                  ${
                    x.image
                      ? `
                        <img
                          style="width:100%;border-radius:12px;margin-top:12px;max-height:260px;object-fit:cover"
                          src="${escAttr(x.image)}"
                          alt=""
                        >
                      `
                      : ""
                  }

                </article>
              `
            )
            .join("")
        : `
          <div class="empty">

            <span>📰</span>

            <h3>
              Aucune actualité publiée
            </h3>

            <p>
              Ajoute ta première actualité
              depuis l'espace
              d'administration.
            </p>

          </div>
        `;
  }

  /* -------- ANNIVERSAIRES -------- */

  const birthdayList =
    document.getElementById(
      "birthday-list"
    );

  if (birthdayList) {
    birthdayList.innerHTML =
      data.birthdays.length
        ? data.birthdays
            .slice()
            .sort((a, b) =>
              a.date.localeCompare(
                b.date
              )
            )
            .map((x) => {

              const d =
                new Date(
                  x.date +
                  "T12:00:00"
                );

              return `
                <article class="birthday">

                  <div class="date">

                    ${d.toLocaleDateString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "short"
                      }
                    )}

                  </div>

                  <div>

                    <strong>
                      ${esc(x.name)}
                    </strong>

                    <small>
                      ${esc(
                        x.promo ||
                        "Membre du Clan"
                      )}
                    </small>

                  </div>

                </article>
              `;
            })
            .join("")
        : `
          <div class="empty">

            <span>🎉</span>

            <h3>
              Les anniversaires du Clan
            </h3>

            <p>
              Ajoute les membres et
              leurs dates depuis
              l'administration.
            </p>

          </div>
        `;
  }

  /* -------- GALERIE -------- */

  const gallery =
    document.getElementById(
      "gallery-list"
    );

  if (gallery) {
    gallery.innerHTML =
      data.gallery.length
        ? data.gallery
            .map(
              (x) => `
                <figure
                  class="gallery-item"
                >

                  <img
                    src="${escAttr(
                      x.image
                    )}"
                    alt="${escAttr(
                      x.title ||
                      "Photo du Clan"
                    )}"
                  >

                  <figcaption>
                    ${esc(
                      x.title ||
                      "Moment du Clan"
                    )}
                  </figcaption>

                </figure>
              `
            )
            .join("")
        : `
          <div
            class="empty"
            style="grid-column:1/-1"
          >

            <span>📷</span>

            <h3>
              La galerie est prête
            </h3>

            <p>
              Ajoute tes photos depuis
              l'administration.
            </p>

          </div>
        `;
  }

  /* -------- VIDÉOS -------- */

  const videos =
    document.getElementById(
      "video-list"
    );

  if (videos) {
    videos.innerHTML =
      data.videos.length
        ? data.videos
            .map(
              (x) => `
                <article
                  class="video-card"
                >

                  <h3>
                    ${esc(x.title)}
                  </h3>

                  <a
                    href="${escAttr(
                      x.url
                    )}"
                    target="_blank"
                    rel="noopener"
                  >
                    Voir la vidéo ↗
                  </a>

                </article>
              `
            )
            .join("")
        : `
          <div class="empty">

            <span>🎥</span>

            <h3>
              Aucune vidéo ajoutée
            </h3>

            <p>
              Ajoute un lien vidéo depuis
              l'administration.
            </p>

          </div>
        `;
  }
}

/* ================================
   AFFICHAGE DU TABLEAU DE BORD
================================ */

function renderAdmin() {

  const maps = {
    news: "title",
    birthdays: "name",
    gallery: "title",
    videos: "title",
    promotions: "number"
  };

  Object.keys(maps).forEach(
    (type) => {

      const element =
        document.getElementById(
          "admin-" + type
        );

      if (!element) {
        return;
      }

      element.innerHTML =
        data[type].length
          ? data[type]
              .map(
                (x) => `
                  <div
                    class="admin-item"
                  >

                    <span>
                      ${esc(
                        x[maps[type]] ||
                        "Sans titre"
                      )}
                    </span>

                    <button
                      onclick="del(
                        '${type}',
                        '${x.id}'
                      )"
                    >
                      Supprimer
                    </button>

                  </div>
                `
              )
              .join("")
          : `
              <p class="hint">
                Aucun élément.
              </p>
            `;
    }
  );
}

/* ================================
   EXPORTATION
================================ */

function exportData() {

  const blob =
    new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const a =
    document.createElement(
      "a"
    );

  a.href = url;

  a.download =
    "clan-saint-marc-donnees.json";

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);
}

/* ================================
   IMPORTATION
================================ */

function importData() {

  alert(
    "L'import JSON est désactivé " +
    "pour éviter d'écraser " +
    "accidentellement la base en ligne. " +
    "Ajoute les contenus depuis " +
    "le tableau de bord."
  );
}

/* ================================
   RÉINITIALISATION
================================ */

function resetData() {

  alert(
    "La suppression globale n'est " +
    "pas activée depuis le site. " +
    "Supprime les éléments un par un " +
    "depuis le tableau de bord."
  );
}

/* ================================
   PROTECTION DU HTML
================================ */

function esc(s = "") {

  return String(s).replace(
    /[&<>"']/g,
    (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[m]
  );
}

function escAttr(s = "") {
  return esc(s);
}

/* ================================
   INITIALISATION
================================ */

initDb();

loadData();

/* ================================
   RESTAURATION DE LA SESSION ADMIN
================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if (isAdmin()) {

      const loginBox =
        document.getElementById(
          "login-box"
        );

      const dashboard =
        document.getElementById(
          "dashboard"
        );

      if (loginBox) {
        loginBox.hidden = true;
      }

      if (dashboard) {
        dashboard.hidden = false;
      }

      renderAdmin();
    }
  }
);

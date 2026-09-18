// ======================================================
// CLAN SAINT MARC — ADMINISTRATION
// ======================================================

const ADMIN_CODE = "SaintMarc1984";

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


// ======================================================
// SUPABASE
// ======================================================

function configured() {
  return (
    window.SUPABASE_URL &&
    window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes("TON-PROJET") &&
    !window.SUPABASE_ANON_KEY.includes("TON_ANON_KEY")
  );
}

function initDb() {
  try {
    if (configured() && window.supabase) {
      supabaseClient = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
      );
      console.log("Supabase connecté.");
      return true;
    }

    console.error("Supabase non configuré.");
    return false;

  } catch (e) {
    console.error("Erreur Supabase :", e);
    return false;
  }
}


// ======================================================
// CHARGEMENT DES DONNÉES
// ======================================================

async function loadData() {

  if (!supabaseClient) {
    console.error("Client Supabase absent.");
    renderAll();
    return;
  }

  try {

    const results = await Promise.all(

      TABLES.map(async (table) => {

        const { data: rows, error } =
          await supabaseClient
            .from(table)
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
          console.error(`Erreur table ${table}:`, error);
          throw error;
        }

        return [table, rows || []];
      })
    );

    data = Object.fromEntries(results);

    console.log("Données chargées :", data);

    renderAll();

  } catch (error) {

    console.error("Erreur de chargement :", error);

    renderAll();

    const msg = document.getElementById("login-msg");

    if (msg) {
      msg.textContent =
        "Erreur Supabase : " + error.message;
    }
  }
}


// ======================================================
// ADMINISTRATION PAR CODE
// ======================================================

function isAdmin() {
  return sessionStorage.getItem("clanSaintMarcAdmin") === "true";
}


async function requireAuth() {

  if (!supabaseClient) {

    alert(
      "Supabase n'est pas configuré correctement."
    );

    return false;
  }

  if (!isAdmin()) {

    alert(
      "Accès administrateur requis."
    );

    return false;
  }

  return true;
}


function loginAdmin() {

  const input = document.getElementById("admin-pass");
  const message = document.getElementById("login-msg");

  if (!input) {
    console.error("Champ admin-pass introuvable.");
    return;
  }

  const password = input.value.trim();

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

    input.value = "";

    return;
  }

  // Connexion réussie
  sessionStorage.setItem(
    "clanSaintMarcAdmin",
    "true"
  );

  if (message) {
    message.textContent =
      "Connexion réussie.";
  }

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

  input.value = "";

  renderAdmin();

  console.log("Administrateur connecté.");
}


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


// ======================================================
// MENU
// ======================================================

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


// ======================================================
// ONGLETS ADMIN
// ======================================================

function showTab(name) {

  document
    .querySelectorAll(".tab-panel")
    .forEach(panel => {
      panel.hidden = true;
    });

  const selected =
    document.getElementById("tab-" + name);

  if (selected) {
    selected.hidden = false;
  }
}


// ======================================================
// UTILITAIRES
// ======================================================

function val(id) {

  const element =
    document.getElementById(id);

  if (!element) {
    console.error(
      "Élément introuvable : " + id
    );

    return "";
  }

  return element.value.trim();
}


function clearFields(ids) {

  ids.forEach(id => {

    const element =
      document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });
}


// ======================================================
// AJOUT DANS SUPABASE
// ======================================================

async function addRow(table, row) {

  if (!(await requireAuth())) {
    return;
  }

  try {

    const { error } =
      await supabaseClient
        .from(table)
        .insert(row);

    if (error) {

      console.error(
        `Erreur insertion ${table}:`,
        error
      );

      alert(
        "Erreur lors de l'ajout :\n\n" +
        error.message
      );

      return;
    }

    alert("Élément ajouté avec succès !");

    await loadData();

    renderAdmin();

  } catch (error) {

    console.error(error);

    alert(
      "Erreur : " + error.message
    );
  }
}


// ======================================================
// ACTUALITÉS
// ======================================================

async function addNews() {

  const title = val("news-title");
  const date = val("news-date");
  const text = val("news-text");
  const image = val("news-image");

  if (!title || !text) {

    alert(
      "Ajoute au minimum un titre et un texte."
    );

    return;
  }

  await addRow("news", {
    title: title,
    date: date || null,
    text: text,
    image: image || null
  });

  clearFields([
    "news-title",
    "news-date",
    "news-text",
    "news-image"
  ]);
}


// ======================================================
// ANNIVERSAIRES
// ======================================================

async function addBirthday() {

  const name = val("bd-name");
  const date = val("bd-date");
  const promo = val("bd-promo");

  if (!name || !date) {

    alert(
      "Ajoute le nom et la date de naissance."
    );

    return;
  }

  await addRow("birthdays", {
    name: name,
    date: date,
    promo: promo || null
  });

  clearFields([
    "bd-name",
    "bd-date",
    "bd-promo"
  ]);
}


// ======================================================
// GALERIE
// ======================================================

async function addGallery() {

  const title = val("gal-title");
  const image = val("gal-image");
  const date = val("gal-date");

  if (!image) {

    alert(
      "Ajoute l'URL de la photo."
    );

    return;
  }

  await addRow("gallery", {
    title: title || null,
    image: image,
    date: date || null
  });

  clearFields([
    "gal-title",
    "gal-image",
    "gal-date"
  ]);
}


// ======================================================
// VIDÉOS
// ======================================================

async function addVideo() {

  const title = val("vid-title");
  const url = val("vid-url");

  if (!title || !url) {

    alert(
      "Ajoute le titre et le lien de la vidéo."
    );

    return;
  }

  await addRow("videos", {
    title: title,
    url: url
  });

  clearFields([
    "vid-title",
    "vid-url"
  ]);
}


// ======================================================
// PROMOTIONS
// ======================================================

async function addPromotion() {

  const number = val("promo-number");
  const year = val("promo-year");
  const text = val("promo-text");

  if (!number || !year) {

    alert(
      "Ajoute le numéro de la promotion et l'année."
    );

    return;
  }

  await addRow("promotions", {
    number: number,
    year: year,
    text: text || null
  });

  clearFields([
    "promo-number",
    "promo-year",
    "promo-text"
  ]);
}


// ======================================================
// SUPPRESSION
// ======================================================

async function del(type, id) {

  if (!isAdmin()) {

    alert(
      "Accès administrateur requis."
    );

    return;
  }

  if (!confirm("Supprimer cet élément ?")) {
    return;
  }

  try {

    const { error } =
      await supabaseClient
        .from(type)
        .delete()
        .eq("id", id);

    if (error) {

      console.error(
        "Erreur suppression :",
        error
      );

      alert(
        "Erreur lors de la suppression :\n\n" +
        error.message
      );

      return;
    }

    alert("Élément supprimé.");

    await loadData();

    renderAdmin();

  } catch (error) {

    console.error(error);

    alert(
      "Erreur : " + error.message
    );
  }
}


// ======================================================
// AFFICHAGE DU SITE
// ======================================================

function renderAll() {

  // ---------------- ACTUALITÉS ----------------

  const news =
    document.getElementById("news-list");

  if (news) {

    news.innerHTML =
      data.news.length

        ? data.news.map(x => `

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
                    style="
                      width:100%;
                      border-radius:12px;
                      margin-top:12px;
                      max-height:260px;
                      object-fit:cover;
                    "
                    src="${escAttr(x.image)}"
                    alt=""
                  >
                `
                : ""
            }

          </article>

        `).join("")

        : `

          <div class="empty">

            <span>📰</span>

            <h3>
              Aucune actualité publiée
            </h3>

            <p>
              Ajoute ta première actualité
              depuis l'espace d'administration.
            </p>

          </div>

        `;
  }


  // ---------------- ANNIVERSAIRES ----------------

  const bd =
    document.getElementById("birthday-list");

  if (bd) {

    bd.innerHTML =
      data.birthdays.length

        ? data.birthdays
            .slice()
            .sort((a, b) =>
              a.date.localeCompare(b.date)
            )
            .map(x => {

              const d =
                new Date(
                  x.date + "T12:00:00"
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

            }).join("")

        : `

          <div class="empty">

            <span>🎉</span>

            <h3>
              Les anniversaires du Clan
            </h3>

            <p>
              Ajoute les membres et leurs dates
              depuis l'administration.
            </p>

          </div>

        `;
  }


  // ---------------- GALERIE ----------------

  const gal =
    document.getElementById("gallery-list");

  if (gal) {

    gal.innerHTML =
      data.gallery.length

        ? data.gallery.map(x => `

            <figure class="gallery-item">

              <img
                src="${escAttr(x.image)}"
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

          `).join("")

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


  // ---------------- VIDÉOS ----------------

  const vid =
    document.getElementById("video-list");

  if (vid) {

    vid.innerHTML =
      data.videos.length

        ? data.videos.map(x => `

            <article class="video-card">

              <h3>
                ${esc(x.title)}
              </h3>

              <a
                href="${escAttr(x.url)}"
                target="_blank"
                rel="noopener"
              >
                Voir la vidéo ↗
              </a>

            </article>

          `).join("")

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


// ======================================================
// AFFICHAGE ADMIN
// ======================================================

function renderAdmin() {

  const maps = {

    news: "title",

    birthdays: "name",

    gallery: "title",

    videos: "title",

    promotions: "number"

  };


  Object.keys(maps).forEach(type => {

    const element =
      document.getElementById(
        "admin-" + type
      );

    if (!element) {
      return;
    }


    element.innerHTML =

      data[type].length

        ? data[type].map(x => `

            <div class="admin-item">

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

          `).join("")

        : `

            <p class="hint">
              Aucun élément.
            </p>

          `;
  });
}


// ======================================================
// EXPORT
// ======================================================

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
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    "clan-saint-marc-donnees.json";

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);
}


// ======================================================
// IMPORT / RESET
// ======================================================

function importData() {

  alert(
    "L'import JSON est désactivé pour éviter d'écraser accidentellement la base en ligne."
  );
}


function resetData() {

  alert(
    "La suppression globale n'est pas activée. Supprime les éléments un par un."
  );
}


// ======================================================
// SÉCURISATION AFFICHAGE
// ======================================================

function esc(s = "") {

  return String(s).replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );
}


function escAttr(s = "") {

  return esc(s);
}


// ======================================================
// DÉMARRAGE
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "Clan Saint Marc : démarrage..."
    );

    const ok = initDb();

    if (!ok) {

      const msg =
        document.getElementById(
          "login-msg"
        );

      if (msg) {

        msg.textContent =
          "Supabase n'est pas correctement configuré.";
      }

      return;
    }


    // Si déjà connecté dans ce navigateur
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
    }


    await loadData();

    renderAdmin();

  }
);
 

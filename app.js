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


// ===============================
// MESSAGE À L'ÉCRAN
// ===============================

function showMessage(message, type = "error") {
  const box = document.getElementById("login-msg");

  if (box) {
    box.textContent = message;
    box.style.display = "block";
  }

  console.log(message);
}


// ===============================
// SUPABASE
// ===============================

function initDb() {

  if (!window.SUPABASE_URL) {
    console.error("SUPABASE_URL absent.");
    return false;
  }

  if (!window.SUPABASE_ANON_KEY) {
    console.error("SUPABASE_ANON_KEY absent.");
    return false;
  }

  if (!window.supabase) {
    console.error("La bibliothèque Supabase n'est pas chargée.");
    return false;
  }

  try {

    supabaseClient = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );

    console.log("Supabase initialisé.");

    return true;

  } catch (error) {

    console.error(error);

    showMessage(
      "Erreur lors de la connexion à Supabase : " +
      error.message
    );

    return false;
  }
}


// ===============================
// CONNEXION ADMIN
// ===============================

function loginAdmin() {

  console.log("Bouton administrateur cliqué.");

  const input =
    document.getElementById("admin-pass");

  const message =
    document.getElementById("login-msg");

  if (!input) {

    alert(
      "ERREUR : le champ admin-pass est introuvable."
    );

    return;
  }

  const code = input.value.trim();

  console.log("Code saisi :", code ? "oui" : "non");

  if (!code) {

    if (message) {
      message.textContent =
        "Entre le code administrateur.";
    }

    return;
  }

  if (code !== ADMIN_CODE) {

    if (message) {
      message.textContent =
        "❌ Code incorrect.";
    }

    input.value = "";

    return;
  }

  // CODE CORRECT

  sessionStorage.setItem(
    "clanSaintMarcAdmin",
    "true"
  );

  if (message) {
    message.textContent =
      "✅ Code correct. Bienvenue dans l'administration.";
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

  console.log("Administration ouverte.");

  // On initialise Supabase après l'ouverture
  if (!supabaseClient) {
    initDb();
  }
}


// ===============================
// DÉCONNEXION
// ===============================

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

  const input =
    document.getElementById("admin-pass");

  if (input) {
    input.value = "";
  }
}


// ===============================
// MENU
// ===============================

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


// ===============================
// ONGLETS
// ===============================

function showTab(name) {

  document
    .querySelectorAll(".tab-panel")
    .forEach(panel => {
      panel.hidden = true;
    });

  const panel =
    document.getElementById("tab-" + name);

  if (panel) {
    panel.hidden = false;
  }
}


// ===============================
// UTILITAIRES
// ===============================

function val(id) {

  const element =
    document.getElementById(id);

  if (!element) {
    console.error(
      "Champ introuvable : " + id
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


function isAdmin() {

  return (
    sessionStorage.getItem(
      "clanSaintMarcAdmin"
    ) === "true"
  );
}


// ===============================
// AJOUT
// ===============================

async function addRow(table, row) {

  if (!isAdmin()) {

    alert(
      "Connecte-toi d'abord comme administrateur."
    );

    return;
  }

  if (!supabaseClient) {

    if (!initDb()) {

      alert(
        "Supabase n'est pas disponible."
      );

      return;
    }
  }

  try {

    const result =
      await supabaseClient
        .from(table)
        .insert(row);

    if (result.error) {

      console.error(
        "Erreur Supabase :",
        result.error
      );

      alert(
        "Erreur Supabase :\n\n" +
        result.error.message
      );

      return;
    }

    alert(
      "✅ Ajout effectué avec succès."
    );

    await loadData();

    renderAdmin();

  } catch (error) {

    console.error(error);

    alert(
      "Erreur : " +
      error.message
    );
  }
}


// ===============================
// ACTUALITÉ
// ===============================

async function addNews() {

  const title = val("news-title");
  const date = val("news-date");
  const text = val("news-text");
  const image = val("news-image");

  if (!title || !text) {

    alert(
      "Ajoute le titre et le texte."
    );

    return;
  }

  await addRow("news", {
    title,
    date: date || null,
    text,
    image: image || null
  });

  clearFields([
    "news-title",
    "news-date",
    "news-text",
    "news-image"
  ]);
}


// ===============================
// ANNIVERSAIRE
// ===============================

async function addBirthday() {

  const name = val("bd-name");
  const date = val("bd-date");
  const promo = val("bd-promo");

  if (!name || !date) {

    alert(
      "Ajoute le nom et la date."
    );

    return;
  }

  await addRow("birthdays", {
    name,
    date,
    promo: promo || null
  });

  clearFields([
    "bd-name",
    "bd-date",
    "bd-promo"
  ]);
}


// ===============================
// GALERIE
// ===============================

async function addGallery() {

  const title = val("gal-title");
  const image = val("gal-image");
  const date = val("gal-date");

  if (!image) {

    alert(
      "Ajoute l'URL de l'image."
    );

    return;
  }

  await addRow("gallery", {
    title: title || null,
    image,
    date: date || null
  });

  clearFields([
    "gal-title",
    "gal-image",
    "gal-date"
  ]);
}


// ===============================
// VIDÉO
// ===============================

async function addVideo() {

  const title = val("vid-title");
  const url = val("vid-url");

  if (!title || !url) {

    alert(
      "Ajoute le titre et le lien."
    );

    return;
  }

  await addRow("videos", {
    title,
    url
  });

  clearFields([
    "vid-title",
    "vid-url"
  ]);
}


// ===============================
// PROMOTION
// ===============================

async function addPromotion() {

  const number = val("promo-number");
  const year = val("promo-year");
  const text = val("promo-text");

  if (!number || !year) {

    alert(
      "Ajoute le numéro et l'année."
    );

    return;
  }

  await addRow("promotions", {
    number,
    year,
    text: text || null
  });

  clearFields([
    "promo-number",
    "promo-year",
    "promo-text"
  ]);
}


// ===============================
// CHARGEMENT
// ===============================

async function loadData() {

  if (!supabaseClient) {
    return;
  }

  try {

    const results = await Promise.all(

      TABLES.map(async table => {

        const { data: rows, error } =
          await supabaseClient
            .from(table)
            .select("*")
            .order(
              "created_at",
              { ascending: false }
            );

        if (error) {
          throw error;
        }

        return [
          table,
          rows || []
        ];
      })
    );

    data =
      Object.fromEntries(results);

    renderAll();

    renderAdmin();

  } catch (error) {

    console.error(
      "Erreur de chargement :",
      error
    );

    const msg =
      document.getElementById(
        "login-msg"
      );

    if (msg) {

      msg.textContent =
        "Erreur Supabase : " +
        error.message;
    }
  }
}


// ===============================
// SUPPRESSION
// ===============================

async function del(type, id) {

  if (!isAdmin()) {
    alert("Accès administrateur requis.");
    return;
  }

  if (!confirm("Supprimer cet élément ?")) {
    return;
  }

  if (!supabaseClient) {
    initDb();
  }

  if (!supabaseClient) {
    alert("Supabase n'est pas disponible.");
    return;
  }

  try {

    const { error } =
      await supabaseClient
        .from(type)
        .delete()
        .eq("id", id);

    if (error) {

      alert(
        "Erreur Supabase :\n\n" +
        error.message
      );

      return;
    }

    await loadData();

    renderAdmin();

  } catch (error) {

    alert(
      "Erreur : " +
      error.message
    );
  }
}


// ===============================
// AFFICHAGE
// ===============================

function renderAll() {

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
                ? `<img
                    src="${escAttr(x.image)}"
                    alt=""
                    style="
                      width:100%;
                      border-radius:12px;
                      margin-top:12px;
                      max-height:260px;
                      object-fit:cover;
                    "
                  >`
                : ""
            }

          </article>

        `).join("")

        : `
          <div class="empty">
            <span>📰</span>
            <h3>Aucune actualité publiée</h3>
            <p>
              Ajoute ta première actualité
              depuis l'administration.
            </p>
          </div>
        `;
  }


  const bd =
    document.getElementById(
      "birthday-list"
    );

  if (bd) {

    bd.innerHTML =
      data.birthdays.length

        ? data.birthdays
            .slice()
            .sort((a,b) =>
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
                        day:"2-digit",
                        month:"short"
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
            <h3>Les anniversaires du Clan</h3>
            <p>
              Ajoute les membres et leurs dates.
            </p>
          </div>
        `;
  }


  const gal =
    document.getElementById(
      "gallery-list"
    );

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
            <h3>La galerie est prête</h3>
            <p>
              Ajoute tes photos depuis
              l'administration.
            </p>
          </div>
        `;
  }


  const vid =
    document.getElementById(
      "video-list"
    );

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
            <h3>Aucune vidéo ajoutée</h3>
            <p>
              Ajoute une vidéo depuis
              l'administration.
            </p>
          </div>
        `;
  }
}


// ===============================
// ADMIN LISTES
// ===============================

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


// ===============================
// EXPORT
// ===============================

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
        type:"application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    "clan-saint-marc-donnees.json";

  a.click();

  URL.revokeObjectURL(url);
}


// ===============================
// IMPORT / RESET
// ===============================

function importData() {

  alert(
    "L'import JSON n'est pas activé."
  );
}

function resetData() {

  alert(
    "La suppression globale n'est pas activée."
  );
}


// ===============================
// PROTECTION HTML
// ===============================

function esc(s = "") {

  return String(s).replace(
    /[&<>"']/g,
    m => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[m])
  );
}

function escAttr(s = "") {
  return esc(s);
}


// ===============================
// DÉMARRAGE
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    console.log(
      "APP.JS DU CLAN SAINT MARC CHARGÉ"
    );

    // Vérification visible
    const loginMsg =
      document.getElementById(
        "login-msg"
      );

    if (loginMsg) {

      loginMsg.textContent =
        "Application chargée.";
    }

    initDb();

    await loadData();

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
 

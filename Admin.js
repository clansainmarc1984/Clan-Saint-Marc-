let supabaseClient = null;

const emptyData = {
  news: [],
  birthdays: [],
  gallery: [],
  videos: [],
  promotions: []
};

let data = structuredClone(emptyData);

const TABLES = Object.keys(emptyData);


/* ===============================
   SUPABASE
================================ */

function initDb() {

  if (!window.SUPABASE_URL) {
    showMessage("SUPABASE_URL absent.");
    return false;
  }

  if (!window.SUPABASE_ANON_KEY) {
    showMessage("SUPABASE_ANON_KEY absent.");
    return false;
  }

  if (!window.supabase) {
    showMessage(
      "La bibliothèque Supabase n'est pas chargée."
    );
    return false;
  }

  try {

    supabaseClient =
      window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
      );

    return true;

  } catch (error) {

    console.error(error);

    showMessage(
      "Erreur Supabase : " +
      error.message
    );

    return false;
  }
}


/* ===============================
   MESSAGES
================================ */

function showMessage(
  message,
  type = "error"
) {

  const box =
    document.getElementById("login-msg");

  if (!box) {
    return;
  }

  box.textContent = message;

  box.style.display = "block";

  box.className =
    type === "success"
      ? "success"
      : "error";
}


/* ===============================
   AUTHENTIFICATION
================================ */

async function loginAdmin() {

  const email =
    document
      .getElementById("admin-email")
      ?.value
      .trim();

  const password =
    document
      .getElementById("admin-password")
      ?.value;

  if (!email || !password) {

    showMessage(
      "Entre ton adresse e-mail et ton mot de passe."
    );

    return;
  }

  if (!supabaseClient) {

    if (!initDb()) {
      return;
    }
  }

  showMessage(
    "Connexion...",
    "success"
  );

  const { data: result, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {

    console.error(error);

    showMessage(
      "Connexion refusée : " +
      error.message
    );

    return;
  }

  if (!result.user) {

    showMessage(
      "Impossible de récupérer le compte."
    );

    return;
  }

  document
    .getElementById("admin-password")
    .value = "";

  await checkAdmin();


  if (isAdmin()) {

    showDashboard();

    await loadData();

    renderAdmin();

  } else {

    await supabaseClient.auth.signOut();

    showMessage(
      "Ce compte n'est pas autorisé à administrer le site."
    );
  }
}


/* ===============================
   VÉRIFICATION ADMIN
================================ */

async function checkAdmin() {

  if (!supabaseClient) {
    return false;
  }

  const {
    data: result,
    error
  } =
    await supabaseClient.rpc(
      "is_admin"
    );

  if (error) {

    console.error(
      "Erreur vérification admin :",
      error
    );

    return false;
  }

  return result === true;
}


function isAdmin() {

  return window.currentUserIsAdmin === true;
}


/* ===============================
   SESSION
================================ */

async function restoreSession() {

  if (!supabaseClient) {
    return;
  }

  const {
    data: {
      session
    }
  } =
    await supabaseClient.auth.getSession();

  if (!session) {
    return;
  }

  const admin =
    await checkAdmin();

  window.currentUserIsAdmin =
    admin;

  if (admin) {

    showDashboard();

    await loadData();

    renderAdmin();

  } else {

    await supabaseClient.auth.signOut();

  }
}


/* ===============================
   AFFICHAGE ADMIN
================================ */

function showDashboard() {

  const login =
    document.getElementById(
      "login-box"
    );

  const dashboard =
    document.getElementById(
      "dashboard"
    );

  if (login) {
    login.hidden = true;
  }

  if (dashboard) {
    dashboard.hidden = false;
  }

}


function showLogin() {

  const login =
    document.getElementById(
      "login-box"
    );

  const dashboard =
    document.getElementById(
      "dashboard"
    );

  if (login) {
    login.hidden = false;
  }

  if (dashboard) {
    dashboard.hidden = true;
  }

}


/* ===============================
   DÉCONNEXION
================================ */

async function logoutAdmin() {

  if (supabaseClient) {

    await supabaseClient.auth.signOut();

  }

  window.currentUserIsAdmin = false;

  showLogin();

  showMessage(
    "Vous êtes déconnecté.",
    "success"
  );

}


/* ===============================
   ONGLETS
================================ */

function showTab(name) {

  document
    .querySelectorAll(".tab-panel")
    .forEach(panel => {

      panel.hidden = true;

    });


  const panel =
    document.getElementById(
      "tab-" + name
    );

  if (panel) {
    panel.hidden = false;
  }

}


/* ===============================
   UTILITAIRES
================================ */

function val(id) {

  const element =
    document.getElementById(id);

  return element
    ? element.value.trim()
    : "";

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


/* ===============================
   AJOUT
================================ */

async function addRow(
  table,
  row
) {

  if (!isAdmin()) {

    alert(
      "Accès administrateur requis."
    );

    return;

  }

  const { error } =
    await supabaseClient
      .from(table)
      .insert(row);

  if (error) {

    console.error(error);

    alert(
      "Erreur Supabase :\n\n" +
      error.message
    );

    return;
  }

  alert(
    "✅ Ajout effectué avec succès."
  );

  await loadData();

  renderAdmin();

}


/* ===============================
   ACTUALITÉ
================================ */

async function addNews() {

  const title =
    val("news-title");

  const date =
    val("news-date");

  const text =
    val("news-text");

  const image =
    val("news-image");


  if (!title || !text) {

    alert(
      "Ajoute le titre et le texte."
    );

    return;
  }


  await addRow(
    "news",
    {
      title,
      date: date || null,
      text,
      image: image || null
    }
  );


  clearFields([
    "news-title",
    "news-date",
    "news-text",
    "news-image"
  ]);

}


/* ===============================
   ANNIVERSAIRE
================================ */

async function addBirthday() {

  const name =
    val("bd-name");

  const date =
    val("bd-date");

  const promo =
    val("bd-promo");


  if (!name || !date) {

    alert(
      "Ajoute le nom et la date."
    );

    return;
  }


  await addRow(
    "birthdays",
    {
      name,
      date,
      promo: promo || null
    }
  );


  clearFields([
    "bd-name",
    "bd-date",
    "bd-promo"
  ]);

}


/* ===============================
   GALERIE
================================ */

async function addGallery() {

  const title =
    val("gal-title");

  const image =
    val("gal-image");

  const date =
    val("gal-date");


  if (!image) {

    alert(
      "Ajoute l'URL de l'image."
    );

    return;
  }


  await addRow(
    "gallery",
    {
      title: title || null,
      image,
      date: date || null
    }
  );


  clearFields([
    "gal-title",
    "gal-image",
    "gal-date"
  ]);

}


/* ===============================
   VIDÉO
================================ */

async function addVideo() {

  const title =
    val("vid-title");

  const url =
    val("vid-url");


  if (!title || !url) {

    alert(
      "Ajoute le titre et le lien."
    );

    return;
  }


  await addRow(
    "videos",
    {
      title,
      url
    }
  );


  clearFields([
    "vid-title",
    "vid-url"
  ]);

}


/* ===============================
   PROMOTION
================================ */

async function addPromotion() {

  const number =
    val("promo-number");

  const year =
    val("promo-year");

  const text =
    val("promo-text");


  if (!number || !year) {

    alert(
      "Ajoute le numéro et l'année."
    );

    return;
  }


  await addRow(
    "promotions",
    {
      number,
      year,
      text: text || null
    }
  );


  clearFields([
    "promo-number",
    "promo-year",
    "promo-text"
  ]);

}


/* ===============================
   CHARGEMENT
================================ */

async function loadData() {

  if (!supabaseClient) {
    return;
  }

  try {

    const results =
      await Promise.all(

        TABLES.map(async table => {

          const {
            data: rows,
            error
          } =
            await supabaseClient
              .from(table)
              .select("*")
              .order(
                "created_at",
                {
                  ascending: false
                }
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

  } catch (error) {

    console.error(error);

    alert(
      "Erreur de chargement : " +
      error.message
    );

  }

}


/* ===============================
   SUPPRESSION
================================ */

async function del(
  type,
  id
) {

  if (!isAdmin()) {

    alert(
      "Accès administrateur requis."
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

}


/* ===============================
   AFFICHAGE DES LISTES
================================ */

function renderAdmin() {

  const maps = {

    news: "title",

    birthdays: "name",

    gallery: "title",

    videos: "title",

    promotions: "number"

  };


  Object.keys(maps)
    .forEach(type => {

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
              .map(x => `

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
                      '${escAttr(x.id)}'
                    )">

                    Supprimer

                  </button>

                </div>

              `)
              .join("")

          : `

            <p class="hint">
              Aucun élément.
            </p>

          `;

    });

}


/* ===============================
   EXPORT
================================ */

function exportData() {

  if (!isAdmin()) {

    alert(
      "Accès administrateur requis."
    );

    return;
  }


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

  a.click();


  URL.revokeObjectURL(url);

}


/* ===============================
   PROTECTION HTML
================================ */

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


/* ===============================
   DÉMARRAGE
================================ */

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    initDb();

    if (!supabaseClient) {
      return;
    }


    const {
      data: {
        session
      }
    } =
      await supabaseClient.auth.getSession();


    if (session) {

      const admin =
        await checkAdmin();

      window.currentUserIsAdmin =
        admin;

      if (admin) {

        showDashboard();

        await loadData();

        renderAdmin();

      }

    }


    supabaseClient.auth.onAuthStateChange(
      async (_event, session) => {

        if (!session) {

          window.currentUserIsAdmin =
            false;

          showLogin();

          return;

        }

        const admin =
          await checkAdmin();

        window.currentUserIsAdmin =
          admin;

        if (!admin) {

          await supabaseClient.auth.signOut();

          showLogin();

          return;

        }

        showDashboard();

        await loadData();

        renderAdmin();

      }
    );

  }
);
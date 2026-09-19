/* =========================================================
   CLAN SAINT MARC
   ADMIN.JS — VERSION ROBUSTE
   ========================================================= */

"use strict";

/* =========================================================
   1. ÉTAT GLOBAL
   ========================================================= */

let supabaseClient = null;
let currentUser = null;


/* =========================================================
   2. UTILITAIRES
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}


function setMessage(message, type = "error") {

  const box = $("login-msg");

  if (!box) return;

  box.textContent = message;

  if (type === "success") {
    box.style.color = "green";
  } else if (type === "info") {
    box.style.color = "#555";
  } else {
    box.style.color = "#c9151e";
  }
}


function setButtonLoading(button, loading, normalText) {

  if (!button) return;

  button.disabled = loading;

  button.textContent =
    loading
      ? "Connexion..."
      : normalText;
}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   3. INITIALISATION SUPABASE
   ========================================================= */

function initializeSupabase() {

  try {

    if (
      typeof window.supabase === "undefined"
    ) {

      throw new Error(
        "La bibliothèque Supabase n'est pas chargée."
      );

    }


    if (
      !window.SUPABASE_URL ||
      !window.SUPABASE_ANON_KEY
    ) {

      throw new Error(
        "La configuration Supabase est absente."
      );

    }


    supabaseClient =
      window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
      );


    console.log(
      "✓ Supabase initialisé."
    );

    return true;

  } catch (error) {

    console.error(
      "Erreur initialisation Supabase :",
      error
    );

    setMessage(
      "Erreur de configuration : " +
      error.message
    );

    return false;
  }
}


/* =========================================================
   4. AFFICHAGE CONNEXION
   ========================================================= */

function showLogin() {

  const loginBox = $("login-box");
  const dashboard = $("dashboard");

  if (loginBox) {

    loginBox.hidden = false;
    loginBox.style.display = "block";

  }


  if (dashboard) {

    dashboard.hidden = true;
    dashboard.style.display = "none";

  }

}


/* =========================================================
   5. AFFICHAGE TABLEAU DE BORD
   ========================================================= */

function showDashboard(user) {

  const loginBox = $("login-box");
  const dashboard = $("dashboard");

  if (loginBox) {

    loginBox.hidden = true;
    loginBox.style.display = "none";

  }


  if (dashboard) {

    /*
      IMPORTANT :
      on retire réellement l'attribut hidden.
    */

    dashboard.hidden = false;
    dashboard.removeAttribute("hidden");
    dashboard.style.display = "block";

  }


  const userBox = $("admin-user");

  if (userBox && user) {

    userBox.textContent =
      user.email || "";

  }


  showTab("news");
}


/* =========================================================
   6. VÉRIFICATION ADMIN
   ========================================================= */

async function checkAdmin() {

  if (!supabaseClient) {

    return {
      ok: false,
      message:
        "Supabase n'est pas initialisé."
    };

  }


  try {

    const {
      data,
      error
    } = await supabaseClient
      .rpc("is_admin");


    console.log(
      "RPC is_admin :",
      data,
      error
    );


    if (error) {

      return {
        ok: false,
        message:
          "Erreur de vérification administrateur : " +
          error.message
      };

    }


    if (data !== true) {

      return {
        ok: false,
        message:
          "Ce compte n'a pas les droits administrateur."
      };

    }


    return {
      ok: true
    };


  } catch (error) {

    console.error(
      "Erreur checkAdmin :",
      error
    );

    return {
      ok: false,
      message:
        "Impossible de vérifier les droits administrateur : " +
        error.message
    };

  }
}


/* =========================================================
   7. CONNEXION
   ========================================================= */

async function loginAdmin() {

  console.log(
    "=== BOUTON CONNEXION CLIQUÉ ==="
  );


  const emailInput =
    $("admin-email");

  const passwordInput =
    $("admin-password");

  const loginButton =
    $("login-button");


  if (!emailInput || !passwordInput) {

    setMessage(
      "Erreur : les champs de connexion sont introuvables."
    );

    return;

  }


  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;


  if (!email || !password) {

    setMessage(
      "Veuillez entrer votre adresse e-mail et votre mot de passe."
    );

    return;

  }


  if (!supabaseClient) {

    setMessage(
      "Supabase n'est pas correctement chargé. Actualise la page."
    );

    return;

  }


  setButtonLoading(
    loginButton,
    true,
    "Se connecter"
  );


  setMessage(
    "Connexion en cours...",
    "info"
  );


  try {

    /*
      ÉTAPE 1 :
      connexion Supabase
    */

    const {
      data,
      error
    } = await supabaseClient
      .auth
      .signInWithPassword({
        email,
        password
      });


    if (error) {

      console.error(
        "Erreur signInWithPassword :",
        error
      );

      setMessage(
        "Connexion refusée : " +
        error.message
      );

      return;

    }


    if (!data || !data.user) {

      setMessage(
        "Supabase n'a pas retourné d'utilisateur."
      );

      return;

    }


    currentUser =
      data.user;


    console.log(
      "✓ Utilisateur connecté :",
      currentUser.email
    );


    /*
      ÉTAPE 2 :
      vérification administrateur
    */

    setMessage(
      "Vérification des droits administrateur...",
      "info"
    );


    const adminResult =
      await checkAdmin();


    if (!adminResult.ok) {

      await supabaseClient
        .auth
        .signOut();


      currentUser = null;


      setMessage(
        adminResult.message
      );

      return;

    }


    /*
      ÉTAPE 3 :
      affichage du tableau de bord
    */

    showDashboard(
      currentUser
    );


    setMessage(
      "Connexion réussie.",
      "success"
    );


    /*
      ÉTAPE 4 :
      chargement des données.
      
      Une erreur de table ne doit PAS
      faire disparaître le dashboard.
    */

    await loadAllData();


  } catch (error) {

    console.error(
      "ERREUR GÉNÉRALE DE CONNEXION :",
      error
    );

    setMessage(
      "Erreur : " +
      (error.message || error)
    );

  } finally {

    setButtonLoading(
      loginButton,
      false,
      "Se connecter"
    );

  }

}


/* =========================================================
   8. DÉCONNEXION
   ========================================================= */

async function logoutAdmin() {

  try {

    if (supabaseClient) {

      await supabaseClient
        .auth
        .signOut();

    }

  } catch (error) {

    console.error(
      "Erreur déconnexion :",
      error
    );

  }


  currentUser = null;

  showLogin();

  setMessage(
    "Vous êtes déconnecté.",
    "info"
  );

}


/* =========================================================
   9. ONGLETS
   ========================================================= */

function showTab(tabName) {

  console.log(
    "Ouverture onglet :",
    tabName
  );


  /*
    Ton HTML utilise .tab-panel.
  */

  const panels =
    document.querySelectorAll(
      ".tab-panel"
    );


  panels.forEach(function(panel) {

    panel.hidden = true;
    panel.style.display = "none";

  });


  const selected =
    $(tabName);


  if (!selected) {

    console.error(
      "Onglet introuvable :",
      tabName
    );

    return;

  }


  selected.hidden = false;
  selected.removeAttribute("hidden");
  selected.style.display = "block";

}


/* =========================================================
   10. CHARGEMENT GLOBAL
   ========================================================= */

async function loadAllData() {

  /*
    Chaque chargement est indépendant.
    Une erreur sur une table ne bloque pas
    les autres.
  */

  try {
    await loadNews();
  } catch (e) {
    console.error("News :", e);
  }


  try {
    await loadBirthdays();
  } catch (e) {
    console.error("Birthdays :", e);
  }


  try {
    await loadGallery();
  } catch (e) {
    console.error("Gallery :", e);
  }


  try {
    await loadVideos();
  } catch (e) {
    console.error("Videos :", e);
  }


  try {
    await loadPromotions();
  } catch (e) {
    console.error("Promotions :", e);
  }

}


/* =========================================================
   11. ACTUALITÉS
   ========================================================= */

async function loadNews() {

  const container =
    $("news-list");

  if (!container) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("news")
    .select("*")
    .order(
      "date",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      "Erreur news :",
      error
    );

    container.innerHTML =
      "<p>Impossible de charger les actualités.</p>";

    return;

  }


  container.innerHTML = "";


  (data || []).forEach(function(news) {

    const item =
      document.createElement("div");

    item.className =
      "admin-item";


    item.innerHTML = `
      <h3>
        ${escapeHTML(news.title)}
      </h3>

      <p>
        <strong>Date :</strong>
        ${escapeHTML(news.date)}
      </p>

      <p>
        ${escapeHTML(news.content)}
      </p>

      ${
        news.image
          ? `
            <p>
              <strong>Image :</strong>
              ${escapeHTML(news.image)}
            </p>
          `
          : ""
      }
    `;


    container.appendChild(item);

  });

}


/* =========================================================
   12. AJOUT ACTUALITÉ
   ========================================================= */

async function addNews() {

  const title =
    $("news-title")?.value.trim() || "";

  const date =
    $("news-date")?.value || "";

  const content =
    $("news-text")?.value.trim() || "";

  const image =
    $("news-image")?.value.trim() || "";


  if (!title || !date || !content) {

    alert(
      "Veuillez remplir le titre, la date et le texte."
    );

    return;

  }


  try {

    const {
      error
    } = await supabaseClient
      .from("news")
      .insert({
        title,
        date,
        content,
        image: image || null
      });


    if (error) {

      throw error;

    }


    $("news-title").value = "";
    $("news-date").value = "";
    $("news-text").value = "";
    $("news-image").value = "";


    alert(
      "Actualité publiée avec succès !"
    );


    await loadNews();


  } catch (error) {

    console.error(
      "Erreur publication :",
      error
    );

    alert(
      "Impossible de publier l'actualité :\n\n" +
      error.message
    );

  }

}


/* =========================================================
   13. ANNIVERSAIRES
   ========================================================= */

async function loadBirthdays() {

  const container =
    $("birthdays-list");

  if (!container) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("birthdays")
    .select("*")
    .order(
      "date",
      {
        ascending: true
      }
    );


  if (error) {

    console.error(
      "Erreur anniversaires :",
      error
    );

    return;

  }


  container.innerHTML = "";


  (data || []).forEach(function(row) {

    const item =
      document.createElement("div");

    item.className =
      "admin-item";


    item.innerHTML = `
      <h3>
        ${escapeHTML(row.name)}
      </h3>

      <p>
        <strong>Date :</strong>
        ${escapeHTML(row.date)}
      </p>

      ${
        row.promo
          ? `<p><strong>Promotion :</strong> ${escapeHTML(row.promo)}</p>`
          : ""
      }
    `;


    container.appendChild(item);

  });

}


async function addBirthday() {

  const name =
    $("birthday-name")?.value.trim() || "";

  const date =
    $("birthday-date")?.value || "";

  const promo =
    $("birthday-promo")?.value.trim() || "";


  if (!name || !date) {

    alert(
      "Veuillez remplir le nom et la date."
    );

    return;

  }


  try {

    const {
      error
    } = await supabaseClient
      .from("birthdays")
      .insert({
        name,
        date,
        promo: promo || null
      });


    if (error) throw error;


    $("birthday-name").value = "";
    $("birthday-date").value = "";
    $("birthday-promo").value = "";


    alert(
      "Anniversaire ajouté avec succès !"
    );


    await loadBirthdays();


  } catch (error) {

    console.error(error);

    alert(
      "Erreur :\n\n" +
      error.message
    );

  }

}


/* =========================================================
   14. GALERIE
   ========================================================= */

async function loadGallery() {

  const container =
    $("gallery-list");

  if (!container) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("gallery")
    .select("*")
    .order(
      "date",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      "Erreur galerie :",
      error
    );

    return;

  }


  container.innerHTML = "";


  (data || []).forEach(function(row) {

    const item =
      document.createElement("div");

    item.className =
      "admin-item";


    item.innerHTML = `
      <h3>
        ${escapeHTML(row.title)}
      </h3>

      <p>
        <strong>Date :</strong>
        ${escapeHTML(row.date)}
      </p>

      <p>
        ${escapeHTML(row.image)}
      </p>
    `;


    container.appendChild(item);

  });

}


async function addGallery() {

  const title =
    $("gallery-title")?.value.trim() || "";

  const image =
    $("gallery-image")?.value.trim() || "";

  const date =
    $("gallery-date")?.value || "";


  if (!title || !image) {

    alert(
      "Veuillez remplir le titre et l'image."
    );

    return;

  }


  try {

    const {
      error
    } = await supabaseClient
      .from("gallery")
      .insert({
        title,
        image,
        date: date || null
      });


    if (error) throw error;


    $("gallery-title").value = "";
    $("gallery-image").value = "";
    $("gallery-date").value = "";


    alert(
      "Photo ajoutée avec succès !"
    );


    await loadGallery();


  } catch (error) {

    console.error(error);

    alert(
      "Erreur :\n\n" +
      error.message
    );

  }

}


/* =========================================================
   15. VIDÉOS
   ========================================================= */

async function loadVideos() {

  const container =
    $("videos-list");

  if (!container) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("videos")
    .select("*");


  if (error) {

    console.error(
      "Erreur vidéos :",
      error
    );

    return;

  }


  container.innerHTML = "";


  (data || []).forEach(function(row) {

    const item =
      document.createElement("div");

    item.className =
      "admin-item";


    item.innerHTML = `
      <h3>
        ${escapeHTML(row.title)}
      </h3>

      <p>
        ${escapeHTML(row.url)}
      </p>
    `;


    container.appendChild(item);

  });

}


async function addVideo() {

  const title =
    $("video-title")?.value.trim() || "";

  const url =
    $("video-url")?.value.trim() || "";


  if (!title || !url) {

    alert(
      "Veuillez remplir le titre et le lien."
    );

    return;

  }


  try {

    const {
      error
    } = await supabaseClient
      .from("videos")
      .insert({
        title,
        url
      });


    if (error) throw error;


    $("video-title").value = "";
    $("video-url").value = "";


    alert(
      "Vidéo ajoutée avec succès !"
    );


    await loadVideos();


  } catch (error) {

    console.error(error);

    alert(
      "Erreur :\n\n" +
      error.message
    );

  }

}


/* =========================================================
   16. PROMOTIONS
   ========================================================= */

async function loadPromotions() {

  const container =
    $("promotions-list");

  if (!container) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("promotions")
    .select("*")
    .order(
      "year",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      "Erreur promotions :",
      error
    );

    return;

  }


  container.innerHTML = "";


  (data || []).forEach(function(row) {

    const item =
      document.createElement("div");

    item.className =
      "admin-item";


    item.innerHTML = `
      <h3>
        ${escapeHTML(row.number)}
      </h3>

      <p>
        <strong>Année :</strong>
        ${escapeHTML(row.year)}
      </p>

      <p>
        ${escapeHTML(row.text)}
      </p>
    `;


    container.appendChild(item);

  });

}


async function addPromotion() {

  const number =
    $("promotion-number")?.value.trim() || "";

  const year =
    $("promotion-year")?.value.trim() || "";

  const text =
    $("promotion-text")?.value.trim() || "";


  if (!number || !year || !text) {

    alert(
      "Veuillez remplir tous les champs."
    );

    return;

  }


  try {

    const {
      error
    } = await supabaseClient
      .from("promotions")
      .insert({
        number,
        year,
        text
      });


    if (error) throw error;


    $("promotion-number").value = "";
    $("promotion-year").value = "";
    $("promotion-text").value = "";


    alert(
      "Promotion ajoutée avec succès !"
    );


    await loadPromotions();


  } catch (error) {

    console.error(error);

    alert(
      "Erreur :\n\n" +
      error.message
    );

  }

}


/* =========================================================
   17. EXPORT
   ========================================================= */

async function exportData() {

  const tables = [
    "news",
    "birthdays",
    "gallery",
    "videos",
    "promotions"
  ];


  const result = {};


  for (const table of tables) {

    try {

      const {
        data,
        error
      } = await supabaseClient
        .from(table)
        .select("*");


      if (!error) {

        result[table] =
          data || [];

      }

    } catch (error) {

      console.error(
        "Export " + table,
        error
      );

    }

  }


  const blob =
    new Blob(
      [
        JSON.stringify(
          result,
          null,
          2
        )
      ],
      {
        type: "application/json"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;

  link.download =
    "clan-saint-marc-data.json";


  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);

}


/* =========================================================
   18. INITIALISATION
   ========================================================= */

async function initializeAdminPage() {

  console.log(
    "=== CLAN SAINT MARC ADMIN ==="
  );


  showLogin();


  /*
    Initialisation Supabase
  */

  if (!initializeSupabase()) {

    return;

  }


  /*
    Vérification session existante
  */

  try {

    const {data,
      error
    } = await supabaseClient
      .auth
      .getSession();


    if (error) {

      console.error(
        "Erreur session :",
        error
      );

      return;

    }


    if (!data.session) {

      console.log(
        "Aucune session active."
      );

      return;

    }


    /*
      Session existante :
      on vérifie quand même les droits.
    */

    const adminResult =
      await checkAdmin();


    if (!adminResult.ok) {

      await supabaseClient
        .auth
        .signOut();

      return;

    }


    currentUser =
      data.session.user;


    showDashboard(
      currentUser
    );


    await loadAllData();


  } catch (error) {

    console.error(
      "Erreur initialisation :",
      error
    );

    setMessage(
      "Erreur au chargement : " +
      error.message
    );

  }

}


/* =========================================================
   19. ÉVÉNEMENTS
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeAdminPage
);


/* =========================================================
   20. EXPOSER LES FONCTIONS AU HTML
   ========================================================= */

window.loginAdmin =
  loginAdmin;

window.logoutAdmin =
  logoutAdmin;

window.showTab =
  showTab;

window.addNews =
  addNews;

window.addBirthday =
  addBirthday;

window.addGallery =
  addGallery;

window.addVideo =
  addVideo;

window.addPromotion =
  addPromotion;

window.exportData =
  exportData;


/* =========================================================
   FIN
   ========================================================= */
    
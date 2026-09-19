
      /* =========================================================
   CLAN SAINT MARC
   ADMIN.JS — VERSION CORRIGÉE
   ========================================================= */

/* =========================================================
   1. VÉRIFICATION DE LA CONFIGURATION
   ========================================================= */

if (
  typeof window.SUPABASE_URL === "undefined" ||
  typeof window.SUPABASE_ANON_KEY === "undefined"
) {
  console.error("Configuration Supabase introuvable.");
  alert(
    "Erreur : la configuration Supabase n'est pas chargée."
  );
}

/* =========================================================
   2. CONNEXION SUPABASE
   ========================================================= */

const supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

/* =========================================================
   3. ÉLÉMENTS HTML
   ========================================================= */

const loginBox = document.getElementById("login-box");
const dashboard = document.getElementById("dashboard");

const adminEmail = document.getElementById("admin-email");
const adminPassword = document.getElementById("admin-password");

const loginMsg = document.getElementById("login-msg");
const adminUser = document.getElementById("admin-user");

/* =========================================================
   4. MESSAGE DE CONNEXION
   ========================================================= */

function showMessage(message, type = "error") {
  if (!loginMsg) return;

  loginMsg.textContent = message;

  if (type === "success") {
    loginMsg.style.color = "green";
  } else {
    loginMsg.style.color = "red";
  }
}

/* =========================================================
   5. AFFICHER LE DASHBOARD
   ========================================================= */

function showDashboard(user) {

  if (loginBox) {
    loginBox.hidden = true;
    loginBox.style.display = "none";
  }

  if (dashboard) {

    /* IMPORTANT :
       on retire réellement l'attribut hidden */
    dashboard.hidden = false;

    dashboard.style.display = "block";
  }

  if (adminUser && user) {
    adminUser.textContent = user.email || "";
  }

  /* Afficher automatiquement Actualités */
  showTab("news");
}

/* =========================================================
   6. AFFICHER LA CONNEXION
   ========================================================= */

function showLogin() {

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
   7. VÉRIFIER SI L'UTILISATEUR EST ADMIN
   ========================================================= */

async function checkAdmin() {

  try {

    const {
      data,
      error
    } = await supabaseClient.rpc("is_admin");

    console.log("=== VÉRIFICATION ADMIN ===");
    console.log("Résultat :", data);
    console.log("Erreur :", error);

    if (error) {

      console.error(
        "Erreur RPC is_admin :",
        error
      );

      return false;
    }

    return data === true;

  } catch (error) {

    console.error(
      "Erreur vérification admin :",
      error
    );

    return false;
  }
}

/* =========================================================
   8. CONNEXION ADMINISTRATEUR
   ========================================================= */

async function loginAdmin() {

  const email =
    adminEmail
      ? adminEmail.value.trim()
      : "";

  const password =
    adminPassword
      ? adminPassword.value
      : "";

  if (!email || !password) {

    showMessage(
      "Veuillez remplir tous les champs."
    );

    return;
  }

  showMessage(
    "Connexion en cours...",
    "success"
  );

  try {

    const {
      data,
      error
    } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {

      console.error(
        "Erreur de connexion :",
        error
      );

      showMessage(
        "Connexion impossible : " +
        error.message
      );

      return;
    }

    const user = data.user;

    if (!user) {

      showMessage(
        "Utilisateur introuvable."
      );

      return;
    }

    /* Vérification admin */
    const isAdmin = await checkAdmin();

    if (!isAdmin) {

      await supabaseClient.auth.signOut();

      showMessage(
        "Accès refusé : ce compte n'est pas administrateur."
      );

      return;
    }

    /* Connexion réussie */
    showDashboard(user);

    showMessage("");

    await loadAllData();

  } catch (error) {

    console.error(
      "Erreur inattendue :",
      error
    );

    showMessage(
      "Une erreur est survenue pendant la connexion."
    );
  }
}

/* =========================================================
   9. DÉCONNEXION
   ========================================================= */

async function logoutAdmin() {

  try {

    const {
      error
    } = await supabaseClient.auth.signOut();

    if (error) {

      console.error(
        "Erreur déconnexion :",
        error
      );

      alert(
        "Erreur lors de la déconnexion : " +
        error.message
      );

      return;
    }

    showLogin();

  } catch (error) {

    console.error(error);

    showLogin();
  }
}

/* =========================================================
   10. ONGLET
   ========================================================= */

function showTab(tabName) {

  const tabs =
    document.querySelectorAll(".tab-panel");

  tabs.forEach(function(tab) {

    tab.hidden = true;
    tab.style.display = "none";

  });

  const selectedTab =
    document.getElementById(tabName);

  if (selectedTab) {

    selectedTab.hidden = false;
    selectedTab.style.display = "block";

  }
}

/* =========================================================
   11. CHARGER TOUTES LES DONNÉES
   ========================================================= */

async function loadAllData() {

  await loadNews();
  await loadBirthdays();
  await loadGallery();
  await loadVideos();
  await loadPromotions();

}

/* =========================================================
   12. ACTUALITÉS
   ========================================================= */

async function loadNews() {

  const container =
    document.getElementById("news-list");

  if (!container) return;

  const {
    data,
    error
  } = await supabaseClient
    .from("news")
    .select("*")
    .order("date", {
      ascending: false
    });

  if (error) {

    console.error(
      "Erreur chargement actualités :",
      error
    );

    return;
  }

  container.innerHTML = "";

  (data || []).forEach(function(news) {

    const item =
      document.createElement("div");

    item.className = "admin-item";

    item.innerHTML = `
      <h3>${escapeHTML(news.title || "")}</h3>

      <p>
        <strong>Date :</strong>
        ${escapeHTML(news.date || "")}
      </p>

      <p>
        ${escapeHTML(news.content || "")}
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
   13. AJOUTER UNE ACTUALITÉ
   ========================================================= */

async function addNews() {

  const titleElement =
    document.getElementById("news-title");

  const dateElement =
    document.getElementById("news-date");

  const textElement =
    document.getElementById("news-text");

  const imageElement =
    document.getElementById("news-image");

  const title =
    titleElement
      ? titleElement.value.trim()
      : "";

  const date =
    dateElement
      ? dateElement.value
      : "";

  const content =
    textElement
      ? textElement.value.trim()
      : "";

  const image =
    imageElement
      ? imageElement.value.trim()
      : "";

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
      .insert([
        {
          title: title,
          date: date,
          content: content,
          image: image || null
        }
      ]);

    if (error) {

      console.error(
        "Erreur publication actualité :",
        error
      );

      alert(
        "Erreur Supabase :\n\n" +
        error.message
      );

      return;
    }

    if (titleElement)
      titleElement.value = "";

    if (dateElement)
      dateElement.value = "";

    if (textElement)
      textElement.value = "";

    if (imageElement)
      imageElement.value = "";

    alert(
      "Actualité publiée avec succès !"
    );

    await loadNews();

  } catch (error) {

    console.error(error);

    alert(
      "Impossible de contacter Supabase."
    );
  }
}

/* =========================================================
   14. ANNIVERSAIRES
   ========================================================= */

async function loadBirthdays() {

  const container =
    document.getElementById("birthdays-list");

  if (!container) return;

  const {
    data,
    error
  } = await supabaseClient
    .from("birthdays")
    .select("*")
    .order("date", {
      ascending: true
    });

  if (error) {

    console.error(
      "Erreur chargement anniversaires :",
      error
    );

    return;
  }

  container.innerHTML = "";

  (data || []).forEach(function(birthday) {

    const item =
      document.createElement("div");

    item.className = "admin-item";

    item.innerHTML = `
      <h3>
        ${escapeHTML(birthday.name || "")}
      </h3>

      <p>
        <strong>Date :</strong>
        ${escapeHTML(birthday.date || "")}
      </p>

      ${
        birthday.promo
          ? `
            <p>
              <strong>Promotion :</strong>
              ${escapeHTML(birthday.promo)}
            </p>
          `
          : ""
      }
    `;

    container.appendChild(item);

  });
}

/* =========================================================
   15. AJOUTER UN ANNIVERSAIRE
   ========================================================= */

async function addBirthday() {

  const name =
    document
      .getElementById("birthday-name")
      ?.value
      .trim() || "";

  const date =
    document
      .getElementById("birthday-date")
      ?.value || "";

  const promo =
    document
      .getElementById("birthday-promo")
      ?.value
      .trim() || "";

  if (!name || !date) {

    alert(
      "Veuillez remplir le nom et la date."
    );

    return;
  }

  const {
    error
  } = await supabaseClient
    .from("birthdays")
    .insert([
      {
        name: name,
        date: date,
        promo: promo || null
      }
    ]);

  if (error) {

    console.error(error);

    alert(
      "Erreur lors de l'ajout : " +
      error.message
    );

    return;
  }

  document.getElementById(
    "birthday-name"
  ).value = "";

  document.getElementById(
    "birthday-date"
  ).value = "";

  document.getElementById(
    "birthday-promo"
  ).value = "";

  alert(
    "Anniversaire ajouté avec succès !"
  );

  await loadBirthdays();
}

/* =========================================================
   16. GALERIE
   ========================================================= */

async function loadGallery() {

  const container =
    document.getElementById("gallery-list");

  if (!container) return;

  const {
    data,
    error
  } = await supabaseClient
    .from("gallery")
    .select("*")
    .order("date", {
      ascending: false
    });

  if (error) {

    console.error(
      "Erreur chargement galerie :",
      error
    );

    return;
  }

  container.innerHTML = "";

  (data || []).forEach(function(photo) {

    const item =
      document.createElement("div");

    item.className = "admin-item";

    item.innerHTML = `
      <h3>
        ${escapeHTML(photo.title || "")}
      </h3>

      <p>
        <strong>Date :</strong>
        ${escapeHTML(photo.date || "")}
      </p>

      ${
        photo.image
          ? `
            <p>
              ${escapeHTML(photo.image)}
            </p>
          `
          : ""
      }
    `;

    container.appendChild(item);

  });
}

/* =========================================================
   17. AJOUTER UNE PHOTO
   ========================================================= */

async function addGallery() {

  const title =
    document
      .getElementById("gallery-title")
      ?.value
      .trim() || "";

  const image =
    document
      .getElementById("gallery-image")
      ?.value
      .trim() || "";

  const date =
    document
      .getElementById("gallery-date")
      ?.value || "";

  if (!title || !image) {

    alert(
      "Veuillez remplir le titre et l'image."
    );

    return;
  }

  const {
    error
  } = await supabaseClient
    .from("gallery")
    .insert([
      {
        title: title,
        image: image,
        date: date || null
      }
    ]);

  if (error) {

    console.error(error);

    alert(
      "Erreur lors de l'ajout : " +
      error.message
    );

    return;
  }

  document.getElementById(
    "gallery-title"
  ).value = "";

  document.getElementById(
    "gallery-image"
  ).value = "";

  document.getElementById(
    "gallery-date"
  ).value = "";

  alert(
    "Photo ajoutée avec succès !"
  );

  await loadGallery();
}

/* =========================================================
   18. VIDÉOS
   ========================================================= */

async function loadVideos() {

  const container =
    document.getElementById("videos-list");

  if (!container) return;

  const {
    data,
    error
  } = await supabaseClient
    .from("videos")
    .select("*");

  if (error) {

    console.error(
      "Erreur chargement vidéos :",
      error
    );

    return;
  }

  container.innerHTML = "";

  (data || []).forEach(function(video) {

    const item =
      document.createElement("div");

    item.className = "admin-item";

    item.innerHTML = `
      <h3>
        ${escapeHTML(video.title || "")}
      </h3>

      <p>
        ${escapeHTML(video.url || "")}
      </p>
    `;

    container.appendChild(item);

  });
}

/* =========================================================
   19. AJOUTER UNE VIDÉO
   ========================================================= */

async function addVideo() {

  const title =
    document
      .getElementById("video-title")
      ?.value
      .trim() || "";

  const url =
    document
      .getElementById("video-url")
      ?.value
      .trim() || "";

  if (!title || !url) {

    alert(
      "Veuillez remplir le titre et l'URL."
    );

    return;
  }

  const {
    error
  } = await supabaseClient
    .from("videos")
    .insert([
      {
        title: title,
        url: url
      }
    ]);

  if (error) {

    console.error(error);

    alert(
      "Erreur lors de l'ajout : " +
      error.message
    );

    return;
  }

  document.getElementById(
    "video-title"
  ).value = "";

  document.getElementById(
    "video-url"
  ).value = "";

  alert(
    "Vidéo ajoutée avec succès !"
  );

  await loadVideos();
}

/* =========================================================
   20. PROMOTIONS
   ========================================================= */

async function loadPromotions() {

  const container =
    document.getElementById(
      "promotions-list"
    );

  if (!container) return;

  const {
    data,
    error
  } = await supabaseClient
    .from("promotions")
    .select("*")
    .order("year", {
      ascending: false
    });

  if (error) {

    console.error(
      "Erreur chargement promotions :",
      error
    );

    return;
  }

  container.innerHTML = "";

  (data || []).forEach(function(promotion) {

    const item =
      document.createElement("div");

    item.className = "admin-item";

    item.innerHTML = `
      <h3>
        ${escapeHTML(
          promotion.number?.toString() || ""
        )}
      </h3>

      <p>
        <strong>Année :</strong>
        ${escapeHTML(
          promotion.year?.toString() || ""
        )}
      </p>

      <p>
        ${escapeHTML(
          promotion.text || ""
        )}
      </p>
    `;

    container.appendChild(item);

  });
}

/* =========================================================
   21. AJOUTER UNE PROMOTION
   ========================================================= */

async function addPromotion() {

  const number =
    document
      .getElementById("promotion-number")
      ?.value
      .trim() || "";

  const year =
    document
      .getElementById("promotion-year")
      ?.value
      .trim() || "";

  const text =
    document
      .getElementById("promotion-text")
      ?.value
      .trim() || "";

  if (!number || !year || !text) {

    alert(
      "Veuillez remplir tous les champs."
    );

    return;
  }

  const {
    error
  } = await supabaseClient
    .from("promotions")
    .insert([
      {
        number: number,
        year: year,
        text: text
      }
    ]);

  if (error) {

    console.error(error);

    alert(
      "Erreur lors de l'ajout : " +
      error.message
    );

    return;
  }

  document.getElementById(
    "promotion-number"
  ).value = "";

  document.getElementById(
    "promotion-year"
  ).value = "";

  document.getElementById(
    "promotion-text"
  ).value = "";

  alert(
    "Promotion ajoutée avec succès !"
  );

  await loadPromotions();
}

/* =========================================================
   22. EXPORTER LES DONNÉES
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

    const {
      data,
      error
    } = await supabaseClient
      .from(table)
      .select("*");

    if (error) {

      console.error(
        "Erreur export " + table + " :",
        error
      );

      continue;
    }

    result[table] = data || [];
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
   23. PROTECTION CONTRE LE HTML
   ========================================================= */

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

/* =========================================================
   24. INITIALISATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    console.log(
      "=== CLAN SAINT MARC ADMIN ==="
    );

    /* Par défaut : connexion visible */
    showLogin();

    /* Charger l'onglet actualités */
    showTab("news");

    try {

      const {
        data,
        error
      } = await supabaseClient.auth.getSession();

      if (error) {

        console.error(
          "Erreur récupération session :",
          error
        );

        showLogin();

        return;
      }

      const session =
        data.session;

      /* Pas connecté */
      if (!session) {

        showLogin();

        return;
      }

      /const session =
        data.session;

      /* Pas connecté */
      if (!session) {

        showLogin();

        return;
      }

      /* Utilisateur déjà connecté */
      const user =
        session.user;

      const isAdmin =
        await checkAdmin();

      /* Session existante mais pas admin */
      if (!isAdmin) {

        await supabaseClient
          .auth
          .signOut();

        showLogin();

        return;
      }

      /* Administrateur reconnu */
      showDashboard(user);

      await loadAllData();

    } catch (error) {

      console.error(
        "Erreur initialisation admin :",
        error
      );

      showLogin();
    }
  }
);

/* =========================================================
   25. RENDRE LES FONCTIONS DISPONIBLES AU HTML
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
   FIN ADMIN.JS
   ========================================================= */

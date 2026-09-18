// =====================================================
// ADMIN.JS — CLAN SAINT MARC
// Administration + Supabase
// =====================================================


// =====================================================
// 1. CONNEXION SUPABASE
// =====================================================

const supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// =====================================================
// 2. ÉLÉMENTS HTML
// =====================================================

const loginBox = document.getElementById("login-box");
const dashboard = document.getElementById("dashboard");

const emailInput = document.getElementById("admin-email");
const passwordInput = document.getElementById("admin-password");

const loginMsg = document.getElementById("login-msg");
const adminUser = document.getElementById("admin-user");


// =====================================================
// 3. MESSAGE
// =====================================================

function showMessage(message, type = "error") {

  if (!loginMsg) return;

  loginMsg.textContent = message;

  if (type === "success") {
    loginMsg.style.color = "#2e7d32";
  }

  else if (type === "info") {
    loginMsg.style.color = "#555";
  }

  else {
    loginMsg.style.color = "#d32f2f";
  }
}


// =====================================================
// 4. VÉRIFIER SI L'UTILISATEUR EST ADMIN
// =====================================================

async function checkAdmin() {

  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return false;
  }

  const {
    data,
    error
  } = await supabaseClient.rpc("is_admin");

  if (error) {

    console.error("Erreur RPC is_admin :", error);

    return false;
  }

  return data === true;
}


// =====================================================
// 5. AFFICHER LE TABLEAU DE BORD
// =====================================================

function showDashboard(user) {

  if (loginBox) {
    loginBox.hidden = true;
  }

  if (dashboard) {
    dashboard.hidden = false;
  }

  if (adminUser && user) {

    adminUser.textContent =
      user.email || "Administrateur connecté";
  }
}


// =====================================================
// 6. AFFICHER LA CONNEXION
// =====================================================

function showLogin() {

  if (loginBox) {
    loginBox.hidden = false;
  }

  if (dashboard) {
    dashboard.hidden = true;
  }
}


// =====================================================
// 7. CONNEXION ADMINISTRATEUR
// =====================================================

async function loginAdmin() {

  const email = emailInput
    ? emailInput.value.trim()
    : "";

  const password = passwordInput
    ? passwordInput.value
    : "";

  if (!email || !password) {

    showMessage(
      "Veuillez entrer votre adresse e-mail et votre mot de passe.",
      "error"
    );

    return;
  }

  showMessage(
    "Connexion en cours...",
    "info"
  );


  const {
    data,
    error
  } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });


  if (error) {

    console.error("Erreur Supabase :", error);

    showMessage(
      "Connexion impossible : " + error.message,
      "error"
    );

    return;
  }


  // Vérification administrateur
  const admin = await checkAdmin();


  if (!admin) {

    await supabaseClient.auth.signOut();

    showMessage(
      "Ce compte est connecté, mais il n'est pas administrateur.",
      "error"
    );

    return;
  }


  // Connexion réussie
  showMessage(
    "Connexion réussie !",
    "success"
  );


  showDashboard(data.user);


  // Charger les données
  await loadAllData();
}


// =====================================================
// 8. DÉCONNEXION
// =====================================================

async function logoutAdmin() {

  const {
    error
  } = await supabaseClient.auth.signOut();

  if (error) {

    console.error(
      "Erreur lors de la déconnexion :",
      error
    );

    return;
  }

  showLogin();

  if (emailInput) {
    emailInput.value = "";
  }

  if (passwordInput) {
    passwordInput.value = "";
  }

  if (loginMsg) {
    loginMsg.textContent = "";
  }
}


// =====================================================
// 9. ONGLET
// =====================================================

function showTab(tabName) {

  const panels =
    document.querySelectorAll(".tab-panel");

  panels.forEach(panel => {
    panel.hidden = true;
  });


  const selected =
    document.getElementById("tab-" + tabName);

  if (selected) {
    selected.hidden = false;
  }
}


// =====================================================
// 10. CHARGEMENT DES DONNÉES
// =====================================================

async function loadAllData() {

  await loadNews();
  await loadBirthdays();
  await loadGallery();
  await loadVideos();
  await loadPromotions();
}


// =====================================================
// 11. ACTUALITÉS
// =====================================================

async function loadNews() {

  const container =
    document.getElementById("admin-news");

  if (!container) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("news")
    .select("*")
    .order("date", { ascending: false });


  if (error) {

    console.error("Erreur chargement actualités :", error);

    container.innerHTML =
      "<p>Impossible de charger les actualités.</p>";

    return;
  }


  container.innerHTML = "";


  data.forEach(item => {

    const div =
      document.createElement("div");

    div.className = "admin-item";


    div.innerHTML = `
      <strong>${escapeHTML(item.title || "")}</strong>
      <small>${escapeHTML(item.date || "")}</small>
      <p>${escapeHTML(item.text || "")}</p>
    `;


    container.appendChild(div);
  });
}


async function addNews() {

  const title =
    document.getElementById("news-title").value.trim();

  const date =
    document.getElementById("news-date").value;

  const text =
    document.getElementById("news-text").value.trim();

  const image =
    document.getElementById("news-image").value.trim();


  if (!title || !date || !text) {

    alert(
      "Veuillez remplir le titre, la date et le texte."
    );

    return;
  }


  const {
    error
  } = await supabaseClient
    .from("news")
    .insert([{
      title: title,
      date: date,
      text: text,
      image: image || null
    }]);


  if (error) {

    console.error(error);

    alert(
      "Erreur lors de la publication : " +
      error.message
    );

    return;
  }


  document.getElementById("news-title").value = "";
  document.getElementById("news-date").value = "";
  document.getElementById("news-text").value = "";
  document.getElementById("news-image").value = "";


  await loadNews();
}


// =====================================================
// 12. ANNIVERSAIRES
// =====================================================

async function loadBirthdays() {

  const container =
    document.getElementById("admin-birthdays");

  if (!container) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("birthdays")
    .select("*")
    .order("date", { ascending: true });


  if (error) {

    console.error(
      "Erreur chargement anniversaires :",
      error
    );

    container.innerHTML =
      "<p>Impossible de charger les anniversaires.</p>";

    return;
  }


  container.innerHTML = "";


  data.forEach(item => {

    const div =
      document.createElement("div");

    div.className = "admin-item";


    div.innerHTML = `
      <strong>${escapeHTML(item.name || "")}</strong>
      <small>${escapeHTML(item.date || "")}</small>
      <p>${escapeHTML(item.promo || "")}</p>
    `;


    container.appendChild(div);
  });
}


async function addBirthday() {

  const name =
    document.getElementById("bd-name").value.trim();

  const date =
    document.getElementById("bd-date").value;

  const promo =
    document.getElementById("bd-promo").value.trim();


  if (!name || !date) {

    alert(
      "Veuillez entrer le nom et la date."
    );

    return;
  }


  const {
    error
  } = await supabaseClient
    .from("birthdays")
    .insert([{
      name: name,
      date: date,
      promo: promo || null
    }]);


  if (error) {

    console.error(error);

    alert(
      "Erreur lors de l'ajout : " +
      error.message
    );

    return;
  }


  document.getElementById("bd-name").value = "";
  document.getElementById("bd-date").value = "";
  document.getElementById("bd-promo").value = "";


  await loadBirthdays();
}


// =====================================================
// 13. GALERIE
// =====================================================

async function loadGallery() {

  const container =
    document.getElementById("admin-gallery");

  if (!container) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("gallery")
    .select("*")
    .order("date", { ascending: false });


  if (error) {

    console.error(
      "Erreur chargement galerie :",
      error
    );

    container.innerHTML =
      "<p>Impossible de charger la galerie.</p>";

    return;
  }


  container.innerHTML = "";


  data.forEach(item => {

    const div =
      document.createElement("div");

    div.className = "admin-item";


    div.innerHTML = `
      <strong>${escapeHTML(item.title || "")}</strong>
      <small>${escapeHTML(item.date || "")}</small>
      <p>${escapeHTML(item.image || "")}</p>
    `;


    container.appendChild(div);
  });
}


async function addGallery() {

  const title =
    document.getElementById("gal-title").value.trim();

  const image =
    document.getElementById("gal-image").value.trim();

  const date =
    document.getElementById("gal-date").value;


  if (!title || !image || !date) {

    alert(
      "Veuillez remplir le titre, l'image et la date."
    );

    return;
  }


  const {
    error
  } = await supabaseClient
    .from("gallery")
    .insert([{
      title: title,
      image: image,
      date: date
    }]);


  if (error) {

    console.error(error);

    alert(
      "Erreur lors de l'ajout : " +
      error.message
    );

    return;
  }


  document.getElementById("gal-title").value = "";
  document.getElementById("gal-image").value = "";
  document.getElementById("gal-date").value = "";


  await loadGallery();
}


// =====================================================
// 14. VIDÉOS
// =====================================================

async function loadVideos() {

  const container =
    document.getElementById("admin-videos");

  if (!container) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("videos")
    .select("*")
    .order("id", { ascending: false });


  if (error) {

    console.error(
      "Erreur chargement vidéos :",
      error
    );

    container.innerHTML =
      "<p>Impossible de charger les vidéos.</p>";

    return;
  }


  container.innerHTML = "";


  data.forEach(item => {

    const div =
      document.createElement("div");

    div.className = "admin-item";


    div.innerHTML = `
      <strong>${escapeHTML(item.title || "")}</strong>
      <p>${escapeHTML(item.url || "")}</p>
    `;


    container.appendChild(div);
  });
}


async function addVideo() {

  const title =
    document.getElementById("vid-title").value.trim();

  const url =
    document.getElementById("vid-url").value.trim();


  if (!title || !url) {

    alert(
      "Veuillez entrer le titre et le lien."
    );

    return;
  }


  const {
    error
  } = await supabaseClient
    .from("videos")
    .insert([{
      title: title,
      url: url
    }]);


  if (error) {

    console.error(error);

    alert(
      "Erreur lors de l'ajout : " +
      error.message
    );

    return;
  }


  document.getElementById("vid-title").value = "";
  document.getElementById("vid-url").value = "";


  await loadVideos();
}


// =====================================================
// 15. PROMOTIONS
// =====================================================

async function loadPromotions() {

  const container =
    document.getElementById("admin-promotions");

  if (!container) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("promotions")
    .select("*")
    .order("id", { ascending: false });


  if (error) {

    console.error(
      "Erreur chargement promotions :",
      error
    );

    container.innerHTML =
      "<p>Impossible de charger les promotions.</p>";

    return;
  }


  container.innerHTML = "";


  data.forEach(item => {

    const div =
      document.createElement("div");

    div.className = "admin-item";


    div.innerHTML = `
      <strong>${escapeHTML(item.number || "")}</strong>
      <small>${escapeHTML(item.year || "")}</small>
      <p>${escapeHTML(item.text || "")}</p>
    `;


    container.appendChild(div);
  });
}


async function addPromotion() {

  const number =
    document.getElementById("promo-number").value.trim();

  const year =
    document.getElementById("promo-year").value.trim();

  const text =
    document.getElementById("promo-text").value.trim();


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
    .insert([{
      number: number,
      year: year,
      text: text
    }]);


  if (error) {

    console.error(error);

    alert(
      "Erreur lors de l'ajout : " +
      error.message
    );

    return;
  }


  document.getElementById("promo-number").value = "";
  document.getElementById("promo-year").value = "";
  document.getElementById("promo-text").value = "";


  await loadPromotions();
}


// =====================================================
// 16. EXPORTATION DES DONNÉES
// =====================================================

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

      result[table] = [];

    } else {

      result[table] = data;
    }
  }


  const blob =
    new Blob(
      [JSON.stringify(result, null, 2)],
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
    "clan-saint-marc-donnees.json";

  link.click();


  URL.revokeObjectURL(url);
}


// =====================================================
// 17. PROTECTION CONTRE L'INJECTION HTML
// =====================================================

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// =====================================================
// 18. INITIALISATION
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    // Par défaut, seul le premier onglet est visible
    showTab("news");


    // Vérifier la session existante
    const {
      data: {
        session
      }
    } = await supabaseClient.auth.getSession();


    if (!session) {

      showLogin();

      return;
    }


    // Vérifier que la session appartient à un admin
    const admin = await checkAdmin();


    if (!admin) {

      await supabaseClient.auth.signOut();

      showLogin();

      return;
    }


    // Administrateur déjà connecté
    showDashboard(session.user);

    await loadAllData();
  }
);


// =====================================================
// 19. RENDRE LES FONCTIONS ACCESSIBLES AUX BOUTONS HTML
// =====================================================

window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;

window.showTab = showTab;

window.addNews = addNews;
window.addBirthday = addBirthday;
window.addGallery = addGallery;
window.addVideo = addVideo;
window.addPromotion = addPromotion;

window.exportData = exportData;

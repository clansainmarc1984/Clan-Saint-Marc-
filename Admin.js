// =====================================================
// ADMIN.JS — CLAN SAINT MARC
// Authentification Supabase + espace administrateur
// =====================================================

const supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// -----------------------------------------------------
// Éléments de la page
// -----------------------------------------------------

const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginMessage = document.getElementById("loginMessage");
const adminMessage = document.getElementById("adminMessage");

const logoutButton = document.getElementById("logoutButton");


// -----------------------------------------------------
// État de l'utilisateur
// -----------------------------------------------------

let currentUser = null;
let currentUserIsAdmin = false;


// -----------------------------------------------------
// Afficher un message
// -----------------------------------------------------

function showLoginMessage(message, type = "error") {
  if (!loginMessage) return;

  loginMessage.textContent = message;
  loginMessage.className = `message ${type}`;
}

function showAdminMessage(message, type = "success") {
  if (!adminMessage) return;

  adminMessage.textContent = message;
  adminMessage.className = `message ${type}`;
}


// -----------------------------------------------------
// Afficher / cacher les interfaces
// -----------------------------------------------------

function showLogin() {
  if (loginSection) {
    loginSection.style.display = "block";
  }

  if (adminSection) {
    adminSection.style.display = "none";
  }
}

function showAdmin() {
  if (loginSection) {
    loginSection.style.display = "none";
  }

  if (adminSection) {
    adminSection.style.display = "block";
  }
}


// -----------------------------------------------------
// Vérifier si l'utilisateur connecté est administrateur
// -----------------------------------------------------

async function checkAdmin() {

  if (!currentUser) {
    currentUserIsAdmin = false;
    return false;
  }

  const { data, error } = await supabaseClient.rpc("is_admin");

  if (error) {
    console.error("Erreur lors de la vérification admin :", error);

    currentUserIsAdmin = false;

    return false;
  }

  currentUserIsAdmin = data === true;

  return currentUserIsAdmin;
}


// -----------------------------------------------------
// Connexion
// -----------------------------------------------------

async function loginAdmin(event) {

  if (event) {
    event.preventDefault();
  }

  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  if (!email || !password) {
    showLoginMessage(
      "Veuillez entrer votre adresse e-mail et votre mot de passe.",
      "error"
    );

    return;
  }

  showLoginMessage("Connexion en cours...", "info");

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {

    console.error("Erreur de connexion :", error);

    showLoginMessage(
      "E-mail ou mot de passe incorrect.",
      "error"
    );

    return;
  }

  currentUser = data.user;

  // IMPORTANT :
  // On récupère réellement le résultat de la vérification.
  const admin = await checkAdmin();

  if (!admin) {

    await supabaseClient.auth.signOut();

    currentUser = null;
    currentUserIsAdmin = false;

    showLoginMessage(
      "Connexion réussie, mais ce compte n'est pas autorisé à accéder à l'administration.",
      "error"
    );

    return;
  }

  showLoginMessage("", "success");

  showAdmin();

  showAdminMessage(
    `Bienvenue ${currentUser.email}`,
    "success"
  );

  // Charger les données administratives
  await loadAdminData();
}


// -----------------------------------------------------
// Déconnexion
// -----------------------------------------------------

async function logoutAdmin() {

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error("Erreur lors de la déconnexion :", error);
    return;
  }

  currentUser = null;
  currentUserIsAdmin = false;

  showLogin();

  if (passwordInput) {
    passwordInput.value = "";
  }

  showLoginMessage(
    "Vous êtes déconnecté.",
    "success"
  );
}


// -----------------------------------------------------
// Vérification de sécurité avant toute action
// -----------------------------------------------------

function isAdmin() {
  return currentUserIsAdmin === true;
}


// -----------------------------------------------------
// Restaurer une session existante
// -----------------------------------------------------

async function restoreSession() {

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();

  if (!session || !session.user) {
    currentUser = null;
    currentUserIsAdmin = false;

    showLogin();

    return;
  }

  currentUser = session.user;

  const admin = await checkAdmin();

  if (!admin) {

    await supabaseClient.auth.signOut();

    currentUser = null;
    currentUserIsAdmin = false;

    showLogin();

    showLoginMessage(
      "Ce compte n'a pas accès à l'administration.",
      "error"
    );

    return;
  }

  showAdmin();

  showAdminMessage(
    `Bienvenue ${currentUser.email}`,
    "success"
  );

  await loadAdminData();
}


// -----------------------------------------------------
// Chargement des données administratives
// -----------------------------------------------------

async function loadAdminData() {

  if (!isAdmin()) {
    console.warn("Accès refusé : utilisateur non administrateur.");
    return;
  }

  console.log("Chargement de l'espace administrateur...");

  /*
    Les fonctions de chargement des différentes sections
    peuvent être ajoutées ici :

    await loadNews();
    await loadBirthdays();
    await loadGallery();
    await loadVideos();
    await loadPromotions();
  */

}


// -----------------------------------------------------
// Initialisation
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

  // Bouton / formulaire de connexion
  if (loginForm) {
    loginForm.addEventListener("submit", loginAdmin);
  }

  // Bouton de déconnexion
  if (logoutButton) {
    logoutButton.addEventListener("click", logoutAdmin);
  }

  // Au départ, on affiche la connexion
  showLogin();

  // Puis on vérifie si une session existe déjà
  await restoreSession();

});


// -----------------------------------------------------
// Écouter les changements d'authentification Supabase
// -----------------------------------------------------

supabaseClient.auth.onAuthStateChange(async (event, session) => {

  console.log("Auth event :", event);

  if (event === "SIGNED_OUT") {

    currentUser = null;
    currentUserIsAdmin = false;

    showLogin();

    return;
  }

  if (
    event === "SIGNED_IN" ||
    event === "INITIAL_SESSION"
  ) {

    if (!session || !session.user) {
      showLogin();
      return;
    }

    currentUser = session.user;

    const admin = await checkAdmin();

    if (!admin) {

      currentUser = null;
      currentUserIsAdmin = false;

      await supabaseClient.auth.signOut();

      showLogin();

      showLoginMessage(
        "Ce compte n'est pas autorisé à accéder à l'administration.",
        "error"
      );

      return;
    }

    showAdmin();

    await loadAdminData();
  }

});
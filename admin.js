// =====================================================
// ADMIN.JS — CLAN SAINT MARC
// Connexion administrateur avec Supabase
// =====================================================

const supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// -----------------------------------------------------
// Éléments du formulaire
// -----------------------------------------------------

const emailInput = document.getElementById("admin-email");
const passwordInput = document.getElementById("admin-password");

// On récupère le formulaire directement depuis le champ e-mail
const loginForm = emailInput ? emailInput.closest("form") : null;


// -----------------------------------------------------
// Message de connexion
// -----------------------------------------------------

function showMessage(message, type = "error") {

  let messageElement = document.getElementById("admin-login-message");

  // S'il n'existe pas dans le HTML, on le crée automatiquement
  if (!messageElement && loginForm) {

    messageElement = document.createElement("p");

    messageElement.id = "admin-login-message";

    messageElement.style.marginTop = "12px";

    loginForm.appendChild(messageElement);
  }

  if (!messageElement) return;

  messageElement.textContent = message;

  if (type === "error") {
    messageElement.style.color = "#d32f2f";
  } else if (type === "success") {
    messageElement.style.color = "#2e7d32";
  } else {
    messageElement.style.color = "#555";
  }
}


// -----------------------------------------------------
// Vérifier si l'utilisateur est administrateur
// -----------------------------------------------------

async function checkAdmin() {

  const {
    data: {
      user
    }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    return false;
  }

  const {
    data,
    error
  } = await supabaseClient.rpc("is_admin");

  if (error) {

    console.error("Erreur is_admin :", error);

    return false;
  }

  return data === true;
}


// -----------------------------------------------------
// Connexion
// -----------------------------------------------------

async function loginAdmin(event) {

  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {

    showMessage(
      "Veuillez entrer votre adresse e-mail et votre mot de passe.",
      "error"
    );

    return;
  }

  showMessage("Connexion en cours...", "info");

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


  // Vérification du statut administrateur
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

  // Chercher le tableau de bord
  const dashboard =
    document.getElementById("admin-dashboard") ||
    document.getElementById("dashboard");

  if (dashboard) {
    dashboard.style.display = "block";
  }


  // Cacher la zone de connexion si elle possède un conteneur
  const loginSection =
    document.getElementById("admin-login") ||
    document.getElementById("login-section") ||
    document.getElementById("loginSection");

  if (loginSection) {
    loginSection.style.display = "none";
  }

}


// -----------------------------------------------------
// Déconnexion
// -----------------------------------------------------

async function logoutAdmin() {

  const {
    error
  } = await supabaseClient.auth.signOut();

  if (error) {

    console.error("Erreur déconnexion :", error);

    return;
  }

  window.location.reload();
}


// -----------------------------------------------------
// Initialisation
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

  // Vérifier que les champs existent
  if (!emailInput || !passwordInput) {

    console.error(
      "ERREUR : admin-email ou admin-password introuvable."
    );

    return;
  }


  // Vérifier que le formulaire existe
  if (!loginForm) {

    console.error(
      "ERREUR : aucun formulaire trouvé autour de admin-email."
    );

    return;
  }


  // Brancher la connexion sur le formulaire
  loginForm.addEventListener("submit", loginAdmin);


  // Vérifier s'il existe déjà une session
  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();


  if (session) {

    const admin = await checkAdmin();

    if (admin) {

      const dashboard =
        document.getElementById("admin-dashboard") ||
        document.getElementById("dashboard");

      const loginSection =
        document.getElementById("admin-login") ||
        document.getElementById("login-section") ||
        document.getElementById("loginSection");

      if (dashboard) {
        dashboard.style.display = "block";
      }

      if (loginSection) {
        loginSection.style.display = "none";
      }

    }

  }

});

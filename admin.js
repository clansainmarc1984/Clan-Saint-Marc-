/* =========================================================
   CLAN SAINT MARC
   ADMIN.JS
   ========================================================= */


/* =========================================================
   1. CONNEXION SUPABASE
   ========================================================= */

const supabaseClient = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


/* =========================================================
   2. ÉLÉMENTS DE LA PAGE
   ========================================================= */

const loginBox =
  document.getElementById("login-box");

const dashboard =
  document.getElementById("dashboard");

const adminEmail =
  document.getElementById("admin-email");

const adminPassword =
  document.getElementById("admin-password");

const loginMsg =
  document.getElementById("login-msg");

const adminUser =
  document.getElementById("admin-user");


/* =========================================================
   3. MESSAGES
   ========================================================= */

function showMessage(message, type = "error") {

  if (!loginMsg) return;

  loginMsg.textContent = message;

  loginMsg.style.color =
    type === "success"
      ? "green"
      : "red";
}


/* =========================================================
   4. VÉRIFICATION ADMIN
   ========================================================= */

async function checkAdmin() {

  const {
    data,
    error
  } = await supabaseClient
    .rpc("is_admin");


  console.log("=== TEST ADMIN ===");
  console.log("RPC data :", data);
  console.log("RPC error :", error);


  if (error) {

    console.error(
      "Erreur vérification admin :",
      error
    );

    alert(
      "ERREUR RPC is_admin :\n\n" +
      error.message
    );

    return false;
  }


  return data === true;
}


/* =========================================================
   5. AFFICHER LE DASHBOARD
   ========================================================= */

function showDashboard(user) {

  if (loginBox) {
    loginBox.style.display = "none";
  }

  if (dashboard) {
    dashboard.style.display = "block";
  }

  if (adminUser && user) {

    adminUser.textContent =
      user.email || "";
  }
}


/* =========================================================
   6. AFFICHER LA CONNEXION
   ========================================================= */

function showLogin() {

  if (loginBox) {
    loginBox.style.display = "block";
  }

  if (dashboard) {
    dashboard.style.display = "none";
  }
}


/* =========================================================
   7. CONNEXION ADMIN
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


  const {
    data,
    error
  } = await supabaseClient
    .auth
    .signInWithPassword({
      email: email,
      password: password
    });


  if (error) {

    console.error(
      "Erreur connexion :",
      error
    );

    showMessage(
      error.message
    );

    return;
  }


  const user =
    data.user;


  const isAdmin =
    await checkAdmin();


  if (!isAdmin) {

    await supabaseClient
      .auth
      .signOut();

    showMessage(
      "Accès refusé : vous n'êtes pas administrateur."
    );

    return;
  }


  showDashboard(user);

  showMessage("");


  await loadAllData();
}


/* =========================================================
   8. DÉCONNEXION
   ========================================================= */

async function logoutAdmin() {

  const {
    error
  } = await supabaseClient
    .auth
    .signOut();


  if (error) {

    console.error(
      "Erreur déconnexion :",
      error
    );

    return;
  }


  showLogin();
}


/* =========================================================
   9. CHANGEMENT D'ONGLET
   ========================================================= */

function showTab(tabName) {

  const tabs =
    document.querySelectorAll(
      ".admin-tab"
    );


  tabs.forEach(function(tab) {

    tab.style.display = "none";

  });


  const selectedTab =
    document.getElementById(
      tabName
    );


  if (selectedTab) {

    selectedTab.style.display =
      "block";
  }
}


/* =========================================================
   10. CHARGER TOUTES LES DONNÉES
   ========================================================= */

async function loadAllData() {

  await loadNews();

  await loadBirthdays();

  await loadGallery();

  await loadVideos();

  await loadPromotions();
}


/* =========================================================
   11. ACTUALITÉS
   ========================================================= */

async function loadNews() {

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
      "Erreur chargement news :",
      error
    );

    return;
  }


  const container =
    document.getElementById(
      "news-list"
    );


  if (!container) {
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
        ${escapeHTML(news.title || "")}
      </h3>

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
   12. AJOUTER UNE ACTUALITÉ
   ========================================================= */

async function addNews() {

  const titleElement =
    document.getElementById(
      "news-title"
    );

  const dateElement =
    document.getElementById(
      "news-date"
    );

  const textElement =
    document.getElementById(
      "news-text"
    );

  const imageElement =
    document.getElementById(
      "news-image"
    );


  const title =
    titleElement
      ? titleElement.value.trim()
      : "";


  const date =
    dateElement
      ? dateElement.value
      : "";


  const text =
    textElement
      ? textElement.value.trim()
      : "";


  const image =
    imageElement
      ? imageElement.value.trim()
      : "";


  if (!title || !date || !text) {

    alert(
      "Veuillez remplir le titre, la date et le texte."
    );

    return;
  }


  console.log(
    "Publication de l'actualité :",
    {
      title: title,
      date: date,
      content: text,
      image: image
    }
  );


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("news")
      .insert([
        {
          title: title,
          date: date,
          content: text,
          image: image || null
        }
      ])
      .select();


    if (error) {

      console.error(
        "ERREUR SUPABASE NEWS :",
        error
      );


      alert(
        "Erreur Supabase :\n\n" +
        error.message
      );


      return;
    }


    console.log(
      "Publication réussie :",
      data
    );


    if (titleElement) {
      titleElement.value = "";
    }


    if (dateElement) {
      dateElement.value = "";
    }


    if (textElement) {
      textElement.value = "";
    }


    if (imageElement) {
      imageElement.value = "";
    }


    alert(
      "Actualité publiée avec succès !"
    );


    await loadNews();

  }

  catch (error) {

    console.error(
      "ERREUR RÉSEAU :",
      error
    );


    alert(
      "Impossible de contacter Supabase.\n\n" +
      error
    );
  }
}


/* =========================================================
   13. ANNIVERSAIRES
   ========================================================= */

async function loadBirthdays() {

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
      "Erreur chargement birthdays :",
      error
    );

    return;
  }


  const container =
    document.getElementById(
      "birthdays-list"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  (data || []).forEach(function(birthday) {

    const item =
      document.createElement("div");


    item.className =
      "admin-item";


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


  await loadBirthdays();
}


/* =========================================================
   14. GALERIE
   ========================================================= */

async function loadGallery() {

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
      "Erreur chargement galerie :",
      error
    );

    return;
  }


  const container =
    document.getElementById(
      "gallery-list"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  (data || []).forEach(function(photo) {

    const item =
      document.createElement("div");


    item.className =
      "admin-item";


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


  await loadGallery();
}


/* =========================================================
   15. VIDÉOS
   ========================================================= */

async function loadVideos() {

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


  const container =
    document.getElementById(
      "videos-list"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  (data || []).forEach(function(video) {

    const item =
      document.createElement("div");


    item.className =
      "admin-item";


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


  await loadVideos();
}


/* =========================================================
   16. PROMOTIONS
   ========================================================= */

async function loadPromotions() {

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
      "Erreur chargement promotions :",
      error
    );

    return;
  }


  const container =
    document.getElementById(
      "promotions-list"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  (data || []).forEach(function(promotion) {

    const item =
      document.createElement("div");


    item.className =
      "admin-item";


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


async function addPromotion() {

  const number =
    document
      .getElementById("promotion-number")
      ?.value
      .trim() || "";


  const year =
    document
      .getElementById("promotion-year")
      ?.value || "";


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


  await loadPromotions();
}


/* =========================================================
   17. EXPORTATION DES DONNÉES
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


    result[table] =
      data || [];
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
   18. PROTECTION HTML
   ========================================================= */

function escapeHTML(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


/* =========================================================
   19. AU CHARGEMENT DE LA PAGE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    showTab("news");


    const {
      data
    } = await supabaseClient
      .auth
      .getSession();


    const session =
      data.session;


    if (!session) {

      showLogin();

      return;
    }


    const user =
      session.user;


    const isAdmin =
      await checkAdmin();


    if (!isAdmin) {

      await supabaseClient
        .auth
        .signOut();

      showLogin();

      return;
    }


    showDashboard(user);


    await loadAllData();

  }
);


/* =========================================================
   20. FONCTIONS ACCESSIBLES À admin.html
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
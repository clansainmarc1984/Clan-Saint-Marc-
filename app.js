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

    return true;

  } catch (error) {

    console.error(
      "Erreur Supabase :",
      error
    );

    return false;
  }
}


/* ===============================
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


/* ===============================
   CHARGEMENT PUBLIC
================================ */

async function loadData() {

  if (!supabaseClient) {
    return;
  }

  try {

    const results =
      await Promise.all(

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

  } catch (error) {

    console.error(
      "Erreur de chargement :",
      error
    );

  }
}


/* ===============================
   AFFICHAGE
================================ */

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
              ${esc(x.content)}
            </p>

            ${
              x.image
                ? `
                  <img
                    src="${escAttr(x.image)}"
                    alt=""
                    style="
                      width:100%;
                      border-radius:12px;
                      margin-top:12px;
                      max-height:260px;
                      object-fit:cover;
                    "
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
              Les actualités publiées apparaîtront ici.
            </p>

          </div>

        `;
  }


  /* ANNIVERSAIRES */

  const bd =
    document.getElementById(
      "birthday-list"
    );

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

            })
            .join("")

        : `

          <div class="empty">

            <span>🎉</span>

            <h3>
              Les anniversaires du Clan
            </h3>

            <p>
              Les anniversaires publiés apparaîtront ici.
            </p>

          </div>

        `;
  }


  /* GALERIE */

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

            <h3>
              La galerie est prête
            </h3>

            <p>
              Les photos publiées apparaîtront ici.
            </p>

          </div>

        `;
  }


  /* VIDÉOS */

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
                rel="noopener noreferrer"
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
              Les vidéos publiées apparaîtront ici.
            </p>

          </div>

        `;
  }
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

    if (supabaseClient) {
      await loadData();
    }

  }
);

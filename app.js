const emptyData = {news:[], birthdays:[], gallery:[], videos:[], promotions:[]};
let data = structuredClone(emptyData);
let supabaseClient = null;
const TABLES = Object.keys(emptyData);

function configured(){ return window.SUPABASE_URL && window.SUPABASE_ANON_KEY}
function initDb(){
  if(configured() && window.supabase){ supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY); }
}
async function loadData(){
  if(!supabaseClient){ renderAll(); return; }
  try{
    const results = await Promise.all(TABLES.map(async t=>{
      const {data: rows,error}=await supabaseClient.from(t).select('*').order('created_at',{ascending:false});
      if(error) throw error;
      return [t, rows || []];
    }));
    data=Object.fromEntries(results);
    renderAll();
  }catch(e){ console.error(e); renderAll(); document.getElementById('login-msg').textContent='Base de données non disponible : '+e.message; }
}
async function requireAuth(){
  if(!supabaseClient){ alert('Configure d’abord config.js avec ton projet Supabase.'); return false; }
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(!session){ document.getElementById('login-msg').textContent='Connecte-toi pour administrer le site.'; return false; }
  return true;
}
function toggleMenu(){document.getElementById('menu').classList.toggle('open')}
function closeMenu(){document.getElementById('menu').classList.remove('open')}
async function loginAdmin(){
  if(!supabaseClient){document.getElementById('login-msg').textContent='Supabase n’est pas encore configuré.';return;}
  const email=val('admin-email'), password=val('admin-pass');
  if(!email||!password){document.getElementById('login-msg').textContent='Entre ton e-mail et ton mot de passe.';return;}
  const {error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error){document.getElementById('login-msg').textContent='Connexion refusée : '+error.message;return;}
  document.getElementById('login-box').hidden=true;document.getElementById('dashboard').hidden=false;renderAdmin();
}
async function logoutAdmin(){if(supabaseClient) await supabaseClient.auth.signOut();document.getElementById('login-box').hidden=false;document.getElementById('dashboard').hidden=true;document.getElementById('admin-pass').value=''}
function showTab(name){document.querySelectorAll('.tab-panel').forEach(x=>x.hidden=true);document.getElementById('tab-'+name).hidden=false}
function val(id){return document.getElementById(id).value.trim()}
async function addRow(table,row){
  if(!(await requireAuth()))return;
  const {error}=await supabaseClient.from(table).insert(row);
  if(error){alert('Erreur : '+error.message);return;}
  await loadData();renderAdmin();
}
async function addNews(){if(!val('news-title')||!val('news-text'))return alert('Ajoute un titre et un texte.');await addRow('news',{title:val('news-title'),date:val('news-date')||null,text:val('news-text'),image:val('news-image')||null});['news-title','news-date','news-text','news-image'].forEach(id=>document.getElementById(id).value='')}
async function addBirthday(){if(!val('bd-name')||!val('bd-date'))return alert('Ajoute le nom et la date.');await addRow('birthdays',{name:val('bd-name'),date:val('bd-date'),promo:val('bd-promo')||null});['bd-name','bd-date','bd-promo'].forEach(id=>document.getElementById(id).value='')}
async function addGallery(){if(!val('gal-image'))return alert("Ajoute l'URL de l'image.");await addRow('gallery',{title:val('gal-title')||null,image:val('gal-image'),date:val('gal-date')||null});['gal-title','gal-image','gal-date'].forEach(id=>document.getElementById(id).value='')}
async function addVideo(){if(!val('vid-title')||!val('vid-url'))return alert('Ajoute le titre et le lien.');await addRow('videos',{title:val('vid-title'),url:val('vid-url')});['vid-title','vid-url'].forEach(id=>document.getElementById(id).value='')}
async function addPromotion(){if(!val('promo-number')||!val('promo-year'))return alert('Ajoute le numéro et l’année.');await addRow('promotions',{number:val('promo-number'),year:val('promo-year'),text:val('promo-text')||null});['promo-number','promo-year','promo-text'].forEach(id=>document.getElementById(id).value='')}
async function del(type,id){if(!confirm('Supprimer cet élément ?'))return;if(!(await requireAuth()))return;const {error}=await supabaseClient.from(type).delete().eq('id',id);if(error)return alert('Erreur : '+error.message);await loadData();renderAdmin()}
function renderAll(){
  const news=document.getElementById('news-list'); news.innerHTML=data.news.length?data.news.map(x=>`<article class="card"><p class="eyebrow">${esc(x.date||'')}</p><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p>${x.image?`<img style="width:100%;border-radius:12px;margin-top:12px;max-height:260px;object-fit:cover" src="${escAttr(x.image)}" alt="">`:''}</article>`).join(''):`<div class="empty"><span>📰</span><h3>Aucune actualité publiée</h3><p>Ajoute ta première actualité depuis l'espace d'administration.</p></div>`;
  const bd=document.getElementById('birthday-list'); bd.innerHTML=data.birthdays.length?data.birthdays.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(x=>{let d=new Date(x.date+'T12:00:00');return `<article class="birthday"><div class="date">${d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</div><div><strong>${esc(x.name)}</strong><small>${esc(x.promo||'Membre du Clan')}</small></div></article>`}).join(''):`<div class="empty"><span>🎉</span><h3>Les anniversaires du Clan</h3><p>Ajoute les membres et leurs dates depuis l'administration.</p></div>`;
  const gal=document.getElementById('gallery-list'); gal.innerHTML=data.gallery.length?data.gallery.map(x=>`<figure class="gallery-item"><img src="${escAttr(x.image)}" alt="${escAttr(x.title||'Photo du Clan')}"><figcaption>${esc(x.title||'Moment du Clan')}</figcaption></figure>`).join(''):`<div class="empty" style="grid-column:1/-1"><span>📷</span><h3>La galerie est prête</h3><p>Ajoute tes photos depuis l'administration.</p></div>`;
  const vid=document.getElementById('video-list'); vid.innerHTML=data.videos.length?data.videos.map(x=>`<article class="video-card"><h3>${esc(x.title)}</h3><a href="${escAttr(x.url)}" target="_blank" rel="noopener">Voir la vidéo ↗</a></article>`).join(''):`<div class="empty"><span>🎥</span><h3>Aucune vidéo ajoutée</h3><p>Ajoute un lien vidéo depuis l'administration.</p></div>`;
}
function renderAdmin(){const maps={news:'title',birthdays:'name',gallery:'title',videos:'title',promotions:'number'};Object.keys(maps).forEach(type=>{const el=document.getElementById('admin-'+type);if(!el)return;el.innerHTML=data[type].map(x=>`<div class="admin-item"><span>${esc(x[maps[type]]||'Sans titre')}</span><button onclick="del('${type}','${x.id}')">Supprimer</button></div>`).join('')||"<p class='hint'>Aucun élément.</p>"})}
function exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='clan-saint-marc-donnees.json';a.click();URL.revokeObjectURL(a.href)}
function importData(){alert('L’import JSON est désactivé pour éviter d’écraser accidentellement la base en ligne. Ajoute les contenus depuis le tableau de bord.')}
function resetData(){alert('La suppression globale n’est pas activée depuis le site. Supprime les éléments un par un depuis le tableau de bord.')}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function escAttr(s=''){return esc(s)}
initDb();loadData();

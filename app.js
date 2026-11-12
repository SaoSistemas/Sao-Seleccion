// =====================================================================================
// SÃO — Portal de Selección y RRHH (app.js)  ·  v5.3 (MDP + Carga Manual + Resize)
// =====================================================================================

const WEBAPP_BASE = "https://script.google.com/macros/s/AKfycbyJImmL7EyVuQ8k9x736rsRrlEriya7-8WsqJznHA3BHx_OYFaoPRYM99h9NVthVKD11g/exec";
const TOKEN_STORAGE_KEY = "sao_auth_token_v1";
let tokenActual = "";

const AUTOSYNC_INTERVALO_MS = 30 * 1000;
const CHUNK = 1500;
const MAX_CARDS = 100;
const PEND_KEY = "sao_pend_v1";
const GEO_DELAY_MS = 1100;

const ESTADOS_ACTIVOS = ["Pendiente", "Recomendado", "Entrevista"];
const NOMBRE_ESTADO = { Pendiente: "Pendiente", Recomendado: "Recomendado", Entrevista: "Entrevista", NoGusto: "No gustó", Contratado: "Contratado", Rechazado: "Rechazado" };
const COLOR_ESTADO = { Pendiente: "#7f8c8d", Recomendado: "#f1c40f", Entrevista: "#3498db", NoGusto: "#e67e22", Contratado: "#2ecc71", Rechazado: "#e74c3c" };
const SECTORES = { locales: "Locales", produccion: "Producción", logistica: "Logística" };

const BBOX = {
  mdp:   [-38.28, -57.90, -37.80, -57.40],
  costa: [-38.45, -58.10, -36.80, -56.60]
};

const LOCALES_SAO = [
  { id: "pinamar", nombre: "Pinamar", zona: "mdp", direccion: "Av. Arq. Jorge Bunge 1055, Pinamar", lat: -37.1121868, lng: -56.8662241, pat: /pinamar/ },
  { id: "chapadmalal", nombre: "Chapadmalal", zona: "mdp", direccion: "Chapadmalal", lat: -38.173056, lng: -57.651944, pat: /chapadmalal/ },
  { id: "mar_de_las_pampas", nombre: "Mar de las Pampas", zona: "mdp", direccion: "Mar de las Pampas, Villa Gesell", lat: -37.3257858, lng: -57.0222331, pat: /pampas/ },
  { id: "alfar", nombre: "Alfar", zona: "mdp", direccion: "Guillermo Magrassi 4885, Alfar", lat: -38.1003796, lng: -57.5612371, pat: /alfar|magrassi/ },
  { id: "diagonal", nombre: "Diagonal", zona: "mdp", direccion: "Diagonal Pueyrredón 2989", lat: -37.9987567, lng: -57.5502357, pat: /diagonal/ },
  { id: "constitucion", nombre: "Constitución", zona: "mdp", direccion: "Av. Constitución 4298", lat: -37.9695491, lng: -57.5467467, pat: /constitucion 4298|constitucion$/ },
  { id: "las_palmeras", nombre: "Las Palmeras", zona: "mdp", direccion: "Av. Constitución 6690", lat: -37.957343, lng: -57.5706836, pat: /constitucion 6690|palmeras/ },
  { id: "playa_grande", nombre: "Playa Grande", zona: "mdp", direccion: "Playa Grande (Balneario 8)", lat: -38.0277922, lng: -57.5323172, pat: /playa grande/ },
  { id: "tienda_leon", nombre: "Tienda León", zona: "mdp", direccion: "Av. Pedro Luro 5550", lat: -37.9837151, lng: -57.576151, pat: /luro 5550|tienda leon/ },
  { id: "peatonal", nombre: "Peatonal", zona: "mdp", direccion: "Peatonal San Martín 2468", lat: -38.0001889, lng: -57.5456374, pat: /peatonal/ },
  { id: "paso", nombre: "Paso", zona: "mdp", direccion: "Av. Juan José Paso 3004", lat: -38.0173866, lng: -57.5670633, pat: /juan jose paso|\bpaso\b/ },
  { id: "chauvin", nombre: "Chauvin", zona: "mdp", direccion: "Hipólito Yrigoyen 3192", lat: -38.0098698, lng: -57.5593746, pat: /yrigoyen|chauvin/ },
  { id: "alem", nombre: "Alem", zona: "mdp", direccion: "Leandro N. Alem 3883", lat: -38.0288428, lng: -57.5371325, pat: /alem 3883|\balem\b/ },
  { id: "edison", nombre: "Edison", zona: "mdp", direccion: "Av. Edison 1821", lat: -38.0511406, lng: -57.5600539, pat: /edison/ },
  { id: "olavarria", nombre: "Olavarría", zona: "mdp", direccion: "Olavarría 3002", lat: -38.0160937, lng: -57.5433462, pat: /olavarria/ },
  { id: "aldrey", nombre: "Aldrey", zona: "mdp", direccion: "Sarmiento 2646 (Paseo Aldrey)", lat: -38.0122446, lng: -57.5428786, pat: /aldrey/ },
  { id: "bendu", nombre: "Bendu", zona: "mdp", direccion: "Av. de los Trabajadores 150", lat: -38.0424496, lng: -57.5427405, pat: /bendu/ }
];

// ---------------------------------------------------------------- estado global
let headersCrudos = [];
let filasCrudas = [];
let personas = [];
let porId = new Map();
let estadosServidor = {};
let pendientes = {};
let geoCache = {};
let geoFallos = new Set();
let geoCorriendo = false;
let mapInstance = null;
let markersGroup = L.layerGroup();
let localesLayer = L.layerGroup();
let radioLayer = L.layerGroup();
let markerPorId = new Map();
let chipEstado = "activos";
let cardsLimit = MAX_CARDS;
let sincronizando = false;
let personaModal = null;
let syncTimer = null;

// ---------------------------------------------------------------- utilidades
function $(id) { return document.getElementById(id); }
function sinTildes(s) { return String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function dormir(ms) { return new Promise(r => setTimeout(r, ms)); }
function fmtFecha(d) { return d ? d.toLocaleDateString("es-AR") : "-"; }

function toast(msg, error) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast" + (error ? " error" : "");
  t.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.style.display = "none"; }, 3500);
}

function setCarga(msg) {
  const el = $("cargaStatus");
  if (!el) return;
  el.textContent = msg || "";
  el.style.display = msg ? "block" : "none";
}

function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function parseFecha(s) {
  if (!s) return null;
  const d = new Date(String(s).replace(" ", "T"));
  return isNaN(d) ? null : d;
}

function edadDe(nac) {
  if (!nac) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
  return (e > 10 && e < 90) ? e : null;
}

function telefonoWa(tel) {
  let d = String(tel || "").replace(/\D/g, "").replace(/^0+/, "");
  if (!d) return "";
  if (d.startsWith("549")) return d;
  if (d.startsWith("54")) return "549" + d.slice(2);
  if (d.length === 12 && /^\d{2,4}15/.test(d)) {
    for (const n of [3, 2, 4]) { if (d.slice(n, n + 2) === "15" && d.length - 2 === 10) { d = d.slice(0, n) + d.slice(n + 2); break; } }
  }
  if (d.length === 10) return "549" + d;
  return d.length >= 10 ? "54" + d : "";
}

// ---------------------------------------------------------------- red (Apps Script)
function getWebappUrl() {
  return WEBAPP_BASE + "?token=" + encodeURIComponent(tokenActual);
}

async function apiGet(action, extra) {
  let url = getWebappUrl() + "&action=" + action;
  if (extra) for (const k in extra) url += "&" + k + "=" + encodeURIComponent(extra[k]);
  const r = await fetch(url);
  const j = await r.json();
  if (j && j.error) throw new Error(j.error);
  return j;
}

async function apiPost(action, items) {
  const r = await fetch(getWebappUrl() + "&action=" + action, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ items })
  });
  const j = await r.json();
  if (j && j.error) throw new Error(j.error);
  return j;
}

// ---------------------------------------------------------------- seguridad / login
function cerrarSesion() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  tokenActual = "";
  if (syncTimer) clearInterval(syncTimer);
  location.reload();
}

async function intentarLogin(claveIngresada) {
  const btn = $("btnLoginEntrar");
  const errEl = $("loginErrorMsg");
  const cleanKey = String(claveIngresada || "").trim();
  if (!cleanKey) return;

  btn.disabled = true;
  btn.textContent = "Verificando...";
  errEl.style.display = "none";

  tokenActual = cleanKey;
  try {
    // 1. Validamos la clave con una consulta rápida
    await apiGet("estados");
    
    // 2. Guardamos la clave y ocultamos el bloqueo INMEDIATAMENTE
    localStorage.setItem(TOKEN_STORAGE_KEY, tokenActual);
    const overlay = $("loginOverlay");
    if (overlay) {
      overlay.style.setProperty("display", "none", "important");
    }
    
    // 3. Ahora sí descargamos la planilla viendo el progreso en pantalla
    iniciarAppAutenticada();
  } catch (e) {
    tokenActual = "";
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    errEl.textContent = e.message.includes("No autorizado") ? "Clave incorrecta." : ("Error: " + e.message);
    errEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Ingresar";
  }
}

// ---------------------------------------------------------------- UI: Colapsar y redimensionar barra lateral
function togglePanelFiltros() {
  const panel = $("panelFiltrosColapsable");
  const btn = $("btnToggleFiltros");
  if (!panel || !btn) return;
  const oculto = panel.classList.toggle("collapsed");
  btn.textContent = oculto ? "▼ Mostrar filtros" : "▲ Ocultar filtros";
}

function initSidebarResizer() {
  const sidebar = $("sidebarSplit");
  const resizer = $("sidebarResizer");
  if (!sidebar || !resizer) return;

  let arrastrando = false;

  resizer.addEventListener("mousedown", (e) => {
    arrastrando = true;
    resizer.classList.add("resizing");
    document.body.style.cursor = "ew-resize";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!arrastrando) return;
    const nuevoAncho = Math.min(Math.max(e.clientX, 340), window.innerWidth * 0.75);
    sidebar.style.width = nuevoAncho + "px";
  });

  document.addEventListener("mouseup", () => {
    if (!arrastrando) return;
    arrastrando = false;
    resizer.classList.remove("resizing");
    document.body.style.cursor = "";
    if (mapInstance) mapInstance.invalidateSize();
  });
}

// ---------------------------------------------------------------- carga manual de postulante
function abrirModalNuevo() {
  const form = $("formNuevoPostulante");
  if (form) form.reset();
  const m = $("nuevoModal");
  if (m) m.style.display = "flex";
}

function cerrarModalNuevo() {
  const m = $("nuevoModal");
  if (m) m.style.display = "none";
}

async function guardarNuevoPostulante(e) {
  e.preventDefault();
  const btn = $("btnGuardarNuevo");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  const nombre = $("newNombre").value.trim();
  const tel = $("newTel").value.trim();
  const email = $("newEmail").value.trim().toLowerCase();
  const dir = $("newDir").value.trim();
  const nac = $("newNac").value;
  const sector = $("newSector").value;
  const puesto = $("newPuesto").value.trim() || "Referido / Manual";
  const local = $("newLocal").value;
  const estado = $("newEstado").value;
  const nota = $("newNota").value.trim();
  const ahoraStr = new Date().toISOString().replace("T", " ").slice(0, 19);

  // Construimos una fila respetando los encabezados reales de la planilla
  const nuevaFila = headersCrudos.map(h => {
    const k = sinTildes(h);
    if (k.includes("marca temporal")) return ahoraStr;
    if (k.includes("nombre completo")) return nombre;
    if (k.includes("fecha de nacimiento")) return nac;
    if (k === "correo electronico" || k.includes("direccion de correo")) return email;
    if (k === "direccion") return dir;
    if (k.includes("telefono")) return tel;
    if (k.includes("puesto de interes")) return puesto;
    if (k.includes("cual de nuestros locales")) return local;
    if (k.includes("buscas sumarte")) return sector;
    if (k.includes("desde donde te contactas")) return "Mar del Plata (Carga manual)";
    if (k.includes("queres agregar")) return nota;
    return "";
  });

  try {
    // 1. Intentamos guardarlo en Google Sheets vía Apps Script
    await apiPost("agregar", [{
      ts: ahoraStr, nombre, nac, email, dir, tel,
      sector, puesto, local, estado, nota, fila: nuevaFila
    }]);

    // 2. Lo sumamos localmente de inmediato
    filasCrudas.push(nuevaFila);
    construirPersonas();

    const tel10 = tel.replace(/\D/g, "").slice(-10);
    const idPersona = email ? "e:" + email : (tel10.length >= 8 ? "t:" + tel10 : "n:" + sinTildes(nombre));
    setEstado(idPersona, estado, nota);

    toast("Postulante cargado ✔");
    cerrarModalNuevo();
    renderTodo();
    geocodificarPendientes();
  } catch (err) {
    toast("No se pudo guardar en Sheets: " + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar postulante";
  }
}

// ---------------------------------------------------------------- domicilios y zonas (OPTIMIZADO MDP)
function limpiarDireccion(dir) {
  let d = String(dir || "").replace(/\([^)]*\)/g, " ").split("//")[0];
  d = d.replace(/\b(piso|pb|depto|dpto|dto|departamento|torre|monoblock|mza|mz|manzana|lote|casa|timbre)\b.*$/i, " ");
  d = d.replace(/\bmar del plata\b|\bmdp\b|\bargentina\b|\bpcia\.?\s*de\s*buenos\s*aires\b/ig, " ");
  return d.replace(/[,;.\s]+$/, "").replace(/\s+/g, " ").trim();
}

const RE_COSTA = /\b(pinamar|gesell|miramar|santa clara|mar chiquita|mar de las pampas|las gaviotas|mar azul|cariloo?|ostende|valeria del mar|san bernardo|la lucila|santa teresita|mar del tuyu|costa azul)\b/;

function zonaDe(contacto, dir) {
  const d = sinTildes(dir);
  if (d && RE_COSTA.test(d)) return "costa";
  return "mdp";
}

function geoZona(zona, dir) {
  return RE_COSTA.test(sinTildes(dir)) ? "costa" : "mdp";
}

function claveGeo(dir, gz) { return gz + "|" + sinTildes(limpiarDireccion(dir)); }

// ---------------------------------------------------------------- geocodificación (OpenStreetMap / Nominatim)
async function consultarNominatim(q, bb) {
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=4&countrycodes=ar&accept-language=es&bounded=1" +
    "&viewbox=" + [bb[1], bb[2], bb[3], bb[0]].join(",") + "&q=" + encodeURIComponent(q);
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

const TIPOS_VAGOS = ["city", "town", "village", "state", "county", "country", "municipality", "state_district", "region", "postcode"];

function elegirResultado(lista, bb, tieneNumero) {
  for (const x of lista || []) {
    const lat = parseFloat(x.lat), lng = parseFloat(x.lon);
    if (isNaN(lat) || isNaN(lng)) continue;
    if (lat < bb[0] || lat > bb[2] || lng < bb[1] || lng > bb[3]) continue;
    if (TIPOS_VAGOS.indexOf(x.addresstype) >= 0) continue;
    const exacto = x.type === "house" || x.addresstype === "house" || x.category === "building";
    const calle = x.category === "highway" || x.addresstype === "road";
    return { lat, lng, tipo: exacto ? "OK" : (calle ? (tieneNumero ? "CALLE" : "APROX") : "APROX") };
  }
  return null;
}

async function geocodificarDireccion(dir, gz) {
  const base = limpiarDireccion(dir);
  if (!base) return { lat: null, lng: null, tipo: "NO" };
  const bb = BBOX[gz] || BBOX.mdp;
  const ciudad = gz === "costa" ? ", Buenos Aires, Argentina" : ", Mar del Plata, Buenos Aires";
  const variantes = [base];
  const sinBarrio = base.replace(/\b(barrio|bº|b°|bo)\b.*$/i, "").trim();
  if (sinBarrio && sinBarrio !== base && sinBarrio.length > 4) variantes.push(sinBarrio);
  
  for (let i = 0; i < variantes.length; i++) {
    if (i > 0) await dormir(GEO_DELAY_MS);
    const lista = await consultarNominatim(variantes[i] + ciudad, bb);
    const res = elegirResultado(lista, bb, /\d/.test(variantes[i]));
    if (res) return res;
  }
  return { lat: null, lng: null, tipo: "NO" };
}

async function geocodificarPendientes() {
  if (geoCorriendo) return;
  geoCorriendo = true;
  const aGuardar = [];
  let errores = 0, hechos = 0;
  try {
    const vistos = new Set();
    const cola = personas
      .filter(p => p.dir && p.geoKey && !(p.geoKey in geoCache) && !geoFallos.has(p.geoKey))
      .sort((a, b) => (ESTADOS_ACTIVOS.includes(b.estado) - ESTADOS_ACTIVOS.includes(a.estado)) || (b.lastTs - a.lastTs))
      .filter(p => !vistos.has(p.geoKey) && vistos.add(p.geoKey));

    for (let i = 0; i < cola.length; i++) {
      const p = cola[i];
      if (p.geoKey in geoCache) continue;
      setCarga("📍 Ubicando domicilios nuevos… quedan " + (cola.length - i));
      try {
        const res = await geocodificarDireccion(p.dir, p.geoZona);
        geoCache[p.geoKey] = res;
        aGuardar.push({ key: p.geoKey, lat: res.lat, lng: res.lng, tipo: res.tipo });
        errores = 0; hechos++;
      } catch (err) {
        geoFallos.add(p.geoKey);
        errores++;
        if (errores >= 3) { setCarga("⚠️ El servicio de mapas no responde. Se reintenta en la próxima sincronización."); break; }
        await dormir(5000);
      }
      if (aGuardar.length >= 15) { await guardarGeoLote(aGuardar); }
      if (hechos > 0 && hechos % 25 === 0) renderTodo();
      await dormir(GEO_DELAY_MS);
    }
  } finally {
    await guardarGeoLote(aGuardar);
    geoCorriendo = false;
    if (errores < 3) setCarga("");
    if (hechos > 0) renderTodo();
  }
}

async function guardarGeoLote(arr) {
  if (!arr.length) return;
  const lote = arr.splice(0, arr.length);
  try { await apiPost("geo_guardar", lote); }
  catch (e) { Array.prototype.push.apply(arr, lote); }
}

async function cargarGeo() {
  try {
    const nuevas = await apiGet("geo");
    if (Array.isArray(nuevas)) nuevas.forEach(g => {
      if (!g.key) return;
      geoCache[g.key] = (g.lat == null || g.lng == null) ? { lat: null, lng: null, tipo: "NO" } : { lat: g.lat, lng: g.lng, tipo: g.tipo || "OK" };
    });
  } catch (e) {}
  try {
    const viejas = await apiGet("geoviejo");
    if (Array.isArray(viejas)) viejas.forEach(v => {
      const dir = v[0], lat = v[1], lng = v[2];
      if (!limpiarDireccion(dir)) return;
      const gz = geoZona("mdp", dir);
      const bb = BBOX[gz] || BBOX.mdp;
      if (lat < bb[0] || lat > bb[2] || lng < bb[1] || lng > bb[3]) return;
      const k = claveGeo(dir, gz);
      if (!(k in geoCache)) geoCache[k] = { lat, lng, tipo: "OK" };
    });
  } catch (e) {}
}

// ---------------------------------------------------------------- armado de personas
function localesDe(texto) {
  const t = sinTildes(texto);
  if (!t) return [];
  return LOCALES_SAO.filter(l => l.pat.test(t)).map(l => l.id);
}

function categoriaExperiencia(p) {
  const t = sinTildes([p.notas, p.dondeTrab].join(" "));
  if (/camarer|mozo|moza|cocin|barista|gastronom|restaur|pizz|heladeri|cafeteri|\bbar\b/.test(t)) return "gastronomia";
  if (/venta|vendedor|atencion|cajer|comercio|kiosco|tienda|promotor|reposit|local/.test(t)) return "ventas";
  if (/primer/.test(sinTildes(p.puesto)) || !t) return "ninguna";
  return "otra";
}
const NOMBRE_EXP = { gastronomia: "Gastronomía", ventas: "Atención / ventas", ninguna: "Sin experiencia declarada", otra: "Otra experiencia" };

function construirPersonas() {
  const H = headersCrudos.map(sinTildes);
  const f = fn => H.findIndex(fn);
  const C = {
    ts: f(h => h.includes("marca temporal")), nombre: f(h => h.includes("nombre completo")),
    nac: f(h => h.includes("fecha de nacimiento")), emailForm: f(h => h.includes("direccion de correo")),
    email: f(h => h === "correo electronico"), dir: f(h => h === "direccion"), tel: f(h => h.includes("telefono")),
    estudia: f(h => h.includes("estas estudiando")), dondeEst: f(h => h.includes("si tu respuesta fue si")),
    carrera: f(h => h.includes("carrera")), notas: f(h => h.includes("queres agregar")),
    trabaja: f(h => h.includes("estas trabajando actualmente")), dondeTrab: f(h => h.startsWith("si estas trabajando")),
    puesto: f(h => h.includes("puesto de interes")), locales: f(h => h.includes("cual de nuestros locales")),
    cv: f(h => h.includes("cv")), sector: f(h => h.includes("buscas sumarte")), contacto: f(h => h.includes("desde donde te contactas"))
  };

  const grupos = new Map();
  let totalPost = 0;
  filasCrudas.forEach(r => {
    const g = i => (i >= 0 && r[i] != null) ? String(r[i]).trim() : "";
    const nombre = g(C.nombre), tsStr = g(C.ts);
    if (!nombre && !tsStr) return;
    totalPost++;
    const post = {
      ts: parseFecha(tsStr), nombre, nac: parseFecha(g(C.nac)),
      email: (g(C.email) || g(C.emailForm)).toLowerCase(), dir: g(C.dir), tel: g(C.tel),
      estudia: g(C.estudia), dondeEst: g(C.dondeEst), carrera: g(C.carrera), notas: g(C.notas),
      trabaja: g(C.trabaja), dondeTrab: g(C.dondeTrab), puesto: g(C.puesto), locales: g(C.locales),
      cv: g(C.cv), sector: g(C.sector), contacto: g(C.contacto), fila: r
    };
    const tel10 = post.tel.replace(/\D/g, "").slice(-10);
    const key = post.email ? "e:" + post.email : (tel10.length >= 8 ? "t:" + tel10 : "n:" + sinTildes(nombre));
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key).push(post);
  });

  const ahora = new Date();
  personas = [];
  porId = new Map();
  grupos.forEach((posts, id) => {
    posts.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const ult = posts[0];
    const pick = k => { for (const x of posts) if (x[k]) return x[k]; return ""; };
    const p = {
      id, posts, nombre: ult.nombre || "Sin nombre", dir: pick("dir"), tel: pick("tel"), email: pick("email"),
      nac: pick("nac") || null, estudia: ult.estudia, dondeEst: ult.dondeEst, carrera: ult.carrera, notas: ult.notas,
      trabaja: ult.trabaja, dondeTrab: ult.dondeTrab, puesto: ult.puesto || "", locales: ult.locales || "",
      contacto: ult.contacto, lastTs: ult.ts || new Date(0), firstTs: posts[posts.length - 1].ts || new Date(0)
    };
    const sec = sinTildes(ult.sector);
    p.sector = sec.includes("produc") ? "produccion" : sec.includes("logist") ? "logistica" : "locales";
    p.zona = zonaDe(p.contacto, p.dir);
    p.geoZona = geoZona(p.zona, p.dir);
    p.geoKey = p.dir ? claveGeo(p.dir, p.geoZona) : "";
    p.edad = edadDe(p.nac);
    p.localesIds = localesDe(p.locales);
    p.exp = categoriaExperiencia(p);
    const textoB1 = sinTildes([p.notas, p.dondeTrab, p.dondeEst].join(" "));
    p.b1 = /\bb[ .-]?1\b|licencia profesional|carnet profesional/.test(textoB1) ? "si" : "no";
    p.texto = sinTildes([p.nombre, p.puesto, p.carrera, p.dondeEst, p.dondeTrab, p.dir, p.tel, p.email, p.locales].join(" "));
    const st = estadosServidor[id];
    p.estado = (st && st.estado) || "Pendiente";
    p.nota = (st && st.nota) || "";
    if (pendientes[id]) { p.estado = pendientes[id].estado; p.nota = pendientes[id].nota; }
    p.dias = Math.floor((ahora - p.lastTs) / 86400000);
    personas.push(p);
    porId.set(id, p);
  });
  personas._totalPost = totalPost;
}

function ubicacion(p) {
  const g = p.geoKey ? geoCache[p.geoKey] : null;
  return (g && g.lat != null) ? g : null;
}

// ---------------------------------------------------------------- carga y sincronización
async function cargarDatos(completo) {
  if (completo) { filasCrudas = []; headersCrudos = []; }
  let primera = true;
  while (true) {
    const res = await apiGet("data", { desde: filasCrudas.length, limite: CHUNK });
    if (!res || !Array.isArray(res.rows)) throw new Error("Respuesta inesperada del servidor");
    if (res.total < filasCrudas.length) return cargarDatos(true);
    if (!headersCrudos.length) headersCrudos = res.headers;
    Array.prototype.push.apply(filasCrudas, res.rows);
    if (completo) setCarga("Cargando postulaciones… " + filasCrudas.length + " de " + res.total);
    if (primera && completo && res.rows.length) { construirPersonas(); renderTodo(); }
    primera = false;
    if (!res.rows.length || filasCrudas.length >= res.total) break;
  }
  setCarga("");
}

async function cargarEstados() {
  const lista = await apiGet("estados");
  estadosServidor = {};
  if (Array.isArray(lista)) lista.forEach(e => { estadosServidor[e.id] = e; });
}

async function sincronizarAhora() {
  if (sincronizando || !tokenActual) return;
  sincronizando = true;
  const st = $("syncStatus");
  if (st) st.textContent = "Sincronizando...";
  try {
    const antes = filasCrudas.length;
    await cargarEstados();
    await cargarDatos(false);
    construirPersonas();
    renderTodo();
    if (st) st.textContent = "Última sincronización: " + new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) +
      (filasCrudas.length > antes ? " (+" + (filasCrudas.length - antes) + " nuevas)" : "");
    geocodificarPendientes();
  } catch (err) {
    if (st) st.textContent = "Error de conexión: " + err.message;
  } finally { sincronizando = false; }
}

async function recargarTodo() {
  if (sincronizando || !tokenActual) return;
  sincronizando = true;
  const st = $("syncStatus");
  if (st) st.textContent = "Recargando todo...";
  try {
    geoCache = {}; geoFallos = new Set();
    await cargarGeo();
    await cargarEstados();
    await cargarDatos(true);
    construirPersonas();
    renderTodo();
    if (st) st.textContent = "Recargado: " + personas.length + " personas";
    geocodificarPendientes();
  } catch (err) {
    setCarga("");
    if (st) st.textContent = "Error: " + err.message;
  } finally { sincronizando = false; }
}

// ---------------------------------------------------------------- guardado de estados
function guardarPend() { try { localStorage.setItem(PEND_KEY, JSON.stringify(pendientes)); } catch (e) {} }

function actualizarPendStatus() {
  const el = $("pendStatus");
  if (!el) return;
  const n = Object.keys(pendientes).length;
  el.style.display = n ? "block" : "none";
  el.textContent = n ? "⚠️ " + n + " cambio(s) sin guardar en la planilla — clic para reintentar" : "";
}

async function enviarPendientes(avisar) {
  const ids = Object.keys(pendientes);
  if (!ids.length) { actualizarPendStatus(); return; }
  const lote = ids.map(id => pendientes[id]);
  try {
    await apiPost("estados", lote);
    lote.forEach(it => { if (pendientes[it.id] === it) delete pendientes[it.id]; });
    guardarPend();
    if (avisar) toast("Cambios guardados ✔");
  } catch (err) {
    if (avisar) toast("No se pudo guardar: " + err.message, true);
  }
  actualizarPendStatus();
}
function reintentarGuardados() { enviarPendientes(true); }

function setEstado(id, estado, nota) {
  const p = porId.get(id);
  if (!p) return;
  p.estado = estado;
  if (nota !== undefined) p.nota = nota;
  pendientes[id] = { id, estado: p.estado, nota: p.nota || "" };
  guardarPend();
  actualizarPendStatus();
  renderTodo();
  enviarPendientes(false);
}

// ---------------------------------------------------------------- mapa
function initMap() {
  mapInstance = L.map("leafletMap", { preferCanvas: true }).setView([-38.0055, -57.555], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 }).addTo(mapInstance);
  radioLayer.addTo(mapInstance);
  markersGroup.addTo(mapInstance);
  localesLayer.addTo(mapInstance);
  dibujarLocales();
}

function dibujarLocales() {
  localesLayer.clearLayers();
  LOCALES_SAO.forEach(loc => {
    const icon = L.divIcon({ className: "sao-pin", html: '<div class="pin-local">SÃO</div>', iconSize: [32, 32], iconAnchor: [16, 16] });
    const m = L.marker([loc.lat, loc.lng], { icon, zIndexOffset: 1000 }).addTo(localesLayer);
    const box = document.createElement("div");
    box.innerHTML = "<b>SÃO " + esc(loc.nombre) + "</b><br>" + esc(loc.direccion) + "<br>";
    const b = document.createElement("button");
    b.className = "popup-btn";
    b.textContent = "Ver postulantes cerca";
    b.addEventListener("click", () => { $("mapCercaFilter").value = loc.id; cardsLimit = MAX_CARDS; renderMapa(); m.closePopup(); });
    box.appendChild(b);
    m.bindPopup(box);
  });
}

function poblarSelectores() {
  const locs = LOCALES_SAO.slice().sort((a, b) => a.nombre.localeCompare(b.nombre));
  const llenar = (id, primero) => {
    const s = $(id);
    if (!s) return;
    s.innerHTML = primero;
    locs.forEach(l => {
      const o = document.createElement("option");
      o.value = l.id;
      o.textContent = l.nombre;
      s.appendChild(o);
    });
  };
  llenar("mapLocalFilter", '<option value="todos">Eligieron cualquier sucursal</option>');
  llenar("mapCercaFilter", '<option value="ninguno">— sin filtro de distancia —</option>');
  llenar("pipelineLocal", '<option value="todos">Todas las sucursales</option>');

  // También llenamos el selector del modal "Nuevo Postulante"
  const newLoc = $("newLocal");
  if (newLoc) {
    newLoc.innerHTML = '<option value="Cualquiera">Cualquiera / Sin preferencia</option>';
    locs.forEach(l => {
      const o = document.createElement("option");
      o.value = l.nombre;
      o.textContent = l.nombre;
      newLoc.appendChild(o);
    });
  }

  const e = $("mapExpFilter");
  if (e) {
    e.innerHTML = '<option value="todas">Cualquier experiencia</option>' +
      Object.keys(NOMBRE_EXP).map(k => '<option value="' + k + '">' + NOMBRE_EXP[k] + "</option>").join("");
  }
}

function poblarPuestos() {
  const s = $("mapPuestoFilter");
  if (!s) return;
  const actual = s.value;
  const set = new Set(personas.map(p => p.puesto).filter(Boolean));
  s.innerHTML = '<option value="todos">Cualquier puesto de interés</option>' +
    Array.from(set).sort().map(x => '<option value="' + esc(x) + '">' + esc(x) + "</option>").join("");
  s.value = set.has(actual) ? actual : "todos";
}

function leerFiltros() {
  const v = id => ($(id) ? $(id).value : "");
  return {
    texto: sinTildes(v("mapSearchInput")), area: v("mapAreaFilter"), zona: v("mapZonaFilter"), local: v("mapLocalFilter"),
    cerca: v("mapCercaFilter"), radio: parseFloat(v("mapRadioFilter")) || 3, puesto: v("mapPuestoFilter"), exp: v("mapExpFilter"),
    estudia: sinTildes(v("mapEstudiaFilter")), trabaja: sinTildes(v("mapTrabajaFilter")), b1: sinTildes(v("mapB1Filter")),
    antig: parseInt(v("mapAntigFilter"), 10) || 0, edadMin: parseInt(v("mapEdadMin"), 10) || 0, edadMax: parseInt(v("mapEdadMax"), 10) || 0,
    ubic: v("mapUbicFilter")
  };
}

function pasaChip(p) {
  if (chipEstado === "todos") return true;
  if (chipEstado === "activos") return ESTADOS_ACTIVOS.includes(p.estado);
  return p.estado === chipEstado;
}

function filtrarMapa() {
  const F = leerFiltros();
  const localCerca = F.cerca !== "ninguno" ? LOCALES_SAO.find(l => l.id === F.cerca) : null;
  const res = [];
  for (const p of personas) {
    if (!pasaChip(p)) continue;
    if (F.texto && !p.texto.includes(F.texto)) continue;
    if (F.area !== "todas" && p.sector !== F.area) continue;
    if (F.zona !== "todas" && p.zona !== F.zona) continue;
    if (F.local !== "todos" && !p.localesIds.includes(F.local)) continue;
    if (F.puesto !== "todos" && p.puesto !== F.puesto) continue;
    if (F.exp !== "todas" && p.exp !== F.exp) continue;
    if (F.estudia !== "todos" && sinTildes(p.estudia) !== F.estudia) continue;
    if (F.trabaja !== "todos" && sinTildes(p.trabaja) !== F.trabaja) continue;
    if (F.b1 !== "todos" && p.b1 !== F.b1) continue;
    if (F.antig && p.dias > F.antig) continue;
    if (F.edadMin && (p.edad == null || p.edad < F.edadMin)) continue;
    if (F.edadMax && (p.edad == null || p.edad > F.edadMax)) continue;
    const u = ubicacion(p);
    if (F.ubic === "con" && !u) continue;
    if (F.ubic === "sin" && u) continue;
    p._dist = null;
    if (localCerca) {
      if (!u) continue;
      p._dist = distanciaKm(u.lat, u.lng, localCerca.lat, localCerca.lng);
      if (p._dist > F.radio) continue;
    }
    res.push(p);
  }
  if (localCerca) res.sort((a, b) => a._dist - b._dist);
  else res.sort((a, b) => b.lastTs - a.lastTs);
  return { lista: res, localCerca, radio: F.radio };
}

function jitter(id, eje) {
  let h = 0;
  const s = id + eje;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.00024;
}

function renderMapa() {
  if (!mapInstance) return;
  const { lista, localCerca, radio } = filtrarMapa();
  markersGroup.clearLayers();
  radioLayer.clearLayers();
  markerPorId = new Map();

  if (localCerca) {
    L.circle([localCerca.lat, localCerca.lng], { radius: radio * 1000, color: "#d4a373", weight: 1, dashArray: "6 6", fillOpacity: 0.04 }).addTo(radioLayer);
  }

  let sinUbicar = 0;
  lista.forEach(p => {
    const u = ubicacion(p);
    if (!u) { sinUbicar++; return; }
    const aprox = u.tipo === "CALLE" || u.tipo === "APROX";
    const pin = L.circleMarker([u.lat + jitter(p.id, "a"), u.lng + jitter(p.id, "b")], {
      radius: 6, fillColor: COLOR_ESTADO[p.estado] || "#3498db", color: aprox ? "#e67e22" : "#000",
      weight: aprox ? 2 : 1, fillOpacity: aprox ? 0.55 : 0.9
    }).addTo(markersGroup);
    const box = document.createElement("div");
    box.innerHTML = "<b>" + esc(p.nombre) + "</b><br>" + esc(p.dir || "") + "<br><small>" + esc(NOMBRE_ESTADO[p.estado]) +
      (aprox ? " · ubicación aproximada" : "") + "</small><br>";
    const b = document.createElement("button");
    b.className = "popup-btn";
    b.textContent = "Ver ficha";
    b.addEventListener("click", () => abrirModal(p.id));
    box.appendChild(b);
    pin.bindPopup(box);
    markerPorId.set(p.id, pin);
  });

  if ($("mapCounter")) $("mapCounter").textContent = lista.length + " candidatos";
  const sc = $("sinUbicarCounter");
  if (sc) {
    sc.style.display = sinUbicar ? "inline-block" : "none";
    sc.textContent = sinUbicar + " sin ubicar";
  }

  const cont = $("mapCvList");
  if (!cont) return;
  cont.innerHTML = "";
  if (!lista.length) { cont.innerHTML = '<div class="cards-empty">No hay postulantes con esos filtros.</div>'; return; }
  lista.slice(0, cardsLimit).forEach(p => {
    const card = document.createElement("div");
    card.className = "cv-card-item";
    const locTxt = p.localesIds.length ? p.localesIds.map(id => LOCALES_SAO.find(l => l.id === id).nombre).join(", ") : (p.locales || "Sin preferencia");
    card.innerHTML = '<div class="cv-card-top"><span class="cv-card-title">' + esc(p.nombre) + "</span><span>" +
      '<span class="badge badge-' + p.estado + '">' + esc(NOMBRE_ESTADO[p.estado]) + "</span>" +
      (p.posts.length > 1 ? '<span class="badge badge-repetido">×' + p.posts.length + "</span>" : "") +
      (p._dist != null ? '<span class="badge badge-dist">' + p._dist.toFixed(1) + " km</span>" : "") + "</span></div>" +
      '<div class="cv-card-info">📍 <b>Domicilio:</b> ' + esc(p.dir || "No indicado") + (ubicacion(p) ? "" : " <i>(sin ubicar)</i>") +
      "<br>🎯 " + esc(p.puesto || SECTORES[p.sector]) + "<br>🏪 <b>Preferencia:</b> " + esc(locTxt) +
      "<br>📅 " + fmtFecha(p.lastTs) + "</div>";
    card.addEventListener("click", () => abrirModal(p.id));
    cont.appendChild(card);
  });
  if (lista.length > cardsLimit) {
    const b = document.createElement("button");
    b.className = "btn-more";
    b.textContent = "Ver más (" + (lista.length - cardsLimit) + " restantes)";
    b.addEventListener("click", () => { cardsLimit += MAX_CARDS; renderMapa(); });
    cont.appendChild(b);
  }
}

function verEnMapa(id) {
  const p = porId.get(id), u = p && ubicacion(p);
  cambiarPantalla("pantalla-mapa");
  if (!u) { toast("Este postulante todavía no tiene ubicación en el mapa", true); return; }
  setTimeout(() => {
    mapInstance.invalidateSize();
    mapInstance.flyTo([u.lat, u.lng], 16);
    const m = markerPorId.get(id);
    if (m) m.openPopup();
  }, 150);
}

// ---------------------------------------------------------------- pipeline
function renderPipeline() {
  const txt = sinTildes($("pipelineSearch").value), area = $("pipelineArea").value, loc = $("pipelineLocal").value;
  const base = personas.filter(p =>
    (!txt || p.texto.includes(txt)) && (area === "todas" || p.sector === area) && (loc === "todos" || p.localesIds.includes(loc)))
    .sort((a, b) => b.lastTs - a.lastTs);
  ["Pendiente", "Recomendado", "Entrevista", "Contratado"].forEach(est => {
    const items = base.filter(p => p.estado === est);
    if ($("count-" + est)) $("count-" + est).textContent = items.length;
    const col = $("col-items-" + est);
    if (!col) return;
    col.innerHTML = "";
    items.slice(0, MAX_CARDS).forEach(p => {
      const card = document.createElement("div");
      card.className = "cv-card-item";
      card.draggable = true;
      card.innerHTML = '<div class="cv-card-top"><span class="cv-card-title">' + esc(p.nombre) + "</span>" +
        (p.posts.length > 1 ? '<span class="badge badge-repetido">×' + p.posts.length + "</span>" : "") + "</div>" +
        '<div class="cv-card-info">' + esc(p.puesto || SECTORES[p.sector]) + "<br>📅 " + fmtFecha(p.lastTs) + "</div>";
      card.addEventListener("click", () => abrirModal(p.id));
      card.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", p.id); card.classList.add("dragging"); });
      card.addEventListener("dragend", () => card.classList.remove("dragging"));
      col.appendChild(card);
    });
    if (items.length > MAX_CARDS) {
      const m = document.createElement("div");
      m.className = "col-more";
      m.textContent = "… y " + (items.length - MAX_CARDS) + " más. Usá los filtros para acotar.";
      col.appendChild(m);
    }
  });
}

function initKanbanDrop() {
  document.querySelectorAll(".kanban-col").forEach(col => {
    const colItems = col.querySelector(".col-items");
    if (!colItems) return;
    const estado = colItems.id.replace("col-items-", "");
    col.addEventListener("dragover", e => { e.preventDefault(); col.classList.add("drag-over"); });
    col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
    col.addEventListener("drop", e => {
      e.preventDefault();
      col.classList.remove("drag-over");
      const id = e.dataTransfer.getData("text/plain");
      const p = porId.get(id);
      if (p && p.estado !== estado) setEstado(id, estado);
    });
  });
}

// ---------------------------------------------------------------- métricas
function renderKpis() {
  const cuenta = est => personas.filter(p => p.estado === est).length;
  const set = (id, v) => { if ($(id)) $(id).textContent = v; };
  const ahora = Date.now();
  const activos = personas.filter(p => ESTADOS_ACTIVOS.includes(p.estado));
  set("kpiTotal", personas.length);
  set("kpiPostulaciones", personas._totalPost || 0);
  set("kpiDuplicados", personas.filter(p => p.posts.length > 1).length);
  set("kpiNuevos7", personas.filter(p => ahora - p.firstTs < 7 * 86400000).length);
  set("kpiNuevos30", personas.filter(p => ahora - p.firstTs < 30 * 86400000).length);
  set("kpiSinUbicar", activos.filter(p => !ubicacion(p)).length);
  set("kpiPendientes", cuenta("Pendiente"));
  set("kpiRecomendados", cuenta("Recomendado"));
  set("kpiEntrevistas", cuenta("Entrevista"));
  set("kpiContratados", cuenta("Contratado"));
  set("kpiNoGustaron", cuenta("NoGusto"));
  set("kpiRechazados", cuenta("Rechazado"));

  if ($("kpiSectoresBody")) {
    $("kpiSectoresBody").innerHTML = Object.keys(SECTORES).map(s => {
      const g = personas.filter(p => p.sector === s);
      const c = est => g.filter(p => p.estado === est).length;
      return "<tr><td>" + SECTORES[s] + "</td><td>" + g.length + "</td><td>" + g.filter(p => ESTADOS_ACTIVOS.includes(p.estado)).length +
        "</td><td>" + c("Recomendado") + "</td><td>" + c("Entrevista") + "</td><td>" + c("Contratado") + "</td></tr>";
    }).join("");
  }

  if ($("kpiLocalesBody")) {
    const filas = LOCALES_SAO.map(l => ({ nombre: l.nombre, n: activos.filter(p => p.localesIds.includes(l.id)).length }))
      .filter(x => x.n > 0).sort((a, b) => b.n - a.n);
    $("kpiLocalesBody").innerHTML = filas.map(x => "<tr><td>" + esc(x.nombre) + "</td><td>" + x.n + "</td></tr>").join("") ||
      '<tr><td colspan="2">Sin datos</td></tr>';
  }
}

// ---------------------------------------------------------------- historial de descartados
function renderDescartados() {
  const txt = sinTildes($("descSearch").value);
  const lista = personas.filter(p => (p.estado === "NoGusto" || p.estado === "Rechazado") &&
    (!txt || p.texto.includes(txt) || sinTildes(p.nota).includes(txt))).sort((a, b) => b.lastTs - a.lastTs);
  const body = $("tablaDescartadosBody");
  if (!body) return;
  body.innerHTML = "";
  if (!lista.length) { body.innerHTML = '<tr><td colspan="6">No hay registros.</td></tr>'; return; }
  lista.slice(0, 300).forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td><b>" + esc(p.nombre) + '</b> <span class="badge badge-' + p.estado + '">' + esc(NOMBRE_ESTADO[p.estado]) + "</span></td>" +
      "<td>" + esc(p.tel) + "<br>" + esc(p.email) + "</td><td>" + SECTORES[p.sector] + "</td><td>" + esc(p.nota || "—") +
      "</td><td>" + fmtFecha(p.lastTs) + "</td><td></td>";
    const acc = tr.lastElementChild;
    const ver = document.createElement("button");
    ver.className = "btn-upload btn-mini"; ver.textContent = "Ver ficha";
    ver.addEventListener("click", () => abrirModal(p.id));
    const re = document.createElement("button");
    re.className = "btn-upload btn-mini"; re.textContent = "Reactivar"; re.style.marginLeft = "6px";
    re.addEventListener("click", () => setEstado(p.id, "Pendiente"));
    acc.appendChild(ver); acc.appendChild(re);
    body.appendChild(tr);
  });
}

// ---------------------------------------------------------------- modal
function abrirModal(id) {
  const p = porId.get(id);
  if (!p) return;
  personaModal = p;
  const set = (i, v) => { if ($(i)) $(i).textContent = (v === "" || v == null) ? "-" : v; };
  set("modalNombre", p.nombre);
  set("modalArea", SECTORES[p.sector]);
  if ($("modalArea")) $("modalArea").className = "badge badge-gris";
  const rep = $("modalRepetido");
  if (rep) {
    rep.style.display = p.posts.length > 1 ? "inline-block" : "none";
    rep.textContent = "Reincidente (" + p.posts.length + " postulaciones)";
  }
  const u = ubicacion(p);
  set("modalDir", (p.dir || "No indicado") + (u ? (u.tipo === "OK" ? "" : " (ubicación aproximada)") : " (sin ubicar)"));
  const dr = $("modalDistRow");
  const cerca = leerFiltros().cerca;
  const loc = cerca !== "ninguno" ? LOCALES_SAO.find(l => l.id === cerca) : null;
  if (dr) {
    if (u && loc) { dr.style.display = "block"; set("modalDist", distanciaKm(u.lat, u.lng, loc.lat, loc.lng).toFixed(1) + " km a " + loc.nombre); }
    else dr.style.display = "none";
  }
  set("modalTel", p.tel);
  set("modalEmail", p.email);
  set("modalNac", p.edad != null ? p.edad + " años (" + fmtFecha(p.nac) + ")" : "");
  set("modalLocal", p.localesIds.length ? p.localesIds.map(i => LOCALES_SAO.find(l => l.id === i).nombre).join(", ") : p.locales);
  set("modalPuesto", p.puesto);
  set("modalEstudios", sinTildes(p.estudia) === "si" ? "Sí — " + [p.dondeEst, p.carrera].filter(Boolean).join(" · ") : (p.estudia || ""));
  set("modalTrabajo", sinTildes(p.trabaja) === "si" ? "Sí — " + (p.dondeTrab || "") : (p.trabaja || ""));
  set("modalExp", NOMBRE_EXP[p.exp] + (p.notas ? " — " + p.notas : ""));
  if ($("modalB1Row")) $("modalB1Row").style.display = p.sector === "logistica" ? "block" : "none";
  set("modalB1", p.b1 === "si" ? "Sí" : "No indicado");

  const cv = $("modalCvLinks");
  if (cv) {
    cv.textContent = "";
    const links = [];
    p.posts.forEach(x => String(x.cv || "").split(/[,\s]+/).forEach(l => { if (/^https?:\/\//.test(l) && links.indexOf(l) < 0) links.push(l); }));
    if (!links.length) cv.textContent = "-";
    links.forEach((l, i) => {
      const a = document.createElement("a");
      a.href = l; a.target = "_blank"; a.rel = "noopener"; a.textContent = "CV " + (i + 1);
      if (i) cv.appendChild(document.createTextNode(" · "));
      cv.appendChild(a);
    });
  }

  if ($("modalNota")) $("modalNota").value = p.nota || "";
  if ($("modalStateSelect")) $("modalStateSelect").value = p.estado;
  const wa = telefonoWa(p.tel);
  const btn = $("modalWaBtn");
  if (btn) {
    btn.style.display = wa ? "flex" : "none";
    btn.href = wa ? "https://wa.me/" + wa : "#";
  }

  const lista = $("modalPostulaciones");
  if (lista) {
    lista.innerHTML = "";
    p.posts.slice(0, 10).forEach(x => {
      const d = document.createElement("div");
      d.className = "raw-item";
      d.innerHTML = '<span class="raw-pregunta">' + fmtFecha(x.ts) + " · " + esc(x.sector || "") + "</span>" +
        '<span class="raw-respuesta">' + esc(x.puesto || "-") + " — " + esc(x.locales || "-") + "<br>" + esc(x.dir || "") + "</span>";
      lista.appendChild(d);
    });
    lista.style.display = "none";
  }
  if ($("rawToggleIcon")) $("rawToggleIcon").textContent = "▾";
  if ($("candidateModal")) $("candidateModal").style.display = "flex";
}

function cerrarModal() { if ($("candidateModal")) $("candidateModal").style.display = "none"; personaModal = null; }

function togglePostulaciones() {
  const l = $("modalPostulaciones");
  if (!l) return;
  const abierto = l.style.display !== "none";
  l.style.display = abierto ? "none" : "flex";
  if ($("rawToggleIcon")) $("rawToggleIcon").textContent = abierto ? "▾" : "▴";
}

function guardarCambiosModal() {
  if (!personaModal) return;
  setEstado(personaModal.id, $("modalStateSelect").value, $("modalNota").value.trim());
  toast("Guardando…");
  cerrarModal();
}

// ---------------------------------------------------------------- navegación y render general
function cambiarPantalla(id) {
  document.querySelectorAll(".view-screen").forEach(s => s.classList.toggle("active", s.id === id));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", (b.getAttribute("onclick") || "").includes("'" + id + "'")));
  if (id === "pantalla-mapa" && mapInstance) setTimeout(() => mapInstance.invalidateSize(), 50);
  renderTodo();
}

function renderTodo() {
  const activa = document.querySelector(".view-screen.active");
  const id = activa ? activa.id : "pantalla-mapa";
  if (id === "pantalla-mapa") renderMapa();
  else if (id === "pantalla-pipeline") renderPipeline();
  else if (id === "pantalla-kpis") renderKpis();
  else if (id === "pantalla-descartados") renderDescartados();
  poblarPuestosSiHaceFalta();
}

let _puestosN = -1;
function poblarPuestosSiHaceFalta() {
  if (personas.length !== _puestosN) { _puestosN = personas.length; poblarPuestos(); }
}

function filtrarCerca(id) { if ($("mapCercaFilter")) $("mapCercaFilter").value = id; renderMapa(); }

// ---------------------------------------------------------------- arranque e inicialización
async function iniciarAppAutenticada() {
  try { pendientes = JSON.parse(localStorage.getItem(PEND_KEY) || "{}"); } catch (e) { pendientes = {}; }
  if (!mapInstance) {
    initMap();
    poblarSelectores();
    initKanbanDrop();
    initSidebarResizer();
  }
  actualizarPendStatus();
  await recargarTodo();
  enviarPendientes(false);
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(sincronizarAhora, AUTOSYNC_INTERVALO_MS);
}

document.addEventListener("DOMContentLoaded", async () => {
  const inp = $("loginTokenInput");
  const btn = $("btnLoginEntrar");
  if (btn) btn.addEventListener("click", () => intentarLogin(inp.value));
  if (inp) inp.addEventListener("keydown", e => { if (e.key === "Enter") intentarLogin(inp.value); });

  let deb;
  const redibujar = () => { cardsLimit = MAX_CARDS; renderMapa(); };
  if ($("mapSearchInput")) $("mapSearchInput").addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(redibujar, 250); });
  ["mapAreaFilter", "mapCercaFilter", "mapRadioFilter", "mapPuestoFilter", "mapExpFilter", "mapEstudiaFilter", "mapTrabajaFilter",
    "mapB1Filter", "mapAntigFilter", "mapEdadMin", "mapEdadMax", "mapUbicFilter"].forEach(i => { if ($(i)) $(i).addEventListener("change", redibujar); });
  
  if ($("mapZonaFilter")) {
    $("mapZonaFilter").addEventListener("change", () => {
      if (mapInstance) mapInstance.flyTo([-38.0055, -57.555], 12);
      redibujar();
    });
  }

  if ($("mapLocalFilter")) {
    $("mapLocalFilter").addEventListener("change", e => {
      const loc = LOCALES_SAO.find(l => l.id === e.target.value);
      if (loc && mapInstance) mapInstance.flyTo([loc.lat, loc.lng], 13);
      redibujar();
    });
  }

  document.querySelectorAll(".quick-status-chips .chip[data-status]").forEach(ch => ch.addEventListener("click", () => {
    document.querySelectorAll(".quick-status-chips .chip[data-status]").forEach(x => x.classList.remove("active"));
    ch.classList.add("active");
    chipEstado = ch.dataset.status;
    redibujar();
  }));

  if ($("btnResetFiltros")) {
    $("btnResetFiltros").addEventListener("click", () => {
      ["mapSearchInput", "mapEdadMin", "mapEdadMax"].forEach(i => { if ($(i)) $(i).value = ""; });
      if ($("mapAreaFilter")) $("mapAreaFilter").value = "todas";
      if ($("mapZonaFilter")) $("mapZonaFilter").value = "todas";
      if ($("mapLocalFilter")) $("mapLocalFilter").value = "todos";
      if ($("mapCercaFilter")) $("mapCercaFilter").value = "ninguno";
      if ($("mapRadioFilter")) $("mapRadioFilter").value = "3";
      if ($("mapPuestoFilter")) $("mapPuestoFilter").value = "todos";
      if ($("mapExpFilter")) $("mapExpFilter").value = "todas";
      if ($("mapEstudiaFilter")) $("mapEstudiaFilter").value = "todos";
      if ($("mapTrabajaFilter")) $("mapTrabajaFilter").value = "todos";
      if ($("mapB1Filter")) $("mapB1Filter").value = "todos";
      if ($("mapAntigFilter")) $("mapAntigFilter").value = "0";
      if ($("mapUbicFilter")) $("mapUbicFilter").value = "todos";
      chipEstado = "activos";
      document.querySelectorAll(".quick-status-chips .chip[data-status]").forEach(x => x.classList.toggle("active", x.dataset.status === "activos"));
      redibujar();
      toast("Filtros limpiados");
    });
  }

  if ($("pipelineSearch")) $("pipelineSearch").addEventListener("input", renderPipeline);
  ["pipelineArea", "pipelineLocal"].forEach(i => { if ($(i)) $(i).addEventListener("change", renderPipeline); });
  if ($("descSearch")) $("descSearch").addEventListener("input", renderDescartados);
  if ($("modalVerMapa")) $("modalVerMapa").addEventListener("click", () => { const p = personaModal; cerrarModal(); if (p) verEnMapa(p.id); });
  if ($("candidateModal")) $("candidateModal").addEventListener("click", e => { if (e.target.id === "candidateModal") cerrarModal(); });
  if ($("nuevoModal")) $("nuevoModal").addEventListener("click", e => { if (e.target.id === "nuevoModal") cerrarModalNuevo(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { cerrarModal(); cerrarModalNuevo(); } });

  const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (savedToken) {
    await intentarLogin(savedToken);
  }
});
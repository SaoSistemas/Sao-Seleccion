// =====================================================================================
// SÃO — Portal de Selección y RRHH (app.js) · v6.3 (Roles Gerentes/RRHH + Fix Fecha)
// =====================================================================================

const WEBAPP_BASE = "https://script.google.com/macros/s/AKfycbwFcUa9cSwV8E1IxVXuvXTolnWlQK0Y-Uw5RuXpLb39qOTTk5a3JnU1rdX89DiJncaDFA/exec";
const TOKEN_STORAGE_KEY = "sao_auth_token_v1";
let tokenActual = "";
let rolActual = "gerente";

const AUTOSYNC_INTERVALO_MS = 30 * 1000;
const CHUNK = 1500;
const MAX_CARDS = 100;
const PEND_KEY = "sao_pend_v1";

const ESTADOS_ACTIVOS = ["Pendiente", "Recomendado", "Entrevista"];
const NOMBRE_ESTADO = { Pendiente: "Pendiente", Recomendado: "Recomendado", Entrevista: "Entrevista", NoGusto: "No gustó", Contratado: "Contratado", Rechazado: "Rechazado" };
const COLOR_ESTADO = { Pendiente: "#7f8c8d", Recomendado: "#f1c40f", Entrevista: "#3498db", NoGusto: "#e67e22", Contratado: "#2ecc71", Rechazado: "#e74c3c" };
const SECTORES = { locales: "Locales", produccion: "Producción", logistica: "Logística" };

const LOCALES_SAO = [
  // Fábricas y Centros Logísticos (misma coordenada exacta que Alfar y San Isidro)
  { id: "fabrica_alfar", nombre: "Fábrica Alfar", tipo: "fabrica", formLabel: "Fábrica Alfar (Mar del Plata)", zona: "mdp", direccion: "Guillermo Magrassi 4885, Alfar", lat: -38.1003796, lng: -57.5612371, pat: /fabrica.*alfar|produccion.*alfar|planta.*alfar/ },
  { id: "logistica_alfar", nombre: "Logística Alfar", tipo: "logistica", formLabel: "Logística Alfar (Mar del Plata)", zona: "mdp", direccion: "Guillermo Magrassi 4885, Alfar", lat: -38.1003796, lng: -57.5612371, pat: /logistica.*alfar|deposito.*alfar/ },
  { id: "fabrica_san_isidro", nombre: "Fábrica San Isidro", tipo: "fabrica", formLabel: "Fábrica San Isidro (GBA)", zona: "bsas", direccion: "Av. del Libertador 14643, San Isidro", lat: -34.47735, lng: -58.50165, pat: /fabrica.*san isidro|produccion.*san isidro|planta.*san isidro/ },
  { id: "logistica_san_isidro", nombre: "Logística San Isidro", tipo: "logistica", formLabel: "Logística San Isidro (GBA)", zona: "bsas", direccion: "Av. del Libertador 14643, San Isidro", lat: -34.47735, lng: -58.50165, pat: /logistica.*san isidro|deposito.*san isidro/ },

  // Locales Mar del Plata y Costa Atlántica
  { id: "pinamar", nombre: "Pinamar", tipo: "local", formLabel: "Pinamar Av Bunge 1055", zona: "mdp", direccion: "Av. Arq. Jorge Bunge 1055, Pinamar", lat: -37.1121868, lng: -56.8662241, pat: /pinamar/ },
  { id: "alfar", nombre: "Alfar", tipo: "local", formLabel: "Alfar, G. Magrassi 4995", zona: "mdp", direccion: "Guillermo Magrassi 4885, Alfar", lat: -38.1003796, lng: -57.5612371, pat: /alfar|magrassi/ },
  { id: "diagonal", nombre: "Diagonal", tipo: "local", formLabel: "Diagonal Pueyrredon Esq. Rivadavia", zona: "mdp", direccion: "Diagonal Pueyrredón 2989", lat: -37.9987567, lng: -57.5502357, pat: /diagonal/ },
  { id: "constitucion", nombre: "Constitución", tipo: "local", formLabel: "Constitución 4298", zona: "mdp", direccion: "Av. Constitución 4298", lat: -37.9695491, lng: -57.5467467, pat: /constitucion 4298|constitucion$/ },
  { id: "las_palmeras", nombre: "Las Palmeras", tipo: "local", formLabel: "Av. Constitución 6690", zona: "mdp", direccion: "Av. Constitución 6690", lat: -37.957343, lng: -57.5706836, pat: /constitucion 6690|palmeras/ },
  { id: "playa_grande", nombre: "Playa Grande", tipo: "local", formLabel: "Playa Grande", zona: "mdp", direccion: "Playa Grande (Balneario 8)", lat: -38.0277922, lng: -57.5323172, pat: /playa grande/ },
  { id: "tienda_leon", nombre: "Tienda León", tipo: "local", formLabel: "Av. Luro 5550", zona: "mdp", direccion: "Av. Pedro Luro 5550", lat: -37.9837151, lng: -57.576151, pat: /luro 5550|tienda leon/ },
  { id: "peatonal", nombre: "Peatonal", tipo: "local", formLabel: "Peatonal San Martín 2468", zona: "mdp", direccion: "Peatonal San Martín 2468", lat: -38.0001889, lng: -57.5456374, pat: /peatonal/ },
  { id: "paso", nombre: "Paso", tipo: "local", formLabel: "Av. Juan José Paso 3004", zona: "mdp", direccion: "Av. Juan José Paso 3004", lat: -38.0173866, lng: -57.5670633, pat: /juan jose paso|\bpaso\b/ },
  { id: "chauvin", nombre: "Chauvin", tipo: "local", formLabel: "H. Yrigoyen esq. San Lorenzo", zona: "mdp", direccion: "Hipólito Yrigoyen 3192", lat: -38.0098698, lng: -57.5593746, pat: /yrigoyen|chauvin/ },
  { id: "alem", nombre: "Alem", tipo: "local", formLabel: "Alem 3883", zona: "mdp", direccion: "Leandro N. Alem 3883", lat: -38.0288428, lng: -57.5371325, pat: /alem 3883|\balem\b/ },
  { id: "edison", nombre: "Edison", tipo: "local", formLabel: "Av. Edison 1821", zona: "mdp", direccion: "Av. Edison 1821", lat: -38.0511406, lng: -57.5600539, pat: /edison/ },
  { id: "olavarria", nombre: "Olavarría", tipo: "local", formLabel: "Alvarado esq. Olavarría", zona: "mdp", direccion: "Olavarría 3002", lat: -38.0160937, lng: -57.5433462, pat: /olavarria/ },
  { id: "aldrey", nombre: "Aldrey", tipo: "local", formLabel: "Paseo Aldrey", zona: "mdp", direccion: "Sarmiento 2646 (Paseo Aldrey)", lat: -38.0122446, lng: -57.5428786, pat: /aldrey/ },
  { id: "bendu", nombre: "Bendu", tipo: "local", formLabel: "Bendu", zona: "mdp", direccion: "Av. de los Trabajadores 150", lat: -38.0424496, lng: -57.5427405, pat: /bendu/ },

  // Locales Buenos Aires (CABA, GBA, Zárate y La Plata)
  { id: "san_isidro", nombre: "San Isidro", tipo: "local", formLabel: "Sao San Isidro - Av. del Libertador 14643. San Isidro", zona: "bsas", direccion: "Av. del Libertador 14643, San Isidro", lat: -34.47735, lng: -58.50165, pat: /san isidro|libertador 14643/ },
  { id: "villa_urquiza", nombre: "Villa Urquiza", tipo: "local", formLabel: "Sao Villa Urquiza -Díaz Colodrero 2315", zona: "bsas", direccion: "Díaz Colodrero 2315, Villa Urquiza, CABA", lat: -34.57472, lng: -58.48755, pat: /urquiza|colodrero/ },
  { id: "villa_devoto", nombre: "Villa Devoto", tipo: "local", formLabel: "Sao Villa Devoto - Gualeguaychú 3920", zona: "bsas", direccion: "Gualeguaychú 3920, Villa Devoto, CABA", lat: -34.60245, lng: -58.51135, pat: /devoto|gualeguaychu/ },
  { id: "paseo_houssay", nombre: "Paseo Houssay", tipo: "local", formLabel: "Sao Paseo Houssay - Av. Córdoba y Junín", zona: "bsas", direccion: "Av. Córdoba y Junín, CABA", lat: -34.59945, lng: -58.39765, pat: /houssay|cordoba y junin/ },
  { id: "zarate_ruta_9", nombre: "Zárate Ruta 9", tipo: "local", formLabel: "Sao Zárate Ruta 9 - Croacia 2860. Zárate.", zona: "bsas", direccion: "Croacia 2860, Zárate", lat: -34.10165, lng: -59.04885, pat: /zarate|croacia 2860/ },
  { id: "belgrano", nombre: "Belgrano", tipo: "local", formLabel: "Sao Belgrano - Av. Juramento 2527", zona: "bsas", direccion: "Av. Juramento 2527, Belgrano, CABA", lat: -34.56215, lng: -58.45865, pat: /belgrano|juramento 2527/ },
  { id: "la_plata", nombre: "La Plata", tipo: "local", formLabel: "Sao La Plata - Calle 11 1051", zona: "bsas", direccion: "Calle 11 1051, La Plata", lat: -34.91825, lng: -57.95315, pat: /la plata|calle 11 1051/ },
  { id: "madero", nombre: "Madero", tipo: "local", formLabel: "Sao Madero - Pierina Dealessi & Boulevard Rosario Vera Peñaloza", zona: "bsas", direccion: "Pierina Dealessi y Blvd. Rosario Vera Peñaloza, Puerto Madero, CABA", lat: -34.61885, lng: -58.36245, pat: /madero|dealessi|penaloza/ },
  { id: "palmas_del_pilar", nombre: "Palmas del Pilar", tipo: "local", formLabel: "Sao Palmas del Pilar - Las Magnolias 757", zona: "bsas", direccion: "Las Magnolias 757 (Palmas del Pilar), Pilar", lat: -34.44815, lng: -58.87125, pat: /pilar|magnolias 757/ }
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
let localSeleccionadoId = null;

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
  const str = String(s).trim();

  // 1. Formato DD/MM/YYYY [HH:mm[:ss]]
  const mArg = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (mArg) {
    return new Date(+mArg[3], +mArg[2] - 1, +mArg[1], +(mArg[4] || 0), +(mArg[5] || 0), +(mArg[6] || 0));
  }

  // 2. Formato ISO YYYY-MM-DD (evita el desfase UTC-3 de new Date("YYYY-MM-DD"))
  const mIso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (mIso) {
    if (/Z$/i.test(str) && mIso[4] != null) {
      const dUtc = new Date(str);
      return isNaN(dUtc) ? null : dUtc;
    }
    return new Date(+mIso[1], +mIso[2] - 1, +mIso[3], +(mIso[4] || 0), +(mIso[5] || 0), +(mIso[6] || 0));
  }

  const d = new Date(str.replace(" ", "T"));
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

// ---------------------------------------------------------------- seguridad / login y permisos
function aplicarPermisosUI() {
  const btnNuevo = document.querySelector('button[onclick="abrirModalNuevo()"]');
  if (btnNuevo) {
    btnNuevo.style.display = (rolActual === "admin") ? "inline-flex" : "none";
  }
}

function cerrarSesion() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  tokenActual = "";
  rolActual = "gerente";
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
    const auth = await apiGet("auth");
    rolActual = (auth && auth.rol) || "gerente";
    localStorage.setItem(TOKEN_STORAGE_KEY, tokenActual);
    const overlay = $("loginOverlay");
    if (overlay) overlay.style.setProperty("display", "none", "important");
    aplicarPermisosUI();
    iniciarAppAutenticada();
  } catch (e) {
    tokenActual = "";
    rolActual = "gerente";
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

// ---------------------------------------------------------------- carga manual de postulante (solo RRHH / Admin)
function actualizarCamposNuevoPostulante() {
  const sec = $("newSector") ? $("newSector").value : "";
  const puesto = $("newPuesto");
  const local = $("newLocal");
  const zona = $("newZona") ? $("newZona").value : "";
  const esBsAs = zona !== "Mar del Plata y Costa Atlantica";

  if (puesto) {
    if (sec === "Logistica") puesto.value = "Picking/Armado de Pedidos";
    else if (sec === "Producción en fábrica") puesto.value = "Pasteleria, Panadería, Sandwicheria";
    else if (puesto.value.includes("Picking") || puesto.value.includes("Pasteleria")) {
      puesto.value = "Atención al publico en local";
    }
  }

  if (local) {
    if (sec === "Logistica") {
      local.value = esBsAs ? "Logística San Isidro (GBA)" : "Logística Alfar (Mar del Plata)";
    } else if (sec === "Producción en fábrica") {
      local.value = esBsAs ? "Fábrica San Isidro (GBA)" : "Fábrica Alfar (Mar del Plata)";
    }
  }
}

function abrirModalNuevo() {
  if (rolActual !== "admin") {
    toast("Solo RRHH o Sistemas pueden cargar postulantes manualmente.", true);
    return;
  }
  const form = $("formNuevoPostulante");
  if (form) form.reset();
  actualizarCamposNuevoPostulante();
  const m = $("nuevoModal");
  if (m) m.style.display = "flex";
}

async function guardarNuevoPostulante(e) {
  e.preventDefault();
  if (rolActual !== "admin") {
    toast("No tenés permisos para realizar esta acción.", true);
    return;
  }
  const btn = $("btnGuardarNuevo");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  const nombre = $("newNombre").value.trim();
  const tel = $("newTel").value.trim();
  const email = $("newEmail").value.trim().toLowerCase();
  const dir = $("newDir").value.trim();
  const nac = $("newNac").value;
  const zona = $("newZona") ? $("newZona").value : "Mar del Plata y Costa Atlantica";
  const sector = $("newSector").value;
  const puesto = $("newPuesto").value;
  const local = $("newLocal").value;
  const expForm = $("newExperiencia") ? $("newExperiencia").value : "";
  const b1 = $("newLicenciaB1") ? $("newLicenciaB1").value : "No";
  const estado = $("newEstado").value;
  const nota = $("newNota").value.trim();
  const ahoraStr = new Date().toISOString().replace("T", " ").slice(0, 19);

  let cvArchivo = null;
  const fileInput = $("newCvFile");
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    if (file.size > 8 * 1024 * 1024) {
      toast("El archivo supera los 8 MB máximos permitidos", true);
      btn.disabled = false;
      btn.textContent = "Guardar postulante";
      return;
    }
    btn.textContent = "Subiendo CV...";
    cvArchivo = await leerArchivoBase64(file);
  }

  const esBsAs = zona !== "Mar del Plata y Costa Atlantica";
  const esLog = sector === "Logistica";
  const esProd = sector === "Producción en fábrica";

  // Mapa exacto de columnas según la rama del Google Form
  // MDP/Costa: Locales = sin sufijo | Logística = .2 | Producción = .3
  // AMBA/LP/Zárate: Locales = .5 | Logística = .7 | Producción = .8
  const sufijo = esBsAs
    ? (esLog ? ".7" : (esProd ? ".8" : ".5"))
    : (esLog ? ".2" : (esProd ? ".3" : ""));

  const idxExacto = exacto => headersCrudos.findIndex(h => String(h || "").trim() === exacto);
  const nuevaFila = new Array(headersCrudos.length).fill("");

  const setCol = (headerExacto, valor) => {
    if (!valor) return -1;
    const i = idxExacto(headerExacto);
    if (i >= 0) nuevaFila[i] = valor;
    return i;
  };

  // Datos generales de cabecera (columnas A..D + zona BL + equipo AL/BK)
  setCol("Marca temporal", ahoraStr);
  setCol("Dirección de correo electrónico", email);
  setCol("Nombre Completo", nombre);
  setCol("Fecha de nacimiento", nac);
  setCol("Desde donde te contactas", zona);
  setCol(esBsAs ? "Buscas sumarte a nuestro equipo de.2" : "Buscas sumarte a nuestro equipo de", sector);

  // Datos de contacto de la rama correspondiente
  setCol("Correo electrónico" + sufijo, email);
  setCol("Dirección" + sufijo, dir);
  setCol("Número de teléfono" + sufijo, tel);

  // Datos específicos según rama (Locales vs Logística/Producción)
  if (esLog || esProd) {
    const sufPuesto = esBsAs ? (esLog ? ".2" : ".3") : (esLog ? "" : ".1");
    setCol("En cual de nuestros equipos te gustaría trabajar? /Puestos de interes" + sufPuesto, puesto);
    setCol("Contas con experiencia previa en el area?" + sufPuesto, expForm);
  } else {
    setCol("Puesto de interés" + sufijo, puesto);
    setCol("¿En cual de nuestros locales te gustaría trabajar?" + sufijo, local);
    if (expForm && expForm !== "Primer Empleo") {
      setCol("¿Queres agregar algo sobre tus estudios o actividades?" + sufijo, "Experiencia declarada: " + expForm);
    }
  }

  // Licencia B1 (si es Logística o si se marcó "Sí" en cualquier otra área)
  if (esLog || b1 === "Sí") {
    setCol(esBsAs ? "Contas con Licencia B1?.1" : "Contas con Licencia B1?", b1);
  }

  const idxColCv = idxExacto("Carga tu CV" + sufijo);

  try {
    const resp = await apiPost("agregar", [{
      ts: ahoraStr, nombre, nac, email, dir, tel,
      sector, puesto, local, estado, nota,
      fila: nuevaFila,
      cvArchivo: cvArchivo,
      idxColCv: idxColCv
    }]);

    if (resp && resp.cvUrl && idxColCv >= 0) {
      nuevaFila[idxColCv] = resp.cvUrl;
    }

    filasCrudas.push(nuevaFila);
    construirPersonas();

    const tel10 = tel.replace(/\D/g, "").slice(-10);
    const idPersona = email ? "e:" + email : (tel10.length >= 8 ? "t:" + tel10 : "f:" + (filasCrudas.length - 1) + "_" + sinTildes(ahoraStr));
    setEstado(idPersona, estado, nota);

    toast(cvArchivo ? "Postulante y CV guardados ✔" : "Postulante cargado ✔");
    cerrarModalNuevo();
    renderTodo();
    geocodificarPendientes();
  } catch (err) {
    toast("No se pudo guardar: " + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar postulante";
  }
}

function cerrarModalNuevo() {
  const m = $("nuevoModal");
  if (m) m.style.display = "none";
}

function leerArchivoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || "").split(",")[1] || "";
      resolve({
        nombre: file.name,
        tipo: file.type || "application/octet-stream",
        datos: base64
      });
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo del CV"));
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------- domicilios y zonas (MDP + Costa + BA + La Plata + Zárate)
function limpiarDireccion(dir) {
  let d = String(dir || "").replace(/\([^)]*\)/g, " ").split("//")[0];
  d = d.replace(/\b(piso|pb|depto|dpto|dto|departamento|torre|monoblock|mza|mz|manzana|lote|casa|timbre)\b.*$/i, " ");
  d = d.replace(/\bmar del plata\b|\bmdp\b|\bargentina\b|\bpcia\.?\s*de\s*buenos\s*aires\b/ig, " ");
  return d.replace(/[,;.\s]+$/, "").replace(/\s+/g, " ").trim();
}

const RE_COSTA = /\b(pinamar|gesell|miramar|santa clara|mar chiquita|mar de las pampas|las gaviotas|mar azul|cariloo?|ostende|valeria del mar|san bernardo|la lucila|santa teresita|mar del tuyu|costa azul)\b/;
const RE_BSAS  = /\b(caba|capital federal|palermo|belgrano|recoleta|caballito|almagro|flores|floresta|devoto|urquiza|nunez|saavedra|colegiales|chacarita|villa crespo|boedo|san telmo|monserrat|retiro|puerto madero|madero|houssay|barracas|la boca|pompeya|liniers|mataderos|lugano|avellaneda|lanus|lomas|banfield|temperley|adrogu[eé]|quilmes|berazategui|florencio varela|moron|haedo|ramos mejia|castelar|ituzaingo|merlo|moreno|san justo|la matanza|san martin|caseros|ciudadela|tres de febrero|vicente lopez|olivos|martinez|san isidro|beccar|san fernando|tigre|nordelta|pacheco|escobar|pilar|zarate|campana|la plata|city bell|gonnet|villa elisa|tolosa|ringuelet|los hornos|berisso|ensenada)\b/;

function zonaDe(contacto, dir, localesTxt) {
  const c = sinTildes(contacto);
  const d = sinTildes(dir);
  const l = sinTildes(localesTxt);
  if (c.includes("amba") || c.includes("caba") || c.includes("gran buenos aires") || c.includes("gba") || c.includes("zarate") || c.includes("la plata") || c.includes("buenos aires")) return "bsas";
  if (c.includes("mar del plata") || c.includes("costa")) return "mdp";
  if (l && /san isidro|zarate|la plata|urquiza|devoto|belgrano|madero|houssay|pilar/.test(l)) return "bsas";
  if (d && RE_BSAS.test(d)) return "bsas";
  if (d && RE_COSTA.test(d)) return "mdp";
  if (d && !/\b(cordoba|rosario|santa fe|mendoza|tucuman|salta|neuquen|bariloche|bahia blanca|tandil|necochea)\b/.test(d)) return "mdp";
  return c ? "otra" : "sin";
}

function geoZona(zona, dir) {
  const d = sinTildes(dir);
  if (RE_COSTA.test(d)) return "costa";
  if (zona === "bsas" || RE_BSAS.test(d)) return "bsas";
  return "mdp";
}

function claveGeo(dir, gz, contacto) {
  const c = sinTildes(contacto);
  const suf = c.includes("zarate") ? "|z" : (c.includes("la plata") ? "|lp" : "");
  return gz + suf + "|" + sinTildes(limpiarDireccion(dir));
}

// ---------------------------------------------------------------- geocodificación (vía Google Apps Script)
async function geocodificarPendientes() {
  if (geoCorriendo) return;
  geoCorriendo = true;
  let errores = 0, hechos = 0;
  try {
    const vistos = new Set();
    const cola = personas
      .filter(p => p.dir && p.geoKey && !(p.geoKey in geoCache) && !geoFallos.has(p.geoKey))
      .sort((a, b) => (ESTADOS_ACTIVOS.includes(b.estado) - ESTADOS_ACTIVOS.includes(a.estado)) || (b.lastTs - a.lastTs))
      .filter(p => !vistos.has(p.geoKey) && vistos.add(p.geoKey));

    const LOTE_SIZE = 25;
    for (let i = 0; i < cola.length; i += LOTE_SIZE) {
      const bloque = cola.slice(i, i + LOTE_SIZE);
      setCarga("📍 Ubicando domicilios… quedan " + (cola.length - i));

      const payload = bloque.map(p => {
        const base = limpiarDireccion(p.dir);
        const c = sinTildes(p.contacto);
        const d = sinTildes(base);
        let ciudad = ", Mar del Plata, Buenos Aires, Argentina";
        if (p.geoZona === "costa") {
          ciudad = ", Buenos Aires, Argentina";
        } else if (p.geoZona === "bsas") {
          if (c.includes("zarate") && !d.includes("zarate")) ciudad = ", Zárate, Buenos Aires, Argentina";
          else if ((/\b(calle\s*\d+|\d+\s*(n|entre|y)\s*\d+)\b/.test(d) || c.includes("la plata")) && !RE_BSAS.test(d)) ciudad = ", La Plata, Buenos Aires, Argentina";
          else ciudad = ", Buenos Aires, Argentina";
        }
        return { key: p.geoKey, gz: p.geoZona, query: base + ciudad };
      });

      try {
        const resLote = await apiPost("geocodificar_lote", payload);
        if (Array.isArray(resLote)) {
          resLote.forEach(r => {
            geoCache[r.key] = (r.lat != null && r.lng != null)
              ? { lat: r.lat, lng: r.lng, tipo: r.tipo || "OK" }
              : { lat: null, lng: null, tipo: "NO" };
            hechos++;
          });
        }
        errores = 0;
        renderTodo();
      } catch (err) {
        errores++;
        if (errores >= 3) {
          setCarga("⚠️ Error al geocodificar: " + err.message);
          break;
        }
        await dormir(2000);
      }
    }
  } finally {
    geoCorriendo = false;
    if (errores < 3) setCarga("");
    if (hechos > 0) renderTodo();
  }
}

async function cargarGeo() {
  try {
    const nuevas = await apiGet("geo");
    if (Array.isArray(nuevas)) nuevas.forEach(g => {
      const key = Array.isArray(g) ? g[0] : g.key;
      const lat = parseFloat(Array.isArray(g) ? g[1] : g.lat);
      const lng = parseFloat(Array.isArray(g) ? g[2] : g.lng);
      const tipo = (Array.isArray(g) ? g[3] : g.tipo) || "OK";
      if (!key) return;
      geoCache[key] = (isNaN(lat) || isNaN(lng)) ? { lat: null, lng: null, tipo: "NO" } : { lat, lng, tipo };
    });
  } catch (e) {}
}

// ---------------------------------------------------------------- armado de personas (SOPORTE 115 COLUMNAS A..DK)
function localesDe(texto, sector, zona) {
  const t = sinTildes(texto);
  const ids = t ? LOCALES_SAO.filter(l => l.pat.test(t)).map(l => l.id) : [];

  // Asignación automática a Fábrica o Logística según zona (MDP -> Alfar, BA -> San Isidro)
  if (sector === "produccion") {
    if (zona === "bsas") {
      if (!ids.includes("fabrica_san_isidro")) ids.push("fabrica_san_isidro");
    } else {
      if (!ids.includes("fabrica_alfar")) ids.push("fabrica_alfar");
    }
  } else if (sector === "logistica") {
    if (zona === "bsas") {
      if (!ids.includes("logistica_san_isidro")) ids.push("logistica_san_isidro");
    } else {
      if (!ids.includes("logistica_alfar")) ids.push("logistica_alfar");
    }
  }
  return ids;
}

function categoriaExperiencia(p) {
  const expForm = sinTildes(p.expForm);
  if (expForm.includes("primer empleo")) return "ninguna";
  if (expForm.includes("ano") || expForm.includes("menos de 1") || expForm.includes("mas de 5")) {
    return p.sector === "logistica" ? "otra" : "gastronomia";
  }
  const t = sinTildes([p.notas, p.dondeTrab].join(" "));
  if (/camarer|mozo|moza|cocin|barista|gastronom|restaur|pizz|heladeri|cafeteri|\bbar\b|panader|pastel|amasad|produccion|fabrica/.test(t)) return "gastronomia";
  if (/venta|vendedor|atencion|cajer|comercio|kiosco|tienda|promotor|reposit|local/.test(t)) return "ventas";
  if (/primer/.test(sinTildes(p.puesto)) || !t) return "ninguna";
  return "otra";
}
const NOMBRE_EXP = { gastronomia: "Gastronomía / Producción", ventas: "Atención / ventas", ninguna: "Sin experiencia declarada", otra: "Otra experiencia" };

function construirPersonas() {
  const H = headersCrudos.map(sinTildes);
  const allIdx = fn => {
    const res = [];
    H.forEach((h, i) => { if (fn(h)) res.push(i); });
    return res;
  };

  // Mapeo exacto de las 115 columnas (A hasta DK)
  const COLS = {
    ts:        allIdx(h => h.includes("marca temporal")),
    nombre:    allIdx(h => h.includes("nombre completo")),
    nac:       allIdx(h => h.includes("fecha de nacimiento")),
    emailForm: allIdx(h => h.includes("direccion de correo")),
    email:     allIdx(h => h === "correo electronico" || h.startsWith("correo electronico")),
    dir:       allIdx(h => !h.includes("correo") && (h === "direccion" || h.startsWith("direccion."))),
    tel:       allIdx(h => h.includes("numero de telefono")),
    estudia:   allIdx(h => h.includes("estas estudiando")),
    dondeEst:  allIdx(h => h.includes("si tu respuesta fue si")),
    carrera:   allIdx(h => h.includes("cual carrera")),
    notas:     allIdx(h => h.includes("queres agregar algo sobre tus estudios")),
    trabaja:   allIdx(h => h.includes("estas trabajando actualmente")),
    dondeTrab: allIdx(h => h.startsWith("si estas trabajando")),
    puesto:    allIdx(h => h.includes("puesto de interes") || h.includes("equipos te gustaria trabajar")),
    locales:   allIdx(h => h.includes("cual de nuestros locales")),
    expForm:   allIdx(h => h.includes("contas con experiencia previa") || h.includes("tenes experiencia en")),
    licencia:  allIdx(h => h.includes("licencia b1")),
    cv:        allIdx(h => h.includes("carga tu cv")),
    sector:    allIdx(h => h.includes("buscas sumarte a nuestro equipo")),
    contacto:  allIdx(h => h.includes("desde donde te contactas"))
  };

  const grupos = new Map();
  let totalPost = 0;

  filasCrudas.forEach((r, idx) => {
    const g = indices => {
      for (let k = 0; k < indices.length; k++) {
        const val = r[indices[k]];
        if (val != null && String(val).trim() !== "") return String(val).trim();
      }
      return "";
    };
    const gAll = indices => {
      const vals = [];
      for (let k = 0; k < indices.length; k++) {
        const val = r[indices[k]];
        if (val != null && String(val).trim() !== "") vals.push(String(val).trim());
      }
      return vals.join(" , ");
    };

    const nombre = g(COLS.nombre), tsStr = g(COLS.ts);
    if (!nombre && !tsStr) return;
    totalPost++;

    // Lee todas las columnas de "Buscas sumarte a nuestro equipo de" (AL y BK)
    const sectorRaw = gAll(COLS.sector);
    const puestoRaw = gAll(COLS.puesto);

    const post = {
      ts: parseFecha(tsStr),
      nombre,
      nac: parseFecha(g(COLS.nac)),
      email: (g(COLS.email) || g(COLS.emailForm)).toLowerCase(),
      dir: g(COLS.dir),
      tel: g(COLS.tel),
      estudia: g(COLS.estudia),
      dondeEst: g(COLS.dondeEst),
      carrera: g(COLS.carrera),
      notas: gAll(COLS.notas),
      trabaja: g(COLS.trabaja),
      dondeTrab: g(COLS.dondeTrab),
      puesto: puestoRaw,
      locales: gAll(COLS.locales),
      expForm: gAll(COLS.expForm),
      licencia: gAll(COLS.licencia),
      cv: gAll(COLS.cv),
      sector: sectorRaw,
      contacto: g(COLS.contacto),
      fila: r
    };

    const tel10 = post.tel.replace(/\D/g, "").slice(-10);
    const key = post.email ? "e:" + post.email : (tel10.length >= 8 ? "t:" + tel10 : "f:" + idx + "_" + sinTildes(tsStr));
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
      expForm: ult.expForm || "", licencia: pick("licencia"), contacto: ult.contacto,
      lastTs: ult.ts || new Date(0), firstTs: posts[posts.length - 1].ts || new Date(0)
    };

    // Clasificación exacta por columna AL / BK ("Buscas sumarte a nuestro equipo de")
    const secNorm = sinTildes(ult.sector);
    const puestoNorm = sinTildes(ult.puesto);
    if (secNorm.includes("produc") || (!secNorm && /pasteleria|panaderia|sandwicheria/.test(puestoNorm))) {
      p.sector = "produccion";
    } else if (secNorm.includes("logist") || (!secNorm && /picking|armado de pedidos/.test(puestoNorm))) {
      p.sector = "logistica";
    } else {
      p.sector = "locales";
    }

    p.zona = zonaDe(p.contacto, p.dir, p.locales);
    p.geoZona = geoZona(p.zona, p.dir);
    p.geoKey = p.dir ? claveGeo(p.dir, p.geoZona, p.contacto) : "";
    p.edad = edadDe(p.nac);
    p.localesIds = localesDe(p.locales, p.sector, p.zona);
    p.exp = categoriaExperiencia(p);

    const licNorm = sinTildes(p.licencia);
    const textoB1 = sinTildes([p.notas, p.dondeTrab, p.dondeEst].join(" "));
    p.b1 = (licNorm === "si" || licNorm.includes("si") || /\bb[ .-]?1\b|licencia profesional|carnet profesional/.test(textoB1)) ? "si" : "no";

    p.texto = sinTildes([p.nombre, p.puesto, p.carrera, p.dondeEst, p.dondeTrab, p.dir, p.tel, p.email, p.locales, p.expForm, p.notas].join(" "));
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
    const etiqueta = loc.tipo === "fabrica" ? "FÁB" : (loc.tipo === "logistica" ? "LOG" : "SÃO");
    const estiloExtra = loc.tipo === "fabrica"
      ? "background:#1e1e1e; color:#e67e22; border-color:#e67e22;"
      : (loc.tipo === "logistica" ? "background:#1e1e1e; color:#2ecc71; border-color:#2ecc71;" : "");

    // Desplazamiento fijo en píxeles para que queden pegados [FÁB] [SÃO] [LOG] a cualquier nivel de zoom
    const anchorX = loc.tipo === "fabrica" ? 53 : (loc.tipo === "logistica" ? -19 : 17);

    const icon = L.divIcon({
      className: "sao-pin",
      html: '<div class="pin-local" style="' + estiloExtra + '">' + etiqueta + "</div>",
      iconSize: [34, 34],
      iconAnchor: [anchorX, 17]
    });

    const m = L.marker([loc.lat, loc.lng], { icon, zIndexOffset: 1000 }).addTo(localesLayer);
    const box = document.createElement("div");
    const titulo = loc.tipo === "local" ? "SÃO " + loc.nombre : loc.nombre;
    box.innerHTML = "<b>" + esc(titulo) + "</b><br>" + esc(loc.direccion) + "<br>";

    // Botón 1: Por cercanía en el mapa (limpia el filtro de sede elegida)
    const bCerca = document.createElement("button");
    bCerca.className = "popup-btn";
    bCerca.textContent = "📍 Viven cerca (< 3 km)";
    bCerca.addEventListener("click", () => {
      $("mapLocalFilter").value = "todos";
      $("mapCercaFilter").value = loc.id;
      $("mapRadioFilter").value = "3";
      cardsLimit = MAX_CARDS;
      renderMapa();
      m.closePopup();
    });
    box.appendChild(bCerca);

    // Botón 2: Por elección en el formulario (limpia el filtro de distancia)
    const bEligieron = document.createElement("button");
    bEligieron.className = "popup-btn";
    bEligieron.style.marginLeft = "4px";
    bEligieron.textContent = loc.tipo === "fabrica"
      ? "🏭 Postulados a Producción"
      : (loc.tipo === "logistica" ? "🚚 Postulados a Logística" : "🏪 Eligieron este local");
    bEligieron.addEventListener("click", () => {
      $("mapCercaFilter").value = "ninguno";
      $("mapLocalFilter").value = loc.id;
      cardsLimit = MAX_CARDS;
      renderMapa();
      m.closePopup();
    });
    box.appendChild(bEligieron);

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
  llenar("mapLocalFilter", '<option value="todos">Eligieron cualquier sede/sucursal</option>');
  llenar("mapCercaFilter", '<option value="ninguno">— sin filtro de distancia —</option>');
  llenar("pipelineLocal", '<option value="todos">Todas las sedes/sucursales</option>');

  const newLoc = $("newLocal");
  if (newLoc) {
    newLoc.innerHTML = '<option value="">Sin preferencia</option>';
    locs.forEach(l => {
      const o = document.createElement("option");
      o.value = l.formLabel || l.nombre;
      o.textContent = l.nombre + " (" + l.direccion + ")";
      newLoc.appendChild(o);
    });
  }

  ["mapExpFilter", "localDetalleExp"].forEach(id => {
    const e = $(id);
    if (e) {
      e.innerHTML = '<option value="todas">Cualquier experiencia</option>' +
        Object.keys(NOMBRE_EXP).map(k => '<option value="' + k + '">' + NOMBRE_EXP[k] + "</option>").join("");
    }
  });
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
    fechaDesde: v("mapFechaDesde"),
    fechaHasta: v("mapFechaHasta"),
    edadMin: parseInt(v("mapEdadMin"), 10) || 0, edadMax: parseInt(v("mapEdadMax"), 10) || 0,
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
    if (F.fechaDesde) {
      const dDesde = new Date(F.fechaDesde + "T00:00:00");
      if (!p.lastTs || p.lastTs < dDesde) continue;
    }
    if (F.fechaHasta) {
      const dHasta = new Date(F.fechaHasta + "T23:59:59");
      if (!p.lastTs || p.lastTs > dHasta) continue;
    }
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
      "<br>🎯 " + esc(p.puesto || SECTORES[p.sector]) + "<br>🏪 <b>Sede / Local:</b> " + esc(locTxt) +
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

// ---------------------------------------------------------------- pestaña sucursales, fábricas y logística
function renderLocalesTab() {
  const grid = $("localesCardsGrid");
  if (!grid) return;
  const zona = $("localesZonaFilter") ? $("localesZonaFilter").value : "todas";
  const tipo = $("localesTipoFilter") ? $("localesTipoFilter").value : "todos";
  const q = sinTildes($("localesSearchInput") ? $("localesSearchInput").value : "");
  const activos = personas.filter(p => ESTADOS_ACTIVOS.includes(p.estado));

  const lista = LOCALES_SAO
    .filter(l =>
      (zona === "todas" || l.zona === zona) &&
      (tipo === "todos" || l.tipo === tipo) &&
      (!q || sinTildes(l.nombre + " " + l.direccion).includes(q))
    )
    .sort((a, b) => (a.tipo === b.tipo ? a.nombre.localeCompare(b.nombre) : (a.tipo === "local" ? 1 : -1)));

  grid.innerHTML = "";
  lista.forEach(loc => {
    const eligieron = activos.filter(p => p.localesIds.includes(loc.id));
    const cerca = activos.filter(p => {
      const u = ubicacion(p);
      return u && distanciaKm(u.lat, u.lng, loc.lat, loc.lng) <= 3;
    });

    const icono = loc.tipo === "fabrica" ? "🏭 " : (loc.tipo === "logistica" ? "🚚 " : "🏪 SÃO ");
    const card = document.createElement("div");
    card.className = "cv-card-item";
    card.style.cursor = "pointer";
    card.style.borderColor = (localSeleccionadoId === loc.id) ? "#d4a373" : "";
    card.innerHTML =
      '<div class="cv-card-top"><span class="cv-card-title">' + icono + esc(loc.nombre) + '</span>' +
      '<span class="badge badge-gris">' + (loc.zona === "bsas" ? "BA / AMBA" : "MDP / Costa") + '</span></div>' +
      '<div class="cv-card-info" style="margin-top:6px;">📍 ' + esc(loc.direccion) +
      '<div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">' +
      '<span class="badge badge-Entrevista">' + eligieron.length + ' postulantes</span>' +
      '<span class="badge badge-Recomendado">' + cerca.length + ' a &lt; 3 km</span>' +
      '</div></div>';
    card.addEventListener("click", () => abrirDetalleLocal(loc.id));
    grid.appendChild(card);
  });

  if (localSeleccionadoId) renderDetalleLocal();
}

function abrirDetalleLocal(locId) {
  localSeleccionadoId = locId;
  renderLocalesTab();
  const panel = $("localDetallePanel");
  if (panel) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function cerrarDetalleLocal() {
  localSeleccionadoId = null;
  if ($("localDetallePanel")) $("localDetallePanel").style.display = "none";
  renderLocalesTab();
}

function limpiarFiltrosDetalleLocal() {
  if ($("localDetalleModo")) $("localDetalleModo").value = "eligieron";
  if ($("localDetalleEstado")) $("localDetalleEstado").value = "activos";
  if ($("localDetalleExp")) $("localDetalleExp").value = "todas";
  if ($("localDetalleB1")) $("localDetalleB1").value = "todos";
  if ($("localDetalleEdadMin")) $("localDetalleEdadMin").value = "";
  if ($("localDetalleEdadMax")) $("localDetalleEdadMax").value = "";
  if ($("localDetalleFechaDesde")) $("localDetalleFechaDesde").value = "";
  if ($("localDetalleFechaHasta")) $("localDetalleFechaHasta").value = "";
  renderDetalleLocal();
}

function renderDetalleLocal() {
  const panel = $("localDetallePanel");
  const loc = LOCALES_SAO.find(l => l.id === localSeleccionadoId);
  if (!panel || !loc) return;

  panel.style.display = "block";
  const prefijo = loc.tipo === "local" ? "SÃO " : "";
  $("localDetalleTitulo").textContent = prefijo + loc.nombre;
  $("localDetalleDir").textContent = loc.direccion;

  const modo = $("localDetalleModo") ? $("localDetalleModo").value : "eligieron";
  const estadoFiltro = $("localDetalleEstado") ? $("localDetalleEstado").value : "activos";
  const expFiltro = $("localDetalleExp") ? $("localDetalleExp").value : "todas";
  const b1Filtro = $("localDetalleB1") ? sinTildes($("localDetalleB1").value) : "todos";
  const edadMin = parseInt($("localDetalleEdadMin") ? $("localDetalleEdadMin").value : "", 10) || 0;
  const edadMax = parseInt($("localDetalleEdadMax") ? $("localDetalleEdadMax").value : "", 10) || 0;
  const fechaDesde = $("localDetalleFechaDesde") ? $("localDetalleFechaDesde").value : "";
  const fechaHasta = $("localDetalleFechaHasta") ? $("localDetalleFechaHasta").value : "";

  const base = personas.filter(p => {
    if (estadoFiltro === "activos") {
      if (!ESTADOS_ACTIVOS.includes(p.estado)) return false;
    } else if (estadoFiltro !== "todos" && p.estado !== estadoFiltro) {
      return false;
    }
    if (expFiltro !== "todas" && p.exp !== expFiltro) return false;
    if (b1Filtro !== "todos" && p.b1 !== b1Filtro) return false;
    if (edadMin && (p.edad == null || p.edad < edadMin)) return false;
    if (edadMax && (p.edad == null || p.edad > edadMax)) return false;
    if (fechaDesde) {
      const dDesde = new Date(fechaDesde + "T00:00:00");
      if (!p.lastTs || p.lastTs < dDesde) return false;
    }
    if (fechaHasta) {
      const dHasta = new Date(fechaHasta + "T23:59:59");
      if (!p.lastTs || p.lastTs > dHasta) return false;
    }
    return true;
  });

  let candidatos = [];
  if (modo === "cerca") {
    candidatos = base
      .map(p => {
        const u = ubicacion(p);
        return u ? { p, dist: distanciaKm(u.lat, u.lng, loc.lat, loc.lng) } : null;
      })
      .filter(x => x && x.dist <= 3)
      .sort((a, b) => a.dist - b.dist)
      .map(x => ({ ...x.p, _distLocal: x.dist }));
  } else {
    candidatos = base
      .filter(p => p.localesIds.includes(loc.id))
      .sort((a, b) => b.lastTs - a.lastTs);
  }

  if ($("localDetalleCount")) $("localDetalleCount").textContent = candidatos.length + " postulantes";

  const cont = $("localDetalleLista");
  cont.innerHTML = "";
  if (!candidatos.length) {
    cont.innerHTML = '<div class="cards-empty">No hay postulantes con esos filtros para esta sede.</div>';
    return;
  }

  candidatos.forEach(p => {
    const card = document.createElement("div");
    card.className = "cv-card-item";
    card.innerHTML =
      '<div class="cv-card-top"><span class="cv-card-title">' + esc(p.nombre) + '</span><span>' +
      '<span class="badge badge-' + p.estado + '">' + esc(NOMBRE_ESTADO[p.estado]) + '</span>' +
      (p.b1 === "si" ? '<span class="badge badge-Contratado">🚚 B1</span>' : '') +
      (p.posts.length > 1 ? '<span class="badge badge-repetido">×' + p.posts.length + '</span>' : '') +
      (p._distLocal != null ? '<span class="badge badge-dist">' + p._distLocal.toFixed(1) + ' km</span>' : '') +
      '</span></div>' +
      '<div class="cv-card-info">📍 ' + esc(p.dir || "Sin domicilio") +
      '<br>🎯 ' + esc(p.puesto || SECTORES[p.sector]) + (p.edad ? ' · ' + p.edad + ' años' : '') +
      '<br>📅 ' + fmtFecha(p.lastTs) + '</div>';
    card.addEventListener("click", () => abrirModal(p.id));
    cont.appendChild(card);
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
  const expTexto = [p.expForm, NOMBRE_EXP[p.exp], p.notas].filter(Boolean).join(" — ");
  set("modalExp", expTexto);
  if ($("modalB1Row")) $("modalB1Row").style.display = (p.sector === "logistica" || p.b1 === "si") ? "block" : "none";
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
  else if (id === "pantalla-locales") renderLocalesTab();
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
    "mapB1Filter", "mapFechaDesde", "mapFechaHasta", "mapEdadMin", "mapEdadMax", "mapUbicFilter"].forEach(i => { if ($(i)) $(i).addEventListener("change", redibujar); });

  if ($("mapZonaFilter")) {
    $("mapZonaFilter").addEventListener("change", e => {
      if (mapInstance) {
        if (e.target.value === "bsas") mapInstance.flyTo([-34.6037, -58.43], 10);
        else mapInstance.flyTo([-38.0055, -57.555], 12);
      }
      redibujar();
    });
  }

  if ($("mapLocalFilter")) {
    $("mapLocalFilter").addEventListener("change", e => {
      const loc = LOCALES_SAO.find(l => l.id === e.target.value);
      if (loc && mapInstance) mapInstance.flyTo([loc.lat, loc.lng], 14);
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
      ["mapSearchInput", "mapEdadMin", "mapEdadMax", "mapFechaDesde", "mapFechaHasta"].forEach(i => { if ($(i)) $(i).value = ""; });
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
      if ($("mapUbicFilter")) $("mapUbicFilter").value = "todos";
      chipEstado = "activos";
      document.querySelectorAll(".quick-status-chips .chip[data-status]").forEach(x => x.classList.toggle("active", x.dataset.status === "activos"));
      redibujar();
      toast("Filtros limpiados");
    });
  }

  if ($("localesZonaFilter")) $("localesZonaFilter").addEventListener("change", renderLocalesTab);
  if ($("localesTipoFilter")) $("localesTipoFilter").addEventListener("change", renderLocalesTab);
  if ($("localesSearchInput")) $("localesSearchInput").addEventListener("input", renderLocalesTab);
  ["localDetalleModo", "localDetalleEstado", "localDetalleExp", "localDetalleB1", "localDetalleEdadMin", "localDetalleEdadMax",
    "localDetalleFechaDesde", "localDetalleFechaHasta"].forEach(id => {
    if ($(id)) $(id).addEventListener("change", renderDetalleLocal);
  });

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
// =====================================================================
// GENERADOR DEL CATALOGO Y DEL SITEMAP - FP Teaching Lab
// Lee productos.js y escribe catalogo.html y sitemap.xml.
// Lo ejecuta GitHub automaticamente cada vez que cambia productos.js
// (ver .github/workflows/catalogo.yml). No hace falta tocarlo a mano.
// =====================================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const SITIO = 'https://mariasantulario-svg.github.io';
const TIENDA = 'https://mariasantuario.gumroad.com/';
const INSTAGRAM = 'https://www.instagram.com/espteachermar/';

// ---------- Leer productos.js ----------
function leerProductos() {
  const codigo = fs.readFileSync(path.join(RAIZ, 'productos.js'), 'utf8');
  const contexto = { window: {} };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  const lista = contexto.window.productos;
  if (!Array.isArray(lista) || lista.length === 0) {
    throw new Error('productos.js no define window.productos o esta vacio');
  }
  return lista.filter((p) => p && p.titulo && p.enlace && !/^PEGAR/i.test(String(p.enlace).trim()));
}

// Reutiliza el icono de la pestana de la landing (si index.html lo tiene).
function favicon() {
  try {
    const index = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
    const m = index.match(/<link rel="icon" href="(data:image\/[^"]+)"/);
    return m ? `<link rel="icon" href="${m[1]}">\n` : '';
  } catch (e) {
    return '';
  }
}

// ---------- Utilidades ----------
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function hoy() {
  const d = new Date();
  const iso = d.toISOString().slice(0, 10);
  return { iso, texto: `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}` };
}

// Misma logica que la landing para agrupar la PAU por comunidad.
function comunidad(p) {
  if (p.comunidad) return p.comunidad;
  const t = (p.titulo || '').toLowerCase();
  if (t.includes('valencia') || t.includes('ophelia')) return 'Valencia';
  if (t.includes('madrid')) return 'Madrid';
  if (t.includes('murcia')) return 'Murcia';
  if (t.includes('catalunya') || t.includes('cataluña') || t.includes('cataluny')) return 'Catalunya';
  return 'General';
}

// ---------- Estructura del catalogo ----------
const FAMILIAS = [
  { area: 'Sanidad', titulo: 'Sanidad' },
  { area: 'Administración y Gestión', titulo: 'Administración y Gestión' },
  { area: 'Comercio y Marketing', titulo: 'Comercio y Marketing' },
  { area: 'Electricidad y Electrónica', titulo: 'Electricidad y Electrónica', sub: 'Instalaciones Eléctricas' },
  { area: 'Fabricación Mecánica', titulo: 'Fabricación Mecánica', sub: 'Soldadura y Calderería' },
  { area: 'Madera, Mueble y Corcho', titulo: 'Madera, Mueble y Corcho', sub: 'Carpintería y Mueble' },
  { area: 'Transversal', titulo: 'Transversal', sub: 'Materiales válidos para cualquier ciclo de FP.', general: 'Todos los ciclos' },
];
const ESO = { area: '1º ESO Atención Educativa', titulo: '1º ESO Atención Educativa', sub: 'Alternativa a Religión en Secundaria', general: 'Sesiones' };
const NIVELES = [['Básica', 'FP Básica'], ['GM', 'Grado Medio'], ['GS', 'Grado Superior']];

function item(p) {
  const gratis = p.tipo === 'gratis';
  const etiqueta = gratis
    ? '<span class="tag tag-gratis">Gratis</span>'
    : '<span class="tag tag-pago">Gumroad</span>';
  const accion = gratis ? 'Abrir recurso' : 'Ver en Gumroad';
  return `        <li class="item">
          <a href="${esc(p.enlace)}" target="_blank" rel="noopener">
            <span class="item-top">${etiqueta}</span>
            <span class="item-titulo">${esc(p.titulo)}</span>
            <span class="item-cta">${accion} <span aria-hidden="true">→</span></span>
          </a>
        </li>`;
}

function grupo(etiqueta, lista) {
  if (!lista.length) return '';
  return `      <div class="grupo">
        <h3>${esc(etiqueta)}</h3>
        <ul class="lista">
${lista.map(item).join('\n')}
        </ul>
      </div>`;
}

function seccion(id, titulo, sub, grupos) {
  const cuerpo = grupos.filter(Boolean).join('\n');
  if (!cuerpo) return '';
  return `    <section id="${id}" class="seccion">
      <h2>${esc(titulo)}</h2>${sub ? `\n      <p class="sub">${esc(sub)}</p>` : ''}
${cuerpo}
    </section>`;
}

function slug(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function seccionFamilia(fam, productos) {
  const delArea = productos.filter((p) => p.area === fam.area);
  const grupos = [];
  grupos.push(grupo(fam.general || 'Para toda la familia',
    delArea.filter((p) => !p.nivel)));
  NIVELES.forEach(([n, etiqueta]) => grupos.push(grupo(etiqueta, delArea.filter((p) => p.nivel === n))));
  return seccion(slug(fam.area), fam.titulo, fam.sub, grupos);
}

function construirHTML(productos, fecha) {
  const pau = productos.filter((p) => p.area === 'PAU');
  const comunidades = [['Valencia', 'Comunitat Valenciana'], ['Madrid', 'Comunidad de Madrid'],
    ['Murcia', 'Región de Murcia'], ['Catalunya', 'Catalunya'], ['General', 'Otros materiales']];
  const secciones = [];
  secciones.push(seccion('pau', 'Bachillerato y PAU', 'Simulacros y packs de preparación del examen de inglés, por comunidad autónoma.',
    comunidades.map(([c, etiqueta]) => grupo(etiqueta, pau.filter((p) => comunidad(p) === c)))));
  FAMILIAS.forEach((f) => secciones.push(seccionFamilia(f, productos)));
  secciones.push(seccionFamilia(ESO, productos));

  // Cualquier area nueva que no este en la lista anterior sale al final, para no perder nada.
  const conocidas = new Set(['PAU', ...FAMILIAS.map((f) => f.area), ESO.area]);
  const otras = [...new Set(productos.map((p) => p.area).filter((a) => !conocidas.has(a)))];
  otras.forEach((a) => secciones.push(seccionFamilia({ area: a, titulo: a }, productos)));

  const indice = secciones.filter(Boolean).map((s) => {
    const id = s.match(/id="([^"]+)"/)[1];
    const titulo = s.match(/<h2>([^<]+)<\/h2>/)[1];
    return `<a href="#${id}">${titulo}</a>`;
  }).join('\n        ');

  const titulo = 'Catálogo de recursos de inglés para FP, Bachillerato y PAU · FP Teaching Lab';
  const descripcion = 'Materiales de inglés de FP Teaching Lab: simulacros PAU por comunidad, recursos para ciclos de FP por familia profesional y materiales gratuitos.';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${SITIO}/catalogo.html">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${SITIO}/catalogo.html">
<meta property="og:locale" content="es_ES">
${favicon()}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --tinta: #1F2A44; --fondo: #F2EDE6; --tarjeta: #FAF7F1; --texto2: #5A6472;
    --suave: #8C95A6; --cabecera2: #AEB6C4; --acento: #C0392B;
    --borde: rgba(31,42,68,0.09); --linea: rgba(31,42,68,0.12);
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; background: var(--fondo); color: var(--tinta);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 400;
    -webkit-font-smoothing: antialiased; line-height: 1.5; }
  a { color: inherit; }
  header.banda { background: var(--tinta); }
  header.banda .dentro { max-width: 720px; margin: 0 auto; padding: 20px 22px; }
  .marca { font-family: 'Fraunces', serif; font-weight: 600; font-size: 21px; color: var(--tarjeta); text-decoration: none; }
  .handle { display: block; font-size: 13.5px; color: var(--cabecera2); font-weight: 500; margin-top: 4px; }
  main { max-width: 720px; margin: 0 auto; padding: 26px 18px 44px; }
  .volver { display: inline-block; font-size: 13px; font-weight: 500; color: var(--texto2); text-decoration: none; margin-bottom: 18px; }
  .volver:hover { color: var(--tinta); }
  h1 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 30px; line-height: 1.15; margin: 0 0 10px; }
  .intro { color: var(--texto2); font-size: 15px; margin: 0 0 8px; max-width: 58ch; }
  .fecha { color: var(--suave); font-size: 12.5px; margin: 0 0 22px; }
  nav.indice { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 8px; }
  nav.indice a { font-size: 12.5px; font-weight: 500; text-decoration: none; color: var(--tinta);
    background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 999px; padding: 6px 12px;
    transition: border-color .15s ease; }
  nav.indice a:hover { border-color: rgba(31,42,68,0.3); }
  .seccion { margin-top: 36px; scroll-margin-top: 16px; }
  .seccion h2 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 23px; line-height: 1.2; margin: 0; }
  .seccion .sub { color: var(--texto2); font-size: 13.5px; margin: 4px 0 0; }
  .grupo h3 { display: flex; align-items: center; gap: 9px; margin: 20px 0 10px;
    font-size: 11.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--texto2); }
  .grupo h3::after { content: ''; flex: 1; height: 1px; background: var(--linea); }
  .lista { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr; gap: 10px; }
  @media (min-width: 560px) { .lista { grid-template-columns: 1fr 1fr; } }
  .item a { display: flex; flex-direction: column; gap: 8px; height: 100%; text-decoration: none;
    background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 14px; padding: 14px 16px 13px;
    box-shadow: 0 1px 2px rgba(31,42,68,0.04), 0 10px 26px -16px rgba(31,42,68,0.25);
    transition: border-color .15s ease, box-shadow .15s ease; }
  .item a:hover { border-color: rgba(31,42,68,0.22); box-shadow: 0 1px 2px rgba(31,42,68,0.05), 0 14px 30px -16px rgba(31,42,68,0.32); }
  .item-titulo { font-family: 'Fraunces', serif; font-weight: 600; font-size: 16.5px; line-height: 1.25; }
  .item-cta { margin-top: auto; font-size: 12.5px; color: var(--texto2); }
  .item-cta span { color: var(--acento); }
  .tag { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    padding: 3px 9px; border-radius: 999px; }
  .tag-gratis { color: var(--tinta); border: 1px solid rgba(31,42,68,0.28); }
  .tag-pago { color: var(--texto2); background: rgba(31,42,68,0.06); }
  footer { max-width: 720px; margin: 0 auto; padding: 0 18px 40px; color: var(--suave); font-size: 12.5px; }
  footer a { color: var(--texto2); }
  a:focus-visible { outline: 2px solid var(--acento); outline-offset: 2px; }
</style>
</head>
<body>
  <header class="banda">
    <div class="dentro">
      <a class="marca" href="${SITIO}/">FP Teaching Lab</a>
      <span class="handle">@ESPteacherMar</span>
    </div>
  </header>
  <main>
    <a class="volver" href="${SITIO}/">← Volver a la portada</a>
    <h1>Recursos de inglés para FP, Bachillerato y PAU</h1>
    <p class="intro">Todos los materiales de inglés de FP Teaching Lab en una sola página, ordenados por etapa y familia profesional. Los recursos gratuitos se abren en Notion o GitHub; los de pago, en Gumroad.</p>
    <p class="fecha">Actualizado el ${fecha.texto} · ${productos.length} recursos</p>
    <nav class="indice" aria-label="Secciones del catálogo">
        ${indice}
    </nav>
${secciones.filter(Boolean).join('\n')}
  </main>
  <footer>
    FP Teaching Lab · <a href="${INSTAGRAM}" rel="noopener">@ESPteacherMar en Instagram</a> · <a href="${TIENDA}" rel="noopener">Tienda en Gumroad</a>
  </footer>
</body>
</html>
`;
}

function construirSitemap(productos, fecha) {
  const urls = [
    { loc: `${SITIO}/` },
    { loc: `${SITIO}/catalogo.html`, lastmod: fecha.iso },
  ];
  // Paginas propias alojadas en este mismo dominio (por ejemplo, el Super Pau Test).
  productos.forEach((p) => {
    const e = String(p.enlace).trim();
    if (!e.startsWith(SITIO + '/')) return;
    if (/\.(docx?|pdf|zip|pptx?|xlsx?|mp3|png|jpe?g)$/i.test(e)) return;
    if (!urls.some((u) => u.loc === e)) urls.push({ loc: e });
  });
  const cuerpo = urls.map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${cuerpo}\n</urlset>\n`;
}

// Solo reescribe si cambia algo mas que la fecha, para no generar cambios vacios.
function escribirSiCambia(nombre, nuevo, normalizar) {
  const ruta = path.join(RAIZ, nombre);
  const viejo = fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : null;
  if (viejo !== null && normalizar(viejo) === normalizar(nuevo)) {
    console.log(`${nombre}: sin cambios`);
    return false;
  }
  fs.writeFileSync(ruta, nuevo, 'utf8');
  console.log(`${nombre}: actualizado`);
  return true;
}

const productos = leerProductos();
const fecha = hoy();
const sinFechaHTML = (s) => s.replace(/Actualizado el [^·<]+·/, 'Actualizado el X ·');
const sinFechaXML = (s) => s.replace(/<lastmod>[^<]+<\/lastmod>/g, '<lastmod>X</lastmod>');
const catalogoCambiado = escribirSiCambia('catalogo.html', construirHTML(productos, fecha), sinFechaHTML);
// Si el catalogo cambia, el sitemap se reescribe siempre para que su fecha sea la real.
escribirSiCambia('sitemap.xml', construirSitemap(productos, fecha), catalogoCambiado ? () => Math.random() : sinFechaXML);

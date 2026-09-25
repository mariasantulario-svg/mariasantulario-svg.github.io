// =====================================================================
// GENERADOR DEL CATALOGO, LAS PAGINAS DE PRODUCTO Y EL SITEMAP
// FP Teaching Lab
// Lee productos.js y fichas.js y escribe:
//   catalogo.html, productos/<slug>.html (una por ficha) y sitemap.xml.
// Lo ejecuta GitHub automaticamente cada vez que cambia productos.js o
// fichas.js (ver .github/workflows/catalogo.yml). No hace falta tocarlo a mano.
// =====================================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const SITIO = 'https://mariasantulario-svg.github.io';
const TIENDA = 'https://mariasantuario.gumroad.com/';
const INSTAGRAM = 'https://www.instagram.com/espteachermar/';
const CARPETA_FICHAS = 'productos';

// ---------- Lectura de datos ----------
function leerLista(archivo, variable, obligatorio) {
  const ruta = path.join(RAIZ, archivo);
  if (!fs.existsSync(ruta)) {
    if (obligatorio) throw new Error(`Falta ${archivo}`);
    return [];
  }
  const contexto = { window: {} };
  vm.createContext(contexto);
  vm.runInContext(fs.readFileSync(ruta, 'utf8'), contexto);
  const lista = contexto.window[variable];
  if (!Array.isArray(lista)) throw new Error(`${archivo} no define window.${variable}`);
  if (obligatorio && lista.length === 0) throw new Error(`${archivo} esta vacio`);
  return lista;
}

function leerProductos() {
  return leerLista('productos.js', 'productos', true)
    .filter((p) => p && p.titulo && p.enlace && !/^PEGAR/i.test(String(p.enlace).trim()));
}

// Solo valen las fichas cuyo enlace coincide con un producto de productos.js.
function leerFichas(productos) {
  const porEnlace = new Map(productos.map((p) => [String(p.enlace).trim(), p]));
  const validas = [];
  leerLista('fichas.js', 'fichas', false).forEach((f) => {
    const producto = f && porEnlace.get(String(f.enlace || '').trim());
    if (!producto) {
      console.log(`Aviso: la ficha "${f && f.slug}" no coincide con ningun producto de productos.js y se ignora`);
      return;
    }
    if (!/^[a-z0-9-]+$/.test(f.slug || '')) throw new Error(`Slug no valido en la ficha de ${f.enlace}`);
    validas.push({ ficha: f, producto });
  });
  return validas;
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

function slug(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

// Seccion del catalogo a la que pertenece un area (para enlazar de vuelta).
function seccionDeArea(area) {
  if (area === 'PAU') return { id: 'pau', titulo: 'Bachillerato y PAU' };
  const fam = FAMILIAS.find((f) => f.area === area) || (area === ESO.area ? ESO : null);
  return { id: slug(area), titulo: fam ? fam.titulo : area };
}

const urlFicha = (f) => `${SITIO}/${CARPETA_FICHAS}/${f.slug}.html`;

// ---------- Piezas comunes ----------
const CSS_BASE = `
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
  h1 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 30px; line-height: 1.15; margin: 0 0 10px; }
  footer { max-width: 720px; margin: 0 auto; padding: 0 18px 40px; color: var(--suave); font-size: 12.5px; }
  footer a { color: var(--texto2); }
  a:focus-visible { outline: 2px solid var(--acento); outline-offset: 2px; }`;

function cabeza({ titulo, descripcion, url, fecha, imagen, tipo, css, jsonld }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<meta name="last-modified" content="${fecha.iso}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${tipo || 'website'}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="es_ES">${imagen ? `\n<meta property="og:image" content="${esc(imagen)}">` : ''}
${favicon()}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">${jsonld ? `\n<script type="application/ld+json">\n${JSON.stringify(jsonld, null, 1).replace(/</g, '\\u003c')}\n</script>` : ''}
<style>${CSS_BASE}${css}
</style>
</head>
<body>
  <header class="banda">
    <div class="dentro">
      <a class="marca" href="${SITIO}/">FP Teaching Lab</a>
      <span class="handle">@ESPteacherMar</span>
    </div>
  </header>
`;
}

const PIE = `  <footer>
    FP Teaching Lab · <a href="${INSTAGRAM}" rel="noopener">@ESPteacherMar en Instagram</a> · <a href="${TIENDA}" rel="noopener">Tienda en Gumroad</a>
  </footer>
</body>
</html>
`;

// ---------- Catalogo ----------
const CSS_CATALOGO = `
  .volver { display: inline-block; font-size: 13px; font-weight: 500; color: var(--texto2); text-decoration: none; margin-bottom: 18px; }
  .volver:hover { color: var(--tinta); }
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
  .tag-pago { color: var(--texto2); background: rgba(31,42,68,0.06); }`;

function item(p, fichas) {
  const gratis = p.tipo === 'gratis';
  const etiqueta = gratis
    ? '<span class="tag tag-gratis">Gratis</span>'
    : '<span class="tag tag-pago">Gumroad</span>';
  const f = fichas.get(String(p.enlace).trim());
  const href = f ? urlFicha(f) : p.enlace;
  const destino = f ? '' : ' target="_blank" rel="noopener"';
  const accion = f ? 'Ver detalles' : (gratis ? 'Abrir recurso' : 'Ver en Gumroad');
  return `        <li class="item">
          <a href="${esc(href)}"${destino}>
            <span class="item-top">${etiqueta}</span>
            <span class="item-titulo">${esc(p.titulo)}</span>
            <span class="item-cta">${accion} <span aria-hidden="true">→</span></span>
          </a>
        </li>`;
}

function construirCatalogo(productos, fichas, fecha) {
  const grupo = (etiqueta, lista) => (!lista.length ? '' : `      <div class="grupo">
        <h3>${esc(etiqueta)}</h3>
        <ul class="lista">
${lista.map((p) => item(p, fichas)).join('\n')}
        </ul>
      </div>`);
  const seccion = (id, titulo, sub, grupos) => {
    const cuerpo = grupos.filter(Boolean).join('\n');
    if (!cuerpo) return '';
    return `    <section id="${id}" class="seccion">
      <h2>${esc(titulo)}</h2>${sub ? `\n      <p class="sub">${esc(sub)}</p>` : ''}
${cuerpo}
    </section>`;
  };
  const seccionFamilia = (fam) => {
    const delArea = productos.filter((p) => p.area === fam.area);
    const grupos = [grupo(fam.general || 'Para toda la familia', delArea.filter((p) => !p.nivel))];
    NIVELES.forEach(([n, etiqueta]) => grupos.push(grupo(etiqueta, delArea.filter((p) => p.nivel === n))));
    return seccion(slug(fam.area), fam.titulo, fam.sub, grupos);
  };

  const pau = productos.filter((p) => p.area === 'PAU');
  const comunidades = [['Valencia', 'Comunitat Valenciana'], ['Madrid', 'Comunidad de Madrid'],
    ['Murcia', 'Región de Murcia'], ['Catalunya', 'Catalunya'], ['General', 'Otros materiales']];
  const secciones = [];
  secciones.push(seccion('pau', 'Bachillerato y PAU', 'Simulacros y packs de preparación del examen de inglés, por comunidad autónoma.',
    comunidades.map(([c, etiqueta]) => grupo(etiqueta, pau.filter((p) => comunidad(p) === c)))));
  FAMILIAS.forEach((f) => secciones.push(seccionFamilia(f)));
  secciones.push(seccionFamilia(ESO));
  // Cualquier area nueva que no este en la lista anterior sale al final, para no perder nada.
  const conocidas = new Set(['PAU', ...FAMILIAS.map((f) => f.area), ESO.area]);
  [...new Set(productos.map((p) => p.area).filter((a) => !conocidas.has(a)))]
    .forEach((a) => secciones.push(seccionFamilia({ area: a, titulo: a })));

  const llenas = secciones.filter(Boolean);
  const indice = llenas.map((s) => {
    const id = s.match(/id="([^"]+)"/)[1];
    const titulo = s.match(/<h2>([^<]+)<\/h2>/)[1];
    return `<a href="#${id}">${titulo}</a>`;
  }).join('\n        ');

  return cabeza({
    titulo: 'Catálogo de recursos de inglés para FP, Bachillerato y PAU · FP Teaching Lab',
    descripcion: 'Materiales de inglés de FP Teaching Lab: simulacros PAU por comunidad, recursos para ciclos de FP por familia profesional y materiales gratuitos.',
    url: `${SITIO}/catalogo.html`,
    fecha,
    css: CSS_CATALOGO,
  }) + `  <main>
    <a class="volver" href="${SITIO}/">← Volver a la portada</a>
    <h1>Recursos de inglés para FP, Bachillerato y PAU</h1>
    <p class="intro">Todos los materiales de inglés de FP Teaching Lab en una sola página, ordenados por etapa y familia profesional. Los recursos gratuitos se abren en Notion o GitHub; los de pago, en Gumroad.</p>
    <p class="fecha">Actualizado el ${fecha.texto} · ${productos.length} recursos</p>
    <nav class="indice" aria-label="Secciones del catálogo">
        ${indice}
    </nav>
${llenas.join('\n')}
  </main>
` + PIE;
}

// ---------- Paginas de producto ----------
const CSS_FICHA = `
  .migas { font-size: 13px; color: var(--texto2); margin: 0 0 18px; }
  .migas a { color: var(--texto2); text-decoration: none; }
  .migas a:hover { color: var(--tinta); }
  .etiqueta { font-size: 11.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--texto2); margin: 0 0 8px; }
  .entradilla { font-size: 16px; color: var(--tinta); margin: 0 0 18px; max-width: 60ch; }
  .compra { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin: 0 0 24px; }
  .boton { display: inline-block; background: var(--tinta); color: var(--tarjeta); text-decoration: none;
    font-weight: 700; font-size: 14.5px; padding: 12px 20px; border-radius: 12px; transition: background-color .15s ease; }
  .boton:hover { background: #0F172A; }
  .precio { font-size: 13.5px; color: var(--texto2); font-weight: 500; }
  .portada { margin: 0 0 30px; background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 16px; padding: 12px; }
  .portada img { display: block; width: 100%; height: auto; max-height: 440px; object-fit: contain; border-radius: 8px; }
  .bloque { margin: 0 0 28px; }
  .bloque h2 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 22px; line-height: 1.2; margin: 0 0 10px; }
  .bloque p { margin: 0 0 10px; font-size: 15px; max-width: 64ch; }
  .puntos { margin: 0; padding: 0 0 0 20px; font-size: 15px; max-width: 64ch; }
  .puntos li { margin: 0 0 8px; }
  .puntos li::marker { color: var(--acento); }
  .faq { background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 14px; padding: 18px 20px 8px; }
  .faq h3 { font-size: 15px; font-weight: 700; margin: 0 0 4px; }
  .faq p { margin: 0 0 16px; font-size: 14.5px; color: var(--texto2); }
  .cierre { margin-top: 30px; padding-top: 22px; border-top: 1px solid var(--linea); }
  .mas { font-size: 13.5px; margin: 18px 0 0; }
  .mas a { color: var(--texto2); }`;

function construirFicha({ ficha: f, producto: p }, fecha) {
  const url = urlFicha(f);
  const sec = seccionDeArea(p.area);
  const titulo = `${f.h1} · FP Teaching Lab`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: p.titulo,
        description: f.meta,
        ...(f.imagen ? { image: f.imagen } : {}),
        url,
        brand: { '@type': 'Brand', name: 'FP Teaching Lab' },
        offers: {
          '@type': 'Offer',
          price: f.precioNum || '0',
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: p.enlace,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Portada', item: `${SITIO}/` },
          { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${SITIO}/catalogo.html` },
          { '@type': 'ListItem', position: 3, name: p.titulo, item: url },
        ],
      },
      ...((f.faq || []).length ? [{
        '@type': 'FAQPage',
        mainEntity: f.faq.map((q) => ({ '@type': 'Question', name: q.p, acceptedAnswer: { '@type': 'Answer', text: q.r } })),
      }] : []),
    ],
  };

  const boton = `      <a class="boton" href="${esc(p.enlace)}" target="_blank" rel="noopener">Ver en Gumroad</a>${f.precio ? `\n      <span class="precio">${esc(f.precio)}</span>` : ''}`;
  const bloques = (f.secciones || []).map((s) => {
    const parrafos = (s.texto || []).map((t) => `      <p>${esc(t)}</p>`).join('\n');
    const lista = (s.lista || []).length
      ? `      <ul class="puntos">\n${s.lista.map((l) => `        <li>${esc(l)}</li>`).join('\n')}\n      </ul>` : '';
    return `    <section class="bloque">
      <h2>${esc(s.titulo)}</h2>
${[parrafos, lista].filter(Boolean).join('\n')}
    </section>`;
  }).join('\n');
  const faq = (f.faq || []).length ? `    <section class="bloque">
      <h2>Preguntas frecuentes</h2>
      <div class="faq">
${f.faq.map((q) => `        <h3>${esc(q.p)}</h3>\n        <p>${esc(q.r)}</p>`).join('\n')}
      </div>
    </section>` : '';

  return cabeza({
    titulo, descripcion: f.meta, url, fecha, imagen: f.imagen, tipo: 'product', css: CSS_FICHA, jsonld,
  }) + `  <main>
    <nav class="migas" aria-label="Ruta"><a href="${SITIO}/">Portada</a> › <a href="${SITIO}/catalogo.html#${sec.id}">Catálogo</a></nav>${f.etiqueta ? `\n    <p class="etiqueta">${esc(f.etiqueta)}</p>` : ''}
    <h1>${esc(f.h1)}</h1>
    <p class="entradilla">${esc(f.entradilla)}</p>
    <div class="compra">
${boton}
    </div>${f.imagen ? `
    <figure class="portada"><img src="${esc(f.imagen)}" alt="${esc(f.imagenAlt || p.titulo)}" loading="eager"></figure>` : ''}
${bloques}
${faq}
    <div class="cierre">
      <div class="compra">
${boton}
      </div>
      <p class="mas"><a href="${SITIO}/catalogo.html#${sec.id}">Más recursos de ${esc(sec.titulo)}</a></p>
    </div>
  </main>
` + PIE;
}

// ---------- Sitemap ----------
// Lee la fecha real de cada pagina generada (meta last-modified).
function fechaDe(archivo) {
  try {
    const m = fs.readFileSync(path.join(RAIZ, archivo), 'utf8').match(/<meta name="last-modified" content="([0-9-]+)">/);
    return m ? m[1] : null;
  } catch (e) {
    return null;
  }
}

function construirSitemap(productos, fichas) {
  const urls = [
    { loc: `${SITIO}/` },
    { loc: `${SITIO}/catalogo.html`, lastmod: fechaDe('catalogo.html') },
  ];
  fichas.forEach(({ ficha }) => urls.push({ loc: urlFicha(ficha), lastmod: fechaDe(`${CARPETA_FICHAS}/${ficha.slug}.html`) }));
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

// ---------- Escritura ----------
// Solo reescribe si cambia algo mas que la fecha, para no generar cambios vacios.
const sinFecha = (s) => s
  .replace(/<meta name="last-modified" content="[0-9-]+">/, '')
  .replace(/Actualizado el [^·<]+·/, 'Actualizado el X ·');

function escribirSiCambia(nombre, nuevo, normalizar) {
  const ruta = path.join(RAIZ, nombre);
  const viejo = fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : null;
  if (viejo !== null && normalizar(viejo) === normalizar(nuevo)) {
    console.log(`${nombre}: sin cambios`);
    return false;
  }
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, nuevo, 'utf8');
  console.log(`${nombre}: actualizado`);
  return true;
}

const productos = leerProductos();
const fichas = leerFichas(productos);
const fichasPorEnlace = new Map(fichas.map(({ ficha }) => [String(ficha.enlace).trim(), ficha]));
const fecha = hoy();

escribirSiCambia('catalogo.html', construirCatalogo(productos, fichasPorEnlace, fecha), sinFecha);

const vigentes = new Set();
fichas.forEach((par) => {
  const nombre = `${CARPETA_FICHAS}/${par.ficha.slug}.html`;
  vigentes.add(`${par.ficha.slug}.html`);
  escribirSiCambia(nombre, construirFicha(par, fecha), sinFecha);
});
// Borra paginas de producto cuya ficha ya no existe.
const carpeta = path.join(RAIZ, CARPETA_FICHAS);
if (fs.existsSync(carpeta)) {
  fs.readdirSync(carpeta).filter((a) => a.endsWith('.html') && !vigentes.has(a)).forEach((a) => {
    fs.unlinkSync(path.join(carpeta, a));
    console.log(`${CARPETA_FICHAS}/${a}: borrada (ya no tiene ficha)`);
  });
}

escribirSiCambia('sitemap.xml', construirSitemap(productos, fichas), (s) => s);

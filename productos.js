// =====================================================================
// CATALOGO DE LA LANDING - FP Teaching Lab
// Este archivo es el CONTENIDO de la landing. El diseño vive en index.html.
// Para añadir o quitar recursos se edita SOLO este archivo.
// Esquema de cada entrada:
//   titulo  : texto de la tarjeta
//   tipo    : 'pago' (Gumroad) o 'gratis' (Notion o GitHub, nunca Gumroad)
//   enlace  : URL completa
//   area    : 'PAU' | 'Sanidad' | 'Administración y Gestión' | 'Comercio y Marketing' |
//             'Electricidad y Electrónica' | 'Fabricación Mecánica' |
//             'Madera, Mueble y Corcho' | 'Transversal'
//   nivel   : 'Básica' | 'GM' | 'GS' | null (para toda la familia; PAU y Transversal siempre null)
//   novedad : true sale en la tira What's New (máximo 3 a la vez)
// =====================================================================

window.productos = [
    // === PAU / BACHILLERATO ===
    { titulo: 'Pack 4 Simulacros PAU Valencia 2026', tipo: 'pago', enlace: 'https://mariasantuario.gumroad.com/l/jsbdvl', area: 'PAU', nivel: null, novedad: false },
    { titulo: 'PAU Madrid 2026 · 6 Simulacros + Pack Profesor', tipo: 'pago', enlace: 'https://mariasantuario.gumroad.com/l/paumadrid26', area: 'PAU', nivel: null, novedad: false },
    { titulo: 'PAU Catalunya 2025-2026 · Pack 4 simulacres', tipo: 'pago', enlace: 'https://mariasantuario.gumroad.com/l/paucat', area: 'PAU', nivel: null, novedad: true },
    { titulo: 'PAU Murcia 2026 · Pack 7 exámenes (UMU)', tipo: 'pago', enlace: 'https://mariasantuario.gumroad.com/l/paumurcia', area: 'PAU', nivel: null, novedad: false },
    { titulo: 'The Geopolitics Bundle · PAU Valencia', tipo: 'pago', enlace: 'https://mariasantuario.gumroad.com/l/goygry', area: 'PAU', nivel: null, novedad: false },
    { titulo: 'Faces, Flags & Surveillance · PAU Valencia', tipo: 'pago', enlace: 'https://mariasantuario.gumroad.com/l/facesandflags', area: 'PAU', nivel: null, novedad: false },
    { titulo: 'The Fate of Ophelia · PAU', tipo: 'pago', enlace: 'https://mariasantuario.gumroad.com/l/gyhpi', area: 'PAU', nivel: null, novedad: false },
    { titulo: 'Super Pau Test', tipo: 'gratis', enlace: 'https://mariasantulario-svg.github.io/SuperPau/', area: 'PAU', nivel: null, novedad: false },
    { titulo: 'Simulacro PAU Inglés CV · Aura Farming', tipo: 'gratis', enlace: 'https://fpteachinglab.notion.site/Aura-Farming-3ce94019816980f2a6cfeded34e46c02', area: 'PAU', nivel: null, novedad: true },
    { titulo: 'Aura Farming Classroom Pack · 4º ESO', tipo: 'pago', enlace: 'https://mariasantuario.gumroad.com/l/erktjd', area: 'PAU', nivel: null, novedad: true },

    // === SANIDAD ===
    { titulo: 'Patient Records & Clinical Documentation · Healthcare English', tipo: 'pago', enlace: 'https://mariasantuario.gumroad.com/l/uczpd', area: 'Sanidad', nivel: 'GS', novedad: false },
    { titulo: 'Medical Conditions and Patient History', tipo: 'gratis', enlace: 'https://fpteachinglab.notion.site/3189401981698085b337e0b4ec14b5f0', area: 'Sanidad', nivel: 'GS', novedad: false }, // nivel GS confirmado 11 ago 2026
    { titulo: 'Healthcare Vocabulary App', tipo: 'gratis', enlace: 'https://healthcare-documentation-and.onrender.com/', area: 'Sanidad', nivel: null, novedad: false }, // app alojada en Render (verificada 11 ago 2026)

    // === ADMINISTRACIÓN Y GESTIÓN ===
    { titulo: 'English Workbook · Company Internship', tipo: 'gratis', enlace: 'https://fpteachinglab.notion.site/32e940198169806eb05df2abaed04201', area: 'Administración y Gestión', nivel: 'Básica', novedad: false },
    { titulo: 'Geopolitical Disruption and International Trade', tipo: 'gratis', enlace: 'https://fpteachinglab.notion.site/32d940198169809692eaf6fcd14e7623', area: 'Administración y Gestión', nivel: 'GS', novedad: false },

    // === COMERCIO Y MARKETING ===
    { titulo: 'The Shop Internship · FP Básica Comercio', tipo: 'pago', enlace: 'https://mariasantuario.gumroad.com/l/shop-internship', area: 'Comercio y Marketing', nivel: 'Básica', novedad: false },
    { titulo: 'Handling Difficult Customers', tipo: 'gratis', enlace: 'https://fpteachinglab.notion.site/30494019816980e69a26e36feddb1dd1', area: 'Comercio y Marketing', nivel: 'Básica', novedad: false },

    // === ELECTRICIDAD Y ELECTRÓNICA ===
    { titulo: 'English Activities Workbook · Electrical Internship', tipo: 'gratis', enlace: 'https://fpteachinglab.notion.site/333940198169814eb895ca7b662ba8b5', area: 'Electricidad y Electrónica', nivel: null, novedad: false },
    { titulo: 'When the Lights Go Out', tipo: 'gratis', enlace: 'https://fpteachinglab.notion.site/30394019816980cb97ffe24f63081dbf', area: 'Electricidad y Electrónica', nivel: 'GM', novedad: false },
    { titulo: 'Electricity & Electronics · Emergency Procedures', tipo: 'gratis', enlace: 'https://fpteachinglab.notion.site/31d9401981698042b518e387bc0cd874', area: 'Electricidad y Electrónica', nivel: 'GM', novedad: false },

    // === FABRICACIÓN MECÁNICA (Soldadura y Calderería) ===
    { titulo: 'The Apprenticeship Company Project · ABP Pack', tipo: 'pago', enlace: 'https://mariasantuario.gumroad.com/l/cinlnl', area: 'Fabricación Mecánica', nivel: 'GS', novedad: false },
    { titulo: 'Manual vs. Electric Welding in Railway Systems', tipo: 'gratis', enlace: 'https://fpteachinglab.notion.site/300940198169811f994afe306d7edd05', area: 'Fabricación Mecánica', nivel: 'GM', novedad: false },

    // === MADERA, MUEBLE Y CORCHO (Carpintería y Mueble) ===
    { titulo: 'Christmas Tree Harvesting', tipo: 'gratis', enlace: 'https://fpteachinglab.notion.site/2cd940198169809ea5e8c8d08cfe2352', area: 'Madera, Mueble y Corcho', nivel: 'GM', novedad: false },
    { titulo: 'Electrical and Power Tools', tipo: 'gratis', enlace: 'https://fpteachinglab.notion.site/315940198169800a9db7f0fb9a0ac0e7', area: 'Madera, Mueble y Corcho', nivel: 'GM', novedad: false },

    // === TRANSVERSAL ===
    { titulo: 'A Lesson on Labour Rights · Industrial History', tipo: 'gratis', enlace: 'https://fpteachinglab.notion.site/31c9401981698080b148d6a77c6bcb93', area: 'Transversal', nivel: null, novedad: false },
  ];

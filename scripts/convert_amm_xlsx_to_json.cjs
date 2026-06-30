/**
 * convert_amm_xlsx_to_json.js
 *
 * Convertit liste_amm.xlsx en un JSON complet compatible avec le format pct_medications.json.
 * Usage: node scripts/convert_amm_xlsx_to_json.js
 *
 * Le fichier généré sera: src/pct_medications.json
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function excelDateToISO(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const msPerDay = 86400 * 1000;
  const utcDays = serial - 25569;
  const date = new Date(Math.round(utcDays * msPerDay));
  return date.toISOString().split('T')[0];
}

function normalize(str) {
  if (!str) return '';
  return String(str).toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function buildTherapeuticClass(classe, sousClasse) {
  const c = (classe || '').trim();
  const sc = (sousClasse || '').trim();
  if (c && sc && sc !== c) return c + ' - ' + sc;
  return c || sc || '';
}

function inferRoute(forme) {
  if (!forme) return '';
  const f = forme.toLowerCase();
  if (f.includes('inject') || f.includes('perfus') || f.includes('intraveineuse')) return 'Injectable';
  if (f.includes('comprim') || f.includes('gelule') || f.includes('capsule') || f.includes('sachet') || f.includes('sirop') || f.includes('suspension buvable') || f.includes('solution buvable') || f.includes('granul')) return 'Oral';
  if (f.includes('collyre') || f.includes('oculaire')) return 'Ophtalmique';
  if (f.includes('creme') || f.includes('pommade') || f.includes('gel cutan') || f.includes('lotion') || f.includes('patch') || f.includes('transdermique')) return 'Topique';
  if (f.includes('ovule') || f.includes('vaginal')) return 'Vaginal';
  if (f.includes('suppositoire') || f.includes('rectal')) return 'Rectal';
  if (f.includes('inhalation') || f.includes('nebuliseur') || f.includes('aerosol') || f.includes('poudre pour inhalation')) return 'Inhalation';
  if (f.includes('nasal')) return 'Nasal';
  if (f.includes('auriculaire') || f.includes('otique')) return 'Auriculaire';
  if (f.includes('lingual') || f.includes('sublingual')) return 'Sublingual';
  return '';
}

function requiresSpecialPrescription(tableau) {
  return tableau === 'A';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ROOT = path.join(__dirname, '..');
const XLSX_PATH = path.join(ROOT, 'liste_amm.xlsx');
const OUTPUT_PATH = path.join(ROOT, 'src', 'pct_medications.json');

console.log('Lecture de liste_amm.xlsx...');
const wb = XLSX.readFile(XLSX_PATH);
const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

const headers = raw[0];
console.log('Feuille: "' + sheetName + '"');
console.log('Colonnes: ' + headers.join(', '));

const rows = raw.slice(1).filter(r => r[0] != null && String(r[0]).trim() !== '');
console.log('Lignes valides: ' + rows.length);

const now = new Date().toISOString();

// Colonnes xlsx:
//  0: Nom
//  1: Dosage
//  2: Forme
//  3: Présentation
//  4: DCI
//  5: Classe
//  6: Sous Classe
//  7: Laboratoire
//  8: AMM
//  9: Date AMM
// 10: Conditionnement primaire
// 11: Spécification Conditionnement primaire
// 12: tableau
// 13: Durée de conservation
// 14: Indications
// 15: G/P/B (Générique / Princeps / Biosimilaire)
// 16: VEIC (Vital / Essentiel / Intermédiaire / Confort)

console.log('\nConversion en cours...');
const medications = rows.map((row, index) => {
  const amm = row[8] != null ? String(row[8]).trim() : ('AMM-' + (index + 1));
  const nameBrand = String(row[0] || '').trim();
  const dosage = row[1] != null ? String(row[1]).trim() : '';
  const forme = String(row[2] || '').trim();
  const presentation = String(row[3] || '').trim();
  const dci = String(row[4] || '').trim();
  const classe = String(row[5] || '').trim();
  const sousClasse = String(row[6] || '').trim();
  const laboratoire = String(row[7] || '').trim();
  const dateAmm = excelDateToISO(row[9]);
  const conditionnementPrimaire = String(row[10] || '').trim();
  const specConditionnement = String(row[11] || '').trim();
  const tableau = String(row[12] || '').trim();
  const dureeConservation = row[13] != null ? Number(row[13]) : null;
  const indications = String(row[14] || '').trim().replace(/\r/g, '');
  const gpb = String(row[15] || '').trim();
  const veic = String(row[16] || '').trim();

  return {
    id: 'amm-' + (index + 1),
    source_type: 'amm',
    source_url: 'https://www.santetunisie.rns.tn',
    pct_code: amm,
    amm_number: amm,
    amm_date: dateAmm,
    name_brand: nameBrand,
    name_normalized: normalize(nameBrand),
    dci_name: dci,
    dci_normalized: normalize(dci),
    dosage_strength: dosage,
    pharmaceutical_form: forme,
    route: inferRoute(forme),
    package_label: presentation,
    packaging_type: conditionnementPrimaire || null,
    packaging_spec: specConditionnement || null,
    supplier: 'Pharmacie Centrale de Tunisie',
    laboratory: laboratoire,
    therapeutic_class: buildTherapeuticClass(classe, sousClasse),
    therapeutic_class_main: classe || null,
    therapeutic_class_sub: sousClasse || null,
    status: 'active',
    is_available: true,
    requires_special_prescription: requiresSpecialPrescription(tableau),
    tableau: tableau || null,
    conservation_months: dureeConservation,
    indications: indications || null,
    gpb_status: gpb || null,
    veic_status: veic || null,
    created_at: now,
    updated_at: now,
  };
});

console.log(medications.length + ' medicaments convertis');

// Stats
const routes = {};
medications.forEach(m => { const r = m.route || 'Inconnu'; routes[r] = (routes[r] || 0) + 1; });
console.log('\nDistribution routes:');
Object.entries(routes).sort((a, b) => b[1] - a[1]).forEach(([r, c]) => console.log('  ' + String(c).padStart(5) + ' - ' + r));

const veic_stats = {};
medications.forEach(m => { const v = m.veic_status || 'null'; veic_stats[v] = (veic_stats[v] || 0) + 1; });
console.log('\nDistribution VEIC:');
Object.entries(veic_stats).forEach(([v, c]) => console.log('  ' + String(c).padStart(5) + ' - ' + v));

// Sauvegarde
console.log('\nSauvegarde vers ' + OUTPUT_PATH + '...');
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(medications, null, 2), 'utf-8');

const sizeMB = (fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2);
console.log('Fichier genere: ' + sizeMB + ' MB');
console.log('\nTermine! ' + medications.length + ' medicaments exportes.');

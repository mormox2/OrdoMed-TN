import { DosageTemplate, Medicine } from '../types';

const DCI_ALIASES: Record<string, string> = {
  ibuprofen: 'ibuprofene',
  ondansetrone: 'ondansetron',
  sumatriptane: 'sumatriptan',
};

export function normalizeDciName(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return DCI_ALIASES[normalized] || normalized;
}

export function findMatchingDosageTemplates(
  medicine: Medicine,
  templates: DosageTemplate[],
): DosageTemplate[] {
  const normalizedMedicineDci = normalizeDciName(medicine.dci_name);

  return templates.filter((template) => {
    if (template.medicine_id === medicine.id) return true;
    if (!template.dci_name || !normalizedMedicineDci) return false;
    return normalizeDciName(template.dci_name) === normalizedMedicineDci;
  });
}

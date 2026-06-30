import { DosageTemplate, Medicine } from '../types';

export function normalizeDciName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DoctorConfig } from '../types';
import { Save, CheckCircle, ShieldAlert, FileText, Settings, Award } from 'lucide-react';

interface DoctorConfigFormProps {
  config: DoctorConfig;
  onSave: (newConfig: DoctorConfig) => void;
}

export default function DoctorConfigForm({ config, onSave }: DoctorConfigFormProps) {
  const [formData, setFormData] = useState<DoctorConfig>({ ...config });
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="doctor-config-panel">
      <div className="border-b border-slate-100 bg-slate-50/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Configuration de l'Ordonnancier</h2>
              <p className="text-xs text-slate-500">Personnalisez vos en-têtes et cachets officiels bilingues</p>
            </div>
          </div>
          {isSaved && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-100 animate-fade-in">
              <CheckCircle className="w-4 h-4" />
              Configurations enregistrées
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Identifiants Officiels (N° Ordre, Fiscal, CNAM) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">N° d'inscription à l'Ordre des Médecins *</label>
            <div className="relative">
              <Award className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                name="order_number"
                required
                value={formData.order_number}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                placeholder="Ex: TN-2026-9482"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Matricule Fiscal (Optionnel)</label>
            <input
              type="text"
              name="matricule_fiscal"
              value={formData.matricule_fiscal || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              placeholder="Ex: MF 1489245/A/P/M/000"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Code Conventionnel CNAM (Optionnel)</label>
            <input
              type="text"
              name="code_cnam"
              value={formData.code_cnam || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              placeholder="Ex: 9482-12-00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Téléphone du Cabinet *</label>
            <input
              type="text"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              placeholder="Ex: +216 71 889 456"
            />
          </div>
        </div>

        {/* Section Bilingue (Français & Arabe) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2 border-t border-slate-100">
          {/* Côté Français */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 rounded text-slate-600">FR</span>
              En-tête et Infos en Français
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom complet du Médecin *</label>
              <input
                type="text"
                name="name_fr"
                required
                value={formData.name_fr}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                placeholder="Ex: Dr. Anis Ben Youssef"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Spécialité médicale *</label>
              <input
                type="text"
                name="specialty_fr"
                required
                value={formData.specialty_fr}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                placeholder="Ex: Cardiologue, Médecin Généraliste"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Adresse du Cabinet *</label>
              <textarea
                name="address_fr"
                required
                rows={2}
                value={formData.address_fr}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                placeholder="Adresse du cabinet en français..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Horaires de consultation</label>
              <input
                type="text"
                name="hours_fr"
                value={formData.hours_fr || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                placeholder="Ex: Lundi - Vendredi: 08:30 - 17:00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Note/Mention de bas de page</label>
              <input
                type="text"
                name="footer_fr"
                value={formData.footer_fr || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                placeholder="Message en bas de l'ordonnance..."
              />
            </div>
          </div>

          {/* Côté Arabe */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 rounded text-slate-600">AR</span>
                En-tête et Infos en Arabe
              </div>
              <span className="text-[11px] text-slate-400 font-normal">Saisie en sens de droite à gauche (RTL)</span>
            </h3>

            <div dir="rtl" className="text-right">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">الاسم الكامل للطبيب *</label>
              <input
                type="text"
                name="name_ar"
                required
                value={formData.name_ar}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-sans text-right"
                placeholder="مثال: الدكتور أنيس بن يوسف"
              />
            </div>

            <div dir="rtl" className="text-right">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">الاختصاص الطبي *</label>
              <input
                type="text"
                name="specialty_ar"
                required
                value={formData.specialty_ar}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-sans text-right"
                placeholder="مثال: أمراض القلب والشرايين والطب العام"
              />
            </div>

            <div dir="rtl" className="text-right">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">عنوان العيادة *</label>
              <textarea
                name="address_ar"
                required
                rows={2}
                value={formData.address_ar}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-sans text-right"
                placeholder="عنوان العيادة باللغة العربية..."
              />
            </div>

            <div dir="rtl" className="text-right">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">أوقات العمل</label>
              <input
                type="text"
                name="hours_ar"
                value={formData.hours_ar || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-sans text-right"
                placeholder="مثال: الإثنين - الجمعة: 08:30 - 17:00"
              />
            </div>

            <div dir="rtl" className="text-right">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">ملاحظة أسفل الصفحة</label>
              <input
                type="text"
                name="footer_ar"
                value={formData.footer_ar || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-sans text-right"
                placeholder="ملاحظات أسفل الوصفة الطبية..."
              />
            </div>
          </div>
        </div>

        {/* Email et Stamp */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Adresse Email du Cabinet (Optionnel)</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                placeholder="Ex: cabinet@anis-benyoussef.tn"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Site Web du Cabinet (Optionnel)</label>
              <input
                type="text"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                placeholder="Ex: https://cabinet-anis-benyoussef.tn"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Texte personnalisé du cachet officiel</label>
              <textarea
                name="stamp_text"
                rows={3}
                value={formData.stamp_text || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                placeholder="Lignes de texte imprimées sur votre cachet..."
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold cursor-pointer select-none hover:bg-slate-100/70 transition-colors">
                <input
                  type="checkbox"
                  name="show_automatic_stamp"
                  checked={formData.show_automatic_stamp !== false}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, show_automatic_stamp: e.target.checked }));
                    setIsSaved(false);
                  }}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4.5 h-4.5"
                />
                <span>Afficher automatiquement le cachet officiel sur l'ordonnance</span>
              </label>
            </div>
          </div>

          {/* Stamp Preview Card */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="text-slate-500 text-xs font-semibold flex items-center gap-1">
              <FileText className="w-4 h-4 text-slate-400" />
              Simulation du Cachet Officiel (Encre Violette)
            </div>

            {/* Stamp visual representation */}
            <div className={`relative p-5 border-4 border-dashed rounded-2xl max-w-xs transform rotate-1 select-none shadow-sm flex flex-col justify-center items-center min-h-[120px] transition-all duration-300 ${
              formData.show_automatic_stamp !== false
                ? 'border-indigo-400/80 bg-indigo-50/20 hover:scale-105 cursor-pointer'
                : 'border-slate-300 bg-slate-100 opacity-60'
            }`}>
              {formData.show_automatic_stamp === false && (
                <div className="absolute inset-0 bg-slate-200/50 backdrop-blur-[0.5px] rounded-xl flex items-center justify-center font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                  Désactivé / Caché
                </div>
              )}
              <div className={`absolute top-1 right-2 text-[8px] font-bold tracking-widest uppercase ${formData.show_automatic_stamp !== false ? 'text-indigo-400/90' : 'text-slate-400'}`}>TUNISIE</div>
              <div className={`text-xs font-bold tracking-tight leading-tight uppercase ${formData.show_automatic_stamp !== false ? 'text-indigo-700/90' : 'text-slate-600'}`}>
                {formData.name_fr || 'Cabinet Medical'}
              </div>
              <div className={`text-[10px] font-medium mt-1 ${formData.show_automatic_stamp !== false ? 'text-indigo-600/85' : 'text-slate-500'}`}>
                {formData.specialty_fr || 'Médecin Généraliste'}
              </div>
              <div className={`text-[9px] border-t border-dashed mt-2 pt-1 ${formData.show_automatic_stamp !== false ? 'text-indigo-500/80 border-indigo-300' : 'text-slate-400 border-slate-300'}`}>
                Ordre: {formData.order_number || 'N° inscription'}
              </div>
              {formData.matricule_fiscal && (
                <div className={`text-[8px] mt-0.5 ${formData.show_automatic_stamp !== false ? 'text-indigo-400/70' : 'text-slate-400'}`}>
                  {formData.matricule_fiscal}
                </div>
              )}
              {formData.code_cnam && (
                <div className={`text-[8px] mt-0.5 ${formData.show_automatic_stamp !== false ? 'text-indigo-400/70' : 'text-slate-400'}`}>
                  CNAM: {formData.code_cnam}
                </div>
              )}
              <div className={`text-[8px] mt-1 ${formData.show_automatic_stamp !== false ? 'text-indigo-400/70' : 'text-slate-400'}`}>
                Tel: {formData.phone}
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              Ce cachet sera automatiquement apposé sur la version A4 de vos ordonnances imprimées ou exportées.
            </p>
          </div>
        </div>

        {/* Bouton d'enregistrement */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-medium rounded-xl text-sm transition-colors shadow-sm shadow-sky-100"
          >
            <Save className="w-4 h-4" />
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
}

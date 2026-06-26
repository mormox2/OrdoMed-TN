/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Prescription, PrescriptionItem, DoctorConfig } from '../types';
import { Printer, Download, ArrowLeft, ShieldCheck, HeartPulse, Sparkles, FileText, Check } from 'lucide-react';

interface PrescriptionPrintViewProps {
  prescription: Prescription;
  items: PrescriptionItem[];
  doctorConfig: DoctorConfig;
  onBack: () => void;
}

export default function PrescriptionPrintView({
  prescription,
  items,
  doctorConfig,
  onBack,
}: PrescriptionPrintViewProps) {
  const [format, setFormat] = useState<'A4' | 'A5'>('A5');
  const [margin, setMargin] = useState<'small' | 'medium' | 'large'>('medium'); // small: 10mm, medium: 15mm, large: 20mm
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base'); // sm: small, base: standard, lg: large
  const [hideHeader, setHideHeader] = useState<boolean>(false);
  const [showStamp, setShowStamp] = useState<boolean>(doctorConfig.show_automatic_stamp !== false);
  const [showQr, setShowQr] = useState<boolean>(true);

  const isA5 = format === 'A5';

  const handlePrint = () => {
    window.print();
  };

  const marginMap = {
    small: { print: '10mm', screen: isA5 ? 'p-3 sm:p-4' : 'p-6 sm:p-8' },
    medium: { print: '15mm', screen: isA5 ? 'p-5 sm:p-6' : 'p-10' },
    large: { print: '20mm', screen: isA5 ? 'p-7 sm:p-8' : 'p-14' },
  };

  const fontSizeMap = {
    sm: { items: 'text-[11px]', body: 'text-[10px]', headings: 'text-[13px]' },
    base: { items: 'text-xs md:text-[13px]', body: 'text-[11px]', headings: 'text-sm md:text-base' },
    lg: { items: 'text-[13px] md:text-sm', body: 'text-xs', headings: 'text-base md:text-lg' },
  };

  const activeMargin = marginMap[margin];
  const activeFont = fontSizeMap[fontSize];

  // Generates a real QR Code that outputs a vCard contact file so scanners can instantly add the doctor to their directory
  const getVCardQrCodeUrl = () => {
    const cleanFrName = (doctorConfig.name_fr || '').replace(/[\n\r]/g, ' ');
    const cleanFrSpecialty = (doctorConfig.specialty_fr || '').replace(/[\n\r]/g, ' ');
    const cleanPhone = (doctorConfig.phone || '').replace(/[\n\r]/g, ' ');
    const cleanEmail = (doctorConfig.email || '').replace(/[\n\r]/g, ' ');
    const cleanAddress = (doctorConfig.address_fr || '').replace(/[\n\r]/g, ' ');
    const cleanWebsite = (doctorConfig.website || '').replace(/[\n\r]/g, ' ');

    const vCardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${cleanFrName}`,
      `ORG:${cleanFrSpecialty}`,
      `TEL;TYPE=WORK,VOICE:${cleanPhone}`,
    ];

    if (cleanEmail) {
      vCardData.push(`EMAIL;TYPE=PREF,INTERNET:${cleanEmail}`);
    }
    if (cleanAddress) {
      vCardData.push(`ADR;TYPE=WORK:;;${cleanAddress};;;;`);
    }
    if (cleanWebsite) {
      vCardData.push(`URL:${cleanWebsite}`);
    }

    vCardData.push('END:VCARD');
    const vCardString = vCardData.join('\n');
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vCardString)}`;
  };

  // Simulated SVG QR Code fallback or direct QR rendering
  const renderVerificationQrCode = () => {
    return (
      <img 
        src={getVCardQrCodeUrl()} 
        alt="QR Contact"
        className={`${isA5 ? 'w-11 h-11' : 'w-14 h-14'} border border-slate-200/50 p-0.5 rounded-lg bg-white transition-all shrink-0`}
        referrerPolicy="no-referrer"
      />
    );
  };

  return (
    <div className="space-y-6" id="prescription-print-container">
      {/* Dynamic Print CSS Style Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${isA5 ? 'A5 portrait' : 'A4 portrait'};
            margin: ${activeMargin.print};
          }
          #prescription-print-container {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          #prescription-a4-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            height: 100% !important;
            background-color: #ffffff !important;
          }
        }
      ` }} />

      {/* Action Bar (Hidden during actual print) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap justify-between items-center gap-4 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'éditeur
        </button>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm shadow-sky-100 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Lancer l'impression (Ctrl+P)
          </button>
        </div>
      </div>

      {/* Workspace Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Customizer Card */}
        <div className="w-full lg:w-80 shrink-0 bg-white border border-slate-100 rounded-2xl p-5 space-y-5 shadow-sm print:hidden">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4.5 h-4.5 text-sky-500 animate-pulse" />
              Personnalisation de l'Impression
            </h3>
            <p className="text-[10px] text-slate-400">Configurez les dimensions et la densité du document avant impression.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Paper format */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-500 font-bold uppercase">Format de page</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setFormat('A4')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    format === 'A4' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Standard A4
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('A5')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    format === 'A5' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Demi-A4 (A5)
                </button>
              </div>
            </div>

            {/* Margins */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-500 font-bold uppercase">Marges d'impression</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                {(['small', 'medium', 'large'] as const).map((m) => {
                  const labels = { small: '10mm', medium: '15mm', large: '20mm' };
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMargin(m)}
                      className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        margin === m ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {labels[m]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font sizes */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-500 font-bold uppercase">Taille des textes</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                {(['sm', 'base', 'lg'] as const).map((f) => {
                  const labels = { sm: 'Petite', base: 'Normale', lg: 'Grande' };
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFontSize(f)}
                      className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        fontSize === f ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {labels[f]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Boolean Toggles */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideHeader}
                  onChange={(e) => setHideHeader(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 border-slate-300 w-4 h-4 cursor-pointer mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 block text-[11px]">Masquer l'en-tête cabinet</span>
                  <span className="text-[9px] text-slate-400 block leading-normal">Cochez si vous utilisez vos propres feuilles pré-imprimées.</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showStamp}
                  onChange={(e) => setShowStamp(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 border-slate-300 w-4 h-4 cursor-pointer mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 block text-[11px]">Inclure cachet numérique</span>
                  <span className="text-[9px] text-slate-400 block leading-normal">Affiche l'empreinte OrdoMed certifiée en bas à droite.</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showQr}
                  onChange={(e) => setShowQr(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 border-slate-300 w-4 h-4 cursor-pointer mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 block text-[11px]">Inclure QR Code de sécurité</span>
                  <span className="text-[9px] text-slate-400 block leading-normal">Permet de vérifier l'authenticité de l'ordonnance en pharmacie.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Preview Sheet */}
        <div className="flex-1 flex justify-center bg-slate-100/40 p-4 sm:p-8 rounded-2xl border border-slate-100 print:bg-white print:p-0 print:border-0 print:shadow-none w-full">
          <div 
            className={`bg-white shadow-xl border border-slate-200/50 rounded-lg flex flex-col justify-between transition-all duration-300 print:shadow-none print:border-0 print:p-0 print:rounded-none print:w-full ${
              isA5 
                ? 'w-[148mm] min-h-[210mm]' 
                : 'w-[210mm] min-h-[297mm]'
            } ${activeMargin.screen} ${activeFont.body}`}
            id="prescription-a4-sheet"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Main Top Part */}
            <div className={isA5 ? "space-y-4" : "space-y-8"}>
              {/* 1. BILINGUAL HEADERS (Rendered if not hidden) */}
              {!hideHeader && (
                <>
                  <div className={`flex items-start ${prescription.print_language_mode === 'fr' ? 'justify-start' : prescription.print_language_mode === 'ar' ? 'justify-end' : 'justify-between'}`}>
                    {/* Français (Left column) */}
                    {(prescription.print_language_mode === 'bilingual' || prescription.print_language_mode === 'fr') && (
                      <div className="text-left max-w-[45%] space-y-1">
                        <h1 className={`${activeFont.headings} font-extrabold text-slate-900 tracking-tight leading-tight`}>
                          {doctorConfig.name_fr}
                        </h1>
                        <p className={`${activeFont.body} text-sky-700 font-bold leading-tight`}>
                          {doctorConfig.specialty_fr}
                        </p>
                        <div className="text-[9px] text-slate-500 font-medium space-y-0.5 leading-snug">
                          <p>N° Ordre : <span className="font-semibold text-slate-700">{doctorConfig.order_number}</span></p>
                          {doctorConfig.matricule_fiscal && <p>MF : {doctorConfig.matricule_fiscal}</p>}
                          {doctorConfig.code_cnam && <p>Code CNAM : <span className="font-semibold text-slate-700">{doctorConfig.code_cnam}</span></p>}
                          <p className="whitespace-pre-line">{doctorConfig.address_fr}</p>
                          <p>Tél : <span className="font-semibold text-slate-700">{doctorConfig.phone}</span></p>
                          {doctorConfig.email && <p>Email : {doctorConfig.email}</p>}
                        </div>
                      </div>
                    )}

                    {/* Center Divider / Decorative Caduceus */}
                    {prescription.print_language_mode === 'bilingual' && (
                      <div className="flex flex-col items-center justify-center pt-2 shrink-0">
                        <div className={`${isA5 ? 'w-5.5 h-5.5' : 'w-7 h-7'} rounded-full border border-sky-600/30 flex items-center justify-center text-sky-600/80 bg-sky-50/20 shadow-sm transition-all`}>
                          <HeartPulse className={isA5 ? 'w-3 h-3' : 'w-4 h-4'} />
                        </div>
                        <div className={`w-px ${isA5 ? 'h-8' : 'h-12'} bg-gradient-to-b from-sky-600/30 to-transparent mt-2 transition-all`}></div>
                      </div>
                    )}

                    {/* Arabe RTL (Right column) */}
                    {(prescription.print_language_mode === 'bilingual' || prescription.print_language_mode === 'ar') && (
                      <div dir="rtl" className="text-right max-w-[45%] space-y-1">
                        <h1 className={`${activeFont.headings} font-extrabold text-slate-900 leading-tight font-sans`}>
                          {doctorConfig.name_ar}
                        </h1>
                        <p className={`${activeFont.body} text-sky-700 font-bold leading-tight font-sans`}>
                          {doctorConfig.specialty_ar}
                        </p>
                        <div className="text-[9px] text-slate-500 font-medium space-y-0.5 leading-snug font-sans">
                          <p>رقم التسجيل بالعمادة : <span className="font-semibold text-slate-700 font-mono">{doctorConfig.order_number}</span></p>
                          {doctorConfig.matricule_fiscal && <p>المعرف الجبائي : {doctorConfig.matricule_fiscal}</p>}
                          {doctorConfig.code_cnam && <p>رمز الكنام : <span className="font-semibold text-slate-700 font-mono">{doctorConfig.code_cnam}</span></p>}
                          <p className="whitespace-pre-line">{doctorConfig.address_ar}</p>
                          <p>الهاتف : <span className="font-semibold text-slate-700 font-mono">{doctorConfig.phone}</span></p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Separator */}
                  <div className="border-b border-slate-200/60 pb-1"></div>
                </>
              )}

              {/* 2. PATIENT DETAILS BLOCK */}
              <div className={`p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-slate-800 ${isA5 ? 'p-2.5 gap-2' : 'p-4'}`}>
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-400 font-medium uppercase block sm:inline text-[9px]">Patient :</span>{' '}
                    <span className={`${isA5 ? 'text-xs' : 'text-sm'} font-extrabold text-slate-900`}>{prescription.patient_name}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 font-medium text-[10px] sm:text-[11px] text-slate-600">
                    <span>Âge : <span className="text-slate-800 font-bold">{prescription.patient_age_str}</span></span>
                    <span>Sexe : <span className="text-slate-800 font-bold">{prescription.patient_gender === 'M' ? 'Masculin' : 'Féminin'}</span></span>
                    {prescription.patient_weight && (
                      <span>Poids : <span className="text-slate-800 font-bold">{prescription.patient_weight} kg</span></span>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-0.5 font-medium shrink-0 text-[10px] sm:text-[11px] text-slate-600">
                  <p>Date : <span className="text-slate-950 font-bold">{new Date(prescription.prescription_date).toLocaleDateString('fr-FR')}</span></p>
                  <p className="font-mono text-[9px] text-slate-400">N° : {prescription.prescription_number}</p>
                </div>
              </div>

              {prescription.is_cnam_apci && (
                <div className={`px-4 py-2 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between text-emerald-800 font-bold ${isA5 ? 'px-3 py-1.5' : 'text-xs'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>PRISE EN CHARGE CNAM (APCI / ALD)</span>
                  </div>
                  {doctorConfig.code_cnam && (
                    <div className="text-right font-mono" dir="rtl">
                      رمز كنام الطبيب: <span className="font-extrabold">{doctorConfig.code_cnam}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 3. BILINGUAL CENTER TITLE */}
              <div className="text-center space-y-1 py-1">
                <h2 className={`${isA5 ? 'text-sm font-black' : 'text-base font-black'} text-slate-900 tracking-widest uppercase`}>
                  ORDONNANCE / وصفة طبية
                </h2>
                <div className="w-12 h-0.5 bg-sky-600 mx-auto rounded-full"></div>
              </div>

              {/* 4. PRESCRIPTION ITEMS LIST */}
              <div className={`space-y-5 ${isA5 ? 'pt-1 space-y-3' : 'pt-2'}`}>
                {items.map((item, index) => (
                  <div key={item.id} className="space-y-1 leading-snug">
                    {/* Item title line */}
                    <div className="flex items-start gap-2">
                      <span className={`${activeFont.items} font-black text-slate-900 shrink-0 select-none mt-0.5`}>
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <span className={`${activeFont.items} font-extrabold text-slate-950 leading-tight`}>
                          {item.medicine_label}
                        </span>
                        {item.dci_name && (
                          <span className="text-[9px] text-slate-500 font-medium italic block sm:inline sm:ml-2">
                            (DCI : {item.dci_name})
                          </span>
                        )}
                      </div>

                      {/* Quantity Badge */}
                      {item.quantity && (
                        <span className={`font-bold text-slate-800 border border-slate-300 rounded px-1.5 py-0.5 shrink-0 bg-slate-50 text-[10px]`}>
                          {item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Consignes detail block (Bilingual parallel columns) */}
                    <div className={`pl-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 pt-0.5 text-slate-700 font-medium ${activeFont.body}`}>
                      {/* Français column */}
                      {(prescription.print_language_mode === 'bilingual' || prescription.print_language_mode === 'fr') && (
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">
                            {item.dosage} • {item.frequency} pendant {item.duration}
                          </div>
                          {item.instructions_fr && (
                            <div className="text-[10px] text-slate-500 italic">Consignes : {item.instructions_fr}</div>
                          )}
                        </div>
                      )}

                      {/* Arabe column (RTL) */}
                      {(prescription.print_language_mode === 'bilingual' || prescription.print_language_mode === 'ar') && (
                        <div dir="rtl" className="text-right space-y-0.5 font-sans">
                          <div className="font-bold text-slate-900">
                            {item.dosage} • {item.frequency} لمدة {item.duration}
                          </div>
                          {item.instructions_ar && (
                            <div className="text-[10px] text-slate-500 italic">إرشادات : {item.instructions_ar}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Part: Stamp, Verification QR Code, footer */}
            <div className={`space-y-5 ${isA5 ? 'pt-4 space-y-3' : 'pt-8'}`}>
              {/* Stamp and Signature visual zone */}
              <div className="flex justify-between items-end gap-4">
                {/* Left Column: Verification QR Code */}
                <div className="shrink-0">
                  {showQr && (
                    <div className="space-y-1 bg-slate-50/50 border border-slate-100 rounded-xl p-2 flex items-center gap-2.5">
                      {renderVerificationQrCode()}
                      <div className="text-[8px] text-slate-400 leading-normal max-w-[130px] font-medium">
                        <span className="font-bold text-sky-700 flex items-center gap-0.5 uppercase text-[9px]">
                          <ShieldCheck className="w-3 h-3" /> OrdoSecure
                        </span>
                        Ordonnance certifiée OrdoMed TN. Flashez pour valider.
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Doctor Official Stamp Seal */}
                <div className={`text-right space-y-1.5 select-none flex flex-col justify-end items-end pr-2 min-h-[90px]`}>
                  <span className="font-bold text-slate-400 uppercase block mb-0.5 text-[8px]">Signature et Cachet</span>
                  
                  {/* Visual cachet simulation */}
                  {showStamp ? (
                    <div className={`border-3 border-dashed border-indigo-400/70 rounded-2xl bg-indigo-50/10 max-w-[210px] text-center transform -rotate-1 shadow-sm transition-all p-2.5`}>
                      <div className="text-[9px] font-extrabold text-indigo-700 uppercase leading-tight">
                        {doctorConfig.name_fr}
                      </div>
                      <div className="font-bold text-indigo-600 mt-0.5 text-[7px]">
                        {doctorConfig.specialty_fr}
                      </div>
                      <div className="text-indigo-500/80 border-t border-dashed border-indigo-300 mt-1 pt-0.5 font-mono text-[7px]">
                        Ordre : {doctorConfig.order_number}
                        {doctorConfig.code_cnam && <div>CNAM : {doctorConfig.code_cnam}</div>}
                      </div>
                    </div>
                  ) : (
                    <div className={`border border-dashed border-slate-200 rounded-xl bg-slate-50/30 w-[180px] text-center text-slate-400 italic flex items-center justify-center p-3 text-[8px] min-h-[50px]`}>
                      Emplacement Cachet & Signature Manuel
                    </div>
                  )}
                </div>
              </div>

              {/* 5. BILINGUAL FOOTER */}
              <div className="border-t border-slate-200/80 pt-2.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400 font-semibold leading-normal text-[8px] sm:text-[9px]">
                  {/* French columns */}
                  <div>
                    <p>{doctorConfig.hours_fr}</p>
                    {doctorConfig.footer_fr && <p className="text-sky-700/80 mt-0.5">{doctorConfig.footer_fr}</p>}
                  </div>

                  {/* Arabic columns */}
                  <div dir="rtl" className="text-right font-sans">
                    <p>{doctorConfig.hours_ar}</p>
                    {doctorConfig.footer_ar && <p className="text-sky-700/80 mt-0.5">{doctorConfig.footer_ar}</p>}
                  </div>
                </div>

                {/* Micro diagnostic tag (Only if chosen, otherwise hidden for privacy) */}
                <div className="text-center text-slate-300 font-mono mt-1.5 text-[7px] sm:text-[8px]">
                  ID : {prescription.id} • Édité le {new Date().toLocaleString('fr-FR')} • Ordonnancier Tunisien V1.0
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


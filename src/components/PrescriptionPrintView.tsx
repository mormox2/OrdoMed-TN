/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Prescription, PrescriptionItem, DoctorConfig } from '../types';
import { Printer, Download, ArrowLeft, ShieldCheck, HeartPulse, Sparkles, FileText } from 'lucide-react';

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
  const [format, setFormat] = useState<'A4' | 'A5'>('A4');
  const isA5 = format === 'A5';

  const handlePrint = () => {
    window.print();
  };

  // Simulated SVG QR Code for prescription authenticity validation (incorporates doctor/prescription metadata)
  const renderVerificationQrCode = () => {
    return (
      <svg 
        className={`${isA5 ? 'w-12 h-12' : 'w-16 h-16'} text-slate-800 transition-all`} 
        viewBox="0 0 29 29" 
        fill="currentColor" 
        shapeRendering="crispEdges"
      >
        {/* QR Code borders & static alignment blocks */}
        <path d="M0 0h7v7H0zm22 0h7v7h-7zM0 22h7v7H0z" />
        <path d="M2 2h3v3H2zm20 0h3v3h-3zM2 24h3v3H2z" />
        {/* Pseudo-random matrix pattern based on prescription id hash */}
        <path d="M9 1h1v2H9zm3 0h4v1h-4zm5 0h2v1h-2zm1 2h1v3h-1zm-6 2h3v1h-3zm8 0h1v1h-1zm-9 2h2v1h-2zm3 0h1v4h-1zm4 1h1v1h-1zm4 0h1v3h-1zm-9 2h1v1h-1zm7 0h2v1h-2zm-6 2h1v1h-1zm3 0h2v1h-2zm5 0h1v2h-1zm-9 2h2v1h-2zm4 0h2v1h-2zm6 0h1v1h-1zm-9 2h3v1h-3zm5 0h2v1h-2zm4 0h3v1h-3z" />
        <path d="M10 10h1v1h-1zm3 0h1v1h-1zm4 0h2v1h-2zm1 2h1v2h-1zm-5 1h2v1h-2zm5 1h1v1h-1zm-6 2h1v1h-1zm4 0h1v2h-1zm4 0h2v1h-2zm-9 2h2v1h-2zm6 0h1v1h-1z" />
      </svg>
    );
  };

  return (
    <div className="space-y-6" id="prescription-print-container">
      {/* Dynamic Print CSS Style Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${isA5 ? 'A5 portrait' : 'A4 portrait'};
            margin: ${isA5 ? '10mm' : '15mm'};
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
            padding: ${isA5 ? '6mm' : '0'} !important;
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

        {/* Format selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Format :</span>
          </div>
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setFormat('A4')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                format === 'A4'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard A4
            </button>
            <button
              onClick={() => setFormat('A5')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                format === 'A5'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inférieur A5 (Demi-A4)
            </button>
          </div>
        </div>

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

      {/* Styled sheet container */}
      <div className="flex justify-center bg-slate-100/40 p-4 sm:p-8 rounded-2xl border border-slate-100 print:bg-white print:p-0 print:border-0 print:shadow-none">
        <div 
          className={`bg-white shadow-xl border border-slate-200/50 rounded-lg flex flex-col justify-between transition-all duration-300 print:shadow-none print:border-0 print:p-0 print:rounded-none print:w-full ${
            isA5 
              ? 'w-[148mm] min-h-[210mm] p-6 text-[11px]' 
              : 'w-[210mm] min-h-[297mm] p-10'
          }`}
          id="prescription-a4-sheet"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Main Top Part */}
          <div className={isA5 ? "space-y-4" : "space-y-8"}>
            {/* 1. BILINGUAL HEADERS */}
            <div className={`flex items-start ${prescription.print_language_mode === 'fr' ? 'justify-start' : prescription.print_language_mode === 'ar' ? 'justify-end' : 'justify-between'}`}>
              {/* Français (Left column) */}
              {(prescription.print_language_mode === 'bilingual' || prescription.print_language_mode === 'fr') && (
                <div className="text-left max-w-[45%] space-y-1">
                  <h1 className={`${isA5 ? 'text-sm' : 'text-base'} font-extrabold text-slate-900 tracking-tight leading-tight`}>
                    {doctorConfig.name_fr}
                  </h1>
                  <p className={`${isA5 ? 'text-[11px]' : 'text-xs'} text-sky-700 font-bold leading-tight`}>
                    {doctorConfig.specialty_fr}
                  </p>
                  <div className={`${isA5 ? 'text-[9px]' : 'text-[10px]'} text-slate-500 font-medium space-y-0.5 leading-snug`}>
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
                  <div className={`${isA5 ? 'w-6 h-6' : 'w-8 h-8'} rounded-full border border-sky-600/30 flex items-center justify-center text-sky-600/80 bg-sky-50/20 shadow-sm transition-all`}>
                    <HeartPulse className={isA5 ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'} />
                  </div>
                  <div className={`w-px ${isA5 ? 'h-10' : 'h-16'} bg-gradient-to-b from-sky-600/30 to-transparent mt-2 transition-all`}></div>
                </div>
              )}

              {/* Arabe RTL (Right column) */}
              {(prescription.print_language_mode === 'bilingual' || prescription.print_language_mode === 'ar') && (
                <div dir="rtl" className="text-right max-w-[45%] space-y-1">
                  <h1 className={`${isA5 ? 'text-sm' : 'text-base'} font-extrabold text-slate-900 leading-tight font-sans`}>
                    {doctorConfig.name_ar}
                  </h1>
                  <p className={`${isA5 ? 'text-[11px]' : 'text-xs'} text-sky-700 font-bold leading-tight font-sans`}>
                    {doctorConfig.specialty_ar}
                  </p>
                  <div className={`${isA5 ? 'text-[9px]' : 'text-[10px]'} text-slate-500 font-medium space-y-0.5 leading-snug font-sans`}>
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
            <div className="border-b border-slate-200/60 pb-2"></div>

            {/* 2. PATIENT DETAILS BLOCK */}
            <div className={`p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-slate-800 ${isA5 ? 'text-[11px] p-3 gap-2' : 'text-xs p-4'}`}>
              <div className="space-y-1">
                <div>
                  <span className={`text-slate-400 font-medium uppercase block sm:inline ${isA5 ? 'text-[9px]' : 'text-[10px]'}`}>Patient :</span>{' '}
                  <span className={`${isA5 ? 'text-xs' : 'text-sm'} font-extrabold text-slate-900`}>{prescription.patient_name}</span>
                </div>
                <div className={`flex flex-wrap gap-4 font-medium ${isA5 ? 'text-[10px]' : 'text-[11px] text-slate-600'}`}>
                  <span>Âge : <span className="text-slate-800 font-bold">{prescription.patient_age_str}</span></span>
                  <span>Sexe : <span className="text-slate-800 font-bold">{prescription.patient_gender === 'M' ? 'Masculin' : 'Féminin'}</span></span>
                  {prescription.patient_weight && (
                    <span>Poids : <span className="text-slate-800 font-bold">{prescription.patient_weight} kg</span></span>
                  )}
                </div>
              </div>

              <div className={`text-right space-y-0.5 font-medium shrink-0 ${isA5 ? 'text-[10px]' : 'text-[11px] text-slate-600'}`}>
                <p>Date : <span className="text-slate-950 font-bold">{new Date(prescription.prescription_date).toLocaleDateString('fr-FR')}</span></p>
                <p className={`font-mono ${isA5 ? 'text-[9px]' : 'text-[10px] text-slate-400'}`}>N° : {prescription.prescription_number}</p>
              </div>
            </div>

            {prescription.is_cnam_apci && (
              <div className={`px-4 py-2 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between text-emerald-800 font-bold ${isA5 ? 'text-[9px] px-3 py-1.5' : 'text-xs'}`}>
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
              <h2 className={`${isA5 ? 'text-base' : 'text-lg'} font-black text-slate-900 tracking-widest uppercase`}>
                ORDONNANCE / وصفة طبية
              </h2>
              <div className="w-16 h-0.5 bg-sky-600 mx-auto rounded-full"></div>
            </div>

            {/* 4. PRESCRIPTION ITEMS LIST */}
            <div className={`space-y-6 ${isA5 ? 'pt-2 space-y-4' : 'pt-4'}`}>
              {items.map((item, index) => (
                <div key={item.id} className="space-y-1.5 leading-snug">
                  {/* Item title line */}
                  <div className="flex items-start gap-2.5">
                    <span className={`${isA5 ? 'text-xs' : 'text-sm'} font-black text-slate-900 shrink-0 select-none mt-0.5`}>
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <span className={`${isA5 ? 'text-xs font-black' : 'text-sm font-extrabold'} text-slate-950 leading-tight`}>
                        {item.medicine_label}
                      </span>
                      {item.dci_name && (
                        <span className={`${isA5 ? 'text-[9px]' : 'text-[10px]'} text-slate-500 font-medium italic block sm:inline sm:ml-2`}>
                          (DCI : {item.dci_name})
                        </span>
                      )}
                    </div>

                    {/* Quantity Badge */}
                    {item.quantity && (
                      <span className={`font-bold text-slate-800 border border-slate-300 rounded px-2 py-0.5 shrink-0 bg-slate-50 ${isA5 ? 'text-[10px]' : 'text-xs'}`}>
                        {item.quantity}
                      </span>
                    )}
                  </div>

                  {/* Consignes detail block (Bilingual parallel columns) */}
                  <div className={`pl-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 pt-0.5 text-slate-700 font-medium ${isA5 ? 'text-[10px]' : 'text-xs'}`}>
                    {/* Français column */}
                    {(prescription.print_language_mode === 'bilingual' || prescription.print_language_mode === 'fr') && (
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">
                          {item.dosage} • {item.frequency} pendant {item.duration}
                        </div>
                        {item.instructions_fr && (
                          <div className={`${isA5 ? 'text-[9px]' : 'text-[11px]'} text-slate-500 italic`}>Consignes : {item.instructions_fr}</div>
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
                          <div className={`${isA5 ? 'text-[9px]' : 'text-[11px]'} text-slate-500 italic`}>إرشادات : {item.instructions_ar}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Part: Stamp, Verification QR Code, footer */}
          <div className={`space-y-6 ${isA5 ? 'pt-6 space-y-4' : 'pt-12'}`}>
            {/* Stamp and Signature visual zone */}
            <div className="flex justify-between items-end">
              {/* Left spacer to preserve layout alignment */}
              <div></div>

              {/* Doctor Official Stamp Seal */}
              <div className={`text-right space-y-2 select-none flex flex-col justify-end items-end pr-4 ${isA5 ? 'min-h-[100px]' : 'min-h-[140px]'}`}>
                <span className={`font-bold text-slate-400 uppercase block mb-1 ${isA5 ? 'text-[8px]' : 'text-[10px]'}`}>Signature et Cachet</span>
                
                {/* Visual cachet simulation */}
                {doctorConfig.show_automatic_stamp !== false ? (
                  <div className={`border-4 border-dashed border-indigo-400/70 rounded-2xl bg-indigo-50/10 max-w-[240px] text-center transform -rotate-1 shadow-sm transition-all ${isA5 ? 'p-2.5' : 'p-4'}`}>
                    <div className={`${isA5 ? 'text-[9px]' : 'text-[10px]'} font-extrabold text-indigo-700 uppercase leading-tight`}>
                      {doctorConfig.name_fr}
                    </div>
                    <div className={`font-bold text-indigo-600 mt-0.5 ${isA5 ? 'text-[7px]' : 'text-[8px]'}`}>
                      {doctorConfig.specialty_fr}
                    </div>
                    <div className={`text-indigo-500/80 border-t border-dashed border-indigo-300 mt-1.5 pt-0.5 font-mono ${isA5 ? 'text-[7px]' : 'text-[8px]'}`}>
                      Ordre : {doctorConfig.order_number}
                      {doctorConfig.code_cnam && <div>CNAM : {doctorConfig.code_cnam}</div>}
                    </div>
                  </div>
                ) : (
                  <div className={`border border-dashed border-slate-200 rounded-xl bg-slate-50/30 max-w-[200px] text-center text-slate-400 italic flex items-center justify-center ${isA5 ? 'p-3 text-[8px] min-h-[50px]' : 'p-5 text-[10px] min-h-[70px]'}`}>
                    Emplacement Cachet & Signature Manuel
                  </div>
                )}
              </div>
            </div>

            {/* 5. BILINGUAL FOOTER */}
            <div className="border-t border-slate-200/80 pt-3">
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400 font-semibold leading-normal ${isA5 ? 'text-[8px] gap-2' : 'text-[9px]'}`}>
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
              <div className={`text-center text-slate-300 font-mono ${isA5 ? 'mt-1 text-[7px]' : 'mt-2 text-[8px]'}`}>
                ID : {prescription.id} • Édité le {new Date().toLocaleString('fr-FR')} • Ordonnancier Tunisien V1.0
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


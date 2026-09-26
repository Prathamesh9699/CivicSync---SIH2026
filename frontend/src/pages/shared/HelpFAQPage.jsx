import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { HelpCircle, ChevronDown, Phone, Mail, Sparkles, Award } from 'lucide-react';

export const HelpFAQPage = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "How do I report civic waste using CleanTrack?",
      a: "Navigate to 'Report Waste', take or upload a photo of the accumulated waste, verify your GPS location on the interactive map, let the AI analyze the material, and click 'Submit Smart Report'."
    },
    {
      q: "How does the AI waste classification work?",
      a: "CleanTrack uses neural computer vision (YOLOv8 + Vision Transformers) to identify material taxonomy (11 master streams), estimate accumulation severity, and verify if previous duplicate reports exist in the same area."
    },
    {
      q: "How are Civic Green Points calculated and awarded?",
      a: "You earn +50 Green Points whenever you submit a verified waste report that is resolved and confirmed clean. Green Points advance your eco citizen level and can be redeemed for municipal compost bags or transit discounts."
    },
    {
      q: "What is a recurring waste hotspot?",
      a: "A recurring hotspot is a location where illegal dumping happens repeatedly over multiple weeks or months. AI tracks these cycles to help municipalities deploy permanent high-capacity bins or increase pickup frequency."
    },
    {
      q: "What if the AI makes an inaccurate classification?",
      a: "CleanTrack uses a human-in-the-loop architecture. Municipal triage officers review all AI suggestions before assigning teams and can modify or override the category and severity with one click."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <PageHeader
        title="Help Center & FAQs"
        subtitle="Frequently asked questions, AI ethics policies, and municipal emergency contacts."
        breadcrumbs={[{ label: "Help & FAQ" }]}
      />

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-brand-600" : ""}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Emergency Municipal Support Helpline */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-base">Pune Municipal Corporation Sanitation Helpline</h4>
          <p className="text-xs text-slate-400 mt-0.5">Toll-Free 24x7 Citizen Assistance</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:18001030222"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>1800-103-0222</span>
          </a>
        </div>
      </div>
    </div>
  );
};

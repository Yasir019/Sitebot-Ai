import { useState } from "react";
import { Check, Sparkles } from "lucide-react";

interface PricingPageProps {
  onSelectPlan: (plan: "free" | "basic" | "pro" | "enterprise") => void;
}

export default function PricingPage({ onSelectPlan }: PricingPageProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <main id="pricing-page-main" className="pt-24 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto w-full px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-100">
            💰 Scalable & Professional
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Simple, Transparent Subscription Plans
          </h1>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Choose the workspace tier that fits your conversational support requirements. Lock in pre-trained RAG guardrails for zero-hallucination accuracy.
          </p>
        </div>

        {/* Pricing Toggle Switch */}
        <div className="flex items-center justify-center gap-3.5 mb-14">
          <span className={`text-xs font-bold transition-colors duration-200 ${!isAnnual ? "text-slate-900" : "text-slate-400"}`}>
            Billed Monthly
          </span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6.5 bg-indigo-200 rounded-full p-1 transition-colors relative flex items-center cursor-pointer"
            aria-label="Toggle annual pricing"
            type="button"
          >
            <div className={`absolute inset-0 rounded-full transition-colors duration-300 ${isAnnual ? "bg-indigo-600" : "bg-slate-300"}`}></div>
            <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform shadow duration-300 relative z-10 ${isAnnual ? "translate-x-5.5" : "translate-x-0"}`}></div>
          </button>
          <span className={`text-xs font-bold transition-colors duration-200 ${isAnnual ? "text-slate-900" : "text-slate-400"} flex items-center gap-1.5`}>
            Billed Annually
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md font-black tracking-normal border border-emerald-250 animate-pulse">
              Save ~20% ⚡
            </span>
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between relative hover:border-slate-350 hover:shadow-xl transition-all duration-300 group">
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Free Trial</h3>
                <div className="mt-2.5 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-905 tracking-tight">$0</span>
                  <span className="text-xs text-slate-400 font-medium ml-1">/mo</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Perfect setup for configuring sandbox tests or playing with local FAQs.</p>
              </div>
              <hr className="border-slate-100" />
              <ul className="text-xs text-slate-650 space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>1 AI Chatbot</strong> widget instance</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Up to <strong>2 Documents</strong> index limit</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>100 Messages</strong> /month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>10 Captured Leads /mo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>1 Support Desk User</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => onSelectPlan("free")} 
              className="mt-8 w-full py-3.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer text-center group-hover:scale-[1.01]"
            >
              Choose Free Plan
            </button>
          </div>

          {/* Basic Tier */}
          <div className="bg-white rounded-3xl border border-indigo-100 p-6 flex flex-col justify-between relative hover:border-indigo-300 hover:shadow-xl transition-all duration-300 group">
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Basic Startup</h3>
                <div className="mt-2.5 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    ${isAnnual ? "15" : "19"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">/mo</span>
                </div>
                {isAnnual && <div className="text-[9px] text-indigo-600 font-bold mt-1">Billed $180 annually</div>}
                <p className="text-[11px] text-slate-550 mt-2 leading-relaxed">Perfect with quick restaurant websites, medical clinics and local shops.</p>
              </div>
              <hr className="border-indigo-100/50" />
              <ul className="text-xs text-slate-650 space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>1 Dedicated AI</strong> chatbot web widget</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Up to <strong>10 Documents</strong> upload</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>1,000 Messages</strong> /month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>100 Captured Leads /mo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>2 Staff Support specialists</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => onSelectPlan("basic")} 
              className="mt-8 w-full py-3.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer text-center group-hover:scale-[1.01]"
            >
              Get Started Basic
            </button>
          </div>

          {/* Pro Growth Tier */}
          <div className="bg-slate-950 rounded-3xl border-2 border-indigo-500 p-6 flex flex-col justify-between relative shadow-xl shadow-indigo-600/10 hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all duration-300 group">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-650 to-purple-650 text-white px-3.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow">
              Most Popular
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  Pro Growth <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                </h3>
                <div className="mt-2.5 flex items-baseline">
                  <span className="text-4xl font-extrabold text-white tracking-tight">
                    ${isAnnual ? "39" : "49"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium ml-1">/mo</span>
                </div>
                {isAnnual && <div className="text-[9px] text-indigo-400 font-bold mt-1">Billed $468 annually</div>}
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">Robust lead collection flows, detailed custom training settings, full SLA.</p>
              </div>
              <hr className="border-slate-800" />
              <ul className="text-xs text-slate-300 space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-405 shrink-0 mt-0.5" />
                  <span><strong>3 AI Chatbots</strong> managed</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-405 shrink-0 mt-0.5" />
                  <span>Up to <strong>50 Documents</strong> upload</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-405 shrink-0 mt-0.5" />
                  <span><strong>5,000 Messages</strong> /month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-405 shrink-0 mt-0.5" />
                  <span>500 Leads captured offline</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-405 shrink-0 mt-0.5" />
                  <span>5 Staff Support specialists</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => onSelectPlan("pro")} 
              className="mt-8 w-full py-3.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer text-center"
            >
              Get Started with Pro
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between relative hover:border-slate-350 hover:shadow-xl transition-all duration-300 group">
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Enterprise</h3>
                <div className="mt-2.5 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    ${isAnnual ? "79" : "99"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium ml-1">/mo</span>
                </div>
                {isAnnual && <div className="text-[9px] text-indigo-650 font-bold mt-1">Billed $948 annually</div>}
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Dedicated clusters, priority response speeds, customizable widget CSS.</p>
              </div>
              <hr className="border-slate-200/65" />
              <ul className="text-xs text-slate-650 space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>Unlimited Chatbots</strong> system</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Up to <strong>200 Documents</strong> indexed</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>25,000 Messages</strong> /month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>10,000 Leads</strong> captured</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>Unlimited Staff</strong> user seats</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => onSelectPlan("enterprise")} 
              className="mt-8 w-full py-3.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer text-center group-hover:scale-[1.01]"
            >
              Onboard Enterprise
            </button>
          </div>
        </div>

        {/* Dynamic Trust Details */}
        <div className="mt-16 max-w-2xl mx-auto text-center bg-slate-100 border border-slate-200 p-4.5 rounded-2xl flex flex-wrap gap-4 items-center justify-center text-xs text-slate-500 font-semibold shadow-sm">
          <span className="flex items-center gap-1">🛡️ No contract / Cancel anytime</span>
          <span className="text-slate-350 hidden sm:inline">•</span>
          <span className="flex items-center gap-1">⚡ Instant sandbox deployment</span>
          <span className="text-slate-350 hidden sm:inline">•</span>
          <span className="flex items-center gap-1">🧠 Zero-hallucination pre-sets</span>
        </div>
      </div>

      <footer className="mt-24 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-6 text-xs text-slate-500">
          <div>
            <div className="text-sm font-black text-slate-900">SiteBot AI</div>
            <p className="mt-2 max-w-sm leading-relaxed">
              Professional AI chatbot workspaces for businesses that need clean support automation, lead capture, and controlled knowledge-base answers.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
            <a href="#pricing-page-main" className="hover:text-slate-900">Plans</a>
            <a href="#" className="hover:text-slate-900">Security</a>
            <a href="#" className="hover:text-slate-900">Terms</a>
            <a href="#" className="hover:text-slate-900">Privacy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

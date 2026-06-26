import Link from "next/link";
import AppIcon, { LogoIcon } from "@/components/ui/AppIcon";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center text-white">
            <LogoIcon size={20} />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-base leading-tight">
              PharmaCycle.AI
            </div>
            <div className="text-[10px] text-gray-400 leading-tight">
              Share. Save. Save Lives.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg transition-colors">
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition-all shadow-sm">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-green-100">
            <AppIcon name="sprout" size={14} className="text-green-600" />
            Empowering Pharmacies & Communities
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-950 tracking-tight leading-tight max-w-3xl mx-auto">
            Reduce Waste. Share Medicines.{" "}
            <span className="text-green-600">Save Lives.</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            PharmaCycle.AI connects pharmacies and the general public to
            facilitate safe medicine transfers, reducing pharmaceutical waste
            and making healthcare more affordable.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md shadow-green-600/10">
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold rounded-xl transition-all">
              Go to Dashboard Demo
            </Link>
          </div>
        </section>

        <section className="bg-white py-20 border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                <AppIcon name="pharmacy" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                For Pharmacies
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                List excess stock or medicines nearing their expiry date.
                Securely request inventory from nearby pharmacies to fill
                immediate shortages. Access AI-powered demand forecasts and
                stock health insights.
              </p>
              <ul className="space-y-2 text-xs text-gray-500 pt-2">
                <li className="flex items-center gap-2">
                  <AppIcon
                    name="checkmark"
                    size={14}
                    className="text-green-600 shrink-0"
                  />{" "}
                  Real-time Inventory Management
                </li>
                <li className="flex items-center gap-2">
                  <AppIcon
                    name="checkmark"
                    size={14}
                    className="text-green-600 shrink-0"
                  />{" "}
                  AI Expiry & Demand Insights
                </li>
                <li className="flex items-center gap-2">
                  <AppIcon
                    name="checkmark"
                    size={14}
                    className="text-green-600 shrink-0"
                  />{" "}
                  Automated Transfer Requests Matching
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <AppIcon name="user" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                For the General Public
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Find available, discounted medicines from certified pharmacies
                nearby. Save money on prescription costs while helping to
                prevent perfect medical stock from being thrown away.
              </p>
              <ul className="space-y-2 text-xs text-gray-500 pt-2">
                <li className="flex items-center gap-2">
                  <AppIcon
                    name="checkmark"
                    size={14}
                    className="text-green-600 shrink-0"
                  />{" "}
                  Locate Affordable Nearby Medicine
                </li>
                <li className="flex items-center gap-2">
                  <AppIcon
                    name="checkmark"
                    size={14}
                    className="text-green-600 shrink-0"
                  />{" "}
                  Verified Certified Partners Only
                </li>
                <li className="flex items-center gap-2">
                  <AppIcon
                    name="checkmark"
                    size={14}
                    className="text-green-600 shrink-0"
                  />{" "}
                  Environmental Waste Prevention
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-400">
        © 2026 PharmaCycle.AI. All rights reserved.
      </footer>
    </div>
  );
}

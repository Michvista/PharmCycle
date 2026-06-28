import Link from "next/link";
import AppIcon, { LogoIcon } from "@/components/ui/AppIcon";
import BrandWordmark from "@/components/ui/BrandWordmark";

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-950">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-600">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.12),_transparent_28%),linear-gradient(180deg,#f7fbf8_0%,#eef6f0_100%)] text-[#0e1a14]">
      <header className="sticky top-0 z-50 border-b border-white/40 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-600 text-white shadow-sm">
              <LogoIcon size={20} />
            </div>
            <BrandWordmark showTagline />
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm font-medium text-[#567060] transition-colors hover:text-[#0d4f3c]">
              How It Works
            </a>
            <a href="#for-pharmacies" className="text-sm font-medium text-[#567060] transition-colors hover:text-[#0d4f3c]">
              For Pharmacies
            </a>
            <a href="#for-public" className="text-sm font-medium text-[#567060] transition-colors hover:text-[#0d4f3c]">
              For Public
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-white hover:text-gray-900">
              Login
            </Link>
            <Link href="/signup" className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-16 pt-16 md:px-12 md:pb-24 md:pt-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-20 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-green-200/30 blur-3xl" />
            <div className="absolute right-0 top-32 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
            <div className="absolute left-10 top-16 hidden text-green-700/10 lg:block">
              <LogoIcon size={480} />
            </div>
            <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 text-green-700/8 lg:block">
              <LogoIcon size={640} />
            </div>
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-white/75 px-4 py-2 text-xs font-semibold text-green-700 shadow-sm backdrop-blur">
                <AppIcon name="sprout" size={14} className="text-green-600" />
                Empowering pharmacies and communities
              </div>

              <div className="max-w-3xl space-y-5">
                <h1 className="max-w-2xl font-[Syne,sans-serif] text-5xl font-extrabold leading-[1.02] tracking-tight text-gray-950 md:text-7xl">
                  Reduce waste.
                  <br />
                  Share medicines.
                  <br />
                  <span className="text-green-600">Save lives.</span>
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">
                  PharmaCycle.AI connects pharmacies and the general public to move surplus stock, surface expiry risk early, and generate demand forecasts that help medicine reach people instead of bins.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/signup" className="rounded-2xl bg-green-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_16px_36px_rgba(22,163,74,0.18)] transition-colors hover:bg-green-700">
                  Get Started
                </Link>
                <Link href="/login" className="rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50">
                  Open Demo Dashboard
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {(
                  [
                    { icon: "verified", title: "Verified partners", description: "Trusted pharmacy network across the platform" },
                    { icon: "trending", title: "Drug forecasts", description: "AI-generated demand signals to guide planning" },
                    { icon: "expiry", title: "Expiry alerts", description: "Clear action on stock nearing expiration" },
                  ] as const
                ).map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
                      <AppIcon name={item.icon} size={18} />
                    </div>
                    <div className="text-sm font-bold text-gray-950">{item.title}</div>
                    <div className="mt-1 text-xs leading-relaxed text-gray-500">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-br from-green-500/15 via-emerald-300/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[32px] border border-white/50 bg-[#0d4f3c] p-5 shadow-[0_40px_100px_rgba(13,79,60,0.28)]">
                <div className="mb-5 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28ca41]" />
                  <div className="ml-2 flex-1 rounded-full bg-white/10 px-4 py-2 text-xs text-white/60">
                    pharmacycle.ai/overview
                  </div>
                </div>

                <div className="rounded-[26px] bg-[#f3f7f4] p-4 md:p-5">
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4">
                      <div className="rounded-[22px] bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Expiry alert</div>
                            <div className="mt-1 text-xl font-bold text-gray-950">3 items need attention</div>
                          </div>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-700">
                            Act soon
                          </span>
                        </div>
                        <div className="space-y-3">
                          {[
                            ["Metformin 850mg", "Expires in 14 days", "Urgent transfer suggested", "amber"],
                            ["Amoxicillin 500mg", "Expires in 28 days", "2 pharmacies nearby need this", "green"],
                            ["Lisinopril 10mg", "Expires in 35 days", "Forecast shows steady demand", "blue"],
                          ].map(([name, when, note, tone]) => (
                            <div key={name} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 px-4 py-3">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{name}</div>
                                <div className="text-xs text-gray-500">{when} - {note}</div>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                                tone === "amber"
                                  ? "bg-amber-100 text-amber-700"
                                  : tone === "green"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                                {tone === "green" ? "Matched" : tone === "blue" ? "Forecasted" : "Review"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[22px] bg-white p-4 shadow-sm">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                            Drug forecast need
                          </div>
                          <div className="mt-2 flex items-end gap-2">
                            <div className="text-3xl font-black text-gray-950">18</div>
                            <div className="pb-1 text-xs font-semibold text-green-600">signals this week</div>
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="h-2 rounded-full bg-gray-100">
                              <div className="h-2 w-[72%] rounded-full bg-green-500" />
                            </div>
                            <div className="h-2 rounded-full bg-gray-100">
                              <div className="h-2 w-[48%] rounded-full bg-emerald-400" />
                            </div>
                            <div className="h-2 rounded-full bg-gray-100">
                              <div className="h-2 w-[61%] rounded-full bg-lime-400" />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[22px] bg-white p-4 shadow-sm">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                            Inventory health
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div>
                              <div className="text-3xl font-black text-gray-950">94%</div>
                              <div className="text-xs text-gray-500">healthy or forecasted</div>
                            </div>
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-700">
                              <AppIcon name="checkmark" size={28} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[22px] bg-white p-4 shadow-sm">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                          Forecast engine
                        </div>
                        <div className="mt-2 text-lg font-bold text-gray-950">AI generates drug forecasts</div>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                          Predict demand shifts before they hit the shelf so pharmacies can restock, discount, or transfer earlier.
                        </p>
                      </div>

                      <div className="rounded-[22px] bg-[#0d4f3c] p-4 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-green-300">
                          <AppIcon name="sparkles" size={14} />
                          Live network
                        </div>
                        <div className="mt-3 space-y-3">
                          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                            <div className="text-sm font-semibold">Amoxicillin 500mg</div>
                            <div className="text-xs text-white/60">Forecast indicates 12% increase in demand</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                            <div className="text-sm font-semibold">Metformin 850mg</div>
                            <div className="text-xs text-white/60">Expiry alert promoted to top priority</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                            <div className="text-sm font-semibold">Lisinopril 10mg</div>
                            <div className="text-xs text-white/60">Transfer recommendation ready</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20">
          <div className="mb-10 max-w-2xl">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.3em] text-green-600">How It Works</div>
            <h2 className="font-[Syne,sans-serif] text-3xl font-extrabold tracking-tight text-gray-950 md:text-5xl">
              Three steps. Zero waste.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 md:text-lg">
              From listing surplus to completing a transfer, the workflow stays quick, clear, and designed for real pharmacy operations.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon={<AppIcon name="clipboard" size={22} />}
              title="List surplus stock"
              description="Add near-expiry or excess inventory in seconds. The platform flags what should move first."
            />
            <FeatureCard
              icon={<AppIcon name="trending" size={22} />}
              title="AI generates drug forecasts"
              description="Forecast demand patterns so pharmacies know what to hold, discount, or transfer before shortages happen."
            />
            <FeatureCard
              icon={<AppIcon name="truck" size={22} />}
              title="Transfer and save"
              description="Confirm the handoff, track progress, and keep medicine flowing to the right destination."
            />
          </div>
        </section>

        <section className="border-y border-white/50 bg-white/70 py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-2 md:px-12">
            <div id="for-pharmacies" className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <AppIcon name="pharmacy" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-950">For Pharmacies</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                List excess stock, surface expiry alerts in a cleaner UI, and use AI forecasts to reduce waste while recovering value from medicines that still have demand.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <AppIcon name="checkmark" size={14} className="text-green-600" />
                  Real-time inventory management
                </li>
                <li className="flex items-center gap-2">
                  <AppIcon name="checkmark" size={14} className="text-green-600" />
                  AI expiry and demand insights
                </li>
                <li className="flex items-center gap-2">
                  <AppIcon name="checkmark" size={14} className="text-green-600" />
                  Automated transfer matching
                </li>
              </ul>
            </div>

            <div id="for-public" className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <AppIcon name="user" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-950">For the Public</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Search for available medicines, compare locations, and connect with verified pharmacies that are ready to help at a lower cost.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <AppIcon name="checkmark" size={14} className="text-green-600" />
                  Find affordable nearby medicine
                </li>
                <li className="flex items-center gap-2">
                  <AppIcon name="checkmark" size={14} className="text-green-600" />
                  Verified partner pharmacies
                </li>
                <li className="flex items-center gap-2">
                  <AppIcon name="checkmark" size={14} className="text-green-600" />
                  Reduce waste while saving money
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <div className="inline-flex rounded-full bg-[#0d4f3c] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-green-200">
                Expiry alert ui
              </div>
              <h2 className="font-[Syne,sans-serif] text-3xl font-extrabold tracking-tight text-gray-950 md:text-5xl">
                A cleaner alert system that feels like the landing page.
              </h2>
              <p className="text-base leading-relaxed text-gray-600 md:text-lg">
                Expiry alerts now read like product highlights, with stronger hierarchy, softer surfaces, and clear action states instead of a plain list.
              </p>
            </div>

            <div className="rounded-[32px] border border-white/60 bg-[#0d4f3c] p-5 shadow-[0_40px_100px_rgba(13,79,60,0.22)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-green-300">Expiry alert</div>
                  <div className="mt-1 text-2xl font-bold text-white">3 items need attention</div>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-green-200">
                  Priority view
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Metformin 850mg", "Urgent transfer suggested", "amber"],
                  ["Amoxicillin 500mg", "2 pharmacies nearby need this", "green"],
                  ["Lisinopril 10mg", "Forecast shows steady demand", "blue"],
                ].map(([name, note, tone]) => (
                  <div key={name} className="flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/10 px-4 py-4">
                    <div>
                      <div className="text-sm font-semibold text-white">{name}</div>
                      <div className="text-xs text-white/60">{note}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      tone === "amber"
                        ? "bg-amber-400/20 text-amber-200"
                        : tone === "green"
                        ? "bg-green-400/20 text-green-200"
                        : "bg-blue-400/20 text-blue-200"
                    }`}>
                      {tone === "amber" ? "Review" : tone === "green" ? "Matched" : "Forecast"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20">
          <div className="rounded-[36px] bg-gradient-to-br from-[#1a7a5e] to-[#0d4f3c] px-8 py-16 text-center shadow-[0_40px_100px_rgba(13,79,60,0.22)]">
            <h2 className="font-[Syne,sans-serif] text-3xl font-extrabold leading-tight text-white md:text-5xl">
              Ready to stop wasting medicine?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
              Join pharmacies already sharing stock, reducing expiry waste, and making medicine access a little easier for everyone.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/signup" className="rounded-2xl bg-white px-8 py-3.5 text-sm font-semibold text-[#0d4f3c] transition-opacity hover:opacity-90">
                Get Started Free
              </Link>
              <Link href="/forgot-password" className="rounded-2xl border border-white/40 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                Forgot Password
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0e1a14] px-6 pb-9 pt-14 md:px-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 border-b border-white/[0.08] pb-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <BrandWordmark tone="light" showTagline />
            <p className="mt-4 max-w-[260px] text-[13px] leading-relaxed text-white/40">
              Connecting pharmacies and communities so medicine reaches people, not bins.
            </p>
          </div>
          <div>
            <div className="mb-5 text-xs font-bold uppercase tracking-wide text-white/50">Product</div>
            <div className="flex flex-col gap-2.5">
              <a href="#how-it-works" className="text-sm text-white/55 transition-colors hover:text-green-400">
                How It Works
              </a>
              <a href="#for-pharmacies" className="text-sm text-white/55 transition-colors hover:text-green-400">
                For Pharmacies
              </a>
              <a href="#for-public" className="text-sm text-white/55 transition-colors hover:text-green-400">
                For Public
              </a>
              <Link href="/login" className="text-sm text-white/55 transition-colors hover:text-green-400">
                Dashboard Demo
              </Link>
            </div>
          </div>
          <div>
            <div className="mb-5 text-xs font-bold uppercase tracking-wide text-white/50">Company</div>
            <div className="flex flex-col gap-2.5">
              <a href="#" className="text-sm text-white/55 transition-colors hover:text-green-400">
                About Us
              </a>
              <a href="#" className="text-sm text-white/55 transition-colors hover:text-green-400">
                Blog
              </a>
              <a href="#" className="text-sm text-white/55 transition-colors hover:text-green-400">
                Careers
              </a>
              <a href="#" className="text-sm text-white/55 transition-colors hover:text-green-400">
                Contact
              </a>
            </div>
          </div>
          <div>
            <div className="mb-5 text-xs font-bold uppercase tracking-wide text-white/50">Legal</div>
            <div className="flex flex-col gap-2.5">
              <a href="#" className="text-sm text-white/55 transition-colors hover:text-green-400">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-white/55 transition-colors hover:text-green-400">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-white/55 transition-colors hover:text-green-400">
                Cookie Policy
              </a>
              <a href="#" className="text-sm text-white/55 transition-colors hover:text-green-400">
                Compliance
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 pt-7 text-xs text-white/30 sm:flex-row">
          <div>© 2026 PharmaCycle.AI. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="mailto:support@pharmacycle.ai" className="transition-colors hover:text-green-400">
              support@pharmacycle.ai
            </a>
            <a href="#" className="transition-colors hover:text-green-400">
              Twitter
            </a>
            <a href="#" className="transition-colors hover:text-green-400">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

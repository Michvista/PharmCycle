import TopBar from "@/components/layout/TopBar";
import AppIcon from "@/components/ui/AppIcon";

const faqs = [
  {
    q: "How do I list medicines for transfer?",
    a: "Go to Transfers → Offer Medicines, or use the Quick Actions on your dashboard. Select the medicines, set a discount, and they'll be visible to partner pharmacies.",
  },
  {
    q: "What happens when a medicine is near expiry?",
    a: "Our AI flags items expiring within 30 days. You'll get alerts and can list them for transfer at a discount to prevent waste.",
  },
  {
    q: "How are partner pharmacies verified?",
    a: "All pharmacies on PharmaCycle.AI are verified through PCN license checks. Look for the green verified badge on partner profiles.",
  },
  {
    q: "Can I track transfer deliveries?",
    a: "Yes. Go to Transfer Requests and filter by 'In Transit'. You'll see real-time status updates for each request.",
  },
  {
    q: "How does AI Insights work?",
    a: "Our AI analyzes your sales history, seasonal trends, and network data to predict demand, flag expiry risks, and recommend stock adjustments.",
  },
];

const contactOptions = [
  {
    icon: "send" as const,
    title: "Email Support",
    desc: "support@PharmaCycle.AI.ng",
    action: "Send Email",
  },
  {
    icon: "help" as const,
    title: "Live Chat",
    desc: "Available Mon–Fri, 8am–6pm WAT",
    action: "Start Chat",
  },
  {
    icon: "reports" as const,
    title: "Documentation",
    desc: "Guides, tutorials, and API docs",
    action: "View Docs",
  },
];

export default function HelpPage() {
  return (
    <>
      <TopBar
        title="Help & Support"
        subtitle="Find answers, get help, and learn how to make the most of PharmaCycle.AI."
      />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">How can we help?</h2>
          <p className="text-green-100 text-sm mb-4">
            Search our knowledge base or reach out to our support team.
          </p>
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3 max-w-lg">
            <AppIcon
              name="search"
              size={18}
              className="text-green-200 shrink-0"
            />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-green-200 w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contactOptions.map((option) => (
            <div
              key={option.title}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                <AppIcon
                  name={option.icon}
                  size={20}
                  className="text-green-600"
                />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                {option.title}
              </h3>
              <p className="text-xs text-gray-500 mb-3">{option.desc}</p>
              <button className="text-xs font-semibold text-green-600 hover:text-green-700">
                {option.action} →
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group border border-gray-100 rounded-xl">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-xl transition-colors list-none">
                  {faq.q}
                  <AppIcon
                    name="chevronDown"
                    size={16}
                    className="text-gray-400 group-open:rotate-180 transition-transform shrink-0"
                  />
                </summary>
                <p className="px-4 pb-4 text-sm text-gray-500 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
          <AppIcon
            name="sprout"
            size={32}
            className="text-green-600 mx-auto mb-3"
          />
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Still need help?
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Our support team typically responds within 2 hours during business
            hours.
          </p>
          <button className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer">
            Contact Support
          </button>
        </div>
      </main>
    </>
  );
}

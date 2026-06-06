import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { 
  Zap, Droplet, Wind, ShieldCheck, Paintbrush, Users, Hammer, Lightbulb,
  Search, CalendarCheck, Star, CreditCard,
  MessageSquare, ArrowRight, Instagram, Twitter, Send, MessageCircle
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3B82F6] text-sm font-bold tracking-wider text-white shadow-sm shadow-[#3B82F6]/20">
              BQ
            </div>
            <span>Briqoly</span>
          </Link>

          {/* Centered Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <Link href="#services" className="transition hover:text-slate-900">
              Services
            </Link>
            <Link href="#how-it-works" className="transition hover:text-slate-900">
              How It Works
            </Link>
            <Link href="#for-pros" className="transition hover:text-slate-900">
              For Pros
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full bg-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#3B82F6]/20 transition hover:bg-[#2563EB]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 pb-0">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                Find Trusted Local <span className="text-[#3B82F6]">Professionals</span> Near You
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Pay only when the job is done right, with real reviews from real customers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>Popular:</span>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">Plumber</span>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">Electrician</span>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">Cleaner</span>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">Pet Handler</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] bg-slate-100 shadow-2xl shadow-slate-200/60">
            <div className="relative h-[520px] w-full">
              <Image
                src="/hero-image.jpg"
                alt="Service professional carrying equipment"
                fill
                className="rounded-[32px] object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <ServicesSection />
      <HowItWorksSection />
      <CTASection />
      <div className="mt-auto">
        <SocialsSection />
      </div>
    </main>
  )
}

/* ==================================
   Sub-components
================================== */

const services = [
  { icon: Zap, name: "Electrician", desc: "Wiring, fixtures & panel upgrades", count: "50+ pros" },
  { icon: Droplet, name: "Plumber", desc: "Repairs, installations & maintenance", count: "60+ pros" },
  { icon: ShieldCheck, name: "Cleaner", desc: "Deep cleaning, regular & move-out", count: "50+ pros" },
  { icon: Wind, name: "HVAC", desc: "AC repair, heating & ventilation", count: "30+ pros" },
  { icon: Paintbrush, name: "Painter", desc: "Interior, exterior & decorative", count: "45+ pros" },
  { icon: Users, name: "Pet Handler", desc: "Dog walking, sitting & grooming", count: "20+ pros" },
  { icon: Hammer, name: "Carpenter", desc: "Furniture, framing & repairs", count: "25+ pros" },
  { icon: Lightbulb, name: "Appliance Repair", desc: "Ovens, fridges & washers", count: "35+ pros" },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-20 lg:py-28">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-[#3B82F6] uppercase tracking-wider">Our Services</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-3">
            Every Service You Need, One Platform
          </h2>
          <p className="text-slate-500 mt-4">
            Browse verified professionals across our core categories. Every provider is vetted so you can book with confidence.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service.name}
              className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:bg-[#3B82F6] hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors duration-300">
                <service.icon size={22} className="text-[#3B82F6] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-white transition-colors duration-300">{service.name}</h3>
              <p className="text-sm text-slate-500 mt-1 group-hover:text-blue-100 transition-colors duration-300">{service.desc}</p>
              <span className="inline-block mt-3 text-xs font-medium text-[#3B82F6] group-hover:text-white transition-colors duration-300">{service.count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const steps = [
  { icon: Search, step: "01", title: "Search & Compare", desc: "Browse verified pros in your area. Filter by rating, price, and availability." },
  { icon: CalendarCheck, step: "02", title: "Book & Schedule", desc: "Pick a time that works for you. Instant booking confirmation." },
  { icon: CreditCard, step: "03", title: "Flexible Payment", desc: "Pay directly via the Pro's preferred method: M-Pesa, Till Number, Pochi la Biashara, or Cash." },
  { icon: Star, step: "04", title: "Review & Rate", desc: "Leave an honest review after the job." },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-slate-100">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-[#3B82F6] uppercase tracking-wider">How It Works</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-3">
            Simple, Transparent, Trustworthy
          </h2>
          <p className="text-slate-500 mt-4">
            From search to satisfaction—every step is designed around your peace of mind.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, i) => (
            <div key={item.step} className="relative text-center">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-border text-gray-300 border-dashed border-gray-300 border-t-2" />
              )}
              <div className="relative mx-auto inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-5 shadow-lg">
                <item.icon size={28} className="text-white" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white text-xs font-bold text-[#3B82F6] flex items-center justify-center bg-white shadow-sm">
                  {item.step}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-[240px] mx-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  return (
    <section id="for-pros" className="py-20 lg:py-28">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="bg-blue-600 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden shadow-xl">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Ready to Connect?
            </h2>
            <p className="text-white/90 text-lg">

              Join thousands of homeowners and professionals who trust Briqoly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button size="lg" className="rounded-xl text-base font-semibold gap-2 bg-white text-blue-600 hover:bg-gray-100" asChild>
                <Link href="/signup">
                  Find a Pro <ArrowRight size={18} />
                </Link>
              </Button>
              <Button size="lg" className="rounded-xl text-base font-semibold gap-2 bg-white text-blue-600 hover:bg-gray-100" asChild>
                <Link href="/signup">
                  Join as a Pro <ArrowRight size={18} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SocialsSection = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3B82F6] text-sm font-bold tracking-wider text-white">
            BQ
          </div>
          <span className="text-lg font-semibold text-white">Briqoly</span>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Telegram">
            <Send size={24} />
          </Link>
          <Link href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Discord">
            <MessageCircle size={24} />
          </Link>
          <Link href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Instagram">
            <Instagram size={24} />
          </Link>
          <Link href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Twitter">
            <Twitter size={24} />
          </Link>
        </div>

        <p className="text-sm text-slate-400 text-center w-full">
          &copy; {new Date().getFullYear()} Briqoly. All rights reserved.
        </p>
      </div>
    </footer>
  )
}


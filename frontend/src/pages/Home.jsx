import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthModal } from '../context/AuthModalContext.jsx';
import Navbar from '../components/Navbar.jsx';
import AboutSection from '../components/home/AboutSection.jsx';
import BusinessPlanSection from '../components/home/BusinessPlanSection.jsx';
import ProductsSection from '../components/home/ProductsSection.jsx';
import ContactSection from '../components/home/ContactSection.jsx';

import BusinessPlan from './BusinessPlan.jsx';

/** Curved blue waves separating hero image from content panel */
function HeroWaves() {
  return (
    <div className="absolute -left-16 sm:-left-20 md:-left-24 top-0 bottom-0 w-32 sm:w-40 md:w-48 pointer-events-none" aria-hidden style={{ zIndex: 1 }}>
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
        <path d="M 0,100 Q 60,50 0,0 L 0,100 Z" fill="#1e3a5f" />
        <path d="M 0,100 Q 50,55 0,12 L 0,100 Z" fill="#2563eb" />
      </svg>
    </div>
  );
}

export default function Home() {
  const { openLogin, openRegister } = useAuthModal();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [hash]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero: full-bleed background image with transparent navbar and content overlay */}
      <section
        className="relative flex flex-col bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://res.cloudinary.com/dsafvwkrf/image/upload/v1777555905/Untitled_1920_x_900_px_u6cbci.png)',
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-slate-700/50" aria-hidden />

        {/* Transparent navbar inside hero so image shows behind it */}
        <div className="relative z-20">
          <Navbar
            transparent
            onOpenLogin={openLogin}
            onOpenRegister={openRegister}
          />
        </div>

        {/* Content overlay — centered */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 text-center">
          <div className="max-w-xl">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#EFBF04]">
              Amruta Wellness
            </p>
            <h1 className="mt-3 sm:mt-4 text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] drop-shadow-sm">
              <span className="text-[#EFBF04]">WELL-NESS</span>
              <br />
              <span className="text-white">THAT GROWS</span>
              <br />
              <span className="text-white">WITH YOU</span>
            </h1>
            <button
              type="button"
              onClick={() => scrollTo('business-plan')}
              className="mt-5 sm:mt-8 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-semibold text-white uppercase tracking-wide shadow-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Building Strong and Sustainable Growth
            </button>
            <p className="mt-5 sm:mt-8 text-sm sm:text-base md:text-lg text-slate-200 leading-relaxed">
              Join a trusted healthcare network. Build your business while helping others live healthier lives.
            </p>
            <p className="mt-3 text-sm sm:text-base font-medium text-emerald-200">
              Start your plan by buying products worth Rs 1500.
            </p>
            <div className="mt-6 sm:mt-10 flex flex-wrap gap-3 sm:gap-4 justify-center">
              <button
                type="button"
                onClick={openRegister}
                className="rounded-lg bg-blue-600 px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Get started
              </button>
              <button
                type="button"
                onClick={() => scrollTo('business-plan')}
                className="rounded-lg border-2 border-slate-300 bg-white/90 px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-slate-700 hover:bg-white"
              >
                View business plan
              </button>
            </div>
          </div>
        </div>
      </section>

      

      <AboutSection />
     
      <BusinessPlanSection />
      <BusinessPlan />
      {/* <ProductsSection /> */}
      <ContactSection />

      <section className="border-t border-slate-300 bg-[#dfe3e6] px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Ready to start?</h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Buy products worth Rs 1500 to activate your plan and join the network.
          </p>
          <button
            type="button"
            onClick={openRegister}
            className="mt-6 inline-block rounded-lg bg-teal-600 px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white hover:bg-teal-700"
          >
            Register now
          </button>
        </div>
      </section>
    </>
  );
}

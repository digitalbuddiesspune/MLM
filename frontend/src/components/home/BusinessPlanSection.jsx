export default function BusinessPlanSection() {
  const points = [
    {
      title: 'Auto-activation in binary tree',
      desc: 'If A is parent and B/C are child nodes, user A gets activated automatically when both B and C join.',
    },
    {
      title: 'Start plan with Rs 1500 products',
      desc: 'Each user can buy products worth Rs 1500 to start the plan, then add members using their sponsor ID.',
    },
    {
      title: 'Level rewards and joining bonus',
      desc: 'From Star to Diamond, each level has a reward and fixed joining bonus based on total users you add.',
    },
  ];

  return (
    <section id="business-plan" className="relative border-t border-b border-[#ccd3d8] bg-[#dfe3e6] px-4 py-16 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Left: label, heading, paragraph */}
          <div>
            <p className="text-sm font-bold tracking-[0.1em] text-[#5a8f3f] uppercase mb-4">Amruta Wellness</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              <span className="">IMPROVING</span>
              <br />
              OPERATIONAL EFFICIENCY
            </h2>
            <p className="mt-6 text-slate-700 text-base sm:text-lg leading-relaxed">
              Our binary structure allows you to build two legs (left and right). You earn through direct
              referrals, generation bonuses across multiple levels, and binary matching when both sides perform.
              All payouts are processed regularly with clear reporting. A one-time activation enables you to
              start earning; renew annually to keep your position and benefits active.
            </p>
          </div>

          {/* Right: blue gradient box with bullet points */}
          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-b from-blue-400 to-blue-700 p-6 sm:p-8 lg:p-10 shadow-xl space-y-8">
              {points.map(({ title, desc }) => (
                <div key={title} className="flex gap-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center mt-1 text-[#EFBF04]" aria-hidden>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-bold text-[#EFBF04] text-base sm:text-lg">{title}</h3>
                    <p className="mt-2 text-white/75 text-sm sm:text-base leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtle wavy graphic bottom right */}
            <div className="absolute -right-8 -bottom-8 w-48 h-48 opacity-20 pointer-events-none" aria-hidden>
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-400">
                <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M0 50 Q25 30 50 50 T100 50 M0 70 Q25 50 50 70 T100 70 M0 30 Q25 10 50 30 T100 30" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

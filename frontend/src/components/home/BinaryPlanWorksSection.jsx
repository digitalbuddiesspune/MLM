import {
  leaf,
  medal,
  rewardIcons,
  stepIcons,
  target,
} from '../../assets/icons/index.js';

const binarySteps = [
  {
    text: 'User A is the parent node; users B and C are child nodes in the binary tree.',
    icon: 'tree',
  },
  {
    text: 'When both B and C join under A, user A gets automatically activated.',
    icon: 'users',
  },
  {
    text: 'Each user joins the plan by purchasing products worth Rs 1500.',
    icon: 'cart',
  },
  {
    text: 'Users can sponsor new members using their sponsor ID and grow their network.',
    icon: 'id',
  },
  {
    text: 'Level, reward, and joining bonus are applied based on total sponsored users.',
    icon: 'gift',
  },
];

const levelSets = [
  { level: 'Level 1', name: 'Star', minUsers: '10+', reward: 'Remote', joiningBonus: 'Rs 20', rewardIcon: 'remote' },
  { level: 'Level 2', name: 'Rubi Star', minUsers: '100+', reward: 'Digital Watch', joiningBonus: 'Rs 10', rewardIcon: 'watch' },
  { level: 'Level 3', name: 'Silver', minUsers: '1000+', reward: 'Mobile', joiningBonus: 'Rs 10', rewardIcon: 'mobile' },
  { level: 'Level 4', name: 'Platinum', minUsers: '5000+', reward: 'Laptop', joiningBonus: 'Rs 10', rewardIcon: 'laptop' },
  { level: 'Level 5', name: 'Gold', minUsers: '20000+', reward: 'Two Wheeler', joiningBonus: 'Rs 10', rewardIcon: 'scooter' },
  { level: 'Level 6', name: 'Diamond', minUsers: '100000+', reward: 'Four Wheeler', joiningBonus: 'Rs 8', rewardIcon: 'car' },
];

function StepIcon({ name }) {
  const src = stepIcons[name] ?? stepIcons.tree;
  return <img src={src} alt="" className="h-10 w-10 object-contain" aria-hidden />;
}

function RewardIcon({ name }) {
  const src = rewardIcons[name] ?? rewardIcons.remote;
  return <img src={src} alt="" className="h-5 w-5 shrink-0 object-contain" aria-hidden />;
}

function StepArrow({ className = '' }) {
  return (
    <div className={`flex shrink-0 items-center justify-center px-1 text-emerald-500 ${className}`} aria-hidden>
      <svg viewBox="0 0 40 24" className="h-5 w-10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4">
        <path d="M2 12h30M28 7l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function SectionTitle({ children, subtitle }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">{children}</h2>
      <div className="mt-3 flex items-center justify-center gap-3">
        <span className="h-px w-16 bg-emerald-300 sm:w-24" />
        <img src={leaf} alt="" className="h-5 w-5 object-contain" aria-hidden />
        <span className="h-px w-16 bg-emerald-300 sm:w-24" />
      </div>
      {subtitle && <p className="mt-3 text-base text-slate-500 sm:text-lg">{subtitle}</p>}
    </div>
  );
}

export default function BinaryPlanWorksSection() {
  return (
    <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <SectionTitle subtitle="Simple steps to build your network and earn rewards.">
            How the Binary Plan Works
          </SectionTitle>

          <div className="mt-10 hidden lg:flex lg:items-stretch lg:justify-between">
            {binarySteps.map((step, index) => (
              <div key={step.text} className="flex min-w-0 flex-1 items-stretch">
                <article className="flex min-w-0 flex-1 flex-col items-center rounded-2xl border border-slate-200 bg-white px-3 py-6 text-center shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-base font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="mt-4 flex h-12 items-center justify-center">
                    <StepIcon name={step.icon} />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{step.text}</p>
                </article>
                {index < binarySteps.length - 1 && <StepArrow className="self-center" />}
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4 lg:hidden">
            {binarySteps.map((step, index) => (
              <div key={step.text}>
                <article className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-base font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="mt-3 flex h-12 items-center justify-center">
                    <StepIcon name={step.icon} />
                  </div>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">{step.text}</p>
                </article>
                {index < binarySteps.length - 1 && (
                  <div className="flex justify-center py-2 text-emerald-500">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" aria-hidden>
                      <path d="M12 4v14M7 13l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="flex items-center justify-center p-6 sm:p-8 lg:justify-start">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                <img src={target} alt="" className="h-10 w-10 object-contain" aria-hidden />
              </div>
            </div>
            <div className="px-6 pb-6 text-center lg:px-0 lg:pb-0 lg:text-left">
              <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">Our Vision</h3>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                We believe good health and financial independence go hand in hand. Through quality wellness products and
                a transparent business model, Amruta Wellness empowers individuals to build better lives.
              </p>
            </div>
            <div className="h-48 w-full lg:h-full lg:min-h-[180px] lg:w-72 xl:w-80">
              <img
                src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=80"
                alt="Wellness and balance"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <img src={medal} alt="" className="h-8 w-8 object-contain" aria-hidden />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">Level Sets, Rewards and Joining Bonus</h3>
              <p className="mt-1 text-base text-slate-500">
                Levels are based on how many users you add with your sponsor ID.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full border-collapse text-left text-base">
              <thead>
                <tr className="bg-emerald-700 text-white">
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Level Name</th>
                  <th className="px-4 py-3 font-semibold">Users Added</th>
                  <th className="px-4 py-3 font-semibold">Reward</th>
                  <th className="px-4 py-3 font-semibold">Joining Bonus</th>
                </tr>
              </thead>
              <tbody>
                {levelSets.map((item, index) => (
                  <tr
                    key={item.level}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    <td className="px-4 py-3 font-semibold text-emerald-700">{item.level}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.minUsers}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="inline-flex items-center gap-2">
                        <RewardIcon name={item.rewardIcon} />
                        {item.reward}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                        {item.joiningBonus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

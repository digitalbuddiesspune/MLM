import aboutImage from '../../assets/banner1.png';
export default function AboutSection() {

  const storyPoints = [
    {
      no: '01',
      title: 'Strong wellness ecosystem',
      desc: 'We combine trusted wellness products with a practical growth model so partners can build long-term value.',
    },
    {
      no: '02',
      title: 'Transparent binary model',
      desc: 'The left-right team structure keeps growth simple and easy to track, with clear performance visibility.',
    },
    {
      no: '03',
      title: 'Community-first support',
      desc: 'Training, mentorship, and regular guidance help every member build confidence and consistency.',
    },
  ];

  return (
    <section id="about" className="border-t border-slate-800 bg-[#dfe3e6] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[28px] bg-[#e9edef] px-6 py-12 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
          <span className="absolute left-10 top-20 h-4 w-4 rounded-full bg-[#8ecf5a]" aria-hidden />
          <span className="absolute right-16 top-16 h-4 w-4 rounded-full bg-[#8ecf5a]" aria-hidden />
          <span className="absolute right-24 top-1/2 h-8 w-8 rounded-full bg-[#ffbe1a]" aria-hidden />
          <span className="absolute right-10 top-[64%] h-3.5 w-3.5 rounded-full bg-[#5561ff]" aria-hidden />
          <span className="absolute left-[18%] top-1/2 h-16 w-16 rounded-full bg-[#c8e8d8]" aria-hidden />

          <div className="relative z-10 text-center">
            <p className="text-sm font-semibold tracking-[0.14em] text-[#7fb85a]">ABOUT US</p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-[#101418] sm:text-5xl lg:text-6xl">
              We are changing
              <br />
              the whole game.
            </h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="rounded-full bg-[#0b0d10] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#1c232b]"
              >
                Get Started
              </button>
              <button
                type="button"
                className="rounded-full border border-[#4a5158] bg-transparent px-8 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#d6dce0]"
              >
                View Pricing
              </button>
            </div>
          </div>

        

        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-sm font-bold tracking-[0.1em] text-[#7fb85a]">OUR STORY</p>
            <h3 className="mt-4 text-4xl font-bold leading-tight text-[#111827]">
              We are building trusted
              <br />
              wellness opportunities
              <br />
              for everyone.
            </h3>
            <div className="mt-8 flex items-start gap-4">
              <div className="relative h-14 w-14 shrink-0" aria-hidden>
                <span className="absolute left-0 top-2 h-8 w-8 rounded-full bg-[#f57ab8]" />
                <span className="absolute left-6 top-0 h-8 w-8 rounded-full bg-[#cde5b7]" />
                <span className="absolute left-2 top-7 h-8 w-8 rounded-full bg-[#f7bf1b]" />
              </div>
              <p className="max-w-sm text-lg leading-relaxed text-[#2a3442]">
                A living place for curiosity, collaboration, and meaningful growth through health and business.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {storyPoints.map(({ no, title, desc }) => (
              <article key={no} className="rounded-2xl border border-[#ccd3d8] bg-[#edf1f3] p-5 shadow-sm">
                <div className="flex gap-3">
                  <span className="text-3xl font-light leading-none text-[#111827]">{no}.</span>
                  <div>
                    <h4 className="text-3xl font-bold leading-tight text-[#111827]">{title}</h4>
                    <p className="mt-2 text-base leading-relaxed text-[#2a3442]">{desc}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-10 overflow-hidden rounded-2xl border border-[#ccd3d8] bg-[#dfe4e8]">
            <img
              src={aboutImage}
              alt="Doctors in hospital corridor"
              className=""
            />
          </div>
    </section>
  );
}

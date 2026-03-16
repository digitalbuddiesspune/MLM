export default function About() {
  return (
    <>
      <section className="border-b border-slate-100 bg-teal-50/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <img
              src="/amruta-wellness-logo.png"
              alt="Amruta Wellness"
              className="mx-auto h-12 w-12 object-contain"
            />
            <h1 className="mt-4 text-4xl font-bold text-slate-900">About us</h1>
            <p className="mt-4 text-lg text-slate-600">
              We are committed to bringing quality wellness and healthcare solutions to every home.
            </p>
          </div>
          <div className="mt-10 rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800"
              alt="Wellness and healthcare"
              className="w-full h-64 sm:h-80 object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-slate max-w-none">
          <h2 className="text-xl font-semibold text-slate-900">Our mission</h2>
          <p className="text-slate-600">
            Amruta Wellness exists to make trusted healthcare and wellness products accessible while creating
            meaningful opportunities for our partners. We believe in transparency, integrity, and supporting
            every member of our network.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-slate-900">Our values</h2>
          <ul className="list-disc pl-6 text-slate-600 space-y-2">
            <li><strong className="text-slate-800">Quality</strong> — Every product meets strict standards.</li>
            <li><strong className="text-slate-800">Integrity</strong> — Honest business practices and clear communication.</li>
            <li><strong className="text-slate-800">Support</strong> — Training and tools for your success.</li>
            <li><strong className="text-slate-800">Community</strong> — A network that grows together.</li>
          </ul>

          <h2 className="mt-10 text-xl font-semibold text-slate-900">Why choose us</h2>
          <p className="text-slate-600">
            With a simple binary structure, timely payouts, and a focus on health and wellness, we offer a
            sustainable way to build your business while helping others live better.
          </p>
        </div>
      </section>
    </>
  );
}

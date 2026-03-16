import { useState } from 'react';

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="border-t border-slate-100 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <h2 className="text-3xl font-bold text-slate-900 text-center">Contact us</h2>
        <p className="mt-4 text-lg text-slate-600 text-center">
          Have a question? We'd love to hear from you.
        </p>
        <div className="mt-12 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          {submitted ? (
            <div className="rounded-lg bg-teal-50 p-4 text-center text-teal-800">
              <p className="font-medium">Thank you for your message.</p>
              <p className="mt-1 text-sm">We'll get back to you as soon as we can.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="home-contact-name" className="block text-sm font-medium text-slate-700">Name</label>
                <input
                  id="home-contact-name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="home-contact-email" className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  id="home-contact-email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="home-contact-message" className="block text-sm font-medium text-slate-700">Message</label>
                <textarea
                  id="home-contact-message"
                  name="message"
                  rows={4}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700"
              >
                Send message
              </button>
            </form>
          )}
        </div>
        <p className="mt-10 text-center text-slate-600 text-sm">
          Or email us at support@amrutawellness.com
        </p>
      </div>
    </section>
  );
}

import { useState } from 'react';

function SocialIcon({ name }) {
  if (name === 'Instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" className="fill-current stroke-none" />
      </svg>
    );
  }

  if (name === 'Facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M13.5 22v-8h2.6l.4-3h-3v-1.9c0-.9.3-1.5 1.6-1.5h1.5V5c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.4V11H7.5v3H10V22h3.5z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
      <path d="M20 12a8 8 0 1 0-14.5 4.6L4 21l4.6-1.4A8 8 0 0 0 20 12Z" />
      <path d="M9.2 9.3c.2-.5.4-.5.6-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.1.6l-.5.6c-.2.2-.1.4 0 .6.4.7 1.1 1.4 1.8 1.8.2.1.4.2.6 0l.6-.5c.2-.1.4-.2.6-.1l1.6.7c.3.1.4.3.4.5v.5c0 .2 0 .4-.5.6-.5.2-1.7.3-3.4-.4-1.6-.7-3.2-2.3-3.9-3.9-.7-1.7-.6-2.9-.4-3.4Z" />
    </svg>
  );
}

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const mapLink = 'https://maps.app.goo.gl/UzmF9MvNUUViL8qC9?g_st=iw';
  const mapEmbedUrl =
    'https://www.google.com/maps?q=Amruta+wellness,+Pusegaon,+Maharashtra+415502&output=embed';
  const socialLinks = [
    { name: 'Instagram', href: 'https://instagram.com/amrutawellness' },
    { name: 'Facebook', href: 'https://facebook.com/amrutawellness' },
    { name: 'WhatsApp', href: 'https://wa.me/919876543210' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="border-t border-slate-300 bg-[#dfe3e6] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-slate-900">Contact Us</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-slate-600">
          Have a question? We&apos;d love to hear from you.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-3xl font-bold text-slate-800">Get In Touch</h3>
            <p className="mt-3 text-slate-600">
              Reach us through any of the channels below and our team will connect with you quickly.
            </p>

            <div className="mt-8 space-y-5 text-sm">
              <div>
                <p className="font-semibold text-slate-800">Address</p>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-teal-700 hover:underline"
                >
                  View on Google Maps
                </a>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Phone Number</p>
                <a href="tel:+919876543210" className="text-slate-600 hover:text-teal-700 hover:underline">
                  +91 98765 43210
                </a>
              </div>
              <div>
                <p className="font-semibold text-slate-800">E-Mail</p>
                <a
                  href="mailto:support@amrutawellness.com"
                  className="text-slate-600 hover:text-teal-700 hover:underline"
                >
                  support@amrutawellness.com
                </a>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="font-semibold text-slate-800">Follow Us:</p>
              <div className="mt-3 flex flex-wrap items-center gap-5">
                {socialLinks.map(({ name, href }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-medium text-teal-700 hover:text-teal-800 hover:underline"
                  >
                    <SocialIcon name={name} />
                    {name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-4xl font-bold text-slate-800">Send a Message</h3>
            {submitted ? (
              <div className="mt-6 rounded-lg bg-teal-50 p-4 text-center text-teal-800">
                <p className="font-medium">Thank you for your message.</p>
                <p className="mt-1 text-sm">We&apos;ll get back to you as soon as we can.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                  <label htmlFor="home-contact-email" className="block text-sm font-medium text-slate-700">Email address</label>
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
                  className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  Submit
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <iframe
            title="Google location map"
            src={mapEmbedUrl}
            className="h-80 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

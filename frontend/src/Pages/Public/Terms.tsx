import Navbar from '../../Components/Navbar';
import usePageTitle from '../../hooks/usePageTitle';

export default function Terms() {
  usePageTitle('Terms of Service');
  const updated = 'October 20, 2025';

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
          <p className="text-gray-400">Last updated: {updated}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">1. Acceptance of Terms</h2>
            <p className="text-gray-300">By accessing or using the Ventauri Merch website, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">2. Products and Availability</h2>
            <p className="text-gray-300">We strive to keep product information accurate and up to date. However, products may be limited, discontinued, or unavailable without prior notice. Pricing and availability are subject to change.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">3. Orders and Payment</h2>
            <p className="text-gray-300">When you place an order, you agree that all information provided is accurate and complete. We may cancel or refuse any order at our discretion. Payments are processed securely via our payment providers; additional verification may be required.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">4. Shipping and Delivery</h2>
            <p className="text-gray-300">Shipping times are estimates and may vary due to carrier delays or external factors. Risk of loss transfers to you upon delivery to the carrier. You will receive tracking information when available.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">5. Returns and Refunds</h2>
            <p className="text-gray-300">We accept returns in accordance with our return policy. Items must be unused and in their original packaging. Certain items may be final sale. Please contact support prior to sending a return.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">6. Accounts and Security</h2>
            <p className="text-gray-300">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately if you suspect unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">7. Intellectual Property</h2>
            <p className="text-gray-300">All content on the site, including logos, graphics, and product photography, is the property of Ventauri or its licensors and is protected by intellectual property laws. You may not reproduce or distribute content without permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">8. Limitation of Liability</h2>
            <p className="text-gray-300">To the maximum extent permitted by law, Ventauri is not liable for indirect, incidental, special, or consequential damages arising from your use of the site or products, even if advised of the possibility of such damages.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">9. Changes to Terms</h2>
            <p className="text-gray-300">We may update these Terms from time to time. Continued use of the site after changes indicates your acceptance of the updated Terms. The date above reflects the latest update.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">10. Contact</h2>
            <p className="text-gray-300">Questions about these Terms? Reach out via our <a href="/contact" className="text-ventauri hover:brightness-110">Contact page</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
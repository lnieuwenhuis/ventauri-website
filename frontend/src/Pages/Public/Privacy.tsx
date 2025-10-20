import Navbar from '../../Components/Navbar';
import usePageTitle from '../../hooks/usePageTitle';

export default function Privacy() {
  usePageTitle('Privacy Policy');
  const updated = 'October 20, 2025';

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: {updated}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">1. Overview</h2>
            <p className="text-gray-300">This Privacy Policy describes how Ventauri collects, uses, and protects your personal information when you visit our website or make a purchase. We respect your privacy and are committed to safeguarding your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">2. Information We Collect</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Account information such as name, email, and login provider</li>
              <li>Order details including shipping address and contact information</li>
              <li>Payment status and transaction identifiers from payment providers</li>
              <li>Usage data such as pages visited, device/browser information, and cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">3. How We Use Information</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>To process and fulfill orders, provide customer support, and manage your account</li>
              <li>To improve our products, services, and user experience</li>
              <li>To prevent fraud and ensure the security of our platform</li>
              <li>To communicate updates, promotions, and transactional notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">4. Legal Basis</h2>
            <p className="text-gray-300">We process personal data where necessary to perform a contract (e.g., fulfilling orders), based on legitimate interests (e.g., site security), and with your consent where required (e.g., certain marketing communications).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">5. Sharing of Information</h2>
            <p className="text-gray-300">We may share information with trusted service providers solely to deliver our services (e.g., payment processing, shipping, analytics). We do not sell your personal data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">6. Data Retention</h2>
            <p className="text-gray-300">We retain personal data as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account subject to applicable exceptions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">7. Your Rights</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Access, correct, or delete your personal information</li>
              <li>Withdraw consent for processing where applicable</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Request data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">8. Cookies</h2>
            <p className="text-gray-300">We use cookies and similar technologies to improve site functionality and measure performance. You can manage cookie preferences through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">9. Security</h2>
            <p className="text-gray-300">We employ administrative, technical, and physical safeguards to protect your data. No method of transmission is 100% secure, but we strive to use industry-standard practices.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">10. Changes to this Policy</h2>
            <p className="text-gray-300">We may update this Policy from time to time. Continued use of the site after changes indicates your acceptance of the updated Policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ventauri mb-2">11. Contact</h2>
            <p className="text-gray-300">Questions about privacy? Reach out via our <a href="/contact" className="text-ventauri hover:brightness-110">Contact page</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
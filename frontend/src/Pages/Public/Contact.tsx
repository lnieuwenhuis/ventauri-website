import React from 'react';

const Contact: React.FC = () => {
	return (
		<div className="space-y-8">
			<div className="text-center">
				<h2 className="text-3xl font-bold text-white mb-4">Contact Us</h2>
				<p className="text-gray-300 max-w-2xl mx-auto">
					Get in touch with Ventauri Esports for partnerships, sponsorships, or general inquiries.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
				<div className="bg-gray-800 rounded-lg p-8">
					<h3 className="text-xl font-semibold text-white mb-6">Contact Information</h3>
					<div className="space-y-4">
						<div className="flex items-center space-x-3">
							<span className="text-yellow-400">📧</span>
							<span className="text-gray-300">contact@ventauri-esports.com</span>
						</div>
						<div className="flex items-center space-x-3">
							<span className="text-yellow-400">🐦</span>
							<span className="text-gray-300">@VentauriEsports</span>
						</div>
						<div className="flex items-center space-x-3">
							<span className="text-yellow-400">📺</span>
							<span className="text-gray-300">Ventauri Esports</span>
						</div>
						<div className="flex items-center space-x-3">
							<span className="text-yellow-400">🎮</span>
							<span className="text-gray-300">Discord: VentauriEsports</span>
						</div>
					</div>
				</div>

				<div className="bg-gray-800 rounded-lg p-8">
					<h3 className="text-xl font-semibold text-white mb-6">Send us a Message</h3>
					<form className="space-y-4">
						<div>
							<input
								type="text"
								placeholder="Your Name"
								className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
							/>
						</div>
						<div>
							<input
								type="email"
								placeholder="Your Email"
								className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
							/>
						</div>
						<div>
							<input
								type="text"
								placeholder="Subject"
								className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
							/>
						</div>
						<div>
							<textarea
								rows={5}
								placeholder="Your Message"
								className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 resize-none"
							></textarea>
						</div>
						<button
							type="submit"
							className="w-full bg-yellow-400 text-black font-semibold py-3 rounded-lg hover:bg-yellow-500 transition-colors"
						>
							Send Message
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Contact;
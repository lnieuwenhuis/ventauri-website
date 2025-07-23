import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../Components/Navbar';
import usePageTitle from '../../hooks/usePageTitle';

const Contact: React.FC = () => {
	usePageTitle('Contact');
	return (
		<div className="min-h-screen bg-gray-900">
			<Navbar />

			{/* Sub Navigation */}
			<div className="bg-gray-800 border-b border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex space-x-8">
						<Link
							to="/about"
							className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-ventauri hover:border-gray-600 font-medium text-sm transition-colors"
						>
							Team Members
						</Link>
						<Link
							to="/competitions"
							className="py-4 px-1 border-b-2 border-transparent text-gray-300 hover:text-ventauri hover:border-gray-600 font-medium text-sm transition-colors"
						>
							Competitions
						</Link>
						<span className="py-4 px-1 border-b-2 border-ventauri text-ventauri font-medium text-sm">
							Contact
						</span>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="space-y-8">
					<div className="text-center">
						<h2 className="text-3xl font-bold text-white mb-4">Contact Us</h2>
						<p className="text-gray-300 max-w-2xl mx-auto">
							Get in touch with Ventauri Esports for partnerships, sponsorships, or
							general inquiries.
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
						<div className="bg-gray-800 rounded-lg p-8">
							<h3 className="text-xl font-semibold text-white mb-6">
								Contact Information
							</h3>
							<div className="space-y-4">
								<div className="flex items-center space-x-3">
									<span className="text-ventauri">📧</span>
									<span className="text-gray-300">contact@ventauri-esports.com</span>
								</div>
								<div className="flex items-center space-x-3">
									<span className="text-ventauri">🐦</span>
									<span className="text-gray-300">@VentauriEsports</span>
								</div>
								<div className="flex items-center space-x-3">
									<span className="text-ventauri">📺</span>
									<span className="text-gray-300">Ventauri Esports</span>
								</div>
								<div className="flex items-center space-x-3">
									<span className="text-ventauri">🎮</span>
									<span className="text-gray-300">Discord: VentauriEsports</span>
								</div>
							</div>
						</div>

						<div className="bg-gray-800 rounded-lg p-8">
							<h3 className="text-xl font-semibold text-white mb-6">
								Send us a Message
							</h3>
							<form className="space-y-4">
								<div>
									<input
										type="text"
										placeholder="Your Name"
										className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-ventauri"
									/>
								</div>
								<div>
									<input
										type="email"
										placeholder="Your Email"
										className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-ventauri"
									/>
								</div>
								<div>
									<input
										type="text"
										placeholder="Subject"
										className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-ventauri"
									/>
								</div>
								<div>
									<textarea
										rows={5}
										placeholder="Your Message"
										className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-ventauri resize-none"
									></textarea>
								</div>
								<button
									type="submit"
									className="w-full bg-ventauri text-black font-semibold py-3 rounded-lg hover:bg-yellow-500 transition-colors"
								>
									Send Message
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Contact;

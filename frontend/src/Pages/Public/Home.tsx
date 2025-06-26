import { Link } from 'react-router-dom';
import Navbar from '../../Components/Navbar';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />
            
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                    <div className="text-center">
                        <h1 className="text-5xl lg:text-7xl font-bold mb-6">
                            <span className="text-white">VENTAURI</span>
                            <span className="text-yellow-400 ml-4">ESPORTS</span>
                        </h1>
                        <p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                            Official merchandise for the fastest F1 Esports team on the grid
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                to="/products" 
                                className="bg-yellow-400 text-black px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors duration-200"
                            >
                                Shop Now
                            </Link>
                            <Link 
                                to="/about" 
                                className="border-2 border-yellow-400 text-yellow-400 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-400 hover:text-black transition-colors duration-200"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl"></div>
            </section>

            {/* Featured Products */}
            <section className="py-20 bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">Featured Collection</h2>
                        <p className="text-xl text-gray-300">Gear up with official Ventauri Esports merchandise</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Product Card 1 */}
                        <div className="bg-gray-900 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-200">
                            <div className="h-64 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                                <div className="text-6xl text-yellow-400">👕</div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-white mb-2">Team Jersey</h3>
                                <p className="text-gray-400 mb-4">Official racing jersey with team colors</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-yellow-400">€49.99</span>
                                    <button className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-300 transition-colors">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Product Card 2 */}
                        <div className="bg-gray-900 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-200">
                            <div className="h-64 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                                <div className="text-6xl text-yellow-400">🧢</div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-white mb-2">Racing Cap</h3>
                                <p className="text-gray-400 mb-4">Premium cap with embroidered logo</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-yellow-400">€29.99</span>
                                    <button className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-300 transition-colors">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Product Card 3 */}
                        <div className="bg-gray-900 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-200">
                            <div className="h-64 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                                <div className="text-6xl text-yellow-400">🏎️</div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-white mb-2">Model Car</h3>
                                <p className="text-gray-400 mb-4">1:43 scale team livery model</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-yellow-400">€79.99</span>
                                    <button className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-300 transition-colors">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Stats */}
            <section className="py-20 bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">Championship Performance</h2>
                        <p className="text-xl text-gray-300">Racing at the highest level of F1 Esports</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-yellow-400 mb-2">12</div>
                            <div className="text-gray-300 text-lg">Race Wins</div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold text-yellow-400 mb-2">28</div>
                            <div className="text-gray-300 text-lg">Podium Finishes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold text-yellow-400 mb-2">3rd</div>
                            <div className="text-gray-300 text-lg">Championship Position</div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold text-yellow-400 mb-2">2024</div>
                            <div className="text-gray-300 text-lg">Season</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Signup */}
            <section className="py-20 bg-gradient-to-r from-yellow-400 to-yellow-500">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-black mb-4">Stay in the Fast Lane</h2>
                    <p className="text-xl text-black/80 mb-8">Get exclusive access to new products, race updates, and team news</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input 
                            type="email" 
                            placeholder="Enter your email" 
                            className="flex-1 px-4 py-3 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <button className="bg-black text-yellow-400 px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                            Subscribe
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
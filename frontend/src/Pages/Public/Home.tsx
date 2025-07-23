import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../Components/Navbar';
import { useCart } from '../../Contexts/CartContext';
import usePageTitle from '../../hooks/usePageTitle';

interface Product {
	id: string;
	name: string;
	description: string;
	price: number;
	categoryId: string;
	images: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	category?: {
		id: string;
		name: string;
	};
}

interface ProductsResponse {
	data: Product[];
	total: number;
	page: number;
	limit: number;
}

// Updated interfaces
interface ChampionshipStats {
	raceWins: number;
	podiumFinishes: number;
	championshipPosition: number;
	competitionName: string;
}

// Updated fetch function
const fetchChampionshipStats = async (): Promise<ChampionshipStats> => {
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';
	const response = await fetch(`${apiURL}/api/competitions/championship-stats`);
	if (!response.ok) {
		throw new Error('Failed to fetch championship stats');
	}
	return response.json();
};

export default function Home() {
	usePageTitle('Home');
	const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const apiURL = import.meta.env.VITE_BACKEND_URL || '';
	const { addToCart, loading: cartLoading } = useCart();
	const [championshipStats, setChampionshipStats] = useState<ChampionshipStats>({
		raceWins: 0,
		podiumFinishes: 0,
		championshipPosition: 3,
		competitionName: 'Loading...',
	});

	useEffect(() => {
		fetchChampionshipStats()
			.then((stats) => {
				setChampionshipStats(stats);
			})
			.catch(console.error);
	}, [apiURL]);

	// Helper function for ordinal numbers
	const getOrdinal = (num: number): string => {
		if (num === 1) return '1st';
		if (num === 2) return '2nd';
		if (num === 3) return '3rd';
		return `${num}th`;
	};

	const fetchFeaturedProducts = async () => {
		try {
			setLoading(true);
			// Fetch latest 3 products sorted by creation date
			const params = new URLSearchParams({
				page: '1',
				limit: '3',
				sort: 'newest',
			});

			const response = await fetch(`${apiURL}/api/products/?${params}`);
			if (response.ok) {
				const result: ProductsResponse = await response.json();
				setFeaturedProducts(result.data || []);
			}
		} catch (error) {
			console.error('Error fetching featured products:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchFeaturedProducts();
		//eslint-disable-next-line
	}, []);

	const parseImages = (images: string): string[] => {
		try {
			if (images && images.trim()) {
				const parsed = JSON.parse(images);
				return Array.isArray(parsed) ? parsed : [];
			}
		} catch (error) {
			console.warn('Failed to parse product images:', error);
		}
		return [];
	};

	const handleAddToCart = async (productId: string) => {
		await addToCart(productId, 1);
	};

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			<Navbar />

			{/* Hero Section */}
			<section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
				<div className="absolute inset-0 bg-gradient-to-r from-ventauri/10 to-transparent"></div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
					<div className="text-center">
						<h1 className="text-5xl lg:text-7xl font-bold mb-6">
							<span className="text-ventauri">VENTAURI</span>
							<span className="text-white ml-4">ESPORTS</span>
						</h1>
						<p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
							Official merchandise for the fastest F1 Esports team on the grid
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								to="/products"
								className="bg-ventauri text-black px-8 py-4 rounded-lg font-semibold text-lg hover:bg-ventauri transition-colors duration-200"
							>
								Shop Now
							</Link>
							<Link
								to="/about"
								className="border-2 border-ventauri text-ventauri px-8 py-4 rounded-lg font-semibold text-lg hover:bg-ventauri hover:text-black transition-colors duration-200"
							>
								Learn More
							</Link>
						</div>
					</div>
				</div>

				{/* Decorative elements */}
				<div className="absolute top-0 right-0 w-96 h-96 bg-ventauri/5 rounded-full blur-3xl"></div>
				<div className="absolute bottom-0 left-0 w-96 h-96 bg-ventauri/5 rounded-full blur-3xl"></div>
			</section>

			{/* Featured Products */}
			<section className="py-20 bg-gray-800">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold text-white mb-4">Latest Products</h2>
						<p className="text-xl text-gray-300">
							Check out our newest Ventauri Esports merchandise
						</p>
					</div>

					{loading ? (
						<div className="flex justify-center items-center py-20">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ventauri"></div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{featuredProducts.map((product) => {
								const productImages = parseImages(product.images);
								const firstImage = productImages.length > 0 ? productImages[0] : null;

								return (
									<div
										key={product.id}
										className="bg-gray-900 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-200"
									>
										<Link to={`/product/${product.id}`}>
											<div className="h-64 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden">
												{firstImage ? (
													<img
														src={firstImage}
														alt={product.name}
														className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
														onError={(e) => {
															const target = e.target as HTMLImageElement;
															target.src = 'https://picsum.photos/400/400';
														}}
													/>
												) : null}
												<div
													className={`text-6xl text-ventauri ${firstImage ? 'hidden' : ''}`}
												>
													📦
												</div>
											</div>
										</Link>
										<div className="p-6">
											<Link to={`/product/${product.id}`}>
												<h3 className="text-xl font-semibold text-white mb-2 hover:text-ventauri transition-colors">
													{product.name}
												</h3>
											</Link>
											<p className="text-gray-400 mb-4 line-clamp-2">
												{product.description}
											</p>
											<div className="flex justify-between items-center">
												<span className="text-2xl font-bold text-ventauri">
													€{product.price.toFixed(2)}
												</span>
												<button
													onClick={() => handleAddToCart(product.id)}
													disabled={cartLoading}
													className="bg-ventauri text-black px-4 py-2 rounded font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												>
													{cartLoading ? 'Adding...' : 'Add to Cart'}
												</button>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}

					{!loading && featuredProducts.length === 0 && (
						<div className="text-center py-20">
							<p className="text-gray-400 text-lg">
								No products available at the moment.
							</p>
						</div>
					)}
				</div>
			</section>

			{/* Team Stats */}
			<section className="py-20 bg-gray-900">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold text-white mb-4">
							Championship Performance
						</h2>
						<p className="text-xl text-gray-300">
							{championshipStats.competitionName} - Racing at the highest level
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="text-center">
							<div className="text-5xl font-bold text-ventauri mb-2">
								{championshipStats.raceWins}
							</div>
							<div className="text-gray-300 text-lg">Race Wins</div>
						</div>
						<div className="text-center">
							<div className="text-5xl font-bold text-ventauri mb-2">
								{championshipStats.podiumFinishes}
							</div>
							<div className="text-gray-300 text-lg">Podium Finishes</div>
						</div>
						<div className="text-center">
							<div className="text-5xl font-bold text-ventauri mb-2">
								{getOrdinal(championshipStats.championshipPosition)}
							</div>
							<div className="text-gray-300 text-lg">Championship Position</div>
						</div>
					</div>
				</div>
			</section>

			{/* Newsletter Signup */}
			<section className="py-20 bg-ventauri">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-4xl font-bold text-black mb-4">
						Stay in the Fast Lane
					</h2>
					<p className="text-xl text-black/80 mb-8">
						Get exclusive access to new products, race updates, and team news
					</p>

					<div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
						<input
							type="email"
							placeholder="Enter your email"
							className="flex-1 px-4 py-3 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
						/>
						<button className="bg-black text-ventauri px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
							Subscribe
						</button>
					</div>
				</div>
			</section>
		</div>
	);
}

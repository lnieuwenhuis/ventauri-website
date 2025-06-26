import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    return (
        <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo Section */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-3">
                            {/* Placeholder for team logo */}
                            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                                <span className="text-black font-bold text-lg">V</span>
                            </div>
                            <div className="text-white">
                                <span className="text-xl font-bold">VENTAURI</span>
                                <span className="text-yellow-400 ml-1">ESPORTS</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link 
                            to="/" 
                            className="text-gray-300 hover:text-yellow-400 px-3 py-2 text-sm font-medium transition-colors"
                        >
                            Home
                        </Link>
                        <Link 
                            to="/products" 
                            className="text-gray-300 hover:text-yellow-400 px-3 py-2 text-sm font-medium transition-colors"
                        >
                            Shop
                        </Link>
                        <Link 
                            to="/categories" 
                            className="text-gray-300 hover:text-yellow-400 px-3 py-2 text-sm font-medium transition-colors"
                        >
                            Categories
                        </Link>
                        <Link 
                            to="/about" 
                            className="text-gray-300 hover:text-yellow-400 px-3 py-2 text-sm font-medium transition-colors"
                        >
                            About Team
                        </Link>
                        <Link 
                            to="/contact" 
                            className="text-gray-300 hover:text-yellow-400 px-3 py-2 text-sm font-medium transition-colors"
                        >
                            Contact
                        </Link>
                    </div>

                    {/* Right Side - Cart, Account, etc. */}
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="bg-gray-800 text-white placeholder-gray-400 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 w-64"
                            />
                            <svg className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Cart */}
                        <Link 
                            to="/cart" 
                            className="relative text-gray-300 hover:text-yellow-400 p-2 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                            </svg>

                            {/* Cart badge */}
                            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                                0
                            </span>
                        </Link>

                        {/* User Account Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="text-gray-300 hover:text-yellow-400 p-2 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>
                            
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                                    <Link 
                                        to="/login" 
                                        className="block px-4 py-2 text-sm text-gray-300 hover:text-yellow-400 hover:bg-gray-700 rounded-t-lg"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        Sign In
                                    </Link>
                                    <Link 
                                        to="/register" 
                                        className="block px-4 py-2 text-sm text-gray-300 hover:text-yellow-400 hover:bg-gray-700"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                    <Link 
                                        to="/profile" 
                                        className="block px-4 py-2 text-sm text-gray-300 hover:text-yellow-400 hover:bg-gray-700"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        My Account
                                    </Link>
                                    <Link 
                                        to="/orders" 
                                        className="block px-4 py-2 text-sm text-gray-300 hover:text-yellow-400 hover:bg-gray-700 rounded-b-lg"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        Order History
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-300 hover:text-yellow-400 p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-gray-800">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <Link 
                                to="/" 
                                className="block text-gray-300 hover:text-yellow-400 px-3 py-2 text-base font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link 
                                to="/products" 
                                className="block text-gray-300 hover:text-yellow-400 px-3 py-2 text-base font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Shop
                            </Link>
                            <Link 
                                to="/categories" 
                                className="block text-gray-300 hover:text-yellow-400 px-3 py-2 text-base font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Categories
                            </Link>
                            <Link 
                                to="/about" 
                                className="block text-gray-300 hover:text-yellow-400 px-3 py-2 text-base font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                About Team
                            </Link>
                            <Link 
                                to="/contact" 
                                className="block text-gray-300 hover:text-yellow-400 px-3 py-2 text-base font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Contact
                            </Link>
                            <div className="border-t border-gray-700 pt-2">
                                <Link 
                                    to="/cart" 
                                    className="block text-gray-300 hover:text-yellow-400 px-3 py-2 text-base font-medium"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Cart (0)
                                </Link>
                                <Link 
                                    to="/login" 
                                    className="block text-gray-300 hover:text-yellow-400 px-3 py-2 text-base font-medium"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="block text-gray-300 hover:text-yellow-400 px-3 py-2 text-base font-medium"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
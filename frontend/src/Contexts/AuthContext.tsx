import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    email: string;
    password?: string;
    role: 'user' | 'admin';
    firstName: string;
    lastName: string;
    phone: string;
    isActive: boolean;
    
    // OAuth fields
    googleId?: string | null;
    avatar?: string | null;
    displayName?: string | null;
    lastLoginAt?: string | null;
    
    // Relationships (these will be arrays or null when populated)
    addresses?: object[] | null;
    orders?: object[] | null;
    cart?: object[] | null;
    reviews?: object[] | null;
    paymentMethods?: object[] | null;
    sessions?: object[] | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

// Add helper function
const getBackendUrl = () => {
    return API_BASE_URL;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check session on mount
    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.data?.user) {
                    setUser(data.data.user);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Session check failed:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async () => {
        try {
            const backendUrl = getBackendUrl();
            const response = await fetch(`${backendUrl}/api/auth/signin/social`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    provider: 'google',
                    callbackURL: '/admin'
                }),
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.url) {
                    // Use window.location.href for external OAuth redirect
                    window.location.href = data.url;
                }
            } else {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('Sign in failed:', error);
            throw error; // Re-throw to handle in UI if needed
        }
    };

    const signOut = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                setUser(null);
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signIn,
                signOut,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
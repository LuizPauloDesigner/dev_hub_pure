import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/services/db';

interface User {
    id: string;
    email: string;
    name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    role: 'user' | 'admin';
    plan: 'free' | 'pro' | 'team';
    organization_id?: string | null;
    sub_role?: 'org_admin' | 'manager' | 'employee' | 'user';
}

export interface Branding {
    name: string;
    logo_url: string;
    primary_color: string;
    accent_color?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isOrgAdmin: boolean;
    isLoading: boolean;
    branding: Branding | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshBranding: () => Promise<void>;
    updateProfile: (updates: Partial<User>) => Promise<void>;
    updatePlan: (plan: 'free' | 'pro' | 'team') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = '/api';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
    const [branding, setBranding] = useState<Branding | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const applyBranding = (data: Branding) => {
        if (data.primary_color) {
            document.documentElement.style.setProperty('--primary', data.primary_color);
            document.documentElement.style.setProperty('--ring', data.primary_color);
            document.documentElement.style.setProperty('--accent', data.primary_color);
        }
    };

    const refreshBranding = async () => {
        if (!token || !user?.organization_id) {
            setBranding(null);
            return;
        }
        try {
            const res = await fetch('/api/org/branding', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBranding(data);
                applyBranding(data);
            }
        } catch (error) {
            console.error('Failed to fetch branding:', error);
        }
    };

    const updateProfile = async (updates: Partial<User>) => {
        if (!token || !user) return;
        try {
            const res = await fetch('/api/auth/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const newUser = { ...user, ...updates };
                setUser(newUser);
                localStorage.setItem('auth_user', JSON.stringify(newUser));
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    const updatePlan = async (plan: 'free' | 'pro' | 'team') => {
        if (!token || !user) return;
        try {
            const res = await fetch('/api/auth/billing/plan', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan })
            });

            if (res.ok) {
                const newUser = { ...user, plan };
                setUser(newUser);
                localStorage.setItem('auth_user', JSON.stringify(newUser));
            }
        } catch (error) {
            console.error('Failed to update plan:', error);
        }
    };

    useEffect(() => {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, [token]);

    useEffect(() => {
        if (user?.organization_id && token) {
            refreshBranding();
        } else {
            setBranding(null);
            document.documentElement.style.removeProperty('--primary');
            document.documentElement.style.removeProperty('--ring');
            document.documentElement.style.removeProperty('--accent');
        }
    }, [user?.organization_id, token]);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setBranding(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        db.clearAll().catch(err => console.error('Failed to clear DB on logout:', err));
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            isAdmin: user?.role === 'admin',
            isOrgAdmin: user?.sub_role === 'org_admin' || user?.sub_role === 'manager',
            isLoading,
            branding,
            login,
            logout,
            refreshBranding,
            updateProfile,
            updatePlan
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

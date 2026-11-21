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

const DEFAULT_USER: User = {
    id: 'local_master_dev',
    email: 'dev@puredev.local',
    name: 'Pure Developer',
    role: 'admin',
    plan: 'pro',
    sub_role: 'org_admin',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User>(() => {
        try {
            const saved = localStorage.getItem('auth_user');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return DEFAULT_USER;
    });
    const [token, setToken] = useState<string>(() => localStorage.getItem('auth_token') || 'local_direct_token');
    const [branding, setBranding] = useState<Branding | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
        if (!user) return;
        const newUser = { ...user, ...updates };
        setUser(newUser);
        localStorage.setItem('auth_user', JSON.stringify(newUser));

        if (token && token !== 'local_direct_token') {
            try {
                await fetch('/api/auth/me', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updates)
                });
            } catch (error) {
                console.error('Failed to update profile on backend:', error);
            }
        }
    };

    const updatePlan = async (plan: 'free' | 'pro' | 'team') => {
        if (!user) return;
        const newUser = { ...user, plan };
        setUser(newUser);
        localStorage.setItem('auth_user', JSON.stringify(newUser));

        if (token && token !== 'local_direct_token') {
            try {
                await fetch('/api/auth/billing/plan', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ plan })
                });
            } catch (error) {
                console.error('Failed to update plan on backend:', error);
            }
        }
    };

    useEffect(() => {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {}
        }
        setIsLoading(false);
    }, [token]);

    useEffect(() => {
        if (user?.organization_id && token && token !== 'local_direct_token') {
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
        setUser(DEFAULT_USER);
        setToken('local_direct_token');
        setBranding(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: true,
            isAdmin: true,
            isOrgAdmin: true,
            isLoading: false,
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

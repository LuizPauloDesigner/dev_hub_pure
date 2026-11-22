import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/services/db';
import { getSupabaseClient, getSupabaseConfig, setSupabaseConfig, clearSupabaseConfig } from '@/services/supabaseClient';
import { cloudSync } from '@/services/cloudSync';
import { toast } from 'sonner';

export interface User {
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
    isCloudConnected: boolean;
    isAdmin: boolean;
    isOrgAdmin: boolean;
    isLoading: boolean;
    branding: Branding | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    signInWithSupabase: (email: string, password: string) => Promise<void>;
    signUpWithSupabase: (email: string, password: string, name?: string) => Promise<any>;
    signOut: () => Promise<void>;
    syncCloudNow: () => Promise<void>;
    saveSupabaseKeys: (url: string, key: string) => void;
    refreshBranding: () => Promise<void>;
    updateProfile: (updates: Partial<User>) => Promise<void>;
    updatePlan: (plan: 'free' | 'pro' | 'team') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEFAULT_USER: User = {
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
    const [isLoading, setIsLoading] = useState(true);
    const [isCloudConfigured, setIsCloudConfigured] = useState(getSupabaseConfig().isConfigured);

    const isCloudConnected = user.id !== DEFAULT_USER.id && isCloudConfigured;

    // Check Supabase session on startup
    useEffect(() => {
        const supabase = getSupabaseClient();
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                const supaUser: User = {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Dev',
                    role: 'admin',
                    plan: 'pro',
                };
                setUser(supaUser);
                setToken(session.access_token);
                localStorage.setItem('auth_user', JSON.stringify(supaUser));
                localStorage.setItem('auth_token', session.access_token);

                // Auto-sync from cloud on open
                cloudSync.download(session.user.id, true);
            }
            setIsLoading(false);
        }).catch(() => {
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const supaUser: User = {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Dev',
                    role: 'admin',
                    plan: 'pro',
                };
                setUser(supaUser);
                setToken(session.access_token);
                localStorage.setItem('auth_user', JSON.stringify(supaUser));
                localStorage.setItem('auth_token', session.access_token);
                await cloudSync.download(session.user.id, true);
            } else if (event === 'SIGNED_OUT') {
                setUser(DEFAULT_USER);
                setToken('local_direct_token');
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_token');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Realtime changes from other devices
    useEffect(() => {
        if (!isCloudConnected || user.id === DEFAULT_USER.id) return;
        const unsubscribe = cloudSync.subscribe(user.id, () => {
            // Updated from other device
        });
        return () => unsubscribe();
    }, [user?.id, isCloudConnected]);

    const saveSupabaseKeys = (url: string, key: string) => {
        setSupabaseConfig(url, key);
        setIsCloudConfigured(true);
        toast.success('Chaves do Supabase salvas com sucesso!');
    };

    const signInWithSupabase = async (email: string, password: string) => {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase não configurado. Por favor, informe a URL e a Anon Key.');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        if (data.user && data.session) {
            const supaUser: User = {
                id: data.user.id,
                email: data.user.email || '',
                name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Dev',
                role: 'admin',
                plan: 'pro',
            };
            login(data.session.access_token, supaUser);
            toast.success('Login realizado com sucesso! Sincronizando com a nuvem...');
            await cloudSync.download(data.user.id, false);
        }
    };

    const signUpWithSupabase = async (email: string, password: string, name?: string) => {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase não configurado. Por favor, informe a URL e a Anon Key.');
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name || email.split('@')[0],
                },
            },
        });

        if (error) throw error;

        if (data.session && data.user) {
            const supaUser: User = {
                id: data.user.id,
                email: data.user.email || '',
                name: name || data.user.email?.split('@')[0] || 'Dev',
                role: 'admin',
                plan: 'pro',
            };
            login(data.session.access_token, supaUser);
            toast.success('Conta criada com sucesso! Enviando dados iniciais para a nuvem...');
            await cloudSync.upload(data.user.id, true);
        } else if (data.user && !data.session) {
            toast.info('Cadastro realizado! Se a confirmação de e-mail estiver ativa no Supabase, verifique sua caixa de entrada.');
        }

        return data;
    };

    const signOut = async () => {
        const supabase = getSupabaseClient();
        if (supabase) {
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.error(e);
            }
        }
        logout();
        toast.info('Você saiu da sua conta. Retornando ao Modo Local.');
    };

    const syncCloudNow = async () => {
        if (!isCloudConnected || user.id === DEFAULT_USER.id) {
            toast.info('Faça login com sua conta para sincronizar na nuvem.');
            return;
        }
        await cloudSync.upload(user.id, false);
    };

    const updateProfile = async (updates: Partial<User>) => {
        if (!user) return;
        const newUser = { ...user, ...updates };
        setUser(newUser);
        localStorage.setItem('auth_user', JSON.stringify(newUser));

        if (isCloudConnected) {
            await cloudSync.upload(user.id, true);
        }
    };

    const updatePlan = async (plan: 'free' | 'pro' | 'team') => {
        if (!user) return;
        const newUser = { ...user, plan };
        setUser(newUser);
        localStorage.setItem('auth_user', JSON.stringify(newUser));

        if (isCloudConnected) {
            await cloudSync.upload(user.id, true);
        }
    };

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

    const refreshBranding = async () => {
        // Optional
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: true,
            isCloudConnected,
            isAdmin: true,
            isOrgAdmin: true,
            isLoading,
            branding,
            login,
            logout,
            signInWithSupabase,
            signUpWithSupabase,
            signOut,
            syncCloudNow,
            saveSupabaseKeys,
            refreshBranding,
            updateProfile,
            updatePlan,
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

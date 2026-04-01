import React, { useEffect, useState } from 'react';
import { Megaphone, AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/button';

export const SystemBanner = () => {
    const [status, setStatus] = useState<{ maintenance: boolean, broadcast: string | null } | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/auth/status');
                if (res.ok) {
                    const data = await res.json();
                    setStatus(data);
                }
            } catch (e) {
                console.error('Failed to fetch system status');
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    if (!status || !isVisible) return null;

    if (status.maintenance) {
        return (
            <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                MODO MANUTENÇÃO ATIVO: Sincronização em nuvem temporariamente pausada para melhorias.
            </div>
        );
    }

    if (status.broadcast) {
        return (
            <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 relative border-b border-primary-foreground/10">
                <Megaphone className="w-4 h-4" />
                <span>{status.broadcast}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 absolute right-2 hover:bg-black/10 text-primary-foreground"
                    onClick={() => setIsVisible(false)}
                >
                    <X className="w-3 h-3" />
                </Button>
            </div>
        );
    }

    return null;
};

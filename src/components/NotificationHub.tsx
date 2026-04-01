import React from 'react';
import { useApp } from '@/contexts/AppContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
    Bell,
    BellOff,
    Info,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Trophy,
    Trash2,
    Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationHub = () => {
    const { state, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } = useApp();
    const notifications = state.notifications || [];
    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'achievement': return <Trophy className="h-4 w-4 text-primary" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative group">
                    <Bell className={cn(
                        "h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary",
                        unreadCount > 0 && "animate-tada"
                    )} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-primary text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center border-2 border-background">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden border-primary/20 bg-card/95 backdrop-blur shadow-2xl">
                <div className="p-4 flex items-center justify-between bg-primary/5">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <DropdownMenuLabel className="p-0 font-bold">Notificações</DropdownMenuLabel>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] hover:text-primary px-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                markAllNotificationsAsRead();
                            }}
                        >
                            Marcar lidas
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator className="m-0" />

                <ScrollArea className="h-[400px]">
                    {notifications.length > 0 ? (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-4 border-b last:border-0 hover:bg-muted/50 transition-colors relative group",
                                        !n.read && "bg-primary/5"
                                    )}
                                    onClick={() => !n.read && markNotificationAsRead(n.id)}
                                >
                                    {!n.read && (
                                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                                    )}
                                    <div className="flex gap-3">
                                        <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm font-semibold leading-none",
                                                    !n.read ? "text-primary" : "text-foreground"
                                                )}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                {n.message}
                                            </p>
                                            <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!n.read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-primary hover:bg-primary/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markNotificationAsRead(n.id);
                                                        }}
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(n.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[300px] flex flex-col items-center justify-center p-8 text-center bg-card">
                            <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                <BellOff className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                            <h3 className="font-semibold text-sm">Sem notificações</h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">
                                Tudo limpo por aqui! Avisaremos quando algo importante acontecer.
                            </p>
                        </div>
                    )}
                </ScrollArea>

                <DropdownMenuSeparator className="m-0" />
                <div className="p-2 bg-muted/10">
                    <Button variant="ghost" size="sm" className="w-full text-[10px] h-8 hover:text-primary">
                        Configurações de Notificação
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

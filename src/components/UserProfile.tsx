import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Shield, UserCircle, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const UserProfile = () => {
    const { user, updateProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        avatar_url: user?.avatar_url || '',
        bio: user?.bio || '',
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateProfile(formData);
            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
            toast.error('Erro ao atualizar perfil.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={formData.avatar_url || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                                {user?.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">{user?.name || 'Seu Perfil'}</CardTitle>
                            <CardDescription>{user?.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    placeholder="Como você deseja ser chamado?"
                                    className="pl-9"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="avatar">URL do Avatar</Label>
                            <div className="relative">
                                <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="avatar"
                                    placeholder="https://exemplo.com/foto.jpg"
                                    className="pl-9"
                                    value={formData.avatar_url}
                                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                placeholder="Conte um pouco sobre você..."
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border text-sm">
                            <Shield className="h-4 w-4 text-primary" />
                            <span>
                                Nível de Acesso: <span className="font-semibold capitalize">{user?.role}</span>
                                {user?.sub_role && <span className="ml-1">({user.sub_role})</span>}
                            </span>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <Button
                        onClick={handleSave}
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="text-destructive">Segurança</CardTitle>
                    <CardDescription>
                        Gerencie sua senha e acessos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start text-destructive">
                        Alterar Senha
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Nota: A alteração de senha exigirá um novo login em todos os dispositivos.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

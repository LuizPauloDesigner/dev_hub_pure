import React, { useState, useMemo } from 'react';
import { useApp, Asset } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    File,
    Image as ImageIcon,
    FileText,
    MoreVertical,
    Download,
    Trash2,
    Search,
    Upload,
    Folder,
    Grid,
    List,
    Clock,
    HardDrive,
    Shield,
    X,
    FolderPlus,
    Filter,
    ArrowUpRight,
    ExternalLink,
    Files
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const AssetManager = () => {
    const { state, addAsset, deleteAsset } = useApp();
    const assets = state.assets || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'image' | 'document' | 'other'>('all');
    const [isUploading, setIsUploading] = useState(false);

    const filteredAssets = useMemo(() => {
        return assets.filter(a => {
            const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [assets, searchQuery, categoryFilter]);

    const stats = useMemo(() => {
        const totalSize = assets.reduce((acc, a) => acc + a.size, 0);
        const images = assets.filter(a => a.category === 'image').length;
        const docs = assets.filter(a => a.category === 'document').length;
        return { totalSize, images, docs, total: assets.length };
    }, [assets]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        // Simular upload "Premium"
        setTimeout(() => {
            const category: 'image' | 'document' | 'other' =
                file.type.startsWith('image/') ? 'image' :
                    file.type.includes('pdf') || file.type.includes('word') || file.type.includes('text') ? 'document' : 'other';

            addAsset({
                name: file.name,
                type: file.type,
                size: file.size,
                url: URL.createObjectURL(file), // Local URL
                category,
                blob: file
            });

            setIsUploading(false);
            toast.success(`${file.name} adicionado ao repositório!`);
        }, 1500);
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
            deleteAsset(id);
            toast.info('Arquivo removido permanentemente.');
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
                        <HardDrive className="h-4 w-4" />
                        Storage & Assets
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">Gerenciador de Arquivos</h1>
                    <p className="text-muted-foreground">Centralize imagens, documentos e especificações técnicas da sua equipe.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        <Button className="font-bold gap-2 relative bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 px-6">
                            {isUploading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            {isUploading ? 'Enviando...' : 'Upload de Arquivo'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Stats & Categories */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1 border-primary/5 bg-card/50 backdrop-blur">
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground py-0">Capacidade</CardTitle>
                        <HardDrive className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-black">{formatSize(stats.totalSize)}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Total de {stats.total} arquivos</p>
                    </CardContent>
                </Card>

                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button
                        variant={categoryFilter === 'image' ? 'default' : 'outline'}
                        className={cn("h-full py-6 flex-col gap-2 rounded-2xl border-primary/5", categoryFilter === 'image' && "bg-primary")}
                        onClick={() => setCategoryFilter(categoryFilter === 'image' ? 'all' : 'image')}
                    >
                        <ImageIcon className="h-6 w-6" />
                        <span className="font-bold">Imagens ({stats.images})</span>
                    </Button>
                    <Button
                        variant={categoryFilter === 'document' ? 'default' : 'outline'}
                        className={cn("h-full py-6 flex-col gap-2 rounded-2xl border-primary/5", categoryFilter === 'document' && "bg-primary")}
                        onClick={() => setCategoryFilter(categoryFilter === 'document' ? 'all' : 'document')}
                    >
                        <FileText className="h-6 w-6" />
                        <span className="font-bold">Documentos ({stats.docs})</span>
                    </Button>
                    <Button
                        variant={categoryFilter === 'other' ? 'default' : 'outline'}
                        className={cn("h-full py-6 flex-col gap-2 rounded-2xl border-primary/5", categoryFilter === 'other' && "bg-primary")}
                        onClick={() => setCategoryFilter(categoryFilter === 'other' ? 'all' : 'other')}
                    >
                        <Files className="h-6 w-6" />
                        <span className="font-bold">Diversos ({stats.total - stats.images - stats.docs})</span>
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/30 p-4 rounded-3xl border border-primary/5">
                <div className="relative w-full sm:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Pesquisar arquivos..."
                        className="pl-10 bg-card/50 border-primary/10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-xl px-4"
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-xl px-4"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Assets Display */}
            <ScrollArea className="h-[600px]">
                {filteredAssets.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredAssets.map(asset => (
                                <Card key={asset.id} className="group relative border-primary/5 bg-card/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                                    <div className="aspect-video bg-muted/30 flex items-center justify-center relative overflow-hidden">
                                        {asset.category === 'image' ? (
                                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-6 transition-transform">
                                                    {asset.category === 'document' ? <FileText className="h-8 w-8" /> : <File className="h-8 w-8" />}
                                                </div>
                                                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">{asset.type.split('/')[1] || 'FILE'}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-xl shadow-xl">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                                                    <DropdownMenuItem className="gap-2 focus:bg-primary focus:text-primary-foreground py-2.5">
                                                        <Download className="h-4 w-4" /> Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 py-2.5">
                                                        <ExternalLink className="h-4 w-4" /> Abrir Original
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="gap-2 text-destructive focus:bg-destructive focus:text-destructive-foreground py-2.5" onClick={() => handleDelete(asset.id, asset.name)}>
                                                        <Trash2 className="h-4 w-4" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <CardHeader className="p-4 space-y-1">
                                        <CardTitle className="text-sm font-bold truncate pr-6">{asset.name}</CardTitle>
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                            <span>{formatSize(asset.size)}</span>
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(asset.createdAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredAssets.map(asset => (
                                <div key={asset.id} className="group flex items-center justify-between p-4 bg-card/50 border border-primary/5 rounded-2xl hover:bg-primary/[0.02] transition-colors">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center",
                                            asset.category === 'image' ? "bg-purple-500/10 text-purple-500" :
                                                asset.category === 'document' ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"
                                        )}>
                                            {asset.category === 'image' ? <ImageIcon className="h-5 w-5" /> :
                                                asset.category === 'document' ? <FileText className="h-5 w-5" /> : <File className="h-5 w-5" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{asset.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{asset.type} • {formatSize(asset.size)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:flex flex-col items-end opacity-60">
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Adicionado em</span>
                                            <span className="text-xs">{new Date(asset.createdAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:text-primary">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(asset.id, asset.name)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-card/30 rounded-3xl border border-dashed border-primary/10">
                        <Folder className="h-16 w-16 text-muted-foreground/20 mb-4" />
                        <h3 className="text-xl font-bold">Nenhum arquivo encontrado</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                            Seu repositório está vazio ou sua busca não retornou resultados. Faça um upload para começar.
                        </p>
                        <Button variant="link" className="mt-4 text-primary font-bold gap-2">
                            Explorar Projetos <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </ScrollArea>

            {/* Storage Info Banner */}
            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                        <Shield className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-bold">Armazenamento Local Criptografado</h4>
                        <p className="text-xs text-muted-foreground">Seus arquivos permanecem no seu navegador e não são enviados para servidores externos.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-9 px-4 font-bold border-primary/20">Limite: 500MB</Badge>
                    <Button variant="outline" size="sm" className="font-bold border-primary/20 bg-card hover:bg-primary hover:text-primary-foreground transition-all">Aumentar Limite</Button>
                </div>
            </div>
        </div>
    );
};

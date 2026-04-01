import { Video, Plus, Trash2, Upload, Folder, Play } from 'lucide-react';
import { Button } from './ui/button';
import { useVideoLibrary, VideoItem } from '@/hooks/useVideoLibrary';
import { useState, useRef } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

export const VideoPlayer = () => {
  const {
    playlists,
    isLoading,
    isConnected,
    addVideosToPlaylist,
    createPlaylist,
    removeVideo,
    removePlaylist,
    clearLibrary,
  } = useVideoLibrary();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      const id = createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreateDialogOpen(false);
      setSelectedPlaylist(id);
    }
  };

  const handleAddVideos = (playlistId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      addVideosToPlaylist(playlistId, files);
    }
  };

  const handlePlayVideo = (video: VideoItem) => {
    setActiveVideo(video);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Video className="h-16 w-16 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Processando vídeos...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center max-w-2xl px-4">
          <Video className="h-24 w-24 text-muted-foreground/20 mb-6 mx-auto" />
          <h2 className="text-2xl font-bold mb-3">Biblioteca de Vídeos</h2>
          <p className="text-muted-foreground mb-2 max-w-md mx-auto">
            Organize seus vídeos em playlists personalizadas.
          </p>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Suporta MP4, WebM, OGG, MKV, AVI e MOV.
          </p>
          <CreatePlaylistDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            name={newPlaylistName}
            onNameChange={setNewPlaylistName}
            onCreate={handleCreatePlaylist}
            buttonLabel="Criar Primeira Playlist"
            buttonSize="lg"
          />
        </div>
      </div>
    );
  }

  const currentPlaylist = selectedPlaylist
    ? playlists.find(p => p.id === selectedPlaylist)
    : playlists[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🎬 Biblioteca de Vídeos</h1>
        <div className="flex gap-2">
          <CreatePlaylistDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            name={newPlaylistName}
            onNameChange={setNewPlaylistName}
            onCreate={handleCreatePlaylist}
            buttonLabel="Nova Playlist"
            buttonSize="sm"
            variant="outline"
          />
          {playlists.length > 0 && (
            <Button onClick={clearLibrary} variant="outline" size="sm" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Limpar Tudo
            </Button>
          )}
        </div>
      </div>

      {/* Video Player Area */}
      {activeVideo && (
        <Card>
          <CardContent className="p-4">
            <video
              ref={videoRef}
              src={activeVideo.url}
              controls
              autoPlay
              className="w-full max-h-[60vh] rounded-lg bg-black"
            />
            <p className="mt-2 font-medium text-center">{activeVideo.title}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        {/* Sidebar com Playlists */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Playlists</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-1 p-4 pt-0">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => setSelectedPlaylist(playlist.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                      selectedPlaylist === playlist.id || (!selectedPlaylist && playlist === playlists[0])
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Folder className="h-4 w-4" />
                    <span className="flex-1 truncate">{playlist.name}</span>
                    <span className="text-xs opacity-70">{playlist.videos.length}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Video Grid */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{currentPlaylist?.name || 'Selecione uma Playlist'}</CardTitle>
              {currentPlaylist && (
                <div className="flex gap-2">
                  <Label htmlFor={`upload-video-${currentPlaylist.id}`} className="cursor-pointer">
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        Adicionar Vídeos
                      </span>
                    </Button>
                    <Input
                      id={`upload-video-${currentPlaylist.id}`}
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAddVideos(currentPlaylist.id, e)}
                    />
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePlaylist(currentPlaylist.id)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentPlaylist && currentPlaylist.videos.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentPlaylist.videos.map((video) => (
                    <div
                      key={video.id}
                      className="group relative rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer"
                      onClick={() => handlePlayVideo(video)}
                    >
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full aspect-video object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-video bg-muted flex items-center justify-center">
                          <Video className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-2 flex items-center justify-between">
                        <p className="text-sm font-medium truncate flex-1">{video.title}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeVideo(currentPlaylist.id, video.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Nenhum vídeo nesta playlist</p>
                {currentPlaylist && (
                  <Label htmlFor={`upload-video-${currentPlaylist.id}-empty`} className="cursor-pointer">
                    <Button variant="outline" size="sm" className="gap-2 mt-4" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        Adicionar Vídeos
                      </span>
                    </Button>
                    <Input
                      id={`upload-video-${currentPlaylist.id}-empty`}
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAddVideos(currentPlaylist.id, e)}
                    />
                  </Label>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <p className="text-muted-foreground text-center">
          Total: {playlists.reduce((acc, p) => acc + p.videos.length, 0)} vídeo
          {playlists.reduce((acc, p) => acc + p.videos.length, 0) !== 1 ? 's' : ''} em{' '}
          {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-muted-foreground/70 text-center mt-2">
          ⚠️ Os vídeos ficam armazenados apenas durante a sessão atual. Ao recarregar a página, será necessário adicioná-los novamente.
        </p>
      </div>
    </div>
  );
};

// Reusable dialog component
function CreatePlaylistDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  onCreate,
  buttonLabel,
  buttonSize = 'sm',
  variant = 'default',
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
  onNameChange: (v: string) => void;
  onCreate: () => void;
  buttonLabel: string;
  buttonSize?: 'sm' | 'lg';
  variant?: 'default' | 'outline';
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={buttonSize} className="gap-2">
          <Plus className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Playlist de Vídeos</DialogTitle>
          <DialogDescription>Escolha um nome para sua playlist</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="video-playlist-name">Nome da Playlist</Label>
            <Input
              id="video-playlist-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ex: Tutoriais, Cursos, Filmes..."
              onKeyDown={(e) => e.key === 'Enter' && onCreate()}
            />
          </div>
          <Button onClick={onCreate} className="w-full">
            Criar Playlist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

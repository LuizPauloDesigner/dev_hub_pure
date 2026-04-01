import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const Draft = () => {
  const { state, updateDraft } = useApp();
  const [content, setContent] = useState(state.draft);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateDraft(content);
    }, 1000);

    return () => clearTimeout(timer);
  }, [content]);

  const handleClear = () => {
    setContent('');
    updateDraft('');
    toast.success('Rascunho limpo');
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Rascunho Rápido</CardTitle>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Use este espaço para anotações rápidas, ideias, lembretes..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[500px] resize-none"
        />
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{wordCount} palavras</span>
          <span>{charCount} caracteres</span>
          <span className="ml-auto text-xs flex items-center gap-1">
            <Save className="h-3 w-3" />
            Auto-salvo
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

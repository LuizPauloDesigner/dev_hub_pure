import React, { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { EmotionType } from '@/contexts/AppContext';

const EMOTION_MAP: Record<EmotionType, { color: string; bg: string; icon: string }> = {
  'Incrível': { color: '#10b981', bg: 'bg-emerald-500', icon: '🤩' },
  'Feliz': { color: '#3b82f6', bg: 'bg-blue-500', icon: '🙂' },
  'Normal': { color: '#eab308', bg: 'bg-yellow-500', icon: '😐' },
  'Triste': { color: '#64748b', bg: 'bg-slate-500', icon: '😢' },
  'Estressado': { color: '#f97316', bg: 'bg-orange-500', icon: '😫' },
  'Cansado': { color: '#a855f7', bg: 'bg-purple-500', icon: '🥱' },
};

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const YearInPixels = () => {
  const { state: { moodPixels = [] }, addMoodPixel } = useApp();
  
  const currentYear = new Date().getFullYear();
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeDate, setActiveDate] = useState<{ y: number; m: number; d: number; } | null>(null);
  const [activeEmotion, setActiveEmotion] = useState<EmotionType | null>(null);
  const [activeNote, setActiveNote] = useState('');

  // 1. Prepare grid data [1..12][1..31]
  const pixelMap = useMemo(() => {
    const map = new Map<string, typeof moodPixels[0]>();
    moodPixels.forEach(p => map.set(p.date, p));
    return map;
  }, [moodPixels]);

  const handlePixelClick = (m: number, d: number) => {
    // Basic date validation
    const dateObj = new Date(currentYear, m - 1, d);
    if (dateObj.getMonth() !== m - 1) return; // invalid date (e.g. Feb 30)

    const dateStr = `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    // Check if future
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr > todayStr) {
      // Allow future booking? Usually moods are past/present. Let's allow but maybe show warning
    }

    const existing = pixelMap.get(dateStr);
    
    setActiveDate({ y: currentYear, m, d });
    setActiveEmotion(existing ? existing.emotion : null);
    setActiveNote(existing?.shortNote || '');
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!activeDate || !activeEmotion) return;
    const dateStr = `${activeDate.y}-${String(activeDate.m).padStart(2, '0')}-${String(activeDate.d).padStart(2, '0')}`;
    
    addMoodPixel({
      id: dateStr,
      date: dateStr,
      emotion: activeEmotion,
      colorCode: EMOTION_MAP[activeEmotion].color,
      shortNote: activeNote,
    });
    
    setIsDialogOpen(false);
  };

  const getDayStatus = (m: number, d: number) => {
    const dateObj = new Date(currentYear, m - 1, d);
    if (dateObj.getMonth() !== m - 1) return 'invalid';
    
    const dateStr = `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];
    
    const entry = pixelMap.get(dateStr);
    if (entry) return entry;
    if (dateStr > todayStr) return 'future';
    return 'empty';
  };

  // Render a specific pixel cell
  const renderPixel = (m: number, d: number) => {
    const status = getDayStatus(m, d);
    
    if (status === 'invalid') {
      return (
        <div key={`${m}-${d}`} className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded bg-transparent opacity-0 pointer-events-none" />
      );
    }
    
    let bgClass = "bg-muted hover:bg-muted-foreground/30";
    let titleStr = `${d} ${MONTHS[m-1]} ${currentYear} (Vazio)`;

    if (typeof status === 'object') {
      bgClass = EMOTION_MAP[status.emotion].bg + ' hover:opacity-80';
      titleStr = `${d} ${MONTHS[m-1]}: ${status.emotion} ${EMOTION_MAP[status.emotion].icon}\n${status.shortNote || ''}`;
    } else if (status === 'future') {
      bgClass = "bg-muted/30 cursor-not-allowed";
      titleStr = `${d} ${MONTHS[m-1]} (Futuro)`;
    }

    return (
      <div 
        key={`${m}-${d}`} 
        title={titleStr}
        onClick={() => status !== 'future' ? handlePixelClick(m, d) : undefined}
        className={cn(
          "w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded transition-all cursor-pointer border border-transparent hover:border-foreground/20",
          bgClass
        )}
      />
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meu Ano em Pixels</h2>
          <p className="text-muted-foreground mt-1">
            Qual a cor predominante de hoje? Construa a paleta de emoções do seu ano.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap text-sm">
          {Object.entries(EMOTION_MAP).map(([emo, info]) => (
            <div key={emo} className="flex items-center gap-1.5 px-2 py-1 bg-accent rounded-md">
              <div className={`w-3 h-3 rounded ${info.bg}`} />
              <span className="text-xs text-muted-foreground">{emo}</span>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex justify-between items-center">
            Grade de {currentYear}
          </CardTitle>
          <CardDescription>
            Tabela [Dia] x [Mês]. Clique em um quadradinho para preencher ou visualizar.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-6">
          <div className="min-w-max">
            {/* Header: Days 1-31 */}
            <div className="flex gap-1 mb-2">
              <div className="w-8 sm:w-10 text-xs font-medium text-muted-foreground flex items-center justify-end pr-2" />
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <div key={`d-${d}`} className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex items-center justify-center text-[10px] sm:text-xs font-semibold text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Matrix rows: Months */}
            {MONTHS.map((monthStr, mIdx) => {
              const m = mIdx + 1;
              return (
                <div key={monthStr} className="flex gap-1 mb-1">
                  <div className="w-8 sm:w-10 text-xs font-semibold text-muted-foreground flex items-center justify-end pr-2 uppercase">
                    {monthStr}
                  </div>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => renderPixel(m, d))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para registrar / editar pixel */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Como foi seu dia?
              {activeDate && (
                <span className="text-sm font-normal text-muted-foreground bg-accent px-2 py-1 rounded">
                  {activeDate.d} de {MONTHS[activeDate.m - 1]}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(EMOTION_MAP) as EmotionType[]).map(emo => {
                const info = EMOTION_MAP[emo];
                const isActive = activeEmotion === emo;
                return (
                  <button
                    key={emo}
                    onClick={() => setActiveEmotion(emo)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                      isActive 
                        ? `ring-2 ring-primary border-transparent ${info.bg} text-white shadow-md` 
                        : "hover:bg-accent border-border text-foreground hover:scale-105"
                    )}
                  >
                    <span className="text-2xl mb-1">{info.icon}</span>
                    <span className="text-xs font-medium">{emo}</span>
                  </button>
                )
              })}
            </div>

            <div className="space-y-2">
              <Label>Diário Rápido (Opcional)</Label>
              <Input 
                placeholder="Por que você se sentiu assim? Em 1 frase..."
                value={activeNote}
                onChange={e => setActiveNote(e.target.value)}
                maxLength={60}
              />
              <span className="text-[10px] text-muted-foreground block text-right">
                {activeNote.length}/60
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!activeEmotion}>
              Guardar na Paleta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, Target, Heart, Brain, HeartHandshake, BookOpen, TreePine, Briefcase, DollarSign, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { key: 'saudeFisica', label: 'Saúde Física', icon: Heart, color: '#ef4444' }, // Red
  { key: 'saudeMental', label: 'Saúde Mental', icon: Brain, color: '#a855f7' }, // Purple
  { key: 'carreira', label: 'Carreira', icon: Briefcase, color: '#3b82f6' }, // Blue
  { key: 'financas', label: 'Finanças', icon: DollarSign, color: '#22c55e' }, // Green
  { key: 'relacionamentos', label: 'Relacion.' , icon: HeartHandshake, color: '#f43f5e' }, // Rose
  { key: 'desenvolvimento', label: 'Desenvolvi.', icon: BookOpen, color: '#f59e0b' }, // Amber
  { key: 'lazer', label: 'Lazer & Hob.', icon: Target, color: '#06b6d4' }, // Teal
  { key: 'ambienteFisico', label: 'Ambiente Fis.', icon: TreePine, color: '#84cc16' }, // Emerald
];

export const WheelOfLife = () => {
  const { state: { wheelOfLife }, addWheelOfLifeAssessment, deleteWheelOfLifeAssessment } = useApp();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newScores, setNewScores] = useState<Record<string, number>>({
    saudeFisica: 5,
    saudeMental: 5,
    carreira: 5,
    financas: 5,
    relacionamentos: 5,
    desenvolvimento: 5,
    lazer: 5,
    ambienteFisico: 5,
  });
  const [notes, setNotes] = useState('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);

  // Sorting newest first
  const sortedAssessments = useMemo(() => {
    return [...(wheelOfLife || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [wheelOfLife]);

  const activeAssessment = useMemo(() => {
    if (!sortedAssessments.length) return null;
    if (selectedAssessmentId) {
      return sortedAssessments.find(a => a.id === selectedAssessmentId) || sortedAssessments[0];
    }
    return sortedAssessments[0];
  }, [sortedAssessments, selectedAssessmentId]);

  const chartData = useMemo(() => {
    if (!activeAssessment) return [];
    return CATEGORIES.map(cat => ({
      subject: cat.label,
      A: activeAssessment.scores[cat.key as keyof typeof activeAssessment.scores],
      fullMark: 10,
    }));
  }, [activeAssessment]);

  const generateAverage = (scores: Record<string, number>) => {
    const vals = Object.values(scores);
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  const handleSave = () => {
    addWheelOfLifeAssessment({
      date: new Date().toISOString(),
      scores: newScores as any,
      notes
    });
    toast.success('Avaliação salva com sucesso!');
    setIsDialogOpen(false);
    setNewScores({
      saudeFisica: 5, saudeMental: 5, carreira: 5, financas: 5,
      relacionamentos: 5, desenvolvimento: 5, lazer: 5, ambienteFisico: 5
    });
    setNotes('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roda da Vida</h2>
          <p className="text-muted-foreground mt-1">
            Avalie o seu nível de satisfação (1 a 10) nas áreas fundamentais e descubra o que precisa de equilíbrio.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Avaliação da Roda da Vida</DialogTitle>
              <DialogDescription>
                Seja brutalmente honsto. Qual é a sua nota atual para cada área hoje?
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <div key={cat.key} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: cat.color }} />
                        {cat.label}
                      </Label>
                      <span className="font-bold text-primary">{newScores[cat.key]}</span>
                    </div>
                    <Slider
                      defaultValue={[5]}
                      max={10}
                      min={1}
                      step={1}
                      value={[newScores[cat.key]]}
                      onValueChange={(vals) => setNewScores(prev => ({ ...prev, [cat.key]: vals[0] }))}
                      className="cursor-pointer"
                    />
                  </div>
                );
              })}
              
              <div className="md:col-span-2 space-y-2 mt-2">
                <Label>Anotações (Opcional)</Label>
                <Input 
                  placeholder="Ex: Minha saúde caiu pois parei a academia..." 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full">
                Salvar Avaliação 
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!activeAssessment ? (
        <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
          <Target className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-lg">Sua roda ainda não girou</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-2 mb-6">
            Adicione a sua primeira avaliação para gerar o seu radar de equilíbrio e entender onde focar.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">Começar Diagnóstico</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg">Equilíbrio Atual</CardTitle>
              <CardDescription>
                Reflexo do dia {new Date(activeAssessment.date).toLocaleDateString('pt-BR')} 
                (Média Global: <span className="font-bold text-primary">{generateAverage(activeAssessment.scores)}</span>)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                  <PolarGrid stroke="currentColor" className="opacity-20" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12, fillOpacity: 0.7 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: 'currentColor', fillOpacity: 0.5 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Radar
                    name="Sua Nota"
                    dataKey="A"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Diagnósticos</CardTitle>
                <CardDescription>Acompanhe sua evolução</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
                {sortedAssessments.map((assessment, idx) => {
                  const isActive = activeAssessment.id === assessment.id;
                  const avg = generateAverage(assessment.scores);
                  return (
                    <div 
                      key={assessment.id}
                      onClick={() => setSelectedAssessmentId(assessment.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${
                        isActive ? 'bg-primary/10 border-primary shadow-sm' : 'hover:bg-accent/50 hover:border-border'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                          {new Date(assessment.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs text-muted-foreground">Média: {avg}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100" 
                          onClick={(e) => { e.stopPropagation(); deleteWheelOfLifeAssessment(assessment.id); }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                        <div className={`w-2 h-2 rounded-full ml-2 ${isActive ? 'bg-primary' : 'bg-transparent'}`} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {activeAssessment.notes && (
              <Card className="bg-muted/30 border-dashed">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Reflexão do Ciclo</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 text-sm text-muted-foreground italic">
                  "{activeAssessment.notes}"
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

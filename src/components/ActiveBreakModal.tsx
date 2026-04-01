import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Timer, Coffee, Eye, Droplet, Dumbbell, Wind, AlertCircle, Check } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface ActiveBreakModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  duration: number;
  breakType: 'short' | 'long';
}

const EXERCISE_SUGGESTIONS = [
  {
    icon: Coffee,
    title: 'Alongue o pescoço e os ombros',
    description: 'Faça movimentos circulares suaves por 30 segundos',
  },
  {
    icon: Droplet,
    title: 'Beba um copo d\'água',
    description: 'Mantenha-se hidratado para melhor concentração',
  },
  {
    icon: Eye,
    title: 'Descanse os olhos',
    description: 'Olhe para algo distante por 20 segundos (regra 20-20-20)',
  },
  {
    icon: Dumbbell,
    title: 'Levante e estique as pernas',
    description: 'Faça alguns passos ou agachamentos leves',
  },
  {
    icon: Wind,
    title: 'Respire profundamente',
    description: '5 respirações profundas pelo nariz e solte pela boca',
  },
];

export const ActiveBreakModal = ({
  isOpen,
  onComplete,
  onSkip,
  duration,
  breakType
}: ActiveBreakModalProps) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  // Memoriza 3 sugestões aleatórias que só mudam quando o modal abre
  const randomExercises = useMemo(() => {
    return EXERCISE_SUGGESTIONS
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(duration * 60);
    }
  }, [isOpen, duration]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} modal>
      <DialogContent
        className="max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2 text-primary">
            <AlertCircle className="h-6 w-6" />
            PAUSA ATIVA OBRIGATÓRIA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Timer className="h-5 w-5" />
              <span className="text-lg font-semibold">
                Pausa {breakType === 'short' ? 'Curta' : 'Longa'} - {duration} minutos
              </span>
            </div>

            <div className="text-5xl font-bold text-primary">
              {formatTime(timeLeft)}
            </div>

            <p className="text-lg text-muted-foreground">
              Cuide do seu corpo e da sua mente. Mova-se um pouco!
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg mb-4">Sugestões de Atividades:</h3>

            <div className="space-y-3">
              {randomExercises.map((exercise, index) => {
                const Icon = exercise.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-md bg-card border">
                    <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{exercise.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {exercise.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={onComplete}
              size="lg"
              className="w-full text-lg h-12"
            >
              <Check className="h-5 w-5 mr-2" />
              Pausa Concluída (+15 Pontos)
            </Button>

            <Button
              onClick={onSkip}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Pular Pausa (-5 Pontos)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, Coffee } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { ActiveBreakModal } from './ActiveBreakModal';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export const PomodoroTimer = () => {
  const { updatePomodoroStats, state, addWellnessBreak, addGamificationPoints, unlockBadge, addNotification } = useApp();
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(state.gamificationStats.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [pendingBreakType, setPendingBreakType] = useState<'short' | 'long'>('short');
  const intervalRef = useRef<NodeJS.Timeout>();
  const timerChannel = useRef<BroadcastChannel>();

  // ── Sync between Tabs ──────────────────────────────────────────────────
  useEffect(() => {
    timerChannel.current = new BroadcastChannel('devcenter-timer');

    timerChannel.current.onmessage = (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'toggle':
          setIsRunning(payload.isRunning);
          if (payload.timeLeft !== undefined) setTimeLeft(payload.timeLeft);
          break;
        case 'reset':
          setIsRunning(false);
          setTimeLeft(payload.timeLeft);
          break;
        case 'tick':
          // Only sync tick if the difference is significant (>2s) to avoid loop jitter
          if (Math.abs(timeLeft - payload.timeLeft) > 2) {
            setTimeLeft(payload.timeLeft);
          }
          break;
      }
    };

    return () => timerChannel.current?.close();
  }, [timeLeft]);

  const broadcastTimer = (type: string, payload: any) => {
    timerChannel.current?.postMessage({ type, payload });
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendPushNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    }
  };

  const TIMER_DURATIONS = {
    focus: state.gamificationStats.focusDuration * 60,
    shortBreak: state.gamificationStats.shortBreakDuration * 60,
    longBreak: state.gamificationStats.longBreakDuration * 60,
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return TIMER_DURATIONS[mode];
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  // Atualizar duração quando as configurações mudarem
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(TIMER_DURATIONS[mode]);
    }
  }, [state.gamificationStats.focusDuration, state.gamificationStats.shortBreakDuration, state.gamificationStats.longBreakDuration]);

  const checkBadges = () => {
    const focusSessions = state.pomodoroStats.focusSessions + 1;
    const completedBreaks = state.wellnessStats.breaks.filter(b => b.adesaoStatus === 'Concluida').length;

    // Verificar badges de foco
    if (focusSessions === 10 && !state.gamificationStats.badges.some(b => b.id === 'foco10')) {
      unlockBadge('foco10');
      toast.success('Badge desbloqueado: Focado!');
    } else if (focusSessions === 25 && !state.gamificationStats.badges.some(b => b.id === 'foco25')) {
      unlockBadge('foco25');
      toast.success('Badge desbloqueado: Concentrado!');
    } else if (focusSessions === 50 && !state.gamificationStats.badges.some(b => b.id === 'foco50')) {
      unlockBadge('foco50');
      toast.success('Badge desbloqueado: Mestre do Foco!');
    }

    // Verificar badges de pausas
    if (completedBreaks === 10 && !state.gamificationStats.badges.some(b => b.id === 'pausa10')) {
      unlockBadge('pausa10');
      toast.success('Badge desbloqueado: Cuidadoso!');
    } else if (completedBreaks === 25 && !state.gamificationStats.badges.some(b => b.id === 'pausa25')) {
      unlockBadge('pausa25');
      toast.success('Badge desbloqueado: Bem-Estar!');
    }

    // Verificar badge de nível
    const nivel = state.gamificationStats.nivel;
    if (nivel >= 5 && !state.gamificationStats.badges.some(b => b.id === 'nivel5')) {
      unlockBadge('nivel5');
      toast.success('Badge desbloqueado: Evoluído!');
    }
  };

  // Acessar player de música do contexto (se disponível)
  const musicPlayerContext = (window as any).musicPlayerContext;

  const handleTimerComplete = () => {
    setIsRunning(false);

    if (mode === 'focus') {
      const newFocusSessions = state.pomodoroStats.focusSessions + 1;
      updatePomodoroStats({
        focusSessions: newFocusSessions,
        totalMinutes: state.pomodoroStats.totalMinutes + state.gamificationStats.focusDuration,
      });

      // Adicionar pontos por completar foco
      addGamificationPoints(10, 'foco', 'Completou um ciclo de foco');
      toast.success('Sessão de foco concluída! +10 XP');
      sendPushNotification('Foco Concluído!', 'Hora de uma pausa ativa. Bom trabalho!');

      addNotification({
        title: 'Foco Concluído!',
        message: 'Excelente trabalho! Sua sessão de foco foi finalizada com sucesso. Ganhou +10 XP.',
        type: 'success'
      });

      // Verificar badges
      checkBadges();

      // Pausar música ao abrir modal de pausa
      if (musicPlayerContext?.pause) {
        musicPlayerContext.pause();
      }

      // Disparar modal de Pausa Ativa
      const breakType = newFocusSessions % 4 === 0 ? 'long' : 'short';
      setPendingBreakType(breakType);
      setShowBreakModal(true);

      // Mudar para modo pausa para ocultar o timer da navbar
      setMode(breakType === 'short' ? 'shortBreak' : 'longBreak');
    } else {
      toast.info('Pausa concluída!');
      sendPushNotification('Pausa Concluída!', 'Pronto para voltar ao trabalho?');

      addNotification({
        title: 'Pausa Concluída!',
        message: 'Você está renovado agora? Vamos voltar ao trabalho!',
        type: 'info'
      });

      changeMode('focus');
    }

    // Play notification sound
    new Audio('/notification.mp3').play().catch(() => { });
  };

  const handleBreakComplete = () => {
    const breakDuration = pendingBreakType === 'short'
      ? state.gamificationStats.shortBreakDuration
      : state.gamificationStats.longBreakDuration;

    addWellnessBreak({
      dataHora: new Date().toISOString(),
      tipoCiclo: pendingBreakType,
      adesaoStatus: 'Concluida',
      duracaoPausa: breakDuration,
    });

    // Adicionar pontos por completar pausa
    addGamificationPoints(15, 'pausa_ativa', 'Completou uma pausa ativa');

    setShowBreakModal(false);
    changeMode('focus');
    toast.success('Pausa ativa concluída! +15 XP');

    // Verificar badges após pausa
    checkBadges();
  };

  const handleBreakSkip = () => {
    const breakDuration = pendingBreakType === 'short'
      ? state.gamificationStats.shortBreakDuration
      : state.gamificationStats.longBreakDuration;

    addWellnessBreak({
      dataHora: new Date().toISOString(),
      tipoCiclo: pendingBreakType,
      adesaoStatus: 'Pulada',
      duracaoPausa: breakDuration,
    });

    // Penalidade por pular pausa
    addGamificationPoints(-5, 'pausa_pulada', 'Pulou uma pausa ativa');

    setShowBreakModal(false);
    changeMode('focus');
    toast.warning('Pausa ignorada. -5 XP. Lembre-se de cuidar da sua saúde!');

    addNotification({
      title: 'Pausa Pulada',
      message: 'Você decidiu pular sua pausa. Cuidado com o burnout! -5 XP.',
      type: 'warning'
    });
  };

  const toggleTimer = () => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);
    broadcastTimer('toggle', { isRunning: newIsRunning, timeLeft });

    // Integração com player de música: tocar ao iniciar foco, pausar ao parar
    const musicPlayerContext = (window as any).musicPlayerContext;
    if (mode === 'focus' && musicPlayerContext) {
      if (newIsRunning && musicPlayerContext.play) {
        musicPlayerContext.play();
      } else if (!newIsRunning && musicPlayerContext.pause) {
        musicPlayerContext.pause();
      }
    }
  };

  const resetTimer = () => {
    const duration = TIMER_DURATIONS[mode];
    setIsRunning(false);
    setTimeLeft(duration);
    broadcastTimer('reset', { timeLeft: duration });
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_DURATIONS[newMode]);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {mode === 'focus' && (
        <div className="flex items-center gap-1 sm:gap-2 rounded-lg border bg-card p-1 sm:p-2">
          <Timer className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm font-medium min-w-[4rem]">
            {formatTime(timeLeft)}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleTimer}
            >
              {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={resetTimer}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <ActiveBreakModal
        isOpen={showBreakModal}
        onComplete={handleBreakComplete}
        onSkip={handleBreakSkip}
        duration={pendingBreakType === 'short' ? state.gamificationStats.shortBreakDuration : state.gamificationStats.longBreakDuration}
        breakType={pendingBreakType}
      />
    </>
  );
};

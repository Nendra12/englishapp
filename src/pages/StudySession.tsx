import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SentenceBuilder } from '@/components/study/SentenceBuilder';
import { VerbDrill } from '@/components/study/VerbDrill';
import { GrammarQuiz } from '@/components/study/GrammarQuiz';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { 
  PenLine, 
  Languages, 
  BookA, 
  Trophy, 
  Clock, 
  Target,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

type Module = 'sentence' | 'verb' | 'grammar';
type SessionState = 'select' | 'study' | 'summary';

interface ModuleResult {
  correct: number;
  wrong: number;
}

const StudySession: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [sessionState, setSessionState] = useState<SessionState>('select');
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [results, setResults] = useState<Record<Module, ModuleResult | null>>({
    sentence: null,
    verb: null,
    grammar: null,
  });
  const [completedModules, setCompletedModules] = useState<Set<Module>>(new Set());
  const [sessionSaved, setSessionSaved] = useState(false);

  // Load today's progress
  useEffect(() => {
    const loadTodayProgress = async () => {
      if (!user) return;
      
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_iso', today)
        .single();
      
      if (data) {
        const completed = new Set<Module>();
        if (data.sentence_done) completed.add('sentence');
        if (data.verb_done) completed.add('verb');
        if (data.grammar_done) completed.add('grammar');
        setCompletedModules(completed);
      }
    };
    
    loadTodayProgress();
  }, [user]);

  const startModule = (module: Module) => {
    setCurrentModule(module);
    setSessionState('study');
    setStartTime(new Date());
  };

  const handleModuleComplete = useCallback(async (correct: number, wrong: number) => {
    if (!currentModule || !user || !startTime) return;
    
    const endTime = new Date();
    const minutesSpent = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
    const accuracy = correct + wrong > 0 ? (correct / (correct + wrong)) * 100 : 0;
    
    // Update results
    setResults(prev => ({
      ...prev,
      [currentModule]: { correct, wrong },
    }));
    setCompletedModules(prev => new Set([...prev, currentModule]));
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Check for existing session today
      const { data: existingSession } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_iso', today)
        .single();
      
      const moduleField = `${currentModule}_done` as 'sentence_done' | 'verb_done' | 'grammar_done';
      
      if (existingSession) {
        // Update existing session
        const newCorrect = existingSession.correct + correct;
        const newWrong = existingSession.wrong + wrong;
        const newMinutes = existingSession.minutes_spent + minutesSpent;
        const newAccuracy = newCorrect + newWrong > 0 ? (newCorrect / (newCorrect + newWrong)) * 100 : 0;
        
        await supabase
          .from('study_sessions')
          .update({
            correct: newCorrect,
            wrong: newWrong,
            minutes_spent: newMinutes,
            accuracy: newAccuracy,
            [moduleField]: true,
          })
          .eq('id', existingSession.id);
      } else {
        // Create new session
        await supabase
          .from('study_sessions')
          .insert({
            user_id: user.id,
            date_iso: today,
            correct,
            wrong,
            minutes_spent: minutesSpent,
            accuracy,
            [moduleField]: true,
          });
      }

      // Update daily log
      const { data: existingLog } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_iso', today)
        .single();
      
      if (existingLog) {
        await supabase
          .from('daily_logs')
          .update({
            minutes_spent: (existingLog.minutes_spent || 0) + minutesSpent,
            accuracy: accuracy,
            did_study: true,
          })
          .eq('id', existingLog.id);
      } else {
        // Calculate streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const { data: yesterdayLog } = await supabase
          .from('daily_logs')
          .select('streak_value')
          .eq('user_id', user.id)
          .eq('date_iso', yesterdayStr)
          .single();
        
        const newStreak = yesterdayLog?.streak_value ? yesterdayLog.streak_value + 1 : 1;
        
        await supabase
          .from('daily_logs')
          .insert({
            user_id: user.id,
            date_iso: today,
            minutes_spent: minutesSpent,
            accuracy,
            did_study: true,
            streak_value: newStreak,
          });

        // Update profile streak
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_streak, best_streak')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          const newBestStreak = Math.max(profile.best_streak || 0, newStreak);
          await supabase
            .from('profiles')
            .update({
              current_streak: newStreak,
              best_streak: newBestStreak,
            })
            .eq('user_id', user.id);
        }
      }

      // Check achievements
      await checkAchievements(correct, wrong, accuracy);
      
      toast.success('Modul selesai! 🎉');
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Gagal menyimpan progress');
    }
    
    setSessionState('summary');
    await refreshProfile();
  }, [currentModule, user, startTime, refreshProfile]);

  const checkAchievements = async (correct: number, wrong: number, accuracy: number) => {
    if (!user) return;
    
    try {
      // Get all achievements
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*');
      
      if (!achievements) return;
      
      // Get user's achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);
      
      const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      
      // Check each achievement
      for (const achievement of achievements) {
        if (unlockedIds.has(achievement.id)) continue;
        
        let shouldUnlock = false;
        
        switch (achievement.code) {
          case 'FIRST_SESSION': {
            const { count } = await supabase
              .from('study_sessions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);
            shouldUnlock = (count || 0) >= 1;
            break;
          }
          case 'ACCURACY_80':
            shouldUnlock = accuracy >= 80 && (correct + wrong) >= 10;
            break;
          case 'STREAK_3': {
            const { data: profile } = await supabase
              .from('profiles')
              .select('current_streak')
              .eq('user_id', user.id)
              .single();
            shouldUnlock = (profile?.current_streak || 0) >= 3;
            break;
          }
          case 'STREAK_7': {
            const { data: profile } = await supabase
              .from('profiles')
              .select('current_streak')
              .eq('user_id', user.id)
              .single();
            shouldUnlock = (profile?.current_streak || 0) >= 7;
            break;
          }
          case 'VOCAB_20': {
            const { count } = await supabase
              .from('vocabulary')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);
            shouldUnlock = (count || 0) >= 20;
            break;
          }
          case 'VOCAB_50': {
            const { count } = await supabase
              .from('vocabulary')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);
            shouldUnlock = (count || 0) >= 50;
            break;
          }
          case 'SENTENCE_MASTER': {
            const { count } = await supabase
              .from('study_sessions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('sentence_done', true);
            shouldUnlock = (count || 0) >= 10;
            break;
          }
          case 'VERB_EXPERT': {
            const { count } = await supabase
              .from('study_sessions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('verb_done', true);
            shouldUnlock = (count || 0) >= 10;
            break;
          }
          case 'GRAMMAR_PRO': {
            const { count } = await supabase
              .from('study_sessions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('grammar_done', true);
            shouldUnlock = (count || 0) >= 10;
            break;
          }
        }
        
        if (shouldUnlock) {
          await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
            });
          toast.success(`🏆 Achievement unlocked: ${achievement.title}!`);
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const modules = [
    { 
      id: 'sentence' as Module, 
      icon: PenLine, 
      title: 'Sentence Builder', 
      desc: 'Susun kalimat dengan pola S + V + O',
      color: 'bg-primary/10 text-primary border-primary/20'
    },
    { 
      id: 'verb' as Module, 
      icon: Languages, 
      title: 'Verb Drill', 
      desc: 'Latihan Verb 1, 2, 3 (irregular verbs)',
      color: 'bg-secondary/10 text-secondary border-secondary/20'
    },
    { 
      id: 'grammar' as Module, 
      icon: BookA, 
      title: 'Grammar Quiz', 
      desc: 'Latihan is/am/are dan a/an/the',
      color: 'bg-accent/10 text-accent border-accent/20'
    },
  ];

  if (sessionState === 'study' && currentModule) {
    return (
      <div className="min-h-screen p-4 lg:p-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSessionState('select')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              {modules.find(m => m.id === currentModule)?.title}
            </h1>
          </div>

          {/* Module Content */}
          {currentModule === 'sentence' && <SentenceBuilder onComplete={handleModuleComplete} />}
          {currentModule === 'verb' && <VerbDrill onComplete={handleModuleComplete} />}
          {currentModule === 'grammar' && <GrammarQuiz onComplete={handleModuleComplete} />}
        </div>
      </div>
    );
  }

  if (sessionState === 'summary' && currentModule) {
    const result = results[currentModule];
    const total = (result?.correct || 0) + (result?.wrong || 0);
    const accuracy = total > 0 ? ((result?.correct || 0) / total) * 100 : 0;

    return (
      <div className="min-h-screen p-4 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <Card className="border-success/20 bg-success/5">
            <CardHeader className="text-center">
              <Trophy className="mx-auto h-12 w-12 text-success" />
              <CardTitle className="text-2xl">Modul Selesai! 🎉</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{result?.correct || 0}</p>
                  <p className="text-sm text-muted-foreground">Benar</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{result?.wrong || 0}</p>
                  <p className="text-sm text-muted-foreground">Salah</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{Math.round(accuracy)}%</p>
                  <p className="text-sm text-muted-foreground">Akurasi</p>
                </div>
              </div>

              <ProgressBar value={accuracy} variant="success" size="lg" />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setCurrentModule(null);
                    setSessionState('select');
                  }}
                >
                  Pilih Modul Lain
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => navigate('/app/dashboard')}
                >
                  Ke Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Module Selection
  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Sesi Belajar</h1>
        <p className="mb-6 text-muted-foreground">Pilih modul yang ingin kamu latih hari ini</p>

        {/* Today's Progress */}
        <Card className="mb-6 border-border">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Progress Hari Ini</span>
              <span className="text-sm text-muted-foreground">{completedModules.size}/3 modul</span>
            </div>
            <ProgressBar value={(completedModules.size / 3) * 100} showPercentage={false} variant="success" />
          </CardContent>
        </Card>

        {/* Module Cards */}
        <div className="space-y-4">
          {modules.map((module) => {
            const isCompleted = completedModules.has(module.id);
            return (
              <Card 
                key={module.id}
                className={`card-hover cursor-pointer border ${module.color} ${isCompleted ? 'opacity-60' : ''}`}
                onClick={() => startModule(module.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${module.color}`}>
                    <module.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{module.title}</p>
                    <p className="text-sm text-muted-foreground">{module.desc}</p>
                  </div>
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <Button size="sm">Mulai</Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudySession;

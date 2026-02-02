import React, { useState, useMemo } from 'react';
import { verbList, shuffleArray } from '@/data/studyData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerbDrillProps {
  onComplete: (correct: number, wrong: number) => void;
}

type VerbForm = 'v1' | 'v2' | 'v3';

export const VerbDrill: React.FC<VerbDrillProps> = ({ onComplete }) => {
  const questions = useMemo(() => {
    const shuffled = shuffleArray(verbList, true);
    return shuffled.map(verb => {
      const forms: VerbForm[] = ['v1', 'v2', 'v3'];
      const givenForm = forms[Math.floor(Math.random() * 3)];
      return { verb, givenForm };
    });
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestion = questions[currentIndex];
  const { verb, givenForm } = currentQuestion;

  const getOtherForms = (): { form1: VerbForm; form2: VerbForm } => {
    if (givenForm === 'v1') return { form1: 'v2', form2: 'v3' };
    if (givenForm === 'v2') return { form1: 'v1', form2: 'v3' };
    return { form1: 'v1', form2: 'v2' };
  };

  const { form1, form2 } = getOtherForms();

  const checkAnswer = () => {
    const correct = 
      answer1.toLowerCase().trim() === verb[form1] &&
      answer2.toLowerCase().trim() === verb[form2];
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));
    }
  };

  const nextQuestion = async () => {
    if (currentIndex + 1 >= questions.length) {
      setIsLoading(true);
      await onComplete(score.correct, score.wrong);
      return;
    }
    
    setCurrentIndex(prev => prev + 1);
    setAnswer1('');
    setAnswer2('');
    setShowResult(false);
    setIsCorrect(false);
  };

  const formLabels = {
    v1: 'Verb 1 (Present)',
    v2: 'Verb 2 (Past)',
    v3: 'Verb 3 (Past Participle)',
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-sm">
          Soal {currentIndex + 1} / {questions.length}
        </Badge>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-success">✓ {score.correct}</span>
          <span className="text-destructive">✗ {score.wrong}</span>
        </div>
      </div>

      {/* Question */}
      <Card className="border-secondary/20 bg-secondary/5">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">{formLabels[givenForm]}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{verb[givenForm]}</p>
          <p className="mt-1 text-sm text-muted-foreground">({verb.meaning})</p>
        </CardContent>
      </Card>

      {/* Input Fields */}
      {!showResult && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">
              {formLabels[form1]}:
            </label>
            <Input
              value={answer1}
              onChange={(e) => setAnswer1(e.target.value)}
              placeholder={`Tulis ${form1 === 'v1' ? 'bentuk dasar' : form1 === 'v2' ? 'bentuk lampau' : 'bentuk participle'}...`}
              className="text-lg"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">
              {formLabels[form2]}:
            </label>
            <Input
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
              placeholder={`Tulis ${form2 === 'v1' ? 'bentuk dasar' : form2 === 'v2' ? 'bentuk lampau' : 'bentuk participle'}...`}
              className="text-lg"
            />
          </div>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <Card className={cn(
          'border-2',
          isCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'
        )}>
          <CardContent className="flex items-start gap-4 p-4">
            {isCorrect ? (
              <CheckCircle2 className="h-8 w-8 shrink-0 text-success" />
            ) : (
              <XCircle className="h-8 w-8 shrink-0 text-destructive" />
            )}
            <div className="space-y-2">
              <p className="font-semibold text-foreground">
                {isCorrect ? 'Benar! 🎉' : 'Salah!'}
              </p>
              <div className="text-sm text-muted-foreground">
                <p>Jawaban yang benar:</p>
                <p className="font-medium text-foreground">
                  {verb.v1} - {verb.v2} - {verb.v3}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!showResult ? (
          <Button
            className="flex-1"
            onClick={checkAnswer}
            disabled={!answer1 || !answer2}
          >
            Cek Jawaban
          </Button>
        ) : (
          <Button className="flex-1" onClick={nextQuestion} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                {currentIndex + 1 >= questions.length ? 'Selesai' : 'Soal Berikutnya'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

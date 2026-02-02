import React, { useState, useMemo } from 'react';
import { grammarQuestions, shuffleArray } from '@/data/studyData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GrammarQuizProps {
  onComplete: (correct: number, wrong: number) => void;
}

export const GrammarQuiz: React.FC<GrammarQuizProps> = ({ onComplete }) => {
  const questions = useMemo(() => shuffleArray(grammarQuestions, true).slice(0, 15), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const currentQuestion = questions[currentIndex];

  const checkAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.answer;
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      onComplete(score.correct, score.wrong);
      return;
    }
    
    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  // Fill in the blank with highlighted answer
  const renderQuestion = () => {
    const parts = currentQuestion.question.split('___');
    return (
      <span>
        {parts[0]}
        <span className={cn(
          'inline-block min-w-[60px] rounded border-b-2 text-center font-bold',
          showResult
            ? isCorrect
              ? 'border-success text-success'
              : 'border-destructive text-destructive'
            : 'border-primary text-primary'
        )}>
          {selectedAnswer || '___'}
        </span>
        {parts[1]}
      </span>
    );
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
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Lengkapi kalimat berikut:</p>
          <p className="mt-4 text-2xl text-foreground">{renderQuestion()}</p>
        </CardContent>
      </Card>

      {/* Options */}
      {!showResult && (
        <div className="grid grid-cols-3 gap-3">
          {currentQuestion.options.map((option) => (
            <Button
              key={option}
              size="lg"
              variant="outline"
              onClick={() => checkAnswer(option)}
              className="text-lg font-medium"
            >
              {option}
            </Button>
          ))}
        </div>
      )}

      {/* Result */}
      {showResult && (
        <>
          <Card className={cn(
            'border-2',
            isCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'
          )}>
            <CardContent className="flex items-center gap-4 p-4">
              {isCorrect ? (
                <CheckCircle2 className="h-8 w-8 text-success" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {isCorrect ? 'Benar! 🎉' : 'Salah!'}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-muted-foreground">
                    Jawaban yang benar: <span className="font-medium text-foreground">{currentQuestion.answer}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Explanation */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-start gap-3 p-4">
              <Lightbulb className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-foreground">{currentQuestion.explanation}</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Next Button */}
      {showResult && (
        <Button className="w-full" onClick={nextQuestion}>
          {currentIndex + 1 >= questions.length ? 'Selesai' : 'Soal Berikutnya'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, ChevronRight, 
  Trophy, RotateCcw, X 
} from "lucide-react";
import { libraryApi, QuizData } from "@/lib/services/library";
import { cn } from "@/lib/utils";
import { PageLoader, InlineLoader } from "@/components/ui/page-loader";

interface FlipBookQuizProps {
  bookId: string;
  onClose: () => void;
  onComplete?: (result: { score: number; is_validated: boolean; passing_score: number }) => void;
}

export function FlipBookQuiz({ bookId, onClose, onComplete }: FlipBookQuizProps) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQuiz = async () => {
      setIsLoading(true);
      try {
        const data = await libraryApi.getQuizzes(bookId);
        if (data) {
          setQuiz(data);
        }
      } catch (err) {
        console.error("Erreur chargement quiz:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadQuiz();
  }, [bookId]);

  const handleSelectChoice = (choiceIdx: number) => {
    if (!quiz) return;
    const questionId = quiz.questions[currentQuestionIdx].id;
    setAnswers(prev => ({ ...prev, [questionId]: choiceIdx }));
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setIsSubmitting(true);
    try {
      const res = await libraryApi.submitQuiz(quiz.id, answers);
      setResult(res);
      onComplete?.({
        score: res.score,
        is_validated: res.passed,
        passing_score: Math.ceil(quiz.questions.length * 0.7),
      });
    } catch (err) {
      console.error("Erreur soumission quiz:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background rounded-3xl border border-border shadow-xl p-8">
        <PageLoader label="Chargement de l'évaluation" />
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 text-center px-6 py-12 bg-background rounded-3xl border border-border shadow-xl">
        <div className="h-20 w-20 rounded-2xl bg-navy/10 border border-navy-hover flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-gold" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold font-serif text-navy">Évaluation non disponible</h3>
          <p className="text-foreground-muted text-xs italic max-w-md mx-auto">Ce livre n&apos;a pas encore de quiz de validation. Votre lecture a tout de même été enregistrée.</p>
        </div>
        <button type="button" onClick={onClose} className="px-6 py-2.5 bg-navy text-gold hover:bg-navy-dark rounded-xl font-bold text-xs border border-gold/30 shadow-xs cursor-pointer min-h-[44px]">Fermer</button>
      </div>
    );
  }

  if (result) {
    const isSuccess = result.passed;
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-full space-y-8 text-center px-6 py-10 bg-background rounded-3xl border border-border shadow-2xl relative overflow-hidden"
      >
        <div className="relative">
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            className={cn(
              "w-28 h-28 rounded-3xl flex items-center justify-center shadow-xl border-2 border-background relative z-10",
              isSuccess ? "bg-success text-white shadow-success/20" : "bg-destructive text-white shadow-destructive/20"
            )}
          >
            {isSuccess ? <Trophy size={56} className="text-white drop-shadow-md" /> : <AlertCircle size={56} className="text-white drop-shadow-md" />}
          </motion.div>
        </div>

        <div className="space-y-3 relative z-10">
          <span className={cn("px-4 py-1.5 uppercase font-bold text-xs rounded-full border-none shadow-md inline-block", isSuccess ? "bg-success text-white" : "bg-destructive text-white")}>
            {isSuccess ? "Lecture Validée avec Succès" : "Validation Échouée"}
          </span>
          <div className="space-y-1">
            <h2 className="text-5xl font-black text-navy font-serif leading-none flex items-center justify-center gap-2">
              {result.score}<span className="text-foreground-muted text-2xl font-sans">/{result.total}</span>
            </h2>
            <p className="text-foreground-muted font-mono uppercase text-[10px] tracking-wider">Note d&apos;évaluation</p>
          </div>
          <p className="text-foreground-muted text-xs italic max-w-lg mx-auto leading-relaxed">
            {isSuccess 
              ? "Excellente restitution ! Vos points et statistiques de lecture ont été enregistrés."
              : "Prenez le temps de relire les passages clés avant de repasser l'évaluation."
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md relative z-10">
          {!isSuccess && (
            <button 
              type="button"
              onClick={() => { setResult(null); setCurrentQuestionIdx(0); setAnswers({}); }}
              className="flex-1 px-4 py-3 bg-background-secondary border border-border text-navy hover:bg-background rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <RotateCcw size={16} /> Réessayer
            </button>
          )}
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gold text-navy hover:bg-gold-hover rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer min-h-[44px]"
          >
            {isSuccess ? "Terminer" : "Fermer"}
            <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIdx];
  const progress = ((currentQuestionIdx + 1) / quiz.questions.length) * 100;

  return (
    <div className="relative w-full h-full flex flex-col max-w-4xl mx-auto px-6 py-8 bg-background rounded-3xl border border-border shadow-2xl overflow-hidden">
      {/* Header & Progress */}
      <div className="relative z-10 space-y-4 pb-6 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <span className="px-2.5 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider">Évaluation de Lecture</span>
            <h3 className="text-navy text-xl font-bold font-serif mt-1">
              Question {currentQuestionIdx + 1} <span className="text-foreground-muted text-sm font-sans">/ {quiz.questions.length}</span>
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="h-9 w-9 rounded-xl bg-background-secondary border border-border flex items-center justify-center text-foreground-muted hover:text-navy hover:bg-background transition-all min-h-[36px] min-w-[36px] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="h-2 w-full bg-background-secondary rounded-full overflow-hidden border border-border">
          <motion.div 
            className="h-full bg-gold rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex flex-col justify-center py-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-lg sm:text-xl font-serif font-bold text-navy leading-snug">
              {currentQuestion.question}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((optionText, idx) => {
                const isSelected = answers[currentQuestion.id] === idx;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleSelectChoice(idx)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer min-h-[44px]",
                      isSelected 
                        ? "bg-navy border-navy text-gold shadow-md" 
                        : "bg-background-secondary border-border hover:border-gold/50 text-foreground"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 transition-all font-mono",
                      isSelected ? "bg-gold text-navy border-gold" : "bg-background border-border text-foreground-muted"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-xs font-medium leading-normal">{optionText}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-border mt-auto">
        <span className="text-[10px] font-mono text-foreground-muted">LAHAThèque • Studio Évaluation</span>
        <button 
          type="button"
          onClick={handleNext}
          disabled={answers[currentQuestion.id] === undefined || isSubmitting}
          className="px-6 py-2.5 bg-gold text-navy hover:bg-gold-hover rounded-xl font-bold text-xs shadow-md flex items-center gap-2 disabled:opacity-40 transition-all cursor-pointer min-h-[44px]"
        >
          {isSubmitting ? <InlineLoader size={16} /> : (
            <>
              {currentQuestionIdx === quiz.questions.length - 1 ? "Soumettre l'évaluation" : "Suivant"}
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

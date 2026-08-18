"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle2, AlertCircle, ChevronRight, 
  Trophy, RotateCcw, X, Loader2 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { libraryApi } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Choice {
  id: string
  text: string
}

interface Question {
  id: string
  text: string
  choices: Choice[]
}

interface Quiz {
  id: string
  description: string
  questions: Question[]
}

interface FlipBookQuizProps {
  bookId: string
  onClose: () => void
  onComplete?: (result: { score: number; is_validated: boolean; passing_score: number }) => void
}

export function FlipBookQuiz({ bookId, onClose, onComplete }: FlipBookQuizProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadQuiz = async () => {
      setIsLoading(true)
      try {
        const data = await libraryApi.quizzes.getForBook(bookId)
        if (data.results && data.results.length > 0) {
          setQuiz(data.results[0])
        }
      } catch (err) {
        console.error("Erreur chargement quiz:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadQuiz()
  }, [bookId])

  const handleSelectChoice = (choiceId: string) => {
    if (!quiz) return
    const questionId = quiz.questions[currentQuestionIdx].id
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }))
  }

  const handleNext = () => {
    if (!quiz) return
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!quiz) return
    setIsSubmitting(true)
    try {
      const res = await libraryApi.quizzes.submit(quiz.id, answers)
      setResult(res)
      onComplete?.({
        score: res.score,
        is_validated: res.is_validated,
        passing_score: res.passing_score
      })
    } catch (err) {
      console.error("Erreur soumission quiz:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-5 bg-background rounded-[3rem] border border-border shadow-xl">
        <Loader2 className="w-16 h-16 text-laha-gold animate-spin" />
        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] italic animate-pulse">Configuration du test...</p>
      </div>
    )
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 text-center px-10 bg-background rounded-[3rem] border border-border shadow-xl">
        <div className="h-24 w-24 rounded-[2rem] bg-layer-1 border border-border/40 flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground/20" />
        </div>
        <div className="space-y-3">
          <h3 className="text-3xl font-black text-foreground italic uppercase tracking-tighter">Évaluation non disponible</h3>
          <p className="text-muted-foreground/60 text-sm italic max-w-md mx-auto">Ce livre n'a pas encore de quiz de validation. Ta lecture a tout de même été enregistrée dans tes statistiques.</p>
        </div>
        <Button onClick={onClose} className="h-14 px-12 bg-layer-1 hover:bg-layer-2 text-foreground rounded-2xl font-black uppercase text-[10px] tracking-widest border border-border">Fermer</Button>
      </div>
    )
  }

  if (result) {
    const isSuccess = result.is_validated
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-full space-y-12 text-center px-6 bg-background rounded-[4rem] border border-border shadow-2xl relative overflow-hidden"
      >
        {/* Background glow effects */}
        <div className={cn("absolute -top-24 -left-24 w-64 h-64 blur-[100px] opacity-20 rounded-full", isSuccess ? "bg-emerald-500" : "bg-rose-500")} />
        <div className={cn("absolute -bottom-24 -right-24 w-64 h-64 blur-[100px] opacity-20 rounded-full", isSuccess ? "bg-emerald-500" : "bg-rose-500")} />

        <div className="relative">
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            className={cn(
              "w-40 h-40 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 border-background/50 relative z-10",
              isSuccess ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20"
            )}
          >
            {isSuccess ? <Trophy size={80} className="text-white drop-shadow-lg" /> : <AlertCircle size={80} className="text-white drop-shadow-lg" />}
          </motion.div>
          {isSuccess && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-6 border-2 border-dashed border-emerald-500/30 rounded-[3.5rem]"
            />
          )}
        </div>

        <div className="space-y-4 relative z-10">
          <Badge className={cn("px-6 py-2 uppercase font-black tracking-[0.2em] italic text-[10px] rounded-full border-none shadow-lg", isSuccess ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
            {isSuccess ? "Lecture Validée avec Succès" : "Validation Échouée"}
          </Badge>
          <div className="space-y-1">
            <h2 className="text-7xl md:text-9xl font-black text-foreground italic uppercase tracking-tighter leading-none flex items-center justify-center gap-2">
              {result.score}<span className="text-muted-foreground/10 text-4xl md:text-6xl">/20</span>
            </h2>
            <p className="text-muted-foreground/60 font-black uppercase text-[10px] tracking-widest italic">Note finale d'évaluation</p>
          </div>
          <p className="text-muted-foreground text-sm italic font-medium max-w-lg mx-auto leading-relaxed">
            {isSuccess 
              ? "Magnifique performance ! Tes points d'expérience (LP) ont été crédités et cette lecture figure désormais dans tes exploits académiques."
              : `Oups ! Tu n'as pas atteint le seuil minimum de ${result.passing_score}/20. Prends le temps de relire les passages clés avant de retenter ta chance.`
            }
          </p>
        </div>

        <div className="flex flex-col md:row gap-4 w-full max-w-md relative z-10">
          {!isSuccess && (
            <Button 
              onClick={() => { setResult(null); setCurrentQuestionIdx(0); setAnswers({}); }}
              className="flex-1 h-16 bg-muted/50 border border-border/40 text-foreground hover:bg-muted rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] gap-3 italic"
            >
              <RotateCcw size={20} /> Réessayer le test
            </Button>
          )}
          <Button 
            onClick={onClose}
            className="flex-1 h-16 bg-laha-gold text-black hover:bg-laha-gold/90 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-laha-gold/20 italic group"
          >
            {isSuccess ? "Terminer l'évaluation" : "Quitter pour le moment"}
            <ChevronRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </motion.div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIdx]
  const progress = ((currentQuestionIdx + 1) / quiz.questions.length) * 100

  return (
    <div className="relative w-full h-full flex flex-col max-w-5xl mx-auto px-6 py-12 bg-background rounded-[4rem] border border-border shadow-2xl overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-laha-gold/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      {/* Quiz Progress */}
      <div className="relative z-10 pt-4 pb-12 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
               <Badge className="bg-laha-gold/10 text-laha-gold border-laha-gold/20 font-black uppercase text-[8px] tracking-widest italic h-5 px-2">Studio Évaluation</Badge>
               <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Test de lecture active</span>
             </div>
             <h3 className="text-foreground text-3xl font-black italic uppercase tracking-tighter leading-none">
               Question {currentQuestionIdx + 1} <span className="text-muted-foreground/20 italic">/ {quiz.questions.length}</span>
             </h3>
          </div>
          <button 
            onClick={onClose} 
            className="h-12 w-12 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 transition-all shadow-sm"
          >
            <X size={24} />
          </button>
        </div>
        <div className="h-2 w-full bg-layer-1 dark:bg-layer-2 rounded-full overflow-hidden border border-border/20 p-0.5">
          <motion.div 
            className="h-full bg-laha-gold rounded-full shadow-[0_0_15px_rgba(246,193,10,0.3)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex flex-col justify-center relative z-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIdx}
            initial={{ opacity: 0, x: 50, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 1.02 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="space-y-12"
          >
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-laha-gold/60 italic">Énoncé de l'exercice :</p>
              <h2 className="text-3xl md:text-5xl font-black text-foreground italic uppercase leading-[1.1] tracking-tight">
                {currentQuestion.text}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {currentQuestion.choices.map((choice, idx) => {
                const isSelected = answers[currentQuestion.id] === choice.id
                return (
                  <button
                    key={choice.id}
                    onClick={() => handleSelectChoice(choice.id)}
                    className={cn(
                      "flex items-center gap-6 p-6 md:p-8 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group/choice shadow-sm",
                      isSelected 
                        ? "bg-laha-gold border-laha-gold text-black shadow-xl shadow-laha-gold/20" 
                        : "bg-white dark:bg-layer-1 border-border hover:border-laha-gold/40 hover:bg-layer-1/50 text-foreground"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-xl border-2 flex items-center justify-center font-black italic text-sm shrink-0 transition-all",
                      isSelected ? "bg-black text-laha-gold border-black" : "bg-muted/20 border-border text-muted-foreground group-hover:text-laha-gold group-hover:border-laha-gold"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="relative z-10 text-base md:text-lg font-black italic uppercase leading-tight">{choice.text}</span>
                    {isSelected && (
                      <motion.div 
                        layoutId="activeChoiceGlow"
                        className="absolute inset-0 bg-laha-gold/5 pointer-events-none"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-8 border-t border-border/20 relative z-10 mt-auto">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">Lahacademia • Évaluation Interactive</p>
        <Button 
          onClick={handleNext}
          disabled={!answers[currentQuestion.id] || isSubmitting}
          className="h-18 px-14 bg-laha-gold text-black hover:bg-laha-gold/90 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-[0_20px_50px_rgba(246,193,10,0.2)] gap-4 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 italic"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : (
            <>
              {currentQuestionIdx === quiz.questions.length - 1 ? "Soumettre mon évaluation" : "Valider & Suivant"}
              <ChevronRight size={20} strokeWidth={4} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}


"use client";

import { useEffect, useState } from "react";
import { 
  getTeacherCourses, 
  createCourse, 
  addRecommendationToCourse 
} from "@/lib/services/teacher";
import { Course } from "@/lib/types/teacher";
import { 
  GraduationCap, 
  Plus, 
  Bookmark, 
  Building2, 
  ArrowLeft,
  XCircle,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { mockBooks } from "@/lib/mock/catalog";

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // State des modales
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");

  const [showRecModal, setShowRecModal] = useState(false);
  const [recCourseId, setRecCourseId] = useState("");
  const [recBookId, setRecBookId] = useState("");
  const [submittingRec, setSubmittingRec] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        const data = await getTeacherCourses();
        setCourses(data);
      } catch (err) {
        console.error("Erreur lors du chargement des cours", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName || !newCourseCode) return;
    try {
      const newC = await createCourse(newCourseName, newCourseCode);
      setCourses(prev => [...prev, newC]);
      setShowCourseModal(false);
      setNewCourseName("");
      setNewCourseCode("");
    } catch (err) {
      alert("Erreur lors de la création du cours.");
    }
  };

  const handleAddRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recCourseId || !recBookId) return;
    const selectedBook = mockBooks.find(b => b.id === recBookId);
    if (!selectedBook) return;
    try {
      setSubmittingRec(true);
      const authorName = selectedBook.authors_details.map(a => `${a.first_name} ${a.last_name}`).join(", ");
      const success = await addRecommendationToCourse(
        recCourseId,
        selectedBook.id,
        selectedBook.title,
        authorName
      );
      if (success) {
        setCourses(prev => prev.map(c => {
          if (c.id === recCourseId) {
            return {
              ...c,
              recommended_books: [
                ...c.recommended_books,
                { id: selectedBook.id, title: selectedBook.title, author: authorName }
              ]
            };
          }
          return c;
        }));
        setShowRecModal(false);
        setRecBookId("");
        setRecCourseId("");
      }
    } catch (err) {
      alert("Erreur.");
    } finally {
      setSubmittingRec(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/teacher"
            className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au Tableau de Bord
          </Link>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Cours & Recommandations</h1>
          <p className="text-sm text-foreground-muted">Gérez vos listes de lectures académiques recommandées par cours.</p>
        </div>

        <div className="flex gap-2 self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => setShowCourseModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-bold px-4 py-3 rounded shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer un Cours
          </button>
          <button
            onClick={() => setShowRecModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-white text-xs font-bold px-4 py-3 rounded shadow-sm transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            Recommander un Manuel
          </button>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="bg-background border border-border h-48 rounded-xl" />
          <div className="bg-background border border-border h-48 rounded-xl" />
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center border border-border rounded-xl bg-background-secondary max-w-md mx-auto space-y-3">
          <GraduationCap className="w-12 h-12 text-gold mx-auto" />
          <h3 className="text-base font-bold text-navy">Aucun cours</h3>
          <p className="text-xs text-foreground-muted">Créez votre premier cours pour commencer à recommander des livres.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-background border border-border rounded-xl shadow-sm p-6 space-y-4 flex flex-col justify-between hover:border-gold/30 transition-colors">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-navy-light text-navy">{course.code}</span>
                    <h3 className="font-serif font-bold text-navy text-lg leading-snug mt-1">{course.name}</h3>
                  </div>
                  <span className="text-xs text-foreground-muted font-medium">{course.student_count} étudiants</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">Ouvrages recommandés (Lectures)</span>
                  {course.recommended_books.length === 0 ? (
                    <p className="text-xs text-foreground-muted italic">Aucune recommandation active.</p>
                  ) : (
                    <ul className="divide-y divide-border/40 text-xs">
                      {course.recommended_books.map((book) => (
                        <li key={book.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-navy">{book.title}</p>
                            <p className="text-[10px] text-foreground-muted">Par {book.author}</p>
                          </div>
                          <Link 
                            href={`/catalog/${book.id}`}
                            className="text-gold hover:text-gold-dark font-bold ml-4 flex items-center gap-1 shrink-0"
                          >
                            Consulter
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        title="Créer un nouveau cours"
        maxWidth={500}
        footer={
          <>
            <button 
              type="button"
              onClick={() => setShowCourseModal(false)}
              className="border border-border text-navy bg-background hover:bg-background-secondary text-xs font-bold px-4 py-2 rounded"
            >
              Annuler
            </button>
            <button 
              type="submit"
              form="create-course-form"
              className="bg-navy hover:bg-navy-hover text-white text-xs font-bold px-4 py-2 rounded"
            >
              Créer le cours
            </button>
          </>
        }
      >
        <form id="create-course-form" onSubmit={handleCreateCourse} className="space-y-4 pt-2 pb-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-navy">Nom du cours *</label>
            <input 
              type="text" 
              required
              className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
              placeholder="Ex: Macroéconomie Internationale"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-navy">Code du cours *</label>
            <input 
              type="text" 
              required
              className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
              placeholder="Ex: ECO-2200"
              value={newCourseCode}
              onChange={(e) => setNewCourseCode(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={showRecModal}
        onClose={() => setShowRecModal(false)}
        title="Recommander un manuel à vos cours"
        maxWidth={500}
        footer={
          <>
            <button 
              type="button"
              onClick={() => setShowRecModal(false)}
              className="border border-border text-navy bg-background hover:bg-background-secondary text-xs font-bold px-4 py-2 rounded"
            >
              Annuler
            </button>
            <button 
              type="submit"
              form="recommend-book-form"
              className="bg-gold hover:bg-gold-dark text-white text-xs font-bold px-4 py-2 rounded"
            >
              Ajouter la recommandation
            </button>
          </>
        }
      >
        <form id="recommend-book-form" onSubmit={handleAddRecommendation} className="space-y-4 pt-2 pb-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-navy">Associer au cours *</label>
            <select 
              className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy cursor-pointer"
              value={recCourseId}
              onChange={(e) => setRecCourseId(e.target.value)}
              required
            >
              <option value="">-- Choisir un cours --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-navy">Ouvrage à recommander *</label>
            <select 
              className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy cursor-pointer"
              value={recBookId}
              onChange={(e) => setRecBookId(e.target.value)}
              required
            >
              <option value="">-- Choisir un ouvrage --</option>
              {mockBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Folder, FolderOpen, ChevronRight, ChevronDown, BookOpen, GraduationCap, Layers } from "lucide-react";
import type { UniversityBook } from "@/lib/types/librarian";

interface FacultyTreeViewProps {
  books: UniversityBook[];
  onSelectFaculty?: (faculty: string) => void;
  onSelectDiscipline?: (discipline: string) => void;
  className?: string;
}

export function FacultyTreeView({
  books,
  onSelectFaculty,
  onSelectDiscipline,
  className,
}: FacultyTreeViewProps) {
  const [expandedFaculties, setExpandedFaculties] = useState<Record<string, boolean>>({
    "FADESP": true,
    "FASEG": true,
  });

  const toggleFaculty = (fac: string) => {
    setExpandedFaculties((prev) => ({ ...prev, [fac]: !prev[fac] }));
  };

  // Grouper par Faculté puis Discipline
  const facultyGroups = books.reduce<Record<string, Record<string, UniversityBook[]>>>((acc, book) => {
    const facKey = book.faculty;
    const discKey = book.discipline;
    if (!acc[facKey]) acc[facKey] = {};
    if (!acc[facKey][discKey]) acc[facKey][discKey] = [];
    acc[facKey][discKey].push(book);
    return acc;
  }, {});

  return (
    <div className={`p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-gold" />
          <h3 className="font-serif font-bold text-navy text-base">Arborescence Institutionnelle</h3>
        </div>
        <span className="text-[10px] text-foreground-muted font-mono uppercase font-bold">
          Hiérarchie : Faculté → Département → Discipline
        </span>
      </div>

      {/* Tree View 21st.dev Tree id: 4316 */}
      <div className="space-y-3 text-xs">
        {Object.entries(facultyGroups).map(([facultyName, disciplines]) => {
          const isExpanded = !!expandedFaculties[facultyName];
          const totalBooksInFac = Object.values(disciplines).reduce((sum, bList) => sum + bList.length, 0);

          return (
            <div key={facultyName} className="rounded-2xl border border-border overflow-hidden bg-background-secondary">
              {/* Entête Faculté */}
              <button
                type="button"
                onClick={() => toggleFaculty(facultyName)}
                className="w-full p-3.5 bg-background border-b border-border/60 hover:bg-navy/5 transition-colors flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gold shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-foreground-muted shrink-0" />
                  )}
                  <GraduationCap className="w-4 h-4 text-navy shrink-0" />
                  <span className="font-serif font-bold text-navy text-xs truncate">{facultyName}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-gold/15 text-gold font-mono font-bold text-[10px] shrink-0">
                  {totalBooksInFac} ouvrage(s)
                </span>
              </button>

              {/* Contenu Disciplines */}
              {isExpanded && (
                <div className="p-3 pl-8 space-y-3 bg-background-secondary/50">
                  {Object.entries(disciplines).map(([disciplineName, bookList]) => (
                    <div key={disciplineName} className="p-3 rounded-xl bg-background border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-gold" />
                          <span className="font-bold text-navy text-xs">{disciplineName}</span>
                        </div>
                        <span className="text-[10px] text-foreground-muted font-mono">{bookList.length} titre(s)</span>
                      </div>

                      <div className="pl-4 space-y-1 border-l-2 border-gold/30">
                        {bookList.map((b) => (
                          <div key={b.id} className="flex items-center justify-between text-[11px] py-0.5">
                            <span className="font-medium text-foreground truncate max-w-[280px]">{b.title}</span>
                            <span className="font-mono text-gold font-bold">{b.consultations_count} vues</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

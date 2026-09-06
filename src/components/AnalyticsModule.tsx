/**
 * Class 4: Analytics Module (الإحصائيات والتحليلات)
 * الجداول الـ 3 الأساسية: إحصائيات الرتب، تفاصيل الرتبة مع بطاقات الطلاب، ومصفوفة الـ 16 سنة
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Award,
  Users,
  Eye,
  Lock,
  Sparkles,
  Phone,
  Grid,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ChevronRight,
  X,
} from 'lucide-react';
import { Student, DeaconRank, UserSession } from '../types';
import { getStudents, DEACON_RANKS, ACADEMIC_LEVELS, ACADEMIC_YEARS } from '../services/storage';

interface AnalyticsModuleProps {
  session: UserSession;
  onSelectStudentProfile: (student: Student) => void;
}

export const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({
  session,
  onSelectStudentProfile,
}) => {
  const students = getStudents();
  const [selectedRankForDetail, setSelectedRankForDetail] = useState<DeaconRank | null>(null);

  // Permission Check
  const canView =
    session.role === 'admin' || session.permissions?.canViewAnalytics !== false;

  if (!canView) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
        <Lock className="w-12 h-12 mx-auto text-amber-500/80 stroke-[1.5]" />
        <h3 className="text-lg font-bold text-slate-100">وحدة الإحصائيات معطّلة للخدام</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          تم تقييد صلاحية عرض الإحصائيات والمصفوفات الأكاديمية بواسطة إدارة المدرسة. يرجى التواصل مع مسؤول النظام لمنح الصلاحية.
        </p>
      </div>
    );
  }

  // TABLE A DATA: Deacon Rank Distribution
  const totalStudentsCount = students.length || 1;
  const rankStats = DEACON_RANKS.map((rank) => {
    const matching = students.filter((s) => s.deaconRank === rank);
    const count = matching.length;
    const percentage = Math.round((count / totalStudentsCount) * 100);
    return {
      rank,
      count,
      percentage,
      students: matching,
    };
  });

  // TABLE B DATA: Students belonging to clicked rank
  const rankDetailStudents = selectedRankForDetail
    ? students.filter((s) => s.deaconRank === selectedRankForDetail)
    : [];

  // TABLE C DATA: 16-Year Matrix (Sorted by highest completion stage)
  const sortedStudentsForMatrix = [...students].sort((a, b) => {
    const scoreA = a.levelIndex * 4 + a.yearIndex;
    const scoreB = b.levelIndex * 4 + b.yearIndex;
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-100">
              وحدة الإحصائيات والتحليلات الشاملة
            </h2>
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold rounded-full">
              {students.length} طالب مسجّل
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إحصائيات الرتب الشماسية، تفاصيل الشمامسة، ومصفوفة التطور الأكاديمي عبر 16 سنة دراسية
          </p>
        </div>
      </div>

      {/* TABLE A: DEACON RANK TOTALS & PERCENTAGE DISTRIBUTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              الجدول (أ): إحصائيات وتوزيع الرتب الشماسية (Deacon Rank Totals)
            </h3>
          </div>
          <span className="text-xs text-slate-400">انقر على الرتبة لعرض تفاصيل الطلاب</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankStats.map((item) => (
            <div
              key={item.rank}
              onClick={() => setSelectedRankForDetail(item.rank)}
              className="p-4 bg-slate-950 border border-slate-800/90 hover:border-amber-500/60 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-md group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-200 text-sm group-hover:text-amber-300 transition-colors">
                  {item.rank}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {item.count} طالب
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(item.percentage, 4)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>نسبة التوزيع:</span>
                <span className="font-mono font-bold text-slate-300">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABLE C: ACADEMIC PROGRESS MATRIX (16-Year Grid) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              الجدول (ج): مصفوفة التطور الأكاديمي 16 سنة (Academic Progress Matrix)
            </h3>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> 🟢 "ن" (ناجح)
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> 🔴 "ر" (راسب)
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> 🟡 "ح" (حالي)
            </span>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse min-w-[900px]">
            <thead>
              {/* Level Headers */}
              <tr className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                <th rowSpan={2} className="p-3 text-right border-l border-slate-800 min-w-[180px]">
                  اسم الطالب
                </th>
                <th rowSpan={2} className="p-3 border-l border-slate-800 min-w-[100px]">
                  الرتبة
                </th>
                {ACADEMIC_LEVELS.map((lvl) => (
                  <th key={lvl} colSpan={4} className="p-2 border-l border-slate-800 text-amber-400 text-[11px]">
                    {lvl}
                  </th>
                ))}
              </tr>
              {/* Year Headers (1..4) */}
              <tr className="bg-slate-950/80 text-slate-400 text-[10px] border-b border-slate-800">
                {[0, 1, 2, 3].map((lvlIdx) =>
                  [0, 1, 2, 3].map((yrIdx) => (
                    <th key={`hdr-${lvlIdx}-${yrIdx}`} className="p-1.5 border-l border-slate-800/60 font-mono">
                      س{yrIdx + 1}
                    </th>
                  ))
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {sortedStudentsForMatrix.map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Student Name */}
                  <td className="p-3 text-right font-bold text-slate-200 border-l border-slate-800 flex items-center justify-between gap-2">
                    <span className="truncate">{stu.fullName}</span>
                    <button
                      onClick={() => onSelectStudentProfile(stu)}
                      className="p-1 text-slate-400 hover:text-amber-400 transition-colors shrink-0"
                      title="فتح الملف التراكمي"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>

                  {/* Rank */}
                  <td className="p-3 border-l border-slate-800 text-amber-300 font-medium text-[11px]">
                    {stu.deaconRank}
                  </td>

                  {/* 16 Stage Cells */}
                  {[0, 1, 2, 3].map((lIdx) =>
                    [0, 1, 2, 3].map((yIdx) => {
                      const historyItem = stu.history?.find(
                        (h) => h.levelIndex === lIdx && h.yearIndex === yIdx
                      );

                      const status = historyItem?.status || (
                        lIdx < stu.levelIndex || (lIdx === stu.levelIndex && yIdx < stu.yearIndex)
                          ? 'passed'
                          : lIdx === stu.levelIndex && yIdx === stu.yearIndex
                          ? 'active'
                          : 'future'
                      );

                      return (
                        <td
                          key={`cell-${stu.id}-${lIdx}-${yIdx}`}
                          className={`p-2 border-l border-slate-800/60 font-bold font-mono text-sm ${
                            status === 'passed'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : status === 'failed'
                              ? 'bg-rose-500/10 text-rose-400'
                              : status === 'active'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'text-slate-700'
                          }`}
                        >
                          {status === 'passed' ? (
                            '🟢 ن'
                          ) : status === 'failed' ? (
                            '🔴 ر'
                          ) : status === 'active' ? (
                            '🟡 ح'
                          ) : (
                            '—'
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE B MODAL: RANK DETAILS EXPLORER (تفاصيل الرتبة) */}
      {selectedRankForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-slate-100">
                  الجدول (ب): تفاصيل الشمامسة برتبة "{selectedRankForDetail}" ({rankDetailStudents.length})
                </h3>
              </div>
              <button
                onClick={() => setSelectedRankForDetail(null)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {rankDetailStudents.length === 0 ? (
                <p className="text-center py-8 text-slate-500 text-xs">
                  لا يوجد طلاب مسجلون بهذه الرتبة الشماسية حالياً.
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {rankDetailStudents.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 hover:border-amber-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={s.fullName}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-800 shrink-0"
                        />
                        <div>
                          <span className="block font-bold text-slate-100 text-sm">
                            {s.fullName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {s.level} — {s.year}
                          </span>
                          <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-slate-400">
                            <span>هاتف الطالب: {s.phone || '—'}</span>
                            <span>ولي الأمر: {s.guardianPhone || '—'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedRankForDetail(null);
                          onSelectStudentProfile(s);
                        }}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-md"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        الملف التراكمي
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

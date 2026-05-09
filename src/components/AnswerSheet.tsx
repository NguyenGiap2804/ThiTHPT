import React from 'react';
import { QuestionStructure, AttemptAnswer } from '../types';
import { cn } from '../lib/utils';
import { Check, Bookmark } from 'lucide-react';

interface AnswerSheetProps {
  questions: QuestionStructure[];
  answers: AttemptAnswer[];
  onAnswerChange: (questionId: string, answer: Partial<AttemptAnswer>) => void;
  flaggedQuestions: string[];
  onToggleFlag: (questionId: string) => void;
  currentIdx: number;
  onJumpToQuestion: (idx: number) => void;
}

export const AnswerSheet: React.FC<AnswerSheetProps> = ({
  questions,
  answers,
  onAnswerChange,
  flaggedQuestions,
  onToggleFlag,
  currentIdx,
  onJumpToQuestion
}) => {
  const parts = [
    { id: 1, label: 'Phần I', subLabel: 'Trắc nghiệm nhiều phương án' },
    { id: 2, label: 'Phần II', subLabel: 'Trắc nghiệm đúng sai' },
    { id: 3, label: 'Phần III', subLabel: 'Trả lời ngắn' },
  ];

  const renderQuestionInput = (q: QuestionStructure, idx: number) => {
    const answer = answers.find(a => a.questionId === q.id);
    const isCurrent = currentIdx === idx;

    return (
      <div 
        key={q.id}
        id={`q-input-${q.id}`}
        className={cn(
          "p-3 rounded-xl border transition-all duration-200 mb-3",
          isCurrent ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500/20 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900">{q.label}</span>
          </div>
          <button 
            onClick={() => onToggleFlag(q.id)}
            className={cn(
              "p-1 rounded-lg transition-colors",
              flaggedQuestions.includes(q.id) ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:bg-slate-50"
            )}
          >
            <Bookmark className={cn("w-3.5 h-3.5", flaggedQuestions.includes(q.id) && "fill-current")} />
          </button>
        </div>

        {q.type === 'single_choice' && (
          <div className="flex justify-between px-2">
            {['A', 'B', 'C', 'D'].map(opt => (
              <button
                key={opt}
                onClick={() => onAnswerChange(q.id, { selectedOption: opt })}
                className={cn(
                  "w-8 h-8 rounded-full border-2 font-black transition-all text-xs flex items-center justify-center",
                  answer?.selectedOption === opt 
                    ? "bg-blue-600 border-blue-600 text-white shadow-md scale-110" 
                    : "border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {q.type === 'true_false' && (
          <div className="grid grid-cols-4 gap-2">
            {['a', 'b', 'c', 'd'].map(sub => (
              <div key={sub} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{sub}</span>
                <div className="flex flex-col gap-1 w-full">
                  <button
                    onClick={() => onAnswerChange(q.id, { 
                      trueFalseAnswers: { ...answer?.trueFalseAnswers, [sub]: true } 
                    })}
                    className={cn(
                      "h-7 rounded-md text-[10px] font-black transition-all border flex items-center justify-center",
                      answer?.trueFalseAnswers?.[sub] === true
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-slate-200 text-slate-400 hover:border-blue-300"
                    )}
                  >
                    Đ
                  </button>
                  <button
                    onClick={() => onAnswerChange(q.id, { 
                      trueFalseAnswers: { ...answer?.trueFalseAnswers, [sub]: false } 
                    })}
                    className={cn(
                      "h-7 rounded-md text-[10px] font-black transition-all border flex items-center justify-center",
                      answer?.trueFalseAnswers?.[sub] === false
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-slate-200 text-slate-400 hover:border-blue-300"
                    )}
                  >
                    S
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {q.type === 'short_answer' && (
          <input
            type="text"
            placeholder="Nhập đáp án..."
            value={answer?.shortAnswer || ''}
            onChange={(e) => onAnswerChange(q.id, { shortAnswer: e.target.value })}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
      {/* Question Status Grid at the Top */}
      <div className="p-6 bg-white border-b border-slate-100 mb-2">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          Trạng thái câu hỏi
        </h3>
        
        <div className="max-h-[220px] overflow-y-auto pr-2 mb-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2.5">
            {questions.map((q, idx) => {
              const answer = answers.find(a => a.questionId === q.id);
              const isDone = !!(answer?.selectedOption || answer?.trueFalseAnswers || answer?.shortAnswer);
              const isFlagged = flaggedQuestions.includes(q.id);
              const isCurrent = currentIdx === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    onJumpToQuestion(idx);
                    const el = document.getElementById(`q-input-${q.id}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={cn(
                    "w-full aspect-square rounded-xl flex items-center justify-center text-[11px] font-black transition-all relative border-2",
                    isCurrent 
                      ? "border-blue-600 bg-white text-blue-600 shadow-lg shadow-blue-100 ring-2 ring-blue-100 z-10" 
                      : isFlagged 
                      ? "bg-amber-500 border-amber-500 text-white shadow-sm" 
                      : isDone 
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                      : "bg-white text-slate-400 border-slate-100 hover:border-blue-200 hover:text-blue-600"
                  )}
                >
                  <span className="relative top-[0.5px]">{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] sm:text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <div className="w-4 h-4 rounded bg-blue-600" />
            <span>Đã làm</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200" />
            <span>Chưa làm</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span>Đánh dấu</span>
          </div>
        </div>
      </div>

      {/* Answer Inputs List */}
      <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-slate-50/30">
        {parts.map(part => {
          const partQuestions = questions.filter(q => q.part === part.id);
          if (partQuestions.length === 0) return null;

          return (
            <div key={part.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-blue-600 whitespace-nowrap">{part.label} - {part.subLabel}</span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>
              
              <div className="space-y-3">
                {partQuestions.map((q) => {
                  const idx = questions.findIndex(item => item.id === q.id);
                  const isCurrent = currentIdx === idx;
                  const answer = answers.find(a => a.questionId === q.id);

                  return (
                    <div 
                      key={q.id}
                      id={`q-input-${q.id}`}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-300 group",
                        isCurrent 
                          ? "bg-white border-blue-200 shadow-lg shadow-blue-50 ring-1 ring-blue-100" 
                          : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[70px]">
                          <span className={cn(
                            "text-sm font-bold transition-colors",
                            isCurrent ? "text-blue-600" : "text-slate-700"
                          )}>
                            Câu {idx + 1}
                          </span>
                          <button 
                            onClick={() => onToggleFlag(q.id)}
                            className={cn(
                              "p-1 rounded-md transition-colors",
                              flaggedQuestions.includes(q.id) ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:bg-slate-100"
                            )}
                          >
                            <Bookmark className={cn("w-3.5 h-3.5", flaggedQuestions.includes(q.id) && "fill-current")} />
                          </button>
                        </div>

                        <div className="flex-1">
                          {q.type === 'single_choice' && (
                            <div className="flex items-center gap-3 max-w-[300px]">
                              {['A', 'B', 'C', 'D'].map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => onAnswerChange(q.id, { selectedOption: opt })}
                                  className={cn(
                                    "w-10 h-10 rounded-xl border-2 font-bold transition-all text-sm flex items-center justify-center relative",
                                    answer?.selectedOption === opt 
                                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-105" 
                                      : "border-slate-100 bg-slate-50 text-slate-400 hover:border-blue-200 hover:text-blue-600 hover:bg-white"
                                  )}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}

                          {q.type === 'true_false' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {['a', 'b', 'c', 'd'].map(sub => (
                                <div key={sub} className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                  <span className="text-[10px] font-black text-slate-400 uppercase mb-2 block">{sub}</span>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => onAnswerChange(q.id, { 
                                        trueFalseAnswers: { ...answer?.trueFalseAnswers, [sub]: true } 
                                      })}
                                      className={cn(
                                        "h-8 rounded-md text-xs font-bold transition-all border flex items-center justify-center",
                                        answer?.trueFalseAnswers?.[sub] === true
                                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                                          : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
                                      )}
                                    >
                                      Đ
                                    </button>
                                    <button
                                      onClick={() => onAnswerChange(q.id, { 
                                        trueFalseAnswers: { ...answer?.trueFalseAnswers, [sub]: false } 
                                      })}
                                      className={cn(
                                        "h-8 rounded-md text-xs font-bold transition-all border flex items-center justify-center",
                                        answer?.trueFalseAnswers?.[sub] === false
                                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                                          : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
                                      )}
                                    >
                                      S
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {q.type === 'short_answer' && (
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Nhập đáp án của bạn..."
                                value={answer?.shortAnswer || ''}
                                onChange={(e) => onAnswerChange(q.id, { shortAnswer: e.target.value })}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { useApp } from '../../context/AppContext';
import { ApiError, examApi, uploadApi } from '../../lib/api';
import { 
  ArrowDown,
  ArrowUp,
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  FileUp,
  FileText,
  FileCode,
  ImageIcon,
  Info,
  KeyRound,
  ListChecks,
  MessageSquare,
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getImageUrl } from '../../lib/utils';
import { Exam } from '../../types';

type ExamDraft = Partial<Exam> & {
  pdfUrl?: string;
};

const loadPdfJs = async () => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  return pdfjsLib;
};

const renderPdfToImageFiles = async (
  file: File,
  onProgress?: (page: number, total: number) => void
): Promise<File[]> => {
  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const renderedFiles: File[] = [];
  const safeBaseName = file.name.replace(/\.pdf$/i, '').replace(/[^\w.-]+/g, '-');

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress?.(pageNumber, pdf.numPages);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.8 });
    const canvas = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');

    if (!canvasContext) {
      throw new Error('Không thể tạo canvas để đọc PDF.');
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvas, canvasContext, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) {
          resolve(value);
        } else {
          reject(new Error('Không thể xuất trang PDF thành ảnh.'));
        }
      }, 'image/png', 0.92);
    });

    renderedFiles.push(new File([blob], `${safeBaseName}-page-${pageNumber}.png`, { type: 'image/png' }));
  }

  return renderedFiles;
};

const getUploadErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'Backend Render đang phản hồi không ổn định. Hệ thống đã thử lại nhiều lần, vui lòng bấm tải lại sau vài giây.';
    }

    if (
      error.message.includes('Production uploads must use Supabase Storage') ||
      error.message.includes('Supabase Storage is not configured')
    ) {
      return 'Backend Render chưa cấu hình Supabase Storage. Cần đặt UPLOAD_STORAGE=supabase và các biến SUPABASE_STORAGE_* trên Render trước khi upload.';
    }

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const ExamManagement: React.FC = () => {
  const { exams, deleteExam, addExam, updateExam, addNotification } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editForm, setEditForm] = useState<ExamDraft>({});
  const [activeTab, setActiveTab] = useState<'info' | 'file' | 'structure' | 'answers' | 'explanations'>('info');
  const [editTab, setEditTab] = useState<'info' | 'file' | 'structure' | 'answers' | 'explanations'>('info');
  const [structureCounts, setStructureCounts] = useState({ part1: 12, part2: 4, part3: 6 });
  const [editStructureCounts, setEditStructureCounts] = useState({ part1: 12, part2: 4, part3: 6 });
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form State
  const [newExam, setNewExam] = useState<ExamDraft>({
    title: '',
    examCode: '',
    durationMinutes: 90,
    subjectId: 'math',
    status: 'published',
    imagePages: [],
    questionStructure: [],
    answerKey: {},
    explanations: {},
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showImportJsonModal, setShowImportJsonModal] = useState(false);
  const [importJsonValue, setImportJsonValue] = useState('');
  const [importTarget, setImportTarget] = useState<'new' | 'edit'>('new');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  const filteredExams = (exams || []).filter(e => 
    (
      (e.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.examCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) &&
    (subjectFilter === 'all' || e.subjectId === subjectFilter)
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đề thi này?')) {
      try {
        await deleteExam(id);
      } catch (error) {
        console.error('Failed to delete exam', error);
      }
    }
  };

  const countStructureParts = (questions: Exam['questionStructure'] = []) => ({
    part1: questions.filter(q => q.part === 1).length,
    part2: questions.filter(q => q.part === 2).length,
    part3: questions.filter(q => q.part === 3).length,
  });

  const buildQuestionStructure = (
    counts: typeof structureCounts,
    examId?: string,
    existing: Exam['questionStructure'] = []
  ) => {
    const structure: any[] = [];
    let qIdx = 1;

    const pushQuestion = (type: NonNullable<Exam['questionStructure']>[number]['type'], part: number, extra: Record<string, unknown> = {}) => {
      const existingQuestion = existing.find(q => q.part === part && q.label === `Câu ${qIdx}`) || existing[qIdx - 1];
      structure.push({
        id: existingQuestion?.id || (examId ? `${examId}-q${qIdx}` : `q${qIdx}`),
        questionNumber: qIdx,
        type,
        label: `Câu ${qIdx}`,
        part,
        ...extra,
      });
      qIdx += 1;
    };

    for (let i = 0; i < counts.part1; i++) {
      pushQuestion('single_choice', 1, { options: ['A', 'B', 'C', 'D'] });
    }
    for (let i = 0; i < counts.part2; i++) {
      pushQuestion('true_false', 2, { subQuestions: ['a', 'b', 'c', 'd'] });
    }
    for (let i = 0; i < counts.part3; i++) {
      pushQuestion('short_answer', 3);
    }

    return structure;
  };

  const startEditExam = async (exam: Exam) => {
    setEditingExam(exam);
    setEditTab('info');
    setEditForm({
      title: exam.title,
      examCode: exam.examCode,
      subjectId: exam.subjectId,
      durationMinutes: exam.durationMinutes,
      status: exam.status,
      imagePages: exam.imagePages || [],
      questionStructure: exam.questionStructure || [],
      answerKey: exam.answerKey || {},
      explanations: exam.explanations || {},
    });
    setEditStructureCounts(countStructureParts(exam.questionStructure || []));
    setIsLoadingEdit(true);
    try {
      const fullExam = await examApi.getAdminById(exam.id);
      setEditingExam(fullExam);
      setEditForm({
        ...fullExam,
        imagePages: fullExam.imagePages || [],
        questionStructure: fullExam.questionStructure || [],
        answerKey: fullExam.answerKey || {},
        explanations: fullExam.explanations || {},
      });
      setEditStructureCounts(countStructureParts(fullExam.questionStructure || []));
    } catch (err) {
      console.error('Failed to load exam for editing', err);
      addNotification({
        title: 'Lỗi',
        message: 'Không thể tải đầy đủ dữ liệu đề thi để sửa.',
        type: 'error',
      });
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleUpdateExam = async () => {
    if (!editingExam) return;

    const nextExam = {
      ...editingExam,
      ...editForm,
      durationMinutes: Number(editForm.durationMinutes || editingExam.durationMinutes),
    } as Exam;

    const previousEditingExam = editingExam;
    const previousEditForm = editForm;

    setIsUpdating(true);
    setEditingExam(null);
    setEditForm({});
    try {
      await updateExam(nextExam);
    } catch (err) {
      console.error('Failed to update exam', err);
      setEditingExam(previousEditingExam);
      setEditForm(previousEditForm);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateExam = async () => {
    const errors: string[] = [];

    // 1. Basic Info
    if (!newExam.title?.trim()) errors.push('Tên đề thi không được để trống');
    if (!newExam.examCode?.trim()) errors.push('Mã đề không được để trống');
    if (!newExam.subjectId) errors.push('Chưa chọn môn học');

    // 2. File/Images
    if ((newExam.imagePages || []).length === 0) {
      errors.push('Vui lòng tải PDF hoặc ảnh trang đề (Phần "File đề thi")');
    }

    // 3. Question Structure & Answers
    const questions = newExam.questionStructure || [];
    if (questions.length === 0) {
      errors.push('Chưa có cấu trúc câu hỏi (Phần "Cấu trúc")');
    } else {
      const missingAnswers: string[] = [];
      questions.forEach(q => {
        const answer = newExam.answerKey?.[q.id];
        
        if (q.part === 1) {
          if (!answer) missingAnswers.push(q.label);
        } else if (q.part === 2) {
          const subKeys = ['a', 'b', 'c', 'd'];
          const subAnswers = (answer as any) || {};
          const missingSub = subKeys.filter(k => subAnswers[k] === undefined || subAnswers[k] === null);
          if (missingSub.length > 0) {
            missingAnswers.push(`${q.label} (thiếu ý ${missingSub.join(', ')})`);
          }
        } else if (q.part === 3) {
          if (!answer || String(answer).trim() === '') missingAnswers.push(q.label);
        }
      });

      if (missingAnswers.length > 0) {
        errors.push(`Thiếu đáp án cho các câu: ${missingAnswers.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      addNotification({
        title: 'Thông tin chưa đầy đủ',
        message: (
          <div className="space-y-2 mt-2">
            <p className="font-bold text-rose-600">Vui lòng hoàn thiện các mục sau:</p>
            <ul className="list-disc list-inside text-xs space-y-1 text-slate-600">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        ) as any,
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const examId = `ex-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const exam: Exam = {
        ...newExam as Exam,
        id: examId,
        questionStructure: (newExam.questionStructure || []).map(q => ({
          ...q,
          id: q.id.includes('q') ? `${examId}-${q.id}` : q.id 
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Correct IDs in answer key
      const finalAnswerKey: any = {};
      (newExam.questionStructure || []).forEach(q => {
        const oldId = q.id;
        const newId = oldId.includes('q') ? `${examId}-${oldId}` : oldId;
        if (newExam.answerKey?.[oldId]) {
          finalAnswerKey[newId] = newExam.answerKey[oldId];
        }
      });
      exam.answerKey = finalAnswerKey;

      await addExam(exam);
      setShowCreateModal(false);
      
      // Reset form
      setNewExam({
        title: '',
        examCode: '',
        durationMinutes: 90,
        subjectId: 'math',
        status: 'published',
        imagePages: [],
        questionStructure: [],
        answerKey: {},
        explanations: {},
      });
      setActiveTab('info');
      setUploadStatus('');
    } catch (err) {
      console.error(err);
      alert('Không thể tạo đề thi. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openImportModal = (target: 'new' | 'edit') => {
    setImportTarget(target);
    setImportJsonValue('');
    setShowImportJsonModal(true);
  };

  const handleImportJson = () => {
    if (!importJsonValue.trim()) return;

    try {
      const data = JSON.parse(importJsonValue);
      
      let importedAnswers = {};
      let importedExplanations = {};

      if (data.answers) {
        importedAnswers = data.answers;
        importedExplanations = data.explanations || {};
      } else {
        importedAnswers = data;
      }

      if (importTarget === 'new') {
        setNewExam(prev => ({
          ...prev,
          answerKey: { ...prev.answerKey, ...importedAnswers },
          explanations: { ...prev.explanations, ...importedExplanations }
        }));
      } else {
        setEditForm(prev => ({
          ...prev,
          answerKey: { ...prev.answerKey, ...importedAnswers },
          explanations: { ...prev.explanations, ...importedExplanations }
        }));
      }

      addNotification({
        title: 'Thành công',
        message: 'Đã cập nhật dữ liệu từ đoạn mã JSON.',
        type: 'success'
      });
      setShowImportJsonModal(false);
    } catch (err) {
      addNotification({
        title: 'Lỗi',
        message: 'Mã JSON không hợp lệ. Vui lòng kiểm tra lại.',
        type: 'error'
      });
    }
  };

  const handlePasteImage = async (e: React.ClipboardEvent<HTMLTextAreaElement>, questionId: string, isEdit: boolean = false) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;

        try {
          addNotification({ title: 'Đang tải...', message: 'Đang xử lý ảnh từ bộ nhớ tạm...', type: 'info' });
          const upload = await uploadApi.file(file);
          const imageUrl = getImageUrl(upload.url);
          const markdownImg = `\n![Giải thích](${imageUrl})\n`;
          
          if (isEdit) {
            setEditForm(prev => ({
              ...prev,
              explanations: {
                ...prev.explanations,
                [questionId]: (prev.explanations?.[questionId] || '') + markdownImg
              }
            }));
          } else {
            setNewExam(prev => ({
              ...prev,
              explanations: {
                ...prev.explanations,
                [questionId]: (prev.explanations?.[questionId] || '') + markdownImg
              }
            }));
          }
        } catch (err) {
          addNotification({ title: 'Lỗi', message: getUploadErrorMessage(err, 'Không thể tải ảnh dán lên.'), type: 'error' });
        }
      }
    }
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Đang tải PDF gốc...');
    try {
      const pdfUpload = await uploadApi.file(file);
      setUploadStatus('Đang chuyển PDF thành ảnh trang đề...');
      const pageFiles = await renderPdfToImageFiles(file, (page, total) => {
        setUploadStatus(`Đang đọc trang ${page}/${total}...`);
      });

      setUploadStatus(`Đang tải ${pageFiles.length} ảnh trang đề...`);
      const uploadedPages = await Promise.all(pageFiles.map(pageFile => uploadApi.file(pageFile)));

      setNewExam(prev => ({
        ...prev,
        pdfUrl: pdfUpload.url,
        imagePages: [...(prev.imagePages || []), ...uploadedPages.map(page => page.url)],
      }));
      addNotification({
        title: 'Thành công',
        message: `Đã tải PDF và tạo ${uploadedPages.length} ảnh trang đề để xem trước.`,
        type: 'success'
      });
    } catch (err) {
      console.error('PDF upload/render failed', err);
      addNotification({
        title: 'Lỗi',
        message: getUploadErrorMessage(err, 'Không thể xử lý PDF. Vui lòng kiểm tra file hoặc thử upload ảnh trang đề.'),
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadStatus(`Đang tải ${files.length} ảnh trang đề...`);
    try {
      const imageFiles = Array.from(files) as File[];
      const uploadedPages = await Promise.all(imageFiles.map(file => uploadApi.file(file)));
      setNewExam(prev => ({
        ...prev,
        imagePages: [...(prev.imagePages || []), ...uploadedPages.map(page => page.url)]
      }));
      addNotification({
        title: 'Thành công',
        message: `Đã tải lên ${uploadedPages.length} ảnh trang đề thi.`,
        type: 'success'
      });
    } catch (err) {
      addNotification({
        title: 'Lỗi',
        message: getUploadErrorMessage(err, 'Không thể tải lên một số ảnh'),
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Đang tải PDF gốc...');
    try {
      const pdfUpload = await uploadApi.file(file);
      setUploadStatus('Đang chuyển PDF thành ảnh trang đề...');
      const pageFiles = await renderPdfToImageFiles(file, (page, total) => {
        setUploadStatus(`Đang đọc trang ${page}/${total}...`);
      });

      setUploadStatus(`Đang tải ${pageFiles.length} ảnh trang đề...`);
      const uploadedPages = await Promise.all(pageFiles.map(pageFile => uploadApi.file(pageFile)));

      setEditForm(prev => ({
        ...prev,
        pdfUrl: pdfUpload.url,
        imagePages: uploadedPages.map(page => page.url),
      }));
      addNotification({
        title: 'Thành công',
        message: `Đã thay file đề và tạo ${uploadedPages.length} ảnh trang đề.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Edit PDF upload/render failed', err);
      addNotification({
        title: 'Lỗi',
        message: getUploadErrorMessage(err, 'Không thể xử lý PDF mới.'),
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadStatus(`Đang tải ${files.length} ảnh trang đề...`);
    try {
      const imageFiles = Array.from(files) as File[];
      const uploadedPages = await Promise.all(imageFiles.map(file => uploadApi.file(file)));
      setEditForm(prev => ({
        ...prev,
        imagePages: [...(prev.imagePages || []), ...uploadedPages.map(page => page.url)]
      }));
      addNotification({
        title: 'Thành công',
        message: `Đã thêm ${uploadedPages.length} ảnh trang đề.`,
        type: 'success'
      });
    } catch (err) {
      addNotification({
        title: 'Lỗi',
        message: getUploadErrorMessage(err, 'Không thể tải lên một số ảnh.'),
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (editImageInputRef.current) editImageInputRef.current.value = '';
    }
  };

  const generateStructure = (part1: number, part2: number, part3: number) => {
    setNewExam(prev => ({ ...prev, questionStructure: buildQuestionStructure({ part1, part2, part3 }) }));
    return;
    const structure: any[] = [];
    let qIdx = 1;

    // Part I
    for (let i = 0; i < part1; i++) {
      structure.push({
        id: `q${qIdx}`,
        type: 'single_choice',
        label: `Câu ${qIdx}`,
        part: 1,
        options: ['A', 'B', 'C', 'D']
      });
      qIdx++;
    }

    // Part II
    for (let i = 0; i < part2; i++) {
      structure.push({
        id: `q${qIdx}`,
        type: 'true_false',
        label: `Câu ${qIdx}`,
        part: 2,
        subQuestions: ['a', 'b', 'c', 'd']
      });
      qIdx++;
    }

    // Part III
    for (let i = 0; i < part3; i++) {
      structure.push({
        id: `q${qIdx}`,
        type: 'short_answer',
        label: `Câu ${qIdx}`,
        part: 3
      });
      qIdx++;
    }

    setNewExam(prev => ({ ...prev, questionStructure: structure }));
  };

  const openCreateModal = () => {
    const counts = { part1: 12, part2: 4, part3: 6 };
    setStructureCounts(counts);
    generateStructure(counts.part1, counts.part2, counts.part3);
    setShowCreateModal(true);
    setActiveTab('info');
  };

  const updateStructureCount = (key: keyof typeof structureCounts, value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    const nextCounts = { ...structureCounts, [key]: safeValue };
    setStructureCounts(nextCounts);
    generateStructure(nextCounts.part1, nextCounts.part2, nextCounts.part3);
  };

  const updateEditStructureCount = (key: keyof typeof editStructureCounts, value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    const nextCounts = { ...editStructureCounts, [key]: safeValue };
    setEditStructureCounts(nextCounts);
    setEditForm(prev => ({
      ...prev,
      questionStructure: buildQuestionStructure(nextCounts, editingExam?.id, prev.questionStructure || []),
    }));
  };

  const removePage = (index: number) => {
    setNewExam(prev => ({ ...prev, imagePages: prev.imagePages?.filter((_, i) => i !== index) || [] }));
  };

  const removeEditPage = (index: number) => {
    setEditForm(prev => ({ ...prev, imagePages: prev.imagePages?.filter((_, i) => i !== index) || [] }));
  };

  const movePage = (index: number, direction: -1 | 1) => {
    setNewExam(prev => {
      const pages = [...(prev.imagePages || [])];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= pages.length) return prev;
      [pages[index], pages[nextIndex]] = [pages[nextIndex], pages[index]];
      return { ...prev, imagePages: pages };
    });
  };

  const moveEditPage = (index: number, direction: -1 | 1) => {
    setEditForm(prev => {
      const pages = [...(prev.imagePages || [])];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= pages.length) return prev;
      [pages[index], pages[nextIndex]] = [pages[nextIndex], pages[index]];
      return { ...prev, imagePages: pages };
    });
  };

  const handleNextTab = () => {
    if (activeTab === 'file' && (newExam.imagePages || []).length === 0) {
      alert('Vui lòng tải PDF hoặc thêm ít nhất một ảnh trang đề trước khi tiếp tục.');
      return;
    }

    const tabs: Array<typeof activeTab> = ['info', 'file', 'structure', 'answers', 'explanations'];
    const nextIdx = tabs.indexOf(activeTab) + 1;
    const nextTab = tabs[nextIdx];
    if (nextTab) setActiveTab(nextTab);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý đề thi</h1>
          <p className="text-slate-500 font-medium">Danh sách tất cả các đề thi trong hệ thống</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Tạo đề thi mới
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tiêu đề hoặc mã đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none font-medium"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors">
            <Filter className="w-4 h-4" />
            Bộ lọc
          </button>
          <select 
            value={subjectFilter}
            className="flex-1 md:flex-none px-4 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors outline-none cursor-pointer"
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="all">Tất cả môn học</option>
            <option value="math">Toán học</option>
            <option value="literature">Ngữ văn</option>
            <option value="english">Tiếng Anh</option>
            <option value="biology">Sinh học</option>
            <option value="chemistry">Hóa học</option>
            <option value="physics">Vật lý</option>
            <option value="other">Môn khác</option>
          </select>
        </div>
      </div>

      {/* Exam List Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Đề thi</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Môn học</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{exam.title}</p>
                        <p className="text-xs text-slate-500 font-medium">Mã đề: {exam.examCode} • {exam.durationMinutes} phút</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                      {exam.subjectId === 'math' ? 'Toán học' : 
                       exam.subjectId === 'literature' ? 'Ngữ văn' :
                       exam.subjectId === 'english' ? 'Tiếng Anh' :
                       exam.subjectId === 'biology' ? 'Sinh học' :
                       exam.subjectId === 'chemistry' ? 'Hóa học' :
                       exam.subjectId === 'physics' ? 'Vật lý' : 'Môn khác'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        exam.status === 'published' ? 'bg-emerald-500' : 
                        exam.status === 'draft' ? 'bg-amber-500' : 'bg-slate-400'
                      )} />
                      <span className={cn(
                        "text-sm font-bold",
                        exam.status === 'published' ? 'text-emerald-600' : 
                        exam.status === 'draft' ? 'text-amber-600' : 'text-slate-500'
                      )}>
                        {exam.status === 'published' ? 'Đã xuất bản' : 
                         exam.status === 'draft' ? 'Bản nháp' : 'Đã ẩn'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-slate-500 font-medium">
                      {new Date(exam.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => window.open(`/exam/${exam.id}`, '_blank', 'noopener,noreferrer')}
                        className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                        title="Xem đề"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startEditExam(exam)}
                        className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                        title="Sửa thông tin"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(exam.id)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Exam Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Thêm đề thi mới</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-6 border-b border-slate-100 bg-slate-50/50">
                {[
                  { id: 'info', label: 'Thông tin' },
                  { id: 'file', label: 'File đề thi' },
                  { id: 'structure', label: 'Cấu trúc' },
                  { id: 'answers', label: 'Đáp án' },
                  { id: 'explanations', label: 'Lời giải' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "px-6 py-4 text-sm font-bold transition-all border-b-2 relative",
                      activeTab === tab.id 
                        ? "text-blue-600 border-blue-600" 
                        : "text-slate-400 border-transparent hover:text-slate-600"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'info' && (
                  <div className="space-y-6 max-w-2xl">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Tên đề thi *</label>
                      <input 
                        type="text"
                        placeholder="VD: Đề thi thử THPT Lần 1 - Hưng Yên 2025-2026"
                        value={newExam.title}
                        onChange={e => setNewExam(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none font-bold text-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Môn học *</label>
                      <select 
                        value={newExam.subjectId}
                        onChange={e => setNewExam(prev => ({ ...prev, subjectId: e.target.value as any }))}
                        className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none font-bold text-slate-700"
                      >
                        <option value="math">Toán học</option>
                        <option value="literature">Ngữ văn</option>
                        <option value="english">Tiếng Anh</option>
                        <option value="biology">Sinh học</option>
                        <option value="chemistry">Hóa học</option>
                        <option value="physics">Vật lý</option>
                        <option value="other">Môn khác</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Mã đề</label>
                        <input 
                          type="text"
                          placeholder="VD: 0101"
                          value={newExam.examCode}
                          onChange={e => setNewExam(prev => ({ ...prev, examCode: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none font-bold text-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Thời gian (phút)</label>
                        <input 
                          type="number"
                          value={newExam.durationMinutes}
                          onChange={e => setNewExam(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none font-bold text-slate-700"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors cursor-pointer",
                        newExam.status === 'published' ? 'bg-blue-600' : 'bg-slate-300'
                      )} onClick={() => setNewExam(prev => ({ ...prev, status: prev.status === 'published' ? 'draft' : 'published' }))}>
                        <div className={cn(
                          "w-4 h-4 bg-white rounded-full transition-transform",
                          newExam.status === 'published' ? 'translate-x-6' : 'translate-x-0'
                        )} />
                      </div>
                      <span className="text-sm font-bold text-blue-900">Xuất bản (học sinh có thể thấy)</span>
                    </div>
                  </div>
                )}

                {activeTab === 'file' && (
                  <div className="space-y-8 max-w-5xl">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 block">File đề thi (PDF)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="URL file PDF..."
                          value={(newExam as any).pdfUrl || ''}
                          onChange={e => setNewExam(prev => ({ ...prev, pdfUrl: e.target.value }))}
                          className="flex-1 px-4 py-3 bg-white border-slate-200 rounded-xl outline-none font-medium"
                        />
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept=".pdf"
                          onChange={handleFileUpload}
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {isUploading ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FileUp className="w-4 h-4" />
                          )}
                          Tải lên PDF
                        </button>
                      </div>
                      {uploadStatus && (
                        <p className="mt-3 text-sm font-bold text-blue-600">{uploadStatus}</p>
                      )}
                    </div>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 block">Ảnh trang đề ({newExam.imagePages?.length || 0} trang)</label>
                      <div className="flex gap-2 mb-4">
                        <input 
                          type="text"
                          placeholder="Hoặc dán URL ảnh..."
                          className="flex-1 px-4 py-3 bg-white border-slate-200 rounded-xl outline-none font-medium"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const url = (e.target as HTMLInputElement).value;
                              if (url) {
                                setNewExam(prev => ({ ...prev, imagePages: [...(prev.imagePages || []), url] }));
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <input 
                          type="file" 
                          ref={imageInputRef} 
                          className="hidden" 
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                        />
                        <button 
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isUploading}
                          className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {isUploading ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          Tải ảnh
                        </button>
                      </div>
                      {(newExam.imagePages?.length || 0) > 0 && (
                        <div className="mb-4 flex justify-end">
                          <button
                            onClick={() => setNewExam(prev => ({ ...prev, imagePages: [] }))}
                            className="text-sm font-bold text-rose-600 hover:text-rose-700"
                          >
                            Xóa tất cả trang
                          </button>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {newExam.imagePages?.map((img, idx) => (
                          <div key={`${img}-${idx}`} className="relative group aspect-[3/4] bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="absolute left-2 top-2 z-10 rounded-lg bg-slate-900/80 px-2 py-1 text-xs font-black text-white">
                              Trang {idx + 1}
                            </div>
                            <img src={getImageUrl(img)} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => movePage(idx, -1)}
                                disabled={idx === 0}
                                className="p-1 bg-white text-slate-600 rounded-lg disabled:opacity-40"
                                title="Đưa trang lên trước"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => movePage(idx, 1)}
                                disabled={idx === (newExam.imagePages?.length || 0) - 1}
                                className="p-1 bg-white text-slate-600 rounded-lg disabled:opacity-40"
                                title="Đưa trang xuống sau"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removePage(idx)}
                                className="p-1 bg-rose-500 text-white rounded-lg"
                                title="Xóa trang này"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {(newExam.imagePages?.length || 0) === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-400">
                          Chưa có ảnh trang đề. Hãy tải PDF để hệ thống tự tạo ảnh xem trước, hoặc tải ảnh từng trang.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'structure' && (
                  <div className="space-y-6 max-w-2xl">
                    {[
                      { id: 'I', label: 'Trắc nghiệm (A/B/C/D)', title: 'Câu trắc nghiệm nhiều phương án lựa chọn', count: structureCounts.part1, key: 'part1' as const },
                      { id: 'II', label: 'Đúng/Sai (a,b,c,d)', title: 'Câu trắc nghiệm đúng sai', count: structureCounts.part2, key: 'part2' as const },
                      { id: 'III', label: 'Trả lời ngắn', title: 'Câu trả lời ngắn', count: structureCounts.part3, key: 'part3' as const },
                    ].map(part => (
                      <div key={part.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">ID Phần (I, II, III...)</label>
                            <input type="text" defaultValue={part.id} className="w-full px-4 py-3 bg-white border-slate-200 rounded-xl outline-none font-bold text-slate-700" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Số câu hỏi</label>
                            <input
                              type="number"
                              min={0}
                              value={part.count}
                              onChange={(event) => updateStructureCount(part.key, Number(event.target.value))}
                              className="w-full px-4 py-3 bg-white border-slate-200 rounded-xl outline-none font-bold text-slate-700"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Loại câu hỏi</label>
                          <select className="w-full px-4 py-3 bg-white border-slate-200 rounded-xl outline-none font-bold text-slate-700">
                            <option>{part.label}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Tên phần</label>
                          <input type="text" defaultValue={part.title} className="w-full px-4 py-3 bg-white border-slate-200 rounded-xl outline-none font-bold text-slate-700" />
                        </div>
                      </div>
                    ))}
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <p className="text-xs font-bold text-blue-900">Điểm Đúng/Sai theo số ý đúng: 0→0đ, 1→0.1đ, 2→0.25đ, 3→0.5đ, 4→1.0đ</p>
                    </div>
                  </div>
                )}

                {activeTab === 'answers' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Nhập đáp án</h3>
                      <button 
                        onClick={() => openImportModal('new')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                      >
                        <FileCode className="w-4 h-4" />
                        Import JSON
                      </button>
                    </div>

                    <div className="space-y-8">
                      {/* Part I Answers */}
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <h4 className="font-black text-slate-900 mb-6">Phần I</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {newExam.questionStructure?.filter(q => q.part === 1).map(q => (
                            <div key={q.id} className="flex items-center gap-3">
                              <span className="text-sm font-bold text-slate-400 w-12">{q.label}</span>
                              <div className="flex gap-1">
                                {['A', 'B', 'C', 'D'].map(opt => (
                                  <button
                                    key={opt}
                                    onClick={() => setNewExam(prev => ({
                                      ...prev,
                                      answerKey: { ...prev.answerKey, [q.id]: opt }
                                    }))}
                                    className={cn(
                                      "w-8 h-8 rounded-full border-2 font-black text-xs flex items-center justify-center transition-all",
                                      newExam.answerKey?.[q.id] === opt
                                        ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                        : "bg-white border-slate-200 text-slate-400 hover:border-blue-300"
                                    )}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Part II Answers */}
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <h4 className="font-black text-slate-900 mb-6">Phần II</h4>
                        <div className="space-y-6">
                          {newExam.questionStructure?.filter(q => q.part === 2).map(q => (
                            <div key={q.id} className="p-4 bg-white rounded-2xl border border-slate-100">
                              <p className="text-sm font-black text-slate-900 mb-4">{q.label}</p>
                              <div className="grid grid-cols-4 gap-4">
                                {['a', 'b', 'c', 'd'].map(sub => (
                                  <div key={sub} className="flex flex-col items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase">{sub}</span>
                                    <div className="flex gap-1 w-full">
                                      <button
                                        onClick={() => setNewExam(prev => ({
                                          ...prev,
                                          answerKey: {
                                            ...prev.answerKey,
                                            [q.id]: { ...(prev.answerKey?.[q.id] || {}), [sub]: true }
                                          }
                                        }))}
                                        className={cn(
                                          "flex-1 h-8 rounded-lg border-2 font-black text-xs flex items-center justify-center transition-all",
                                          newExam.answerKey?.[q.id]?.[sub] === true
                                            ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                            : "bg-white border-slate-200 text-slate-400 hover:border-blue-300"
                                        )}
                                      >
                                        Đ
                                      </button>
                                      <button
                                        onClick={() => setNewExam(prev => ({
                                          ...prev,
                                          answerKey: {
                                            ...prev.answerKey,
                                            [q.id]: { ...(prev.answerKey?.[q.id] || {}), [sub]: false }
                                          }
                                        }))}
                                        className={cn(
                                          "flex-1 h-8 rounded-lg border-2 font-black text-xs flex items-center justify-center transition-all",
                                          newExam.answerKey?.[q.id]?.[sub] === false
                                            ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                            : "bg-white border-slate-200 text-slate-400 hover:border-blue-300"
                                        )}
                                      >
                                        S
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Part III Answers */}
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <h4 className="font-black text-slate-900 mb-6">Phần III</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {newExam.questionStructure?.filter(q => q.part === 3).map(q => (
                            <div key={q.id} className="flex items-center gap-4">
                              <span className="text-sm font-bold text-slate-400 w-12">{q.label}</span>
                              <input 
                                type="text"
                                placeholder="Đáp án..."
                                value={newExam.answerKey?.[q.id] || ''}
                                onChange={e => setNewExam(prev => ({
                                  ...prev,
                                  answerKey: { ...prev.answerKey, [q.id]: e.target.value }
                                }))}
                                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-blue-500 transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'explanations' && (
                  <div className="space-y-8">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Lời giải chi tiết</h3>
                    <div className="space-y-4">
                      {newExam.questionStructure?.map(q => (
                        <div key={q.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800">{q.label}</span>
                            <span className="text-[10px] font-black uppercase text-slate-400 bg-white px-3 py-1 rounded-full">{q.type}</span>
                          </div>
                          <textarea
                            placeholder="Nhập nội dung lời giải hoặc dán ảnh trực tiếp từ clipboard..."
                            value={newExam.explanations?.[q.id] || ''}
                            onPaste={(e) => handlePasteImage(e, q.id)}
                            onChange={e => setNewExam(prev => ({
                              ...prev,
                              explanations: { ...prev.explanations, [q.id]: e.target.value }
                            }))}
                            className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-medium focus:border-blue-300 transition-all min-h-[120px]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-8 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <div className="flex-1" />
                {activeTab !== 'explanations' ? (
                  <button 
                    onClick={handleNextTab}
                    className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                  >
                    Tiếp theo
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={handleCreateExam}
                    disabled={isSubmitting}
                    className={cn(
                      "px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg flex items-center gap-2",
                      isSubmitting 
                        ? "bg-blue-400 cursor-not-allowed" 
                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-200 active:scale-95"
                    )}
                  >
                    {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {isSubmitting ? 'Đang tạo đề...' : 'Tạo đề thi'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingExam(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="shrink-0 border-b border-slate-100 bg-white p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sửa đầy đủ đề thi</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-400">Cập nhật thông tin, file đề, cấu trúc, đáp án và lời giải trong một luồng.</p>
                </div>
                <button onClick={() => setEditingExam(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="shrink-0 flex gap-2 overflow-x-auto border-b border-slate-100 bg-white px-6 py-3">
                {[
                  { id: 'info', label: 'Thông tin', icon: Info },
                  { id: 'file', label: 'File đề', icon: ImageIcon },
                  { id: 'structure', label: 'Cấu trúc', icon: ListChecks },
                  { id: 'answers', label: 'Đáp án', icon: KeyRound },
                  { id: 'explanations', label: 'Lời giải', icon: MessageSquare },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setEditTab(tab.id as typeof editTab)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition-all",
                      editTab === tab.id ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto bg-white p-6 space-y-5">
                {isLoadingEdit && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                    Đang tải dữ liệu đầy đủ của đề thi...
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Tên đề thi</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(event) => setEditForm(prev => ({ ...prev, title: event.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none font-bold text-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Mã đề</label>
                    <input
                      type="text"
                      value={editForm.examCode || ''}
                      onChange={(event) => setEditForm(prev => ({ ...prev, examCode: event.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Thời gian</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.durationMinutes || 90}
                      onChange={(event) => setEditForm(prev => ({ ...prev, durationMinutes: Number(event.target.value) }))}
                      className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none font-bold text-slate-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Môn học</label>
                    <select
                      value={editForm.subjectId || 'math'}
                      onChange={(event) => setEditForm(prev => ({ ...prev, subjectId: event.target.value as any }))}
                      className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none font-bold text-slate-700"
                    >
                      <option value="math">Toán học</option>
                      <option value="literature">Ngữ văn</option>
                      <option value="english">Tiếng Anh</option>
                      <option value="biology">Sinh học</option>
                      <option value="chemistry">Hóa học</option>
                      <option value="physics">Vật lý</option>
                      <option value="other">Môn khác</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Trạng thái</label>
                    <select
                      value={editForm.status || 'draft'}
                      onChange={(event) => setEditForm(prev => ({ ...prev, status: event.target.value as any }))}
                      className="w-full px-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none font-bold text-slate-700"
                    >
                      <option value="published">Đã xuất bản</option>
                      <option value="draft">Bản nháp</option>
                      <option value="hidden">Đã ẩn</option>
                    </select>
                  </div>
                </div>
                {editTab === 'file' && (
                  <div className="space-y-6 border-t border-slate-100 pt-6">
                    <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-blue-500">Thay PDF đề thi</label>
                          <p className="text-xs font-semibold text-slate-400">Upload PDF mới sẽ tự tạo lại ảnh từng trang.</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 md:flex-row">
                        <input
                          type="text"
                          placeholder="URL file PDF..."
                          value={editForm.pdfUrl || ''}
                          onChange={e => setEditForm(prev => ({ ...prev, pdfUrl: e.target.value }))}
                          className="flex-1 rounded-2xl border border-blue-100 bg-white px-4 py-3 font-medium outline-none focus:border-blue-500"
                        />
                        <input type="file" ref={editFileInputRef} className="hidden" accept=".pdf" onChange={handleEditFileUpload} />
                        <button
                          onClick={() => editFileInputRef.current?.click()}
                          disabled={isUploading}
                          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
                        >
                          Tải PDF mới
                        </button>
                      </div>
                      {uploadStatus && <p className="mt-3 text-sm font-bold text-blue-600">{uploadStatus}</p>}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Ảnh trang đề ({editForm.imagePages?.length || 0} trang)</label>
                            <p className="text-xs font-semibold text-slate-400">Kéo thứ tự bằng nút lên/xuống hoặc dán URL ảnh ngoài.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditForm(prev => ({ ...prev, imagePages: [] }))}
                          className="text-sm font-black text-rose-600 hover:text-rose-700"
                        >
                          Xóa tất cả
                        </button>
                      </div>
                      <div className="mb-4 flex flex-col gap-2 md:flex-row">
                        <input
                          type="text"
                          placeholder="Dán URL ảnh rồi Enter..."
                          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:bg-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const url = (e.target as HTMLInputElement).value.trim();
                              if (url) {
                                setEditForm(prev => ({ ...prev, imagePages: [...(prev.imagePages || []), url] }));
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <input type="file" ref={editImageInputRef} className="hidden" accept="image/*" multiple onChange={handleEditImageUpload} />
                        <button
                          onClick={() => editImageInputRef.current?.click()}
                          disabled={isUploading}
                          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Tải ảnh
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {editForm.imagePages?.map((img, idx) => (
                          <div key={`${img}-${idx}`} className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                            <div className="absolute left-2 top-2 z-10 rounded-lg bg-slate-900/80 px-2 py-1 text-xs font-black text-white">Trang {idx + 1}</div>
                            <img src={getImageUrl(img)} alt={`Page ${idx + 1}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button type="button" onClick={() => moveEditPage(idx, -1)} disabled={idx === 0} className="rounded-lg bg-white p-1 text-slate-600 disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                              <button type="button" onClick={() => moveEditPage(idx, 1)} disabled={idx === (editForm.imagePages?.length || 0) - 1} className="rounded-lg bg-white p-1 text-slate-600 disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                              <button type="button" onClick={() => removeEditPage(idx)} className="rounded-lg bg-rose-500 p-1 text-white"><X className="h-4 w-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {editTab === 'structure' && (
                  <div className="grid gap-4 border-t border-slate-100 pt-6 md:grid-cols-3">
                    {[
                      { label: 'Phần I', key: 'part1' as const, help: 'A/B/C/D' },
                      { label: 'Phần II', key: 'part2' as const, help: 'Đúng/Sai' },
                      { label: 'Phần III', key: 'part3' as const, help: 'Trả lời ngắn' },
                    ].map(part => (
                      <div key={part.key} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                        <p className="text-sm font-black text-slate-900">{part.label}</p>
                        <p className="mb-3 text-xs font-bold text-slate-400">{part.help}</p>
                        <input
                          type="number"
                          min={0}
                          value={editStructureCounts[part.key]}
                          onChange={(event) => updateEditStructureCount(part.key, Number(event.target.value))}
                          className="w-full rounded-xl bg-white px-4 py-3 text-lg font-black text-slate-800 outline-none"
                        />
                      </div>
                    ))}
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-800 md:col-span-3">
                      Nếu đề đã có lượt làm bài, hệ thống sẽ chặn thay đổi số lượng/ID câu hỏi để không làm hỏng lịch sử bài làm.
                    </div>
                  </div>
                )}

                {editTab === 'answers' && (
                  <div className="space-y-5 border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Cập nhật đáp án</h3>
                      <button 
                        onClick={() => openImportModal('edit')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                      >
                        <FileCode className="w-4 h-4" />
                        Import JSON
                      </button>
                    </div>
                    {editForm.questionStructure?.map(q => (
                      <div key={q.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="font-black text-slate-800">{q.label}</span>
                          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-slate-400">{q.type}</span>
                        </div>
                        {q.type === 'single_choice' && (
                          <div className="mb-3 flex gap-2">
                            {['A', 'B', 'C', 'D'].map(opt => (
                              <button
                                key={opt}
                                onClick={() => setEditForm(prev => ({ ...prev, answerKey: { ...prev.answerKey, [q.id]: opt } }))}
                                className={cn(
                                  "h-9 w-9 rounded-xl border-2 text-sm font-black",
                                  editForm.answerKey?.[q.id] === opt ? "border-blue-600 bg-blue-600 text-white" : "border-slate-100 bg-white text-slate-400"
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                        {q.type === 'true_false' && (
                          <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                            {['a', 'b', 'c', 'd'].map(sub => (
                              <div key={sub} className="rounded-xl bg-white p-2">
                                <p className="mb-2 text-xs font-black uppercase text-slate-400">{sub}</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {[true, false].map(value => (
                                    <button
                                      key={String(value)}
                                      onClick={() => setEditForm(prev => ({
                                        ...prev,
                                        answerKey: {
                                          ...prev.answerKey,
                                          [q.id]: { ...(prev.answerKey?.[q.id] || {}), [sub]: value }
                                        }
                                      }))}
                                      className={cn(
                                        "h-8 rounded-lg text-xs font-black",
                                        editForm.answerKey?.[q.id]?.[sub] === value ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400"
                                      )}
                                    >
                                      {value ? 'Đ' : 'S'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === 'short_answer' && (
                          <input
                            type="text"
                            value={editForm.answerKey?.[q.id] || ''}
                            onChange={event => setEditForm(prev => ({ ...prev, answerKey: { ...prev.answerKey, [q.id]: event.target.value } }))}
                            className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold outline-none"
                            placeholder="Đáp án"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {editTab === 'explanations' && (
                  <div className="space-y-5 border-t border-slate-100 pt-6">
                    {editForm.questionStructure?.map(q => (
                      <div key={q.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="font-black text-slate-800">{q.label}</span>
                        </div>
                        <textarea
                          value={editForm.explanations?.[q.id] || ''}
                          onPaste={(e) => handlePasteImage(e, q.id, true)}
                          onChange={event => setEditForm(prev => ({ ...prev, explanations: { ...prev.explanations, [q.id]: event.target.value } }))}
                          className="min-h-32 w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-300 transition-all"
                          placeholder="Lời giải / ghi chú cho câu này (Có thể dán ảnh từ clipboard)"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="shrink-0 border-t border-slate-100 bg-slate-50/90 p-5 flex justify-end gap-3">
                <button
                  onClick={() => setEditingExam(null)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateExam}
                  disabled={isUpdating}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Import JSON Modal */}
      <AnimatePresence>
        {showImportJsonModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImportJsonModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Import Đáp án từ JSON</h2>
                    <p className="text-sm font-medium text-slate-500">Dán mã JSON cấu trúc đáp án và lời giải vào đây</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowImportJsonModal(false)} 
                  className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Mã JSON</label>
                  <div className="relative group">
                    <textarea 
                      value={importJsonValue}
                      onChange={e => setImportJsonValue(e.target.value)}
                      placeholder='{ "answers": { "q1": "A", "q2": { "a": true, "b": false... } } }'
                      className="w-full h-64 p-6 bg-slate-900 text-blue-100 font-mono text-sm rounded-3xl border-none focus:ring-4 focus:ring-blue-500/20 transition-all outline-none resize-none"
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-white/50 uppercase">JSON Format</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100/50">
                    <p className="text-[10px] font-black text-blue-900 uppercase tracking-wider mb-1">Mẹo</p>
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                      Bạn có thể copy cấu trúc đáp án từ các đề cũ để đẩy nhanh quá trình tạo đề mới.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-wider mb-1">Lưu ý</p>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                      Dữ liệu cũ sẽ bị ghi đè nếu trùng mã câu hỏi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0 flex gap-3">
                <button 
                  onClick={() => setShowImportJsonModal(false)}
                  className="flex-1 px-8 py-4 rounded-2xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleImportJson}
                  disabled={!importJsonValue.trim()}
                  className="flex-[2] px-8 py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  Xác nhận Import
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { Subject, Exam, Notification } from './types';

export const SUBJECTS: Subject[] = [
  { id: 'math', name: 'Toán học', icon: 'Calculator', color: 'bg-blue-500', description: 'Luyện tập các chuyên đề Giải tích và Hình học.' },
  { id: 'english', name: 'Tiếng Anh', icon: 'Languages', color: 'bg-indigo-500', description: 'Ngữ pháp, từ vựng và kỹ năng đọc hiểu.' },
  { id: 'physics', name: 'Vật lý', icon: 'Zap', color: 'bg-orange-500', description: 'Cơ học, Điện học, Quang học và Vật lý hạt nhân.' },
  { id: 'chemistry', name: 'Hóa học', icon: 'Beaker', color: 'bg-emerald-500', description: 'Hóa vô cơ và Hóa hữu cơ chuyên sâu.' },
  { id: 'biology', name: 'Sinh học', icon: 'Dna', color: 'bg-green-500', description: 'Di truyền học, Tiến hóa và Sinh thái học.' },
  { id: 'literature', name: 'Ngữ văn', icon: 'BookOpen', color: 'bg-rose-500', description: 'Phân tích tác phẩm và Nghị luận xã hội.' },
];

export const EXAMS: Exam[] = [
  {
    id: 'math-2025-0119',
    subjectId: 'math',
    title: 'Đề thi tốt nghiệp THPT 2025 - Mã đề 0119',
    examCode: '0119',
    durationMinutes: 90,
    imagePages: [
      'https://picsum.photos/seed/exam1/1200/1600',
      'https://picsum.photos/seed/exam2/1200/1600',
      'https://picsum.photos/seed/exam3/1200/1600',
      'https://picsum.photos/seed/exam4/1200/1600'
    ],
    questionStructure: [
      // Part 1: Single Choice (1-12)
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `q${i + 1}`,
        type: 'single_choice' as const,
        label: `Câu ${i + 1}`,
        part: 1,
        options: ['A', 'B', 'C', 'D']
      })),
      // Part 2: True/False (13-16)
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `q${i + 13}`,
        type: 'true_false' as const,
        label: `Câu ${i + 13}`,
        part: 2,
        subQuestions: ['a', 'b', 'c', 'd']
      })),
      // Part 3: Short Answer (17-22)
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `q${i + 17}`,
        type: 'short_answer' as const,
        label: `Câu ${i + 17}`,
        part: 3
      }))
    ],
    answerKey: {
      'q1': 'C', 'q2': 'C', 'q3': 'D', 'q4': 'A', 'q5': 'A', 'q6': 'A',
      'q7': 'A', 'q8': 'A', 'q9': 'D', 'q10': 'D', 'q11': 'C', 'q12': 'A',
      'q13': { 'a': true, 'b': false, 'c': false, 'd': true },
      'q14': { 'a': true, 'b': false, 'c': true, 'd': false },
      'q15': { 'a': false, 'b': true, 'c': true, 'd': false },
      'q16': { 'a': true, 'b': true, 'c': false, 'd': false },
      'q17': '3780', 'q18': '95.3', 'q19': '2.08', 'q20': '2150', 'q21': '2016', 'q22': '1808'
    },
    explanations: {
      'q1': 'Dựa vào bảng tần số ghép nhóm, Q3 = 135.',
      'q2': 'Vectơ BA + A\'C\' = BC.',
      'q17': 'Kết quả tính toán là 3780.',
      'q22': 'Lợi nhuận tối đa đạt được tại x = 1808.'
    },
    status: 'published',
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2024-03-20T10:00:00Z'
  }
];

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'Đề thi mới',
    message: 'Đề thi tốt nghiệp THPT 2025 - Mã đề 0119 đã được cập nhật.',
    type: 'info',
    timestamp: new Date().toISOString(),
    read: false
  },
  {
    id: 'n2',
    title: 'Kết quả thi',
    message: 'Bạn đã hoàn thành bài thi thử môn Toán với điểm số 8.5.',
    type: 'success',
    timestamp: new Date().toISOString(),
    read: true
  }
];

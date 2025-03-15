import { create } from 'zustand';
import axios from 'axios';

interface Test {
  id: number;
  name: string;
  owner_chat_id: string;
  test_count: number;
  open_test_answers_count: number | null;
  is_active: boolean;
  is_deleted: boolean;
  answers: string; 
  checked_count: number;
  created_at: string;
}

interface SubmitTestData {
  user_chat_id: string;
  user: string;
  test_id: number;
  answers_json: { id: number; answer: string }[];
  region: string;
  class: string;
}

interface TestStore {
  tests: Test[];
  fetchTests: () => Promise<void>;
  checkTest: (testId: number) => { test: Test | null; message: string };
  submitTest: (data: SubmitTestData) => Promise<{ message: string; success: boolean }>;
}

export const useTestStore = create<TestStore>((set, get) => ({
  tests: [],
  fetchTests: async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}`);
      set({ tests: response.data }); 
    } catch (error) {
      console.error('Testlarni olishda xato:', error);
    }
  },
  checkTest: (testId: number) => {
    const test = get().tests.find((t) => t.id === testId); 
    if (!test) {
      return { test: null, message: 'Test topilmadi!' };
    }
    if (!test.is_active) {
      return { test: null, message: 'Bu test yopilgan!' };
    }
    return { test, message: '' };
  },
  submitTest: async (data: SubmitTestData) => {
    const test = get().tests.find((t) => t.id === data.test_id); 
    if (!test) {
      return { message: 'Test topilmadi!', success: false };
    }

    const correctAnswers = JSON.parse(test.answers);
    const result = data.answers_json.map((userAnswer) => {
      const correctAnswer = correctAnswers.find((ans: { id: number }) => ans.id === userAnswer.id);
      return userAnswer.answer.trim().toUpperCase() === correctAnswer.answer.trim().toUpperCase();
    });

    const resultText = result
      .map((isCorrect, index) => `Javob ${index + 1}: ${isCorrect ? 'To‘g‘ri' : 'Noto‘g‘ri'}`)
      .join('\n');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/check`, data, {
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
        },
      });
      return { message: `Natijalar:\n${resultText}`, success: true };
    } catch (error) {
      console.error('Testni yuborishda xato:', error);
      return { message: 'Javoblarni yuborishda xatolik yuz berdi!', success: false };
    }
  },
}));
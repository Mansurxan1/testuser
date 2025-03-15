import { create } from 'zustand';
import axios, { AxiosError } from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL;

interface User {
  id: string;
  full_name: string;
  chat_id: string;
  role: string;
  status: string;
  region: string;
  class: string;
}

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

interface Answer {
  id: number;
  answer: string;
}

interface CheckResult {
  message: string;
  score: number;
  totalQuestions: number;
  details: { id: number; isCorrect: boolean; userAnswer: string; correctAnswer: string }[];
}

interface TestStore {
  user: User | null;
  selectedTest: Test | null;
  checkResult: CheckResult | null;
  loading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  fetchTestById: (testId: number) => Promise<void>;
  submitTest: (data: {
    user_chat_id: string;
    user: string;
    test_id: number;
    answers_json: Answer[];
    region: string;
    class: string;
  }) => Promise<void>;
}

export const useTestStore = create<TestStore>((set) => ({
  user: null,
  selectedTest: null,
  checkResult: null,
  loading: false,
  error: null,

  fetchUser: async () => {
    try {
      set({ loading: true });
      const urlParams = new URLSearchParams(window.location.search);
      const chatId = window.location.pathname.split('/').pop() || urlParams.get('chat_id');
      
      if (!chatId) throw new Error('User ID not found in URL');

      const response = await axios.get(`${VITE_API_URL}/users/${chatId}`);
      set({ user: response.data.data, error: null });
    } catch (error) {
      const err = error as AxiosError;
      set({ error: err.message || 'Foydalanuvchi ma’lumotlari yuklanmadi!' });
    } finally {
      set({ loading: false });
    }
  },

  fetchTestById: async (testId: number) => {
    try {
      set({ loading: true });
      const response = await axios.get(`${VITE_API_URL}/tests`);
      const tests = response.data.data;
      const test = tests.find((t: Test) => t.id === testId);
      
      if (!test) {
        throw new Error('Test topilmadi!');
      }
      
      set({ selectedTest: test, error: null });
    } catch (error) {
      const err = error as AxiosError;
      set({ error: err.message || 'Test yuklanmadi!' });
    } finally {
      set({ loading: false });
    }
  },

  submitTest: async (data) => {
    try {
      set({ loading: true });
      
      const selectedTest = useTestStore.getState().selectedTest;
      if (!selectedTest) {
        throw new Error('Test tanlanmagan!');
      }

      const correctAnswers: Answer[] = JSON.parse(selectedTest.answers);
      
      const checkDetails = data.answers_json.map((userAnswer) => {
        const correctAnswer = correctAnswers.find(ca => ca.id === userAnswer.id);
        const isCorrect = correctAnswer?.answer.toLowerCase() === userAnswer.answer.toLowerCase();
        
        return {
          id: userAnswer.id,
          isCorrect,
          userAnswer: userAnswer.answer,
          correctAnswer: correctAnswer?.answer || 'Noma’lum'
        };
      });

      const score = checkDetails.filter(detail => detail.isCorrect).length;
      const totalQuestions = checkDetails.length;

      const response = await axios.post(`${VITE_API_URL}/tests/check`, data, {
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
        },
      });

      set({
        checkResult: {
          message: response.data.message || 'Test muvaffaqiyatli tekshirildi!',
          score,
          totalQuestions,
          details: checkDetails,
        },
        error: null,
      });
    } catch (error) {
      const err = error as AxiosError;
      set({ error: err.message || 'Test yuborishda xatolik yuz berdi!' });
    } finally {
      set({ loading: false });
    }
  },
}));

useTestStore.getState().fetchUser();
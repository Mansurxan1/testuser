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
  is_private: boolean;
  answers: string;
  checked_count: number;
  created_at: string;
  answers_json: Answer[];
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
  fetchUser: (chatId?: string) => Promise<void>;
  fetchTestById: (testId: number) => Promise<void>;
  checkUserTestResult: (userChatId: string, testId: number) => Promise<boolean>;
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

  fetchUser: async (chatId?: string) => {
    try {
      set({ loading: true });
      const urlChatId = window.location.pathname.split('/').pop() || new URLSearchParams(window.location.search).get('chat_id');
      const finalChatId = chatId || urlChatId;
      console.log('Foydalanuvchi chatId bilan olinmoqda:', finalChatId);
      if (!finalChatId) throw new Error('Chat ID URLda topilmadi va berilmadi!');
      const response = await axios.get(`${VITE_API_URL}/users/${finalChatId}`);
      console.log('Foydalanuvchi muvaffaqiyatli olindi:', response.data.data);
      set({ user: response.data.data, error: null });
    } catch (error) {
      const err = error as AxiosError;
      console.error('Foydalanuvchi olishda xatolik:', err.message);
      set({ error: err.message || 'Foydalanuvchi ma’lumotlari yuklanmadi!' });
    } finally {
      set({ loading: false });
    }
  },

  fetchTestById: async (testId: number) => {
    try {
      set({ loading: true });
      console.log('Test ID bilan olinmoqda:', testId);
      const response = await axios.get(`${VITE_API_URL}/tests/${testId}`);
      const test = response.data.data;
      console.log('Test muvaffaqiyatli olindi:', test);
      if (!test) throw new Error('Test topilmadi!');
      if (test.is_deleted) throw new Error('Bu test mavjud emas!'); 
      set({ selectedTest: test, error: null });
    } catch (error) {
      const err = error as AxiosError | Error;
      console.error('Test olishda xatolik:', err.message);
      set({ error: err.message || 'Test yuklanmadi!' });
    } finally {
      set({ loading: false });
    }
  },

  checkUserTestResult: async (userChatId: string, testId: number) => {
    try {
      console.log('Foydalanuvchi natijasi tekshirilmoqda, user:', userChatId, 'test:', testId);
      const response = await axios.get(`${VITE_API_URL}/results/${userChatId}/${testId}`);
      console.log('Natija javobi:', response.data);
      return response.status === 200 && response.data.data !== null;
    } catch (error) {
      const err = error as AxiosError;
      console.error('Natija tekshirishda xatolik:', err.response?.status, err.message);
      if (err.response?.status === 404) {
        console.log('Oldingi natija topilmadi');
        return false;
      }
      throw error;
    }
  },

  submitTest: async (data) => {
    try {
      set({ loading: true });
      console.log('Test yuborilmoqda:', data);
      const selectedTest = useTestStore.getState().selectedTest;
      if (!selectedTest) throw new Error('Test tanlanmagan!');

      const response = await axios.post(`${VITE_API_URL}/tests/check`, data, {
        headers: { 'Accept': '*/*', 'Content-Type': 'application/json' },
      });
      console.log('Yuborish javobi:', response.data);

      const { result, answers } = response.data.data;
      const totalQuestions = selectedTest.answers_json.length;

      const userAnswers = JSON.parse(answers);
      const correctAnswers = selectedTest.answers_json;
      const checkDetails = userAnswers.map((userAnswer: Answer) => {
        const correctAnswer = correctAnswers.find(ca => ca.id === userAnswer.id);
        const isCorrect = correctAnswer?.answer.toLowerCase() === userAnswer.answer.toLowerCase();
        return {
          id: userAnswer.id,
          isCorrect,
          userAnswer: userAnswer.answer,
          correctAnswer: correctAnswer?.answer || 'Noma’lum',
        };
      });

      set({
        checkResult: {
          message: response.data.message || 'Test muvaffaqiyatli tekshirildi!',
          score: result,
          totalQuestions,
          details: checkDetails,
        },
        error: null,
      });
    } catch (error) {
      const err = error as AxiosError;
      console.error('Yuborishda xatolik:', err.message);
      set({ error: err.message || 'Test yuborishda xatolik yuz berdi!' });
    } finally {
      set({ loading: false });
    }
  },
}));
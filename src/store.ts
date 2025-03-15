// store.ts
import { create } from "zustand";
import axios from "axios";

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
  answers: string;
  created_at: string;
}

interface Answer {
  id: number;
  answer: string;
}

interface SubmitTestPayload {
  user_chat_id: string;
  user: string;
  test_id: number;
  answers_json: Answer[];
  region: string;
  class: string;
}

interface CheckResult {
  message: string;
  score: string;
  details: { id: number; userAnswer: string; isCorrect: boolean }[];
}

interface TestState {
  user: User | null;
  tests: Test[];
  selectedTest: Test | null;
  checkResult: CheckResult | null;
  loading: boolean;
  error: string | null;
  fetchUser: (chatId: string) => Promise<void>;
  fetchTestById: (testId: number) => Promise<void>;
  submitTest: (payload: SubmitTestPayload) => Promise<CheckResult>;
}

const API_URL = import.meta.env.VITE_API_URL;

export const useTestStore = create<TestState>((set) => ({
  user: null,
  tests: [],
  selectedTest: null,
  checkResult: null,
  loading: false,
  error: null,

  fetchUser: async (chatId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/users/${chatId}`);
      set({ user: response.data.data, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Foydalanuvchi topilmadi",
        loading: false,
      });
    }
  },

  fetchTestById: async (testId: number) => {
    set({ loading: true, error: null, checkResult: null });
    try {
      const response = await axios.get(`${API_URL}/tests`);
      const tests = response.data.data as Test[];
      const test = tests.find((t) => t.id === testId);
      if (test) {
        set({ selectedTest: test, loading: false });
      } else {
        set({
          error: "Bu test ID uchun test topilmadi",
          selectedTest: null,
          loading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Testni olishda xatolik",
        loading: false,
      });
    }
  },

  submitTest: async (payload: SubmitTestPayload) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/tests/check`, payload, {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      });
      const test = (await axios.get(`${API_URL}/tests`)).data.data.find(
        (t: Test) => t.id === payload.test_id
      );
      const correctAnswers = JSON.parse(test.answers);
      const checkResult: CheckResult = {
        message: "Test muvaffaqiyatli tekshirildi",
        score: response.data.score || `${payload.answers_json.filter((ans) => correctAnswers.find((ca: Answer) => ca.id === ans.id && ca.answer === ans.answer)).length}/${payload.answers_json.length}`,
        details: payload.answers_json.map((ans) => {
          const correct = correctAnswers.find((ca: Answer) => ca.id === ans.id);
          return {
            id: ans.id,
            userAnswer: ans.answer,
            isCorrect: ans.answer === correct.answer,
          };
        }),
      };
      set({ checkResult, loading: false });
      return checkResult;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Javoblarni yuborishda xatolik",
        loading: false,
      });
      return {
        message: "Javoblarni yuborishda xatolik yuz berdi",
        score: "0/0",
        details: [],
      };
    }
  },
}));
import { useState, useEffect } from 'react';
import { useTestStore } from './store';

// Test obyektining tipini e'lon qilish
interface Test {
  id: number;
  name: string;
  answers: string; // JSON formatidagi javoblar
}

const App = () => {
  const { fetchTests, checkTest, submitTest } = useTestStore();
  const [testId, setTestId] = useState<number | ''>('');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ id: number; answer: string }[]>([]);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleCheckTest = () => {
    const { test, message } = checkTest(Number(testId));
    if (test) {
      try {
        const parsedAnswers = JSON.parse(test.answers) as { id: number }[];
        setSelectedTest(test);
        setUserAnswers(parsedAnswers.map((ans) => ({ id: ans.id, answer: '' })));
        setShowModal(false);
      } catch (error) {
        setModalMessage('Testning javoblari noto‘g‘ri formatda!');
        setShowModal(true);
      }
    } else {
      setModalMessage(message);
      setShowModal(true);
      setSelectedTest(null);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[index].answer = value;
    setUserAnswers(updatedAnswers);
  };

  const handleSubmit = async () => {
    if (!selectedTest) return;

    const result = await submitTest({
      user_chat_id: '123456789',
      user: 'John Doe',
      test_id: selectedTest.id,
      answers_json: userAnswers,
      region: 'Europe',
      class: '11A',
    });

    setModalMessage(result.message);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 p-6">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Test Sahifasi</h1>
      <div className="max-w-lg mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="mb-6">
          <input
            type="number"
            placeholder="Test ID kiriting"
            value={testId}
            onChange={(e) => setTestId(Number(e.target.value) || '')}
            className="border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleCheckTest}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition-all w-full"
          >
            Tekshirish
          </button>
        </div>

        {selectedTest && (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedTest.name}</h2>
            {userAnswers.map((answer, index) => (
              <div key={answer.id} className="mb-4">
                <label className="block font-medium text-gray-700">
                  {`Javob ${index + 1}:`}
                </label>
                <input
                  type="text"
                  placeholder="Javobingizni kiriting"
                  value={answer.answer}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
            <button
              onClick={handleSubmit}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-md transition-all w-full"
            >
              Yuborish
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <pre className="text-gray-700 whitespace-pre-wrap">{modalMessage}</pre>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg w-full"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

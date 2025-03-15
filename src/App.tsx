// App.tsx
import { useState, useEffect } from "react";
import { useTestStore } from "./store";

interface Answer {
  id: number;
  answer: string;
}

const App = () => {
  const { user, selectedTest, checkResult, loading, error, fetchTestById, submitTest } =
    useTestStore();
  const [testId, setTestId] = useState<number | "">("");
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [modalMessage, setModalMessage] = useState<string>("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleFetchTest = () => {
    if (!testId) {
      setModalMessage("Iltimos, test ID sini kiriting!");
      setShowMessageModal(true);
      return;
    }
    fetchTestById(Number(testId));
  };

  useEffect(() => {
    if (selectedTest) {
      try {
        const parsedAnswers = JSON.parse(selectedTest.answers) as { id: number }[];
        setUserAnswers(parsedAnswers.map((ans) => ({ id: ans.id, answer: "" })));
      } catch (error) {
        setModalMessage("Test javoblari noto‘g‘ri formatda!");
        setShowMessageModal(true);
      }
    }
  }, [selectedTest]);

  const handleAnswerChange = (index: number, value: string) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[index].answer = value;
    setUserAnswers(updatedAnswers);
  };

  const handleSubmit = async () => {
    if (!selectedTest || !user) {
      setModalMessage("Test yoki foydalanuvchi ma’lumotlari topilmadi!");
      setShowMessageModal(true);
      return;
    }

    await submitTest({
      user_chat_id: user.chat_id,
      user: user.full_name,
      test_id: selectedTest.id,
      answers_json: userAnswers,
      region: user.region,
      class: user.class,
    });
    setShowMessageModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Test Sahifasi</h1>

      <div className="w-full max-w-md mb-6">
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200"
        >
          Profil
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <input
            type="number"
            placeholder="Test ID kiriting"
            value={testId}
            onChange={(e) => setTestId(e.target.value ? Number(e.target.value) : "")}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <button
            onClick={handleFetchTest}
            disabled={loading}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? "Yuklanmoqda..." : "Tekshirish"}
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-center mb-4 bg-red-100 p-2 rounded-lg border border-red-300">
            {error}
          </p>
        )}

        {selectedTest && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedTest.name}</h2>
            {userAnswers.map((answer, index) => (
              <div key={answer.id} className="mb-4">
                <label className="block font-medium text-gray-700 mb-1">
                  {`Savol ${index + 1} uchun javob:`}
                </label>
                <input
                  type="text"
                  placeholder="Javobingizni kiriting"
                  value={answer.answer}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            ))}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? "Yuborilmoqda..." : "Javoblarni Yuborish"}
            </button>
          </div>
        )}
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-md w-96 p-6 transform scale-95 animate-pop-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Foydalanuvchi Profili</h2>
            {user ? (
              <div className="space-y-4 text-gray-800">
                <p className="flex items-center">
                  <span className="font-semibold text-gray-700 w-28">Ism:</span> {user.full_name}
                </p>
                <p className="flex items-center">
                  <span className="font-semibold text-gray-700 w-28">Chat ID:</span> {user.chat_id}
                </p>
                <p className="flex items-center">
                  <span className="font-semibold text-gray-700 w-28">Hudud:</span> {user.region}
                </p>
                <p className="flex items-center">
                  <span className="font-semibold text-gray-700 w-28">Sinf:</span> {user.class}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Ma’lumotlar yuklanmoqda...</p>
            )}
            <button
              onClick={() => setShowProfileModal(false)}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-md w-96 p-6 transform scale-95 animate-pop-in">
            {checkResult ? (
              <div>
                <p className="text-gray-800 font-semibold mb-4">
                  Test muvaffaqiyatli tekshirildi. Ball: {checkResult.score}/{checkResult.totalQuestions}
                </p>
                <ul className="text-gray-800 space-y-3">
                  {checkResult.details.map((detail) => (
                    <li key={detail.id} className="border-b pb-2">
                      <span className="font-medium">Savol {detail.id}:</span>{" "}
                      <span className={detail.isCorrect ? "text-green-600" : "text-red-600"}>
                        {detail.isCorrect ? "To‘g‘ri" : "Noto‘g‘ri"}
                      </span>
                      <br />
                      <span className="text-sm">
                        Sizning javobingiz: {detail.userAnswer}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <pre className="text-gray-800 whitespace-pre-wrap mb-4">{modalMessage}</pre>
            )}
            <button
              onClick={() => setShowMessageModal(false)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
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
import { useState, useEffect } from "react";
import { useTestStore } from "./store";

interface Answer {
  id: number;
  answer: string;
}

const App = () => {
  const { user, selectedTest, loading, error, fetchUser, fetchTestById, checkUserTestResult, submitTest } = useTestStore();
  const [testId, setTestId] = useState<number | "">("");
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [modalMessage, setModalMessage] = useState<string>("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [canTakeTest, setCanTakeTest] = useState(false);
  const [emptyFields, setEmptyFields] = useState<number[]>([]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleFetchTest = async () => {
    if (!testId) {
      setModalMessage("Iltimos, test ID sini kiriting!");
      setShowMessageModal(true);
      return;
    }
    if (!user) {
      setModalMessage("Foydalanuvchi ma'lumotlari yuklanmadi!");
      setShowMessageModal(true);
      return;
    }

    console.log('Test olish jarayoni boshlandi, ID:', testId);
    await fetchTestById(Number(testId));
  };

  useEffect(() => {
    const checkTestConditions = async () => {
      if (!selectedTest || !user) {
        console.log('Hali tanlangan test yoki foydalanuvchi yo‘q');
        return;
      }

      console.log('Test shartlari tekshirilmoqda:', selectedTest);

      if (!selectedTest.is_active) {
        console.log('Test faol emas');
        setModalMessage("Bu test yopilgan!");
        setShowMessageModal(true);
        setTestId("");
        setCanTakeTest(false);
        return;
      }

      if (selectedTest.is_private) {
        try {
          const hasTakenTest = await checkUserTestResult(user.chat_id, selectedTest.id);
          console.log('Test oldin yechilganmi:', hasTakenTest);
          if (hasTakenTest) {
            setModalMessage("Siz avval bu testni tekshirgansiz!");
            setShowMessageModal(true);
            setCanTakeTest(false);
            return;
          }
        } catch (error) {
          console.error('Natija tekshirishda xatolik yuz berdi:', error);
          setModalMessage("Test holatini tekshirishda xatolik!");
          setShowMessageModal(true);
          setCanTakeTest(false);
          return;
        }
      }

      console.log('Testni yechishga ruxsat berildi');
      setUserAnswers(selectedTest.answers_json.map((ans) => ({ id: ans.id, answer: "" })));
      setCanTakeTest(true);
    };

    checkTestConditions();
  }, [selectedTest, user, checkUserTestResult]);

  const handleAnswerChange = (index: number, value: string) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[index].answer = value;
    setUserAnswers(updatedAnswers);

    if (value.trim() === "") {
      setEmptyFields((prev) => [...prev, updatedAnswers[index].id].filter((id, i, arr) => arr.indexOf(id) === i));
    } else {
      setEmptyFields((prev) => prev.filter((id) => id !== updatedAnswers[index].id));
    }

    const inputElement = document.querySelector(`input[data-index="${index}"]`);
    if (inputElement) {
      inputElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleSubmit = async () => {
    if (!selectedTest || !user) {
      setModalMessage("Test yoki foydalanuvchi ma’lumotlari topilmadi!");
      setShowMessageModal(true);
      return;
    }

    const allAnswered = userAnswers.every(answer => answer.answer.trim() !== "");
    if (!allAnswered) {
      const empty = userAnswers
        .filter(answer => answer.answer.trim() === "")
        .map(answer => answer.id);
      setEmptyFields(empty);
      console.log('To‘ldirilmagan savollar:', empty);
      return;
    }

    console.log('Test javoblari yuborilmoqda:', userAnswers);
    await submitTest({
      user_chat_id: user.chat_id,
      user: user.full_name,
      test_id: selectedTest.id,
      answers_json: userAnswers,
      region: user.region,
      class: user.class,
    });

    setTimeout(() => {
      const updatedCheckResult = useTestStore.getState().checkResult;
      if (updatedCheckResult) {
        setModalMessage(`Siz ${updatedCheckResult.totalQuestions} tadan ${updatedCheckResult.score} ta testni to'g'ri yechdingiz!`);
      } else {
        setModalMessage("Natija yuklanmadi!");
      }
      setShowMessageModal(true);
      setEmptyFields([]);
    }, 100);
  };

  const closeModal = () => {
    console.log('Modal yopilmoqda');
    setShowMessageModal(false);
    setTestId("");
    setUserAnswers([]);
    setCanTakeTest(false);
  };

  useEffect(() => {
    const handleResize = () => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.tagName === "INPUT") {
        activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex flex-col items-center overflow-auto" style={{ minHeight: "100vh" }}>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Test Sahifasi</h1>

      <div className="w-full max-w-md mb-6">
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200"
          disabled={!user}
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

        {selectedTest && canTakeTest && (
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
                  data-index={index} // Scroll uchun qo'shildi
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {emptyFields.includes(answer.id) && (
                  <p className="text-red-600 text-sm mt-1">To'ldirish kerak!</p>
                )}
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
                <p className="flex items-center"><span className="font-semibold text-gray-700 w-28">Ism:</span> {user.full_name}</p>
                <p className="flex items-center"><span className="font-semibold text-gray-700 w-28">Chat ID:</span> {user.chat_id}</p>
                <p className="flex items-center"><span className="font-semibold text-gray-700 w-28">Hudud:</span> {user.region}</p>
                <p className="flex items-center"><span className="font-semibold text-gray-700 w-28">Sinf:</span> {user.class}</p>
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
            <pre className="text-gray-800 whitespace-pre-wrap mb-4">{modalMessage}</pre>
            <button
              onClick={closeModal}
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
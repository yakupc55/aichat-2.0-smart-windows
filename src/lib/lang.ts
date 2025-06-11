// src/lib/lang.ts
import { currentLanguage } from './Stores/LangStores';
export const translations = {
    en: {
        AppName: 'AI Chat 2.0',
        send: 'Send',
        writeMessage: "Write ...",
        smartWindow: "Smart window",
        createDb: 'Create Database',
        addValueDb: 'Add to Database',
        chatScript: 'AI Script - Quiz',
        dbName: 'Database Name',
        description: 'Description',
        columns: 'Columns',
        fieldName: 'Field Name',
        type: 'Type',
        primaryKey: 'Primary Key',
        createDbButton: 'Create Database',
        dbCreatedSuccess: '✅ Your database has been successfully created.',
        addValuesButton: 'Add',
        valuesAddedSuccess: '✅ Records have been successfully added.',
        gameTitle: '🧠 Word Meaning Game',
        questionPrompt: 'What is the Turkish meaning of the word <span style="font-weight: bold;">{question}</span>?',
        correctAnswer: '✅ Correct answer!',
        wrongAnswer: '❌ Wrong! The correct answer is: <strong>{correctAnswer}</strong>',
        newQuestionButton: 'New Question',
        chatCalculate: 'Smart Calculate',
        FormulText: "Formula",
        CalculateText: "Calculate",
        ChooseLanguage: "Choose Language",
        ResetChat: 'Reset Chat',
        StartNewChat: 'Since we use Google},\'s free API, your data processed according to Google policies may be used to improve Google models. Therefore, refrain from sharing your sensitive data.',
        noSmartWindow: 'A smart window of this type is not configured: or the process is still in progress',
         // Quiz çevirileri
        questionText: "Question",
        wordQuestionText: 'What is the meaning of "{0}"?',
        selectOptionText: "Please select an option",
        checkAnswerText: "Check Answer",
        nextQuestionText: "Next Question",
        restartQuizText: "Restart Quiz",
        correctAnswerText: "✅ Correct Answer!",
        wrongAnswerText: "❌ Wrong Answer!",
        showExplanationText: "Show Explanation",
        hideExplanationText: "Hide Explanation",
        explanationText: "Explanation",
        quizCompleteText: "Quiz Completed! Your Score: {score}/{totalQuestions} (%{percentage})",
        ofText: "of"

    },
    tr: {
        AppName: 'YZ Sohbet 2.0',
        send: 'Gönder',
        writeMessage: "Mesaj yaz...",
        smartWindow: "Akıllı Pencere",
        createDb: 'Veritabanı Oluştur',
        addValueDb: 'Veritabanına Kayıt Ekle',
        chatScript: 'Kullanışlı Yazılım - Quiz',
        dbName: 'Veritabanı Adı',
        description: 'Açıklama',
        columns: 'Kolonlar',
        fieldName: 'Alan Adı',
        type: 'Tip',
        primaryKey: 'Birincil Anahtar',
        createDbButton: 'Veritabanını Oluştur',
        dbCreatedSuccess: '✅ Veritabanınız başarıyla oluşturuldu.',
        addValuesButton: 'Ekle',
        valuesAddedSuccess: '✅ Kayıtlar başarıyla eklendi.',
        gameTitle: '🧠 Anlam Bulma Oyunu',
        questionPrompt: '<span style="font-weight: bold;">{question}</span> kelimesinin Türkçe karşılığı nedir?',
        correctAnswer: '✅ Doğru cevap!',
        wrongAnswer: '❌ Yanlış! Doğru cevap: <strong>{correctAnswer}</strong>',
        newQuestionButton: 'Yeni Soru',
        chatCalculate: 'Akıllı Hesaplayıcı',
        FormulText: "Formül",
        CalculateText: "Calculate",
        ChooseLanguage: "Dil Seç",
        ResetChat: 'Sohbeti Sıfırla',
        StartNewChat: 'Google\'ın ücretsiz API\'sini kullandığımız için, Google politikalarına göre işlem gören verileriniz, Google modellerini geliştirmek için kullanılabilir. Bu nedenle hassas verilerinizi paylaşmaktan kaçının.',
        noSmartWindow: 'Bu türde bir smart window yapılandırılmamış: yada daha işlem devam ediyor ',
        // Quiz çevirileri
        questionText: "Soru",
        wordQuestionText: '"{0}" kelimesinin anlamı nedir?',
        selectOptionText: "Lütfen bir seçenek belirleyin",
        checkAnswerText: "Cevapla",
        nextQuestionText: "Sonraki Soru",
        restartQuizText: "Testi Yeniden Başlat",
        correctAnswerText: "✅ Doğru Cevap!",
        wrongAnswerText: "❌ Yanlış Cevap!",
        showExplanationText: "Açıklamayı Göster",
        hideExplanationText: "Açıklamayı Gizle",
        explanationText: "Açıklama",
        quizCompleteText: "Test Tamamlandı! Skorunuz: {score}/{totalQuestions} (%{percentage})",
        ofText: "/"
    }
};

// Çeviri fonksiyonu
export function t(key: string, params?: { [key: string]: string }) {
    let translation = '';
    currentLanguage.subscribe((lang) => {
        translation = translations[lang][key] || key;
    });

    if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
            translation = translation.replace(`{${paramKey}}`, paramValue);
        }
    }
    return translation;
}
// Dili değiştirme ve localStorage'a kaydetme
export function setLanguage(lang: string) {
    currentLanguage.set(lang);
}
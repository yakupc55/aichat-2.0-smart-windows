// src/lib/lang.ts
import { currentLanguage } from './Stores/LangStores';
let activeLang = "en";
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
        ofText: "of",
        hideText: "hide",
        showText: "show",

        //cümle oluşlturma çevirileri
        sentenceBuilder: "Sentence Builder",
        sentenceText: "Sentence",
        buildEnglishSentenceText: "Build the English equivalent of '{0}':",
        dragWordsHereText: "Drag or click words here...",
        checkSentenceText: "Check Sentence",
        correctSentenceText: "Congratulations! Correct sentence.",
        wrongSentenceText: "Sorry, incorrect sentence.",
        showCorrectSentenceText: "Show Correct Sentence",
        hideCorrectSentenceText: "Hide Correct Sentence",
        nextSentenceText: "Next Sentence",
        sentenceBuilderCompleteText: "Practice Complete! {score}/{totalQuestions} ({percentage}%) sentences correct.",
        restartBuilderText: "Restart Practice",
        ofTextTotal: "of",
        clickToRemoveText: "Click to remove",
        clickToAddText: "Click to add",
        //smart kontroller çevirileri
        smartControlText:'Smart Controller',
        smartControlPanelText:'Smart Control Panel',
        availableClientsText: "Available Apps",
        noClientsAvailableText: "No Apps are currently active.",
        selectClientText: "Select a Client",
        chooseClientText: "Choose a Client...",
        requestDocumentationText: "Request Documentation",
        documentationForClientText: "{0} Client Documentation",
        controlPanelText: "Control Panel",
        commandCodeText: "Command Code (JSON)",
        enterJsonCommandText: "Example: { \"action\": \"createFile\", \"filename\": \"test.txt\", \"content\": \"Hello World\" }",
        applyOperationText: "Apply Operation",
        contentText: "Content",
        filesText: "Files",
        sendingCommandToAppText: "Sending command to app",
        successOperationMessage: 'The operation was successful',
        commingDataInfoText:'imported configuration messages'
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
        ofText: "/",
        hideText: "gizle",
        showText: "göster",

        //cümle oluşturma çevirileri
        sentenceBuilder: "Cümle oluşturma",
        sentenceText: "Cümle",
        ofTextTotal: "toplam",
        buildEnglishSentenceText: "{0} cümlesinin İngilizce karşılığını oluşturun:",
        dragWordsHereText: "Kelime sürükle veya tıkla...",
        checkSentenceText: "Cümleyi Kontrol Et",
        correctSentenceText: "Tebrikler! Doğru cümle.",
        wrongSentenceText: "Maalesef, yanlış cümle.",
        showCorrectSentenceText: "Doğru Cümleyi Göster",
        hideCorrectSentenceText: "Doğru Cümleyi Gizle",
        nextSentenceText: "Sonraki Cümle",
        sentenceBuilderCompleteText: "Alıştırma Tamamlandı! {score}/{totalQuestions} ({percentage}%) cümle doğru.",
        restartBuilderText: "Tekrar Başla",
        clickToRemoveText: "Kaldırmak için tıkla",
        clickToAddText: "Eklemek için tıkla",

        //smart kontroller çevirileri
        smartControlText:'Akıllı Kontrolcü',
        smartControlPanelText:'Akıllı Kontrol Paneli',
        availableClientsText: "Mevcut Uygulama'lar",
        noClientsAvailableText: "Şu anda hiçbir uygulama aktif değil.",
        selectClientText: "Bir Uygulma Seçin",
        chooseClientText: "Uygulama Seç...",
        requestDocumentationText: "Kullanım yapısını içe aktar",
        documentationForClientText: "{0} Uygulama Dökümantasyonu",
        controlPanelText: "İşlem Paneli",
        commandCodeText: "Komut Kodu (JSON)",
        enterJsonCommandText: "Örn: { \"action\": \"createFile\", \"filename\": \"test.txt\", \"content\": \"Merhaba Dünya\" }",
        applyOperationText: "İşlemi Uygula",
        contentText: "İçerik",
        filesText: "Dosyalar",
        sendingCommandToAppText: "Komut gönderilecek uygulama",
        successOperationMessage: 'İşlem başarıyla sonuçlandırıldı',
        commingDataInfoText:'içe aktarılan yapılandırma mesajları'
    }
};

// Çeviri fonksiyonu
export function t(key: string, params?: { [key: string]: string }) {
    let translation = '';
    currentLanguage.subscribe((lang) => {
        activeLang = lang;
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

export function getLanguage():string {
    return activeLang;
}

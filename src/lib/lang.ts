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
        StartNewChat: 'Start a new chat!',

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
        StartNewChat: 'Yeni bir sohbet başlatın!',
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
<script lang="ts">
	import { t } from "$lib/lang";
	import { createMapFromSplitData, splitDataByLevel } from "$lib/utils";

  export let value: string;
console.log("value",value);

    type QuizType = 'word' | 'knowledge';
  type Question = {
    question: string;
    options: string[];
    answer: string | number;
    explanation?: string;
  };
type WordPair = {
  word: string; // Kelimenin orijinal hali (örneğin, İngilizce)
  translation: string; // Kelimenin çevirisi (örneğin, Türkçe)
};
  let title = '';
  let quizType: QuizType = 'word';
  let questions: Question[] = [];
  let currentQuestionIndex = 0;
  let selectedAnswer: number | null = null;
  let isAnswered = false;
  let isCorrect = false;
  let score = 0;
  let showExplanation = false;
  let totalQuestions = 0;

   $: {
   try {

    const splitData = splitDataByLevel(value, 0);
    const valuesDatas = createMapFromSplitData(splitData, 1);
    console.log('values data: ', valuesDatas);
    title = valuesDatas.get('title');
    quizType = valuesDatas.get('type');
  
    
    if(questions.length<1){
      if (quizType === 'word') {
    const wordPairsData: string[] = valuesDatas.get('wordPairs');
    console.log("question data",wordPairsData);
      // Word türü için özel işlem
      const wordPairs: WordPair[] = []; // Kelime çiftlerini al
      wordPairsData.forEach((data) => {
        let splitData = splitDataByLevel(data, 2);
        const inputData = createMapFromSplitData(splitData, 3);
        wordPairs.push({
          word:inputData.get('word'),
          translation:inputData.get('translation')
        });
      });
      questions = generateWordQuestions(wordPairs); // Soruları oluştur
    }else{
        const questionsData: string[] = valuesDatas.get('questions');
        questionsData.forEach((data) => {
        let splitData = splitDataByLevel(data, 2);
        console.log("split data",splitData);
        
        const inputData = createMapFromSplitData(splitData, 3);
        console.log("input data",inputData);
        console.log("options",inputData.get('options'));
        
        questions.push({
                    question: inputData.get('question'),
          explanation: inputData.get('explanation'),
         options: inputData.get('options'),
          answer: inputData.get('answer')
        });
      });
    }
    totalQuestions = questions.length;
    }

  } catch (err) {
    console.error("Error parsing value:", err);
    questions = [];
    totalQuestions = 0;
  }
}

  function checkAnswer() {
    if (selectedAnswer === null) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    isCorrect = quizType === 'word' 
      ? currentQuestion.options[selectedAnswer] === currentQuestion.answer
      : selectedAnswer === currentQuestion.answer;
    
    isAnswered = true;
    if (isCorrect) score++;
  }

  function nextQuestion() {
    currentQuestionIndex++;
    selectedAnswer = null;
    isAnswered = false;
    showExplanation = false;
  }

  function resetQuiz() {
    currentQuestionIndex = 0;
    selectedAnswer = null;
    isAnswered = false;
    isCorrect = false;
    score = 0;
    showExplanation = false;
  }
  function generateWordQuestions(wordPairs: WordPair[]): Question[] {
  const questions: Question[] = [];

  wordPairs.forEach((pair, index) => {
    // Doğru cevap
    const correctAnswer = pair.translation;

    // Yanlış cevaplar için rastgele çeviriler seçiyoruz
    const otherTranslations = wordPairs
      .filter((_, i) => i !== index) // Mevcut kelimeyi dışarıda bırak
      .map(p => p.translation); // Diğer kelimelerin çevirilerini al

    // Rastgele 3 yanlış cevap seçiyoruz
    const wrongAnswers = shuffleArray(otherTranslations).slice(0, 3);

    // Tüm seçenekleri birleştiriyoruz (doğru cevap + yanlış cevaplar)
    const options = shuffleArray([...wrongAnswers, correctAnswer]);

    // Soruyu oluşturuyoruz
    questions.push({
      question: `${pair.word}`, // Soru metni
      options: options, // Seçenekler
      answer: correctAnswer, // Doğru cevap
      explanation: `${pair.word} kelimesinin anlamı ${correctAnswer}dır.` // Açıklama
    });
  });

  return questions;
}

// Rastgele sıralama için yardımcı bir fonksiyon
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
  // Class hesaplamayı ayrı bir fonksiyona alabiliriz
   function getOptionClasses(
    index: number,
    option: string,
    quizType: 'word' | 'knowledge',
    questions: Array<{
      question: string;
      options: string[];
      answer: string | number;
      explanation?: string;
    }>,
    currentQuestionIndex: number,
    isAnswered: boolean,
    selectedAnswer: number | null,
    isCorrect: boolean
  ): string {
    let classes = ['option'];
    
    if (selectedAnswer === index) classes.push('selected');
    
    if (isAnswered) {
      const isActuallyCorrect = quizType === 'word' 
        ? option === questions[currentQuestionIndex].answer
        : index === questions[currentQuestionIndex].answer;
      
      if (isActuallyCorrect) classes.push('correct');
      if (selectedAnswer === index && !isCorrect) classes.push('incorrect');
    }
    
    return classes.join(' ');
  }
</script>

<style>
  /* Önceki stil tanımları aynı kalacak */
  .quiz-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
  }
  .quiz-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: #1e40af;
  }
  .question {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }
  .options {
    display: grid;
    gap: 0.8rem;
    margin-bottom: 1.5rem;
  }
  .option {
    padding: 0.8rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .option:hover {
    background-color: #f3f4f6;
  }
  .option.selected {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }
  .option.correct {
    border-color: #10b981;
    background-color: #ecfdf5;
  }
  .option.incorrect {
    border-color: #ef4444;
    background-color: #fef2f2;
  }
  .button {
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    margin-right: 0.5rem;
  }
  .check-button {
    background-color: #3b82f6;
    color: white;
    border: none;
  }
  .check-button:hover {
    background-color: #2563eb;
  }
  .next-button {
    background-color: #10b981;
    color: white;
    border: none;
  }
  .next-button:hover {
    background-color: #059669;
  }
  .reset-button {
    background-color: #f59e0b;
    color: white;
    border: none;
  }
  .reset-button:hover {
    background-color: #d97706;
  }
  .feedback {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 8px;
    font-weight: 500;
  }
  .correct-feedback {
    background-color: #ecfdf5;
    color: #059669;
  }
  .incorrect-feedback {
    background-color: #fef2f2;
    color: #dc2626;
  }
  .explanation {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f8fafc;
    border-radius: 8px;
    border-left: 4px solid #94a3b8;
  }
  .progress {
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: #64748b;
  }
  .score {
    font-weight: bold;
    margin-top: 1rem;
    font-size: 1.1rem;
  }
</style>

<div class="quiz-container">
  <h2 class="quiz-title">{title}</h2>
  {#if currentQuestionIndex < questions.length}
    <div class="progress">
      {t('questionText')} {currentQuestionIndex + 1} {t('ofText')} {totalQuestions}
    </div>
    
    <div class="question">{
      quizType === 'word' 
        ? t('wordQuestionText', {0: questions[currentQuestionIndex].question})
        : questions[currentQuestionIndex].question}
    </div>
    
    <div class="options">
      {#each questions[currentQuestionIndex].options as option, index}
        <div 
  class={getOptionClasses(index, option, quizType, questions, currentQuestionIndex, isAnswered, selectedAnswer, isCorrect)}
  on:click={() => !isAnswered && (selectedAnswer = index)}
>
          {option}
        </div>
      {/each}
    </div>
    
    {#if !isAnswered}
      <button 
        class="button check-button" 
        on:click={checkAnswer}
        disabled={selectedAnswer === null}
      >
        {t('checkAnswerText')}
      </button>
      {#if selectedAnswer === null}
        <div style="color: #64748b; margin-top: 0.5rem;">
          {t('selectOptionText')}
        </div>
      {/if}
    {:else}
      <div class="feedback {isCorrect ? 'correct-feedback' : 'incorrect-feedback'}">
        {isCorrect ? t('correctAnswerText') : t('wrongAnswerText')}
      </div>
      
      {#if questions[currentQuestionIndex].explanation}
        <button 
          class="button" 
          on:click={() => showExplanation = !showExplanation}
        >
          {showExplanation ? t('hideExplanationText') : t('showExplanationText')}
        </button>
        
        {#if showExplanation}
          <div class="explanation">
            <strong>{t('explanationText')}:</strong> {questions[currentQuestionIndex].explanation}
          </div>
        {/if}
      {/if}
      
      <button class="button next-button" on:click={nextQuestion}>
        {t('nextQuestionText')}
      </button>
    {/if}
  {:else}
   <div class="score">
  {t('quizCompleteText', {
    score: score.toString(),
    totalQuestions: totalQuestions.toString(),
    percentage: (score / totalQuestions * 100).toFixed(1)
  })}
</div>
    
    <button class="button reset-button" on:click={resetQuiz}>
      {t('restartQuizText')}
    </button>
  {/if}
</div>
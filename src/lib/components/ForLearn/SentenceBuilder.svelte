<script lang="ts">
  import { t } from "$lib/lang";
  import { createMapFromSplitData, splitDataByLevel } from "$lib/utils";

  export let value: string;

  type SentencePair = {
    turkish: string;
    english: string;
  };

  type WordToken = {
    id: number;
    word: string; // Bu, kelimenin orijinal hali olacak
    originalIndex: number;
  };

  let title = '';
  let sentencePairs: SentencePair[] = [];
  let currentSentenceIndex = 0;
  let availableWords: WordToken[] = [];
  let selectedWords: WordToken[] = [];
  let isAnswerChecked = false;
  let isCorrect = false;
  let score = 0;
  let totalSentences = 0;
  let showExplanation = false;

  $: {
    try {
      const splitData = splitDataByLevel(value, 0);
      const valuesDatas = createMapFromSplitData(splitData, 1);
      
      title = valuesDatas.get('title');

      if (sentencePairs.length < 1) {
        const sentencesData: string[] = valuesDatas.get('sentences');
        sentencesData.forEach((data) => {
          let splitData = splitDataByLevel(data, 2);
          const inputData = createMapFromSplitData(splitData, 3);
         
          let langList:string[] = [];
          inputData.forEach((element,key) => {
            langList.push(key);
          });
          
          sentencePairs.push({
            turkish: inputData.get(langList[0]),
            english: inputData.get(langList[1])
          });
        });
        totalSentences = sentencePairs.length;
        if (totalSentences > 0) {
          initializeSentence();
        }
      } else if (currentSentenceIndex < sentencePairs.length && !availableWords.length && !selectedWords.length && !isAnswerChecked) {
        initializeSentence();
      }
    } catch (err) {
      console.error("Error parsing value:", err);
      sentencePairs = [];
      totalSentences = 0;
    }
  }

  function initializeSentence() {
    if (sentencePairs.length > 0 && currentSentenceIndex < sentencePairs.length) {
      const currentSentence = sentencePairs[currentSentenceIndex].english;
      
      // Noktalama işaretlerini kelime gibi ayırırken ekstra boşluk bırakmamak için regex güncellendi
      // Örn: "This is an apple." -> ["This", "is", "an", "apple", "."]
      // Veya: "Are you ready?" -> ["Are", "you", "ready", "?"]
      const words = currentSentence
        .replace(/([.,!?;:])/g, (match) => ` ${match} `) // Noktalama işaretinin her iki tarafına boşluk koy
        .split(/\s+/) // Birden fazla boşluğu tek boşluk olarak kabul et
        .filter(word => word.length > 0) // Boş kelimeleri filtrele
        .map(word => word.trim()); // Her kelimenin başındaki/sonundaki boşluğu temizle (önemli!)

      const wordsWithIds: WordToken[] = words.map((word, i) => ({ id: i, word: word, originalIndex: i }));

      availableWords = shuffleArray(wordsWithIds);
      selectedWords = [];
      isAnswerChecked = false;
      isCorrect = false;
      showExplanation = false;
    }
  }

  function addWordToSelected(token: WordToken) {
    if (isAnswerChecked) return;

    selectedWords = [...selectedWords, token];
    availableWords = availableWords.filter(w => w.id !== token.id);
  }

  function removeWordFromSelected(token: WordToken) {
    if (isAnswerChecked) return;

    availableWords = [...availableWords, token].sort((a, b) => a.originalIndex - b.originalIndex);
    selectedWords = selectedWords.filter(w => w.id !== token.id);
  }

  function checkAnswer() {
    const currentSentence = sentencePairs[currentSentenceIndex].english;

    // Kullanıcının seçtiği kelimeleri birleştirip normalize et
    const userBuiltSentence = selectedWords.map(t => t.word).join(' ');
    const normalizedUserAnswer = normalizeForComparison(userBuiltSentence);
    
    // Doğru cevabı normalize et
    const normalizedCorrectAnswer = normalizeForComparison(currentSentence);
    
    console.log("normalizedUserAnswer:", `"${normalizedUserAnswer}"`); // Kontrol için tırnak içine al
    console.log("normalizedCorrectAnswer:", `"${normalizedCorrectAnswer}"`); // Kontrol için tırnak içine al

    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    isAnswerChecked = true;
    if (isCorrect) score++;
  }

  // Cümleleri karşılaştırma için standartlaştıran yardımcı fonksiyon
  function normalizeForComparison(sentence: string): string {
    return sentence
      .toLowerCase() // Tüm harfleri küçük harfe çevir
      .replace(/\s+/g, ' ') // Birden fazla boşluğu tek boşluğa indir
      .trim() // Baştaki ve sondaki boşlukları kaldır
      // Noktalama işaretleri ile kelimeler arasındaki boşluğu kaldır
      // Örnek: "apple ." -> "apple." veya "What ?" -> "What?"
      .replace(/\s*([.,!?;:])\s*/g, '$1') // Noktalama işaretlerinin etrafındaki boşlukları kaldır
      ;
  }

  function nextSentence() {
    currentSentenceIndex++;
    if (currentSentenceIndex < totalSentences) {
      initializeSentence();
    }
  }

  function resetQuiz() {
    currentSentenceIndex = 0;
    score = 0;
    initializeSentence();
  }

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
</script>

<style>
  .sentence-builder-container {
    max-width: 700px;
    margin: 0 auto;
    padding: 1rem;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  .builder-title {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
    color: #1a202c; /* Darker blue-gray */
    text-align: center;
  }
  .progress {
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: #4a5568; /* Gray */
    text-align: center;
  }
  .turkish-sentence {
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
    font-weight: 500;
    color: #2d3748; /* Darker gray */
    padding: 1rem;
    background-color: #e2e8f0; /* Light gray */
    border-radius: 8px;
    text-align: center;
  }
  .answer-area {
    min-height: 80px;
    border: 2px dashed #a0aec0; /* Light blue-gray dashed border */
    border-radius: 8px;
    padding: 0.8rem;
    margin-bottom: 1.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    background-color: #f7fafc; /* Very light gray */
    font-size: 1.1rem;
  }
  .scrambled-words-area {
    border: 1px solid #cbd5e0; /* Lighter gray */
    border-radius: 8px;
    padding: 0.8rem;
    margin-bottom: 1.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    background-color: #edf2f7; /* Slightly darker light gray */
  }
  .word-token {
    padding: 0.5rem 0.8rem;
    background-color: #4299e1; /* Blue */
    color: white;
    border-radius: 6px;
    cursor: grab;
    transition: all 0.2s;
    user-select: none; /* Metin seçmeyi engelle */
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  .word-token:hover {
    background-color: #3182ce; /* Darker blue on hover */
    transform: translateY(-2px);
  }
  .word-token.user-answer-token {
    background-color: #38a169; /* Green for user answer */
    cursor: pointer;
  }
  .word-token.user-answer-token:hover {
    background-color: #2f855a; /* Darker green on hover */
  }

  .button-group {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  .button {
    padding: 0.7rem 1.4rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;
  }
  .check-button {
    background-color: #3182ce; /* Blue */
    color: white;
  }
  .check-button:hover {
    background-color: #2b6cb0; /* Darker blue */
    transform: translateY(-1px);
  }
  .check-button:disabled {
    background-color: #a0aec0; /* Lighter gray when disabled */
    cursor: not-allowed;
  }
  .next-button {
    background-color: #38a169; /* Green */
    color: white;
  }
  .next-button:hover {
    background-color: #2f855a; /* Darker green */
    transform: translateY(-1px);
  }
  .reset-button {
    background-color: #f6ad55; /* Orange */
    color: white;
  }
  .reset-button:hover {
    background-color: #ed8936; /* Darker orange */
    transform: translateY(-1px);
  }
  .feedback {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 8px;
    font-weight: 600;
    text-align: center;
  }
  .correct-feedback {
    background-color: #d1fae5; /* Light green */
    color: #065f46; /* Dark green */
  }
  .incorrect-feedback {
    background-color: #fee2e2; /* Light red */
    color: #991b1b; /* Dark red */
  }
  .explanation {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #ebf8ff; /* Light blue */
    border-radius: 8px;
    border-left: 5px solid #63b3ed; /* Blue border */
    color: #2b6cb0; /* Darker blue text */
    font-weight: 500;
  }
  .score {
    font-weight: bold;
    margin-top: 1.5rem;
    font-size: 1.2rem;
    text-align: center;
    color: #2d3748;
  }
  .select-word-prompt {
    color: #718096; /* Medium gray */
    text-align: center;
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }
</style>

<div class="sentence-builder-container">
  <h2 class="builder-title">{title}</h2>

  {#if currentSentenceIndex < sentencePairs.length}
    <div class="progress">
      {t('sentenceText')} {currentSentenceIndex + 1} {t('ofText')} {totalSentences}
    </div>
    
    <div class="turkish-sentence">
      {t('buildEnglishSentenceText', { 0: sentencePairs[currentSentenceIndex].turkish })}
    </div>
    
    <div class="answer-area">
      {#if selectedWords.length === 0 && !isAnswerChecked}
        <span class="select-word-prompt">{t('dragWordsHereText')}</span>
      {/if}
      {#each selectedWords as token (token.id)} <!-- Anahtar olarak token.id kullanıyoruz -->
        <div 
          class="word-token user-answer-token" 
          on:click={() => removeWordFromSelected(token)}
          title={t('clickToRemoveText')}
        >
          {token.word}
        </div>
      {/each}
    </div>
    
    <div class="scrambled-words-area">
      {#each availableWords as token (token.id)} <!-- Anahtar olarak token.id kullanıyoruz -->
        <div 
          class="word-token" 
          on:click={() => addWordToSelected(token)}
          title={t('clickToAddText')}
        >
          {token.word}
        </div>
      {/each}
    </div>
    
    <div class="button-group">
      {#if !isAnswerChecked}
        <button 
          class="button check-button" 
          on:click={checkAnswer}
          disabled={selectedWords.length === 0}
        >
          {t('checkSentenceText')}
        </button>
      {:else}
        {#if isCorrect}
          <div class="feedback correct-feedback">
            {t('correctSentenceText')}
          </div>
        {:else}
          <div class="feedback incorrect-feedback">
            {t('wrongSentenceText')}
          </div>
          <button 
            class="button" 
            on:click={() => showExplanation = !showExplanation}
          >
            {showExplanation ? t('hideCorrectSentenceText') : t('showCorrectSentenceText')}
          </button>
          
          {#if showExplanation}
            <div class="explanation">
              <strong>{t('correctSentenceText')}:</strong> {sentencePairs[currentSentenceIndex].english}
            </div>
          {/if}
        {/if}
        <button class="button next-button" on:click={nextSentence}>
          {t('nextSentenceText')}
        </button>
      {/if}
    </div>
  {:else}
    <div class="score">
      {t('sentenceBuilderCompleteText', {
        score: score.toString(),
        totalQuestions: totalSentences.toString(), // totalQuestions yerine totalSentences kullanıldı
        percentage: (score / totalSentences * 100).toFixed(1)
      })}
    </div>
    
    <div class="button-group">
      <button class="button reset-button" on:click={resetQuiz}>
        {t('restartBuilderText')}
      </button>
    </div>
  {/if}
</div>
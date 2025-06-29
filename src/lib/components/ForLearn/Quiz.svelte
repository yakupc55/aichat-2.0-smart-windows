<script lang="ts">
	import { t } from '$lib/lang';
	import { createMapFromSplitData, splitDataByLevel } from '$lib/utils';

	export let value: string;
	//console.log('value', value);

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

	// Quiz Durumu
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
	let allWordPairs: WordPair[] = []; // Orijinal kelime çiftlerini saklamak için

	// Ayarlar Durumu
	let showSettings = false; // Ayarlar menüsünü göster/gizle
	let isQuickAnswerMode = false; // Hızlı cevap modu aktif mi?

	// Önceki Soru Durumu (Hızlı Cevap Modu için)
	let previousQuestionWord: string | null = null;
	let previousQuestionAnswer: string | null = null;

	$: {
		try {
			const splitData = splitDataByLevel(value, 0);
			const valuesDatas = createMapFromSplitData(splitData, 1);
			//console.log('values data: ', valuesDatas);
			title = valuesDatas.get('title');
			quizType = valuesDatas.get('type');

			// Yalnızca bir kez soruları oluştur
			if (questions.length < 1 || allWordPairs.length < 1) {
				if (quizType === 'word') {
					const wordPairsData: string[] = valuesDatas.get('wordPairs');
					//console.log('question data', wordPairsData);
					const tempWordPairs: WordPair[] = [];
					wordPairsData.forEach((data) => {
						let splitData = splitDataByLevel(data, 2);
						const inputData = createMapFromSplitData(splitData, 3);
						tempWordPairs.push({
							word: inputData.get('word'),
							translation: inputData.get('translation')
						});
					});
					allWordPairs = tempWordPairs; // Orijinal kelime çiftlerini sakla
					questions = generateWordQuestions(allWordPairs, isQuickAnswerMode); // Soruları oluştur
				} else {
					const questionsData: string[] = valuesDatas.get('questions');
					questionsData.forEach((data) => {
						let splitData = splitDataByLevel(data, 2);
						//console.log('split data', splitData);

						const inputData = createMapFromSplitData(splitData, 3);
						//console.log('input data', inputData);
						//console.log('options', inputData.get('options'));

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
			console.error('Error parsing value:', err);
			questions = [];
			totalQuestions = 0;
		}
	}

	// Hızlı cevap modu değiştiğinde soruları yeniden oluştur
	$: if (quizType === 'word' && allWordPairs.length > 0) {
		questions = generateWordQuestions(allWordPairs, isQuickAnswerMode);
		totalQuestions = questions.length;
		resetQuiz(); // Sorular yeniden oluşturulduğunda quiz'i sıfırla
	}

	function checkAnswer() {
		if (selectedAnswer === null) return;

		const currentQuestion = questions[currentQuestionIndex];
		isCorrect =
			quizType === 'word'
				? currentQuestion.options[selectedAnswer] === currentQuestion.answer
				: selectedAnswer === currentQuestion.answer;

		isAnswered = true;
		if (isCorrect) score++;

		// Hızlı cevap modu aktifse otomatik olarak bir sonraki soruya geç
		if (isQuickAnswerMode && quizType === 'word') {
			// Önceki soru bilgisini kaydet
			previousQuestionWord = currentQuestion.question;
			previousQuestionAnswer = currentQuestion.answer as string; // Word quiz'de cevap string olacak
			setTimeout(() => {
				nextQuestion();
			}, 150); // Kısa bir gecikme ile geçiş yap
		}
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
		previousQuestionWord = null;
		previousQuestionAnswer = null;
		// Quiz sıfırlandığında, hızlı cevap moduna göre soruları tekrar oluştur
		if (quizType === 'word' && allWordPairs.length > 0) {
			questions = generateWordQuestions(allWordPairs, isQuickAnswerMode);
			totalQuestions = questions.length;
		}
	}

	function generateWordQuestions(wordPairs: WordPair[], quickMode: boolean): Question[] {
		const questions: Question[] = [];
		const numberOfWrongOptions = quickMode ? 2 : 3; // Hızlı modda 2 yanlış, normalde 3 yanlış

		wordPairs.forEach((pair, index) => {
			// Doğru cevap
			const correctAnswer = pair.translation;

			// Yanlış cevaplar için rastgele çeviriler seçiyoruz
			const otherTranslations = wordPairs
				.filter((_, i) => i !== index) // Mevcut kelimeyi dışarıda bırak
				.map((p) => p.translation); // Diğer kelimelerin çevirilerini al

			// Rastgele 'numberOfWrongOptions' kadar yanlış cevap seçiyoruz
			const wrongAnswers = shuffleArray(otherTranslations).slice(0, numberOfWrongOptions);

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
			const isActuallyCorrect =
				quizType === 'word'
					? option === questions[currentQuestionIndex].answer
					: index === questions[currentQuestionIndex].answer;

			if (isActuallyCorrect) classes.push('correct');
			// Eğer seçilen cevap yanlışsa ve bu cevap bizim seçtiğimiz cevapsa 'incorrect' ekle
			else if (selectedAnswer === index && !isActuallyCorrect) classes.push('incorrect');
		}

		return classes.join(' ');
	}
</script>

<div class="quiz-container">
	<h2 class="quiz-title">{title}</h2>

	<!-- Ayarlar Bölümü -->
	<details class="settings-menu" bind:open={showSettings}>
		<summary class="settings-summary">
	
			<span>{t('settingsText')}</span>
		</summary>
		<div class="settings-content">
			{#if quizType === 'word'}
				<label class="setting-item">
					<input type="checkbox" bind:checked={isQuickAnswerMode} />
					<span>{t('quickAnswerModeText')}</span>
					<span class="setting-description">({t('quickAnswerModeDescription')})</span>
				</label>
			{:else}
				<p class="setting-note">{t('noWordQuizSettingsText')}</p>
			{/if}
		</div>
	</details>

	{#if currentQuestionIndex < questions.length}
		<div class="progress">
			{t('questionText')} {currentQuestionIndex + 1} {t('ofText')} {totalQuestions}
		</div>

		<div class="question">
			{quizType === 'word'
				? t('wordQuestionText', { 0: questions[currentQuestionIndex].question })
				: questions[currentQuestionIndex].question}
		</div>

		<div class="options">
			{#each questions[currentQuestionIndex].options as option, index}
				<div
					class={getOptionClasses(
						index,
						option,
						quizType,
						questions,
						currentQuestionIndex,
						isAnswered,
						selectedAnswer,
						isCorrect
					)}
					on:click={() => {
						if (!isAnswered) {
							selectedAnswer = index;
							// Hızlı cevap modu aktifse, seçer seçmez kontrol et
							if (isQuickAnswerMode && quizType === 'word') {
								checkAnswer();
							}
						}
					}}
				>
					{option}
				</div>
			{/each}
		</div>

		{#if !isAnswered}
			{#if !(isQuickAnswerMode && quizType === 'word')}
				<!-- Hızlı cevap modunda kontrol butonu gizlenir -->
				<button
					class="button check-button"
					on:click={checkAnswer}
					disabled={selectedAnswer === null}
				>
					{t('checkAnswerText')}
				</button>
				{#if selectedAnswer === null}
					<div style="color: #64748b; margin-top: 0.25rem;">
						{t('selectOptionText')}
					</div>
				{/if}
			{:else if selectedAnswer === null}
				<!-- Hızlı cevap modunda, seçeneğe tıklandığında otomatik kontrol -->
				<div style="color: #64748b; margin-top: 0.25rem;">
					{t('selectOptionText')}
				</div>
			{/if}
		{:else}
			<div class="feedback {isCorrect ? 'correct-feedback' : 'incorrect-feedback'}">
				{isCorrect ? t('correctAnswerText') : t('wrongAnswerText')}
			</div>

			{#if questions[currentQuestionIndex].explanation}
				<button class="button" on:click={() => (showExplanation = !showExplanation)}>
					{showExplanation ? t('hideExplanationText') : t('showExplanationText')}
				</button>

				{#if showExplanation}
					<div class="explanation">
						<strong>{t('explanationText')}:</strong>
						{questions[currentQuestionIndex].explanation}
					</div>
				{/if}
			{/if}

			{#if !(isQuickAnswerMode && quizType === 'word')}
				<!-- Hızlı cevap modunda sonraki soru butonu gizlenir, otomatik geçiş olur -->
				<button class="button next-button" on:click={nextQuestion}>
					{t('nextQuestionText')}
				</button>
			{/if}
		{/if}

		<!-- Önceki Soru/Cevap Gösterimi (Word Quiz ve Hızlı Cevap Modu aktifken) -->
		{#if isQuickAnswerMode && quizType === 'word' && previousQuestionWord && previousQuestionAnswer}
			<div class="previous-qa-info">
				<strong>{t('previousQuestionText')}:</strong>
				<span class="previous-question-word">{previousQuestionWord}</span>
				<span class="previous-question-answer">({previousQuestionAnswer})</span>
			</div>
		{/if}
	{:else}
		<div class="score">
			{t('quizCompleteText', {
				score: score.toString(),
				totalQuestions: totalQuestions.toString(),
				percentage: ((score / totalQuestions) * 100).toFixed(1)
			})}
		</div>

		<button class="button reset-button" on:click={resetQuiz}>
			{t('restartQuizText')}
		</button>
	{/if}
</div>

<style>
	.quiz-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 0.25rem;
		position: relative; /* Ayarlar menüsü için */
	}
	.quiz-title {
		font-size: 1.2rem;
		font-weight: bold;
		margin-bottom: 0.25rem;
		color: #1e40af;
	}
	.question {
		font-size: 1.2rem;
		margin-bottom: 0.25rem;
		font-weight: 500;
	}
	.options {
		display: grid;
		gap: 0.25rem;
		margin-bottom: 0.25rem;
	}
	.option {
		padding: 0.25rem;
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
		padding: 0.5rem 0.5rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		margin-right: 0.5rem;
		border: 1px solid transparent; /* Varsayılan border */
		transition:
			background-color 0.2s,
			border-color 0.2s;
	}
	.button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.check-button {
		background-color: #3b82f6;
		color: white;
	}
	.check-button:hover:not(:disabled) {
		background-color: #2563eb;
	}
	.next-button {
		background-color: #10b981;
		color: white;
	}
	.next-button:hover:not(:disabled) {
		background-color: #059669;
	}
	.reset-button {
		background-color: #f59e0b;
		color: white;
	}
	.reset-button:hover:not(:disabled) {
		background-color: #d97706;
	}
	.feedback {
		margin-top: 0.25rem;
		padding: 0.25rem;
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
		margin-top: 0.25rem;
		padding: 0.25rem;
		background-color: #f8fafc;
		border-radius: 8px;
		border-left: 4px solid #94a3b8;
		font-size: 0.95rem;
	}
	.progress {
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
		color: #64748b;
	}
	.score {
		font-weight: bold;
		margin-top: 0.25rem;
		font-size: 1.1rem;
	}

	/* Ayarlar Menüsü Stilleri */
	.settings-menu {
		margin-bottom: 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		background-color: #f8fafc;
	}
	.settings-summary {
		padding: 0.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		font-weight: 500;
		color: #475569;
		list-style: none; /* Varsayılan ok işaretini kaldırır */
	}
	.settings-summary::-webkit-details-marker {
		display: none; /* Webkit tarayıcılarda ok işaretini kaldırır */
	}
	.settings-summary::before {
		content: '▶'; /* Özel ok işareti */
		display: inline-block;
		margin-right: 0.5rem;
		transition: transform 0.2s;
	}
	.settings-menu[open] > .settings-summary::before {
		transform: rotate(90deg); /* Açıkken oku döndür */
	}
	.settings-summary svg {
		margin-right: 0.25rem;
		color: #64748b;
	}
	.settings-content {
		padding: 0.5rem;
		border-top: 1px solid #e2e8f0;
		background-color: #f0f4f8;
		border-bottom-left-radius: 8px;
		border-bottom-right-radius: 8px;
	}
	.setting-item {
		display: flex;
		align-items: center;
		margin-bottom: 0.25rem;
	}
	.setting-item input[type='checkbox'] {
		margin-right: 0.5rem;
		cursor: pointer;
	}
	.setting-item span {
		font-size: 0.95rem;
		color: #334155;
	}
	.setting-description {
		font-size: 0.8rem;
		color: #64748b;
		margin-left: 0.5rem;
	}
	.setting-note {
		font-size: 0.9rem;
		color: #64748b;
		padding-left: 0.25rem;
	}

	/* Önceki Soru/Cevap Bilgisi */
	.previous-qa-info {
		margin-top: 1rem;
		padding: 0.5rem;
		background-color: #e2e8f0;
		border-radius: 8px;
		font-size: 0.9rem;
		color: #334155;
	}
	.previous-question-word {
		font-weight: bold;
		margin-left: 0.25rem;
	}
	.previous-question-answer {
		font-style: italic;
		color: #475569;
		margin-left: 0.25rem;
	}
</style>

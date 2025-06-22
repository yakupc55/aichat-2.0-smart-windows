<!-- Lobby.svelte -->
<script lang="ts">
	import { t } from '$lib/lang';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { gameTypes } from './gameTypes';
	import { createMapFromSplitData, splitDataByLevel } from '$lib/utils';
	import { get, writable, derived } from 'svelte/store';
	// Yeni eklenen importlar
	import { peerUserNames, selfUserName } from '$lib/p2p';

	export let value: string;
	export let currentRoomId: string | null;
	export let selfPeerId: string | null;
	export let selfRole: 'manager' | 'manager-player' | 'participant' | 'viewer';
	export let connectedPeers: Map<string, RTCPeerConnection>;
	export let dataChannels: Map<string, RTCDataChannel>;
	export let isGameInitialized: boolean;
	export let playerUserNames: Map<string, string>; // SmartTogether.svelte'den gelen yeni prop

	const dispatch = createEventDispatcher();

	type QuizType = 'word' | 'knowledge';
	type Question = {
		question: string;
		options: string[];
		answer: string | number;
		explanation?: string;
	};
	type WordPair = {
		word: string;
		translation: string;
	};

	type PlayerRole = 'manager' | 'manager-player' | 'participant' | 'viewer';
	type PlayerState = {
		peerId: string;
		userName: string; // Yeni: Kullanıcı adı
		role: PlayerRole;
		score: number;
		hasAnswered: boolean;
		lastAnswer: number | null;
	};

	let title = '';
	let quizType: QuizType = 'word';
	let questions: Question[] = [];
	let currentQuestionIndex = 0;
	let selectedAnswer: number | null = null;
	let isAnswered = false;
	let isCorrect = false;
	let showExplanation = false;
	let totalQuestions = 0;

	let players = writable<Map<string, PlayerState>>(new Map());
	let managerPeerId: string | null = null;

	let autoNextQuestion: boolean = false;

	onMount(() => {
		if (selfPeerId) {
			players.update((map) => {
				map.set(selfPeerId, {
					peerId: selfPeerId,
					userName: get(selfUserName) || selfPeerId, // Kendi ismini veya Peer ID'yi kullan
					role: selfRole,
					score: 0,
					hasAnswered: false,
					lastAnswer: null
				});
				return map;
			});
			if (selfRole === 'manager' || selfRole === 'manager-player') {
				loadQuizData(value);
				managerPeerId = selfPeerId;
			}
		}
		window.addEventListener('p2pMessage', handleGlobalP2PMessage);
		window.addEventListener('p2pPlayerLeft', handlePlayerLeftEvent);
	});

	onDestroy(() => {
		window.removeEventListener('p2pMessage', handleGlobalP2PMessage);
		window.removeEventListener('p2pPlayerLeft', handlePlayerLeftEvent);
	});

	function loadQuizData(dataString: string) {
		try {
			const splitData = splitDataByLevel(dataString, 0);
			const valuesDatas = createMapFromSplitData(splitData, 1);
			title = valuesDatas.get('title') || '';
			quizType = (valuesDatas.get('type') as QuizType) || 'knowledge';

			if (valuesDatas.get('wordPairs') && quizType === 'word') {
				const wordPairsData: string[] = valuesDatas.get('wordPairs');
				const wordPairs: WordPair[] = [];
				wordPairsData.forEach((data) => {
					let splitData = splitDataByLevel(data, 2);
					const inputData = createMapFromSplitData(splitData, 3);
					wordPairs.push({
						word: inputData.get('word') || '',
						translation: inputData.get('translation') || ''
					});
				});
				questions = generateWordQuestions(wordPairs);
			} else if (valuesDatas.get('questions') && quizType !== 'word') {
				const questionsData: string[] = valuesDatas.get('questions');
				questionsData.forEach((data) => {
					let splitData = splitDataByLevel(data, 2);
					const inputData = createMapFromSplitData(splitData, 3);
					questions.push({
						question: inputData.get('question') || '',
						explanation: inputData.get('explanation') || '',
						options: inputData.get('options') || [],
						answer: inputData.get('answer')
					});
				});
			} else {
				console.warn('loadQuizData: No valid quiz data found for type', quizType);
				questions = [];
			}
			totalQuestions = questions.length;
			console.log('Quiz verisi yüklendi (Yönetici):', questions.length, 'soru.');
		} catch (err) {
			console.error('Error parsing quiz value for manager:', err);
			questions = [];
			totalQuestions = 0;
		}
	}

	function handleGlobalP2PMessage(event: Event) {
		const customEvent = event as CustomEvent;
		const senderPeerId = customEvent.detail.senderPeerId;
		const message = customEvent.detail.message;
		handleP2PMessage(senderPeerId, message);
	}

	function handlePlayerLeftEvent(event: Event) {
		const customEvent = event as CustomEvent;
		const peerId = customEvent.detail.peerId;
		players.update((map) => {
			map.delete(peerId);
			return map;
		});
		if (managerPeerId === peerId) {
			managerPeerId = null;
			dispatch('sendData', { data: { type: 'endGame' } });
			console.warn('Yönetici ayrıldı! Oyun sona erdi.');
		}
	}

	function handleP2PMessage(senderPeerId: string, message: any) {
		console.log(`TogetherQuiz - P2P Mesajı Alındı [${senderPeerId}]:`, message);

		switch (message.type) {
			case 'playerJoined':
				players.update((map) => {
					if (!map.has(senderPeerId)) {
						map.set(senderPeerId, {
							peerId: senderPeerId,
							userName: playerUserNames.get(senderPeerId) || senderPeerId, // Gelen isimleri kullan
							role: message.role || 'participant',
							score: 0,
							hasAnswered: false,
							lastAnswer: null
						});
					}
					return map;
				});
				if (selfRole === 'manager' || selfRole === 'manager-player') {
					sendGameStatusTo(senderPeerId);
				}
				break;
			case 'gameStatus':
				if (selfRole !== 'manager' && selfRole !== 'manager-player') {
					currentQuestionIndex = message.currentQuestionIndex;
					managerPeerId = message.managerPeerId;
					title = message.quizTitle;
					quizType = message.quizType;
					questions = message.questions;
					totalQuestions = message.totalQuestions;
					isGameInitialized = message.gameStarted;
					autoNextQuestion = message.autoNextQuestion;

					// PlayerStates'i güncellerken userName bilgisini de aktar
					const updatedPlayerStates = new Map<string, PlayerState>();
					message.playerStates.forEach((p: PlayerState) => {
						updatedPlayerStates.set(p.peerId, {
							...p,
							userName: playerUserNames.get(p.peerId) || p.peerId // PeerUserNames store'undan veya PeerId'den al
						});
					});
					players.set(updatedPlayerStates);
					resetForNextQuestion();
					console.log('Katılımcı - Oyun durumu güncellendi:', {
						currentQuestionIndex,
						totalQuestions,
						isGameInitialized,
						autoNextQuestion
					});
				}
				break;
			case 'nextQuestion':
				if (selfRole !== 'manager' && selfRole !== 'manager-player') {
					currentQuestionIndex = message.questionIndex;
					players.update((map) => {
						map.forEach((player) => {
							player.hasAnswered = false;
							player.lastAnswer = null;
						});
						return map;
					});
					resetForNextQuestion();
				}
				break;
			case 'answerSubmitted':
				if (selfRole === 'manager' || selfRole === 'manager-player') {
					players.update((map) => {
						const player = map.get(senderPeerId);
						if (player) {
							player.hasAnswered = true;
							player.lastAnswer = message.answerIndex;
							const currentQuestion = questions[currentQuestionIndex];
							const isPlayerCorrect =
								quizType === 'word'
									? currentQuestion.options[message.answerIndex] === currentQuestion.answer
									: message.answerIndex === currentQuestion.answer;
							if (isPlayerCorrect) {
								player.score++;
							}
							map.set(senderPeerId, player);
						}
						return map;
					});
				}
				break;
			case 'playerRoleChanged':
				players.update((map) => {
					const player = map.get(message.playerPeerId);
					if (player) {
						player.role = message.newRole;
						map.set(message.playerPeerId, player);
					}
					return map;
				});
				if (message.playerPeerId === selfPeerId) {
					selfRole = message.newRole;
				}
				break;
			case 'setManager':
				managerPeerId = message.managerPeerId;
				players.update((map) => {
					if (map.has(message.managerPeerId)) {
						const newManager = map.get(message.managerPeerId)!;
						newManager.role = 'manager';
						map.set(message.managerPeerId, newManager);
					} else {
						map.set(message.managerPeerId, {
							peerId: message.managerPeerId,
							userName: playerUserNames.get(message.managerPeerId) || message.managerPeerId, // İsim bilgisini ekle
							role: 'manager',
							score: 0,
							hasAnswered: false,
							lastAnswer: null
						});
					}
					map.forEach((player) => {
						if (
							player.peerId !== message.managerPeerId &&
							(player.role === 'manager' || player.role === 'manager-player')
						) {
							player.role = 'participant';
							map.set(player.peerId, player);
						}
					});
					return map;
				});
				if (selfPeerId === message.managerPeerId) {
					selfRole = 'manager';
					loadQuizData(value);
				} else if (selfRole === 'manager' || selfRole === 'manager-player') {
					selfRole = 'participant';
				}
				break;
			case 'autoNextUpdate':
				if (
					selfRole !== 'manager' &&
					selfRole !== 'manager-player' &&
					managerPeerId === senderPeerId
				) {
					// Sadece yönetici olmayanlar güncellesin
					autoNextQuestion = message.autoNextQuestion;
				}
				break;
			case 'userNameUpdate': // p2p.ts'ten gelen doğrudan userNameUpdate mesajları
				// playerUserNames store'u zaten p2p.ts içinde güncelleniyor, burada ek bir işlem yapmaya gerek yok.
				// Ancak players store'undaki ilgili oyuncunun userName'ini de güncellemeliyiz.
				players.update((map) => {
					const player = map.get(message.peerId);
					if (player) {
						player.userName = message.userName;
						map.set(message.peerId, player);
					}
					return map;
				});
				break;
			case 'startGame':
				break;
			case 'endGame':
				break;
			case 'resetQuiz':
				resetQuizState();
				break;
		}
	}

	function sendGameStatusTo(targetPeerId: string | 'all') {
		if (!(selfRole === 'manager' || selfRole === 'manager-player') || !selfPeerId) return;

		const message = {
			type: 'gameStatus',
			currentQuestionIndex: currentQuestionIndex,
			managerPeerId: selfPeerId,
			gameStarted: isGameInitialized,
			quizTitle: title,
			quizType: quizType,
			questions: questions,
			totalQuestions: totalQuestions,
			autoNextQuestion: autoNextQuestion,
			playerStates: Array.from(get(players).values()) // PlayerStates zaten userName içeriyor
		};

		if (targetPeerId === 'all') {
			dispatch('sendData', { data: message });
		} else {
			const channel = dataChannels.get(targetPeerId);
			if (channel && channel.readyState === 'open') {
				channel.send(JSON.stringify(message));
			}
		}
	}

	function managerNextQuestion() {
		if (!(selfRole === 'manager' || selfRole === 'manager-player') || !selfPeerId) return;

		currentQuestionIndex++;
		if (currentQuestionIndex < totalQuestions) {
			players.update((map) => {
				map.forEach((player) => {
					player.hasAnswered = false;
					player.lastAnswer = null;
				});
				return map;
			});
			resetForNextQuestion();
			dispatch('sendData', { data: { type: 'nextQuestion', questionIndex: currentQuestionIndex } });
		} else {
			dispatch('sendData', {
				data: {
					type: 'endGame',
					finalScores: Array.from(get(players).values()).map((p) => ({
						peerId: p.peerId,
						userName: p.userName,
						score: p.score
					})) // userName ekle
				}
			});
		}
	}

	function submitAnswer() {
		// Sadece katılımcı veya oynayan-yönetici cevap verebilir
		if (
			!(selfRole === 'participant' || selfRole === 'manager-player') ||
			selectedAnswer === null ||
			isAnswered ||
			!selfPeerId
		)
			return;

		isAnswered = true;
		const currentQuestion = questions[currentQuestionIndex];
		isCorrect =
			quizType === 'word'
				? currentQuestion.options[selectedAnswer] === currentQuestion.answer
				: selectedAnswer === currentQuestion.answer;

		players.update((map) => {
			const myPlayer = map.get(selfPeerId!);
			if (myPlayer) {
				myPlayer.hasAnswered = true;
				myPlayer.lastAnswer = selectedAnswer;
				if (isCorrect) myPlayer.score++;
				map.set(selfPeerId!, myPlayer);
			}
			return map;
		});

		// Cevabı yöneticiye P2P üzerinden gönder.
		// SADECE eğer ben katılımcıysam
		if (selfRole === 'participant' && managerPeerId) {
			const channel = dataChannels.get(managerPeerId);
			if (channel && channel.readyState === 'open') {
				channel.send(JSON.stringify({ type: 'answerSubmitted', answerIndex: selectedAnswer }));
			}
		}
	}

	function resetForNextQuestion() {
		selectedAnswer = null;
		isAnswered = false;
		isCorrect = false;
		showExplanation = false;
	}

	function resetQuizState() {
		currentQuestionIndex = 0;
		resetForNextQuestion();
		players.update((map) => {
			map.forEach((player) => {
				player.score = 0;
				player.hasAnswered = false;
				player.lastAnswer = null;
			});
			return map;
		});
	}

	function resetQuiz() {
		resetQuizState();
		if (selfRole === 'manager' || selfRole === 'manager-player') {
			dispatch('sendData', { data: { type: 'resetQuiz' } });
			loadQuizData(value);
		} else if (managerPeerId) {
			const channel = dataChannels.get(managerPeerId);
			if (channel && channel.readyState === 'open') {
				channel.send(JSON.stringify({ type: 'resetQuizRequest' }));
			}
		}
	}

	function changeMyRole(newRole: PlayerRole) {
		if (selfPeerId === null || newRole === selfRole) return;

		// Yöneticilikten başka bir role geçiş
		if (
			(selfRole === 'manager' || selfRole === 'manager-player') &&
			!(newRole === 'manager' || newRole === 'manager-player')
		) {
			const activeManagers = Array.from(get(players).values()).filter(
				(p) => p.role === 'manager' || p.role === 'manager-player'
			).length;
			if (activeManagers === 1 && (selfRole === 'manager' || selfRole === 'manager-player')) {
				console.warn(
					'Tek yönetici varken yöneticilik rolünden çıkmak oyunu durdurabilir. Yeni bir yönetici atayın veya oyunu bitirin.'
				);
			}
		}

		// Rol değişimini P2P üzerinden diğer oyunculara bildir
		dispatch('sendData', {
			data: { type: 'playerRoleChanged', playerPeerId: selfPeerId, newRole: newRole }
		});

		// Kendi rolümüzü güncelle
		selfRole = newRole;

		players.update((map) => {
			const myPlayer = map.get(selfPeerId!);
			if (myPlayer) {
				myPlayer.role = newRole;
				myPlayer.hasAnswered = false;
				myPlayer.lastAnswer = null;
				map.set(selfPeerId!, myPlayer);
			}
			return map;
		});

		if (newRole === 'manager' || newRole === 'manager-player') {
			managerPeerId = selfPeerId;
			loadQuizData(value);
			dispatch('sendData', { data: { type: 'endGame' } });
		} else if (selfRole === 'manager' || selfRole === 'manager-player') {
			// Do nothing specific here, SmartTogether will handle managerPeerId change logic.
		}
	}

	function generateWordQuestions(wordPairs: WordPair[]): Question[] {
		const questions: Question[] = [];
		wordPairs.forEach((pair, index) => {
			const correctAnswer = pair.translation;
			const otherTranslations = wordPairs.filter((_, i) => i !== index).map((p) => p.translation);
			const wrongAnswers = shuffleArray(otherTranslations).slice(0, 3);
			const options = shuffleArray([...wrongAnswers, correctAnswer]);
			questions.push({
				question: `${pair.word}`,
				options: options,
				answer: correctAnswer,
				explanation: `${pair.word} kelimesinin anlamı ${correctAnswer}dır.`
			});
		});
		return questions;
	}

	function shuffleArray<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	function getOptionClasses(index: number, option: string): string {
		let classes = ['option'];

		if (selectedAnswer === index) classes.push('selected');

		// Düzeltme: manager-player artık doğrudan doğru cevabı göremez.
		// Sadece manager ve viewer rolleri veya cevap verildikten sonra (isAnswered) görülebilir.
		const canSeeCorrectAnswer = isAnswered || selfRole === 'viewer' || selfRole === 'manager';

		if (canSeeCorrectAnswer) {
			const currentQuestion = questions[currentQuestionIndex];
			if (!currentQuestion || !currentQuestion.options) return classes.join(' ');

			const isActuallyCorrect =
				quizType === 'word'
					? currentQuestion.options[index] === currentQuestion.answer
					: index === currentQuestion.answer;

			if (isActuallyCorrect) classes.push('correct');
			// Sadece kendi cevabı yanlışsa ve kendisi katılımcı veya oynayan yöneticiyse 'incorrect' işaretle
			if (
				(selfRole === 'participant' || selfRole === 'manager-player') &&
				selectedAnswer === index &&
				!isCorrect &&
				isAnswered
			) {
				classes.push('incorrect');
			}
		}

		return classes.join(' ');
	}

	$: allPlayersAnswered = (() => {
		if (
			!(selfRole === 'manager' || selfRole === 'manager-player') ||
			!isGameInitialized ||
			questions.length === 0
		)
			return false;

		const currentPlayersMap = get(players);
		if (!currentPlayersMap) return false;

		const activePlayers = Array.from(currentPlayersMap.values()).filter(
			(p) => p.role === 'participant' || p.role === 'manager-player'
		);

		if (activePlayers.length === 0) return false;

		return activePlayers.every((player) => player.hasAnswered);
	})();

	$: {
		if (
			(selfRole === 'manager' || selfRole === 'manager-player') &&
			autoNextQuestion &&
			allPlayersAnswered &&
			currentQuestionIndex < totalQuestions
		) {
			setTimeout(() => {
				managerNextQuestion();
			}, 1500);
		}
	}

	const sortedPlayers = derived(players, ($players) => {
		return Array.from($players.values())
			.filter((p) => p.role === 'participant' || p.role === 'manager-player')
			.sort((a, b) => b.score - a.score);
	});

	$: {
		// connectedPeers güncellendiğinde veya playerUserNames güncellendiğinde tetiklenir
		if (selfPeerId) {
			const currentPeerIds = new Set(Array.from(connectedPeers.keys())); // connectedPeers bir Map olduğu için key'leri al
			const currentPlayersMap = get(players);

			currentPeerIds.forEach((peerId) => {
				if (!currentPlayersMap.has(peerId)) {
					players.update((map) => {
						map.set(peerId, {
							peerId: peerId,
							userName: playerUserNames.get(peerId) || peerId, // Kullanıcı adını kullan
							role: 'participant', // Varsayılan olarak katılımcı rolüyle ekle
							score: 0,
							hasAnswered: false,
							lastAnswer: null
						});
						return map;
					});
				} else {
					// Eğer oyuncu zaten varsa ve userName güncellenmişse, onu da players store'unda güncelle
					const existingPlayer = currentPlayersMap.get(peerId);
					const latestUserName = playerUserNames.get(peerId);
					if (existingPlayer && latestUserName && existingPlayer.userName !== latestUserName) {
						players.update((map) => {
							map.set(peerId, { ...existingPlayer, userName: latestUserName });
							return map;
						});
					}
				}
			});

			// Artık bağlı olmayan peer'ları players listesinden çıkar
			players.update((map) => {
				const newMap = new Map(map);
				newMap.forEach((playerState, peerId) => {
					if (!currentPeerIds.has(peerId) && peerId !== selfPeerId) {
						// Kendimizi listeden çıkarmayız
						newMap.delete(peerId);
					}
				});
				return newMap;
			});

			// Kendi kullanıcı adımızı players listesinde güncelle (eğer değiştiyse)
			if (
				selfPeerId &&
				get(selfUserName) &&
				get(players).get(selfPeerId)?.userName !== get(selfUserName)
			) {
				players.update((map) => {
					const myPlayer = map.get(selfPeerId);
					if (myPlayer) {
						map.set(selfPeerId, { ...myPlayer, userName: get(selfUserName) });
					}
					return map;
				});
			}
		}
	}

	function startGameAsManager() {
		if ((selfRole === 'manager' || selfRole === 'manager-player') && !isGameInitialized) {
			dispatch('sendData', { data: { type: 'startGame' } });
			sendGameStatusTo('all');
		}
	}

	function sendAutoNextState() {
		if (selfRole === 'manager' || selfRole === 'manager-player') {
			dispatch('sendData', {
				data: { type: 'autoNextUpdate', autoNextQuestion: autoNextQuestion }
			});
		}
	}
</script>

<div class="quiz-container">
	<h2 class="quiz-title">{title} ({t('multiplayer')})</h2>

	<div class="role-selection">
		<div class="current-role">
			{t('yourRole')}: <strong>{t(selfRole)}</strong>
		</div>
		{#if selfPeerId && !isGameInitialized}
			{#if selfRole !== 'manager'}
				<button class="button role-manager" on:click={() => changeMyRole('manager')}>
					{t('becomeManager')}
				</button>
			{/if}
			{#if selfRole !== 'manager-player'}
				<button class="button role-manager-player" on:click={() => changeMyRole('manager-player')}>
					{t('becomeManagerPlayer')}
				</button>
			{/if}
			{#if selfRole !== 'participant'}
				<button class="button role-participant" on:click={() => changeMyRole('participant')}>
					{t('becomeParticipant')}
				</button>
			{/if}
			{#if selfRole !== 'viewer'}
				<button class="button role-viewer" on:click={() => changeMyRole('viewer')}>
					{t('becomeViewer')}
				</button>
			{/if}
		{/if}
		{#if selfRole === 'manager' || selfRole === 'manager-player'}
			<div class="manager-controls">
				<label class="auto-next-label">
					<input type="checkbox" bind:checked={autoNextQuestion} on:change={sendAutoNextState} />
					{t('autoNextQuestion')}
				</label>
			</div>
		{/if}
	</div>

	<div class="player-list">
		<h4>{t('playersInRoom')}:</h4>
		<ul>
			{#each $sortedPlayers as player}
				<li>
					{player.userName} ({t(player.role)}): <span>{player.score}</span>
				</li>
			{/each}
		</ul>
	</div>

	{#if (selfRole === 'manager' || selfRole === 'manager-player') && !isGameInitialized}
		<div class="button-group">
			<button
				class="button start-game-button"
				on:click={startGameAsManager}
				disabled={totalQuestions === 0}
			>
				{t('startGame')}
			</button>
			{#if totalQuestions === 0}
				<p style="color: #e91e63;">{t('noQuestionsLoaded')}</p>
			{/if}
		</div>
	{:else if !isGameInitialized}
		<div class="waiting-message">
			<p>{t('waitingForManagerToStart')}</p>
		</div>
	{/if}

	{#if isGameInitialized}
		{#if currentQuestionIndex < questions.length}
			<div class="question-section">
				<div class="progress">
					{t('questionText')}
					{currentQuestionIndex + 1}
					{t('ofText')}
					{totalQuestions}
				</div>

				<div class="question">
					{quizType === 'word'
						? t('wordQuestionText', { 0: questions[currentQuestionIndex].question })
						: questions[currentQuestionIndex].question}
				</div>

				<div class="options">
					{#each questions[currentQuestionIndex].options as option, index}
						<div
							class={getOptionClasses(index, option)}
							on:click={() =>
								(selfRole === 'participant' || selfRole === 'manager-player') &&
								!isAnswered &&
								(selectedAnswer = index)}
							class:disabled={!(selfRole === 'participant' || selfRole === 'manager-player') ||
								isAnswered}
							role="option"
							tabindex={selfRole === 'participant' || (selfRole === 'manager-player' && !isAnswered)
								? '0'
								: '-1'}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									if (
										(selfRole === 'participant' || selfRole === 'manager-player') &&
										!isAnswered
									) {
										selectedAnswer = index;
									}
								}
							}}
						>
							{option}
						</div>
					{/each}
				</div>

				<div class="button-group">
					{#if selfRole === 'participant' || selfRole === 'manager-player'}
						{#if !isAnswered}
							<button
								class="button check-button"
								on:click={submitAnswer}
								disabled={selectedAnswer === null}
							>
								{t('submitAnswerText')}
							</button>
						{:else}
							<div class="feedback {isCorrect ? 'correct-feedback' : 'incorrect-feedback'}">
								{isCorrect ? t('correctAnswerText') : t('wrongAnswerText')}
							</div>
							{#if questions[currentQuestionIndex] && questions[currentQuestionIndex].explanation}
								<button class="button" on:click={() => (showExplanation = !showExplanation)}>
									{showExplanation ? t('hideExplanationText') : t('showExplanationText')}
								</button>
							{/if}
						{/if}
					{/if}

					{#if selfRole === 'manager' || selfRole === 'manager-player'}
						<button
							class="button next-button"
							on:click={managerNextQuestion}
							disabled={totalQuestions === 0 || currentQuestionIndex === totalQuestions - 1}
						>
							{t('nextQuestionText')}
						</button>
						{#if questions[currentQuestionIndex] && questions[currentQuestionIndex].explanation}
							{#if selfRole !== 'participant'}
								<button class="button" on:click={() => (showExplanation = !showExplanation)}>
									{showExplanation ? t('hideExplanationText') : t('showExplanationText')}
								</button>
							{/if}
						{/if}
					{/if}
				</div>
				{#if showExplanation && questions[currentQuestionIndex] && questions[currentQuestionIndex].explanation}
					<div class="explanation">
						<strong>{t('explanationText')}:</strong>
						{questions[currentQuestionIndex].explanation}
					</div>
				{/if}
			</div>
		{:else}
			<div class="score-final">
				{t('quizCompleteText', {
					score: Array.from(get(players).values()).find((p) => p.peerId === selfPeerId)?.score || 0,
					totalQuestions: totalQuestions.toString(),
					percentage: (
						((Array.from(get(players).values()).find((p) => p.peerId === selfPeerId)?.score || 0) /
							totalQuestions) *
						100
					).toFixed(1)
				})}
				<br />
				<h4>{t('finalScores')}:</h4>
				<ul>
					{#each $sortedPlayers as player}
						<li>
							{player.userName} ({t(player.role)}): <span>{player.score}</span>
						</li>
					{/each}
				</ul>
			</div>

			<div class="button-group">
				<button class="button reset-button" on:click={resetQuiz}>
					{t('restartQuizText')}
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.quiz-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
		background-color: #fcfcfc;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}
	.quiz-title {
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 1.5rem;
		color: #1e40af;
		text-align: center;
	}
	.role-selection {
		text-align: center;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background-color: #e8f5e9;
		border-radius: 8px;
	}
	.role-selection button {
		margin: 0.5rem;
		padding: 0.8rem 1.5rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		transition: background-color 0.2s;
	}
	.role-manager {
		background-color: #4caf50;
		color: white;
	}
	.role-manager:hover {
		background-color: #43a047;
	}
	.role-manager-player {
		background-color: #f59e0b;
		color: white;
	} /* Turuncu tonu */
	.role-manager-player:hover {
		background-color: #d97706;
	}
	.role-participant {
		background-color: #2196f3;
		color: white;
	}
	.role-participant:hover {
		background-color: #1976d2;
	}
	.role-viewer {
		background-color: #9e9e9e;
		color: white;
	}
	.role-viewer:hover {
		background-color: #757575;
	}

	.manager-controls {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #ddd;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 1rem;
	}
	.auto-next-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		color: #444;
	}
	.auto-next-label input[type='checkbox'] {
		width: 20px;
		height: 20px;
		cursor: pointer;
	}

	.current-role {
		font-weight: bold;
		color: #333;
		margin-bottom: 0.8rem;
	}
	.player-list {
		margin-top: 1.5rem;
		margin-bottom: 2rem;
		padding: 1rem;
		background-color: #eceff1;
		border-radius: 8px;
	}
	.player-list h4 {
		margin-top: 0;
		color: #455a64;
		font-size: 1.1rem;
	}
	.player-list ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.5rem;
	}
	.player-list li {
		background-color: #ffffff;
		padding: 0.6rem 1rem;
		border-radius: 5px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}
	.player-list li span {
		font-weight: bold;
		color: #3f51b5;
	}

	.question-section {
		margin-top: 2rem;
		padding: 1.5rem;
		border: 1px solid #d1d5db;
		border-radius: 10px;
		background-color: white;
	}
	.progress {
		margin-bottom: 1rem;
		font-size: 0.9rem;
		color: #64748b;
	}
	.question {
		font-size: 1.3rem;
		margin-bottom: 1.5rem;
		font-weight: 500;
		color: #333;
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
	.option.disabled {
		opacity: 0.7;
		cursor: not-allowed;
		background-color: #f0f0f0;
	}
	.button-group {
		display: flex;
		gap: 0.5rem;
		margin-top: 1.5rem;
		justify-content: center;
	}
	.button {
		padding: 0.8rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
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
	.start-game-button {
		background-color: #22c55e;
		color: white;
		border: none;
	}
	.start-game-button:hover {
		background-color: #16a34a;
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
	.score-final {
		font-weight: bold;
		margin-top: 1rem;
		font-size: 1.5rem;
		text-align: center;
		color: #1a237e;
	}
	.waiting-message {
		text-align: center;
		padding: 2rem;
		font-size: 1.2rem;
		color: #666;
	}
</style>

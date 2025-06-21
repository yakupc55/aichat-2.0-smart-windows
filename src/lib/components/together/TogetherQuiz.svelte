<!-- Lobby.svelte -->
<script lang="ts">
	import { t } from '$lib/lang';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { gameTypes } from './gameTypes'; // Oyun türlerini import et
	import { createMapFromSplitData, splitDataByLevel } from '$lib/utils';
	import { get, writable, derived } from 'svelte/store';

	export let value: string;
  export let currentRoomId: string | null; // Bu prop SmartTogether'dan geliyor, eğer kullanılmıyorsa uyarı verebilir.
  export let selfPeerId: string | null; // <-- Prop olarak değeri geliyor, store değil
  export let selfRole: 'manager' | 'participant' | 'viewer'; // <-- Prop olarak değeri geliyor, store değil
  export let connectedPeers: Map<string, RTCPeerConnection>; // Bu Map, p2p.ts'deki connectedPeers store'unun value'su olmalı
  export let dataChannels: Map<string, RTCDataChannel>; // Bu Map, p2p.ts'deki dataChannels store'unun value'su olmalı
  export let isGameInitialized: boolean; // SmartTogether'dan gelen prop

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

  type PlayerRole = 'manager' | 'participant' | 'viewer';
  type PlayerState = {
    peerId: string;
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

  let players = writable<Map<string, PlayerState>>(new Map()); // players bir writable store
  let managerPeerId: string | null = null;

  // Yöneticinin oyuna katılıp katılmadığını belirten yeni bir state
  let managerPlays: boolean = false; // Varsayılan olarak yönetici oynamaz
  let autoNextQuestion: boolean = false; // Yeni: Otomatik geçiş varsayılan olarak kapalı

  onMount(() => {
    if (selfPeerId) {
      players.update(map => { // players bir store olduğu için update kullanın
        map.set(selfPeerId, { peerId: selfPeerId, role: selfRole, score: 0, hasAnswered: false, lastAnswer: null });
        return map;
      });
      if (selfRole === 'manager') {
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
          console.warn("loadQuizData: No valid quiz data found for type", quizType);
          questions = [];
      }
      totalQuestions = questions.length;
      console.log("Quiz verisi yüklendi (Yönetici):", questions.length, "soru.");
    } catch (err) {
      console.error("Error parsing quiz value for manager:", err);
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
    players.update(map => {
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
        players.update(map => {
          if (!map.has(senderPeerId)) {
            map.set(senderPeerId, { peerId: senderPeerId, role: message.role || 'participant', score: 0, hasAnswered: false, lastAnswer: null });
          }
          return map;
        });
        if (selfRole === 'manager') {
            sendGameStatusTo(senderPeerId);
        }
        break;
      case 'gameStatus':
        if (selfRole !== 'manager') {
          currentQuestionIndex = message.currentQuestionIndex;
          managerPeerId = message.managerPeerId;
          title = message.quizTitle;
          quizType = message.quizType;
          questions = message.questions;
          totalQuestions = message.totalQuestions;
          isGameInitialized = message.gameStarted;
          managerPlays = message.managerPlays; // Yöneticinin oynayıp oynamadığını al
          autoNextQuestion = message.autoNextQuestion; // Otomatik geçiş durumunu al

          players.set(new Map(message.playerStates.map((p: PlayerState) => [p.peerId, p])));
          resetForNextQuestion();
          console.log("Katılımcı - Oyun durumu güncellendi:", { currentQuestionIndex, totalQuestions, isGameInitialized, managerPlays, autoNextQuestion });
        }
        break;
      case 'nextQuestion':
        if (selfRole !== 'manager') {
          currentQuestionIndex = message.questionIndex;
          players.update(map => {
            map.forEach(player => {
                player.hasAnswered = false;
                player.lastAnswer = null;
            });
            return map;
          });
          resetForNextQuestion();
        }
        break;
      case 'answerSubmitted':
        if (selfRole === 'manager') {
          players.update(map => {
            const player = map.get(senderPeerId);
            if (player) {
              player.hasAnswered = true;
              player.lastAnswer = message.answerIndex;
              const currentQuestion = questions[currentQuestionIndex];
              const isPlayerCorrect = quizType === 'word'
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
        players.update(map => {
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
          players.update(map => {
              if (map.has(message.managerPeerId)) {
                  const newManager = map.get(message.managerPeerId)!;
                  newManager.role = 'manager';
                  map.set(message.managerPeerId, newManager);
              } else {
                  map.set(message.managerPeerId, { peerId: message.managerPeerId, role: 'manager', score: 0, hasAnswered: false, lastAnswer: null });
              }
              map.forEach(player => {
                  if (player.peerId !== message.managerPeerId && player.role === 'manager') {
                      player.role = 'participant';
                      map.set(player.peerId, player);
                  }
              });
              return map;
          });
          if (selfPeerId === message.managerPeerId) {
            selfRole = 'manager';
            loadQuizData(value);
          } else if (selfRole === 'manager') {
              selfRole = 'participant';
          }
          break;
      case 'managerPlaysUpdate': // Yönetici oynuyor mu bilgisini güncelle
          if (managerPeerId === senderPeerId) { // Sadece yöneticiden geliyorsa güncelle
              managerPlays = message.managerPlays;
              players.update(map => {
                  const managerPlayer = map.get(managerPeerId!);
                  if (managerPlayer) {
                      map.set(managerPeerId!, { 
                          ...managerPlayer, 
                          hasAnswered: managerPlays ? managerPlayer.hasAnswered : false,
                          lastAnswer: managerPlays ? managerPlayer.lastAnswer : null
                      });
                  }
                  return map;
              });
          }
          break;
      case 'autoNextUpdate': // Yeni: Otomatik geçiş durumu güncellendiğinde
          if (managerPeerId === senderPeerId && selfRole !== 'manager') { // Sadece yöneticiden geliyorsa ve ben yönetici değilsem
              autoNextQuestion = message.autoNextQuestion;
          }
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
    if (selfRole !== 'manager' || !selfPeerId) return;

    const message = {
      type: 'gameStatus',
      currentQuestionIndex: currentQuestionIndex,
      managerPeerId: selfPeerId,
      gameStarted: isGameInitialized,
      quizTitle: title,
      quizType: quizType,
      questions: questions,
      totalQuestions: totalQuestions,
      managerPlays: managerPlays, // Yeni: Yöneticinin oynayıp oynamadığı
      autoNextQuestion: autoNextQuestion, // Yeni: Otomatik geçiş durumu
      playerStates: Array.from(get(players).values()), // players bir store olduğu için get(players) kullanın
    };

    if (targetPeerId === 'all') {
      dispatch('sendData', { data: message });
    } else {
        const channel = dataChannels.get(targetPeerId); // dataChannels prop olduğu için doğrudan kullanılır
        if (channel && channel.readyState === 'open') {
            channel.send(JSON.stringify(message));
        }
    }
  }

  function managerNextQuestion() {
    if (selfRole !== 'manager' || !selfPeerId) return;

    currentQuestionIndex++;
    if (currentQuestionIndex < totalQuestions) {
      players.update(map => {
          map.forEach(player => {
              player.hasAnswered = false;
              player.lastAnswer = null;
          });
          return map;
      });
      resetForNextQuestion();
      dispatch('sendData', { data: { type: 'nextQuestion', questionIndex: currentQuestionIndex } });
    } else {
      dispatch('sendData', { data: { type: 'endGame', finalScores: Array.from(get(players).values()).map(p => ({ peerId: p.peerId, score: p.score })) } });
    }
  }

  function submitAnswer() {
    // Yönetici oynuyorsa veya katılımcı ise cevap verebilir
    if ((selfRole === 'participant' || (selfRole === 'manager' && managerPlays)) && selectedAnswer !== null && !isAnswered && selfPeerId) {
    
      isAnswered = true;
      const currentQuestion = questions[currentQuestionIndex];
      isCorrect = quizType === 'word' 
        ? currentQuestion.options[selectedAnswer] === currentQuestion.answer
        : selectedAnswer === currentQuestion.answer;
      
      players.update(map => {
          const myPlayer = map.get(selfPeerId!);
          if(myPlayer) {
              myPlayer.hasAnswered = true;
              myPlayer.lastAnswer = selectedAnswer;
              if (isCorrect) myPlayer.score++;
              map.set(selfPeerId!, myPlayer);
          }
          return map;
      });

      // Cevabı yöneticiye P2P üzerinden gönder.
      // SADECE eğer ben yönetici değilsem (çünkü yönetici ise kendi players store'unu zaten güncelledi)
      if (selfRole !== 'manager' && managerPeerId) {
          const channel = dataChannels.get(managerPeerId);
          if (channel && channel.readyState === 'open') {
              channel.send(JSON.stringify({ type: 'answerSubmitted', answerIndex: selectedAnswer }));
          }
      }
    } else if (selectedAnswer === null) {
      // Konsolda zaten uyarı veriliyor (SmartTogether'da debug amaçlı)
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
    players.update(map => {
        map.forEach(player => {
            player.score = 0;
            player.hasAnswered = false;
            player.lastAnswer = null;
        });
        return map;
    });
  }

  function resetQuiz() {
    resetQuizState();
    if (selfRole === 'manager') {
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

    if (newRole === 'manager') {
        if (selfRole !== 'manager') {
            managerPeerId = selfPeerId;
            selfRole = 'manager';
            dispatch('sendData', { data: { type: 'setManager', managerPeerId: selfPeerId } });
            loadQuizData(value);
            dispatch('sendData', { data: { type: 'endGame' } }); 
        }
    } else {
        selfRole = newRole;
        dispatch('sendData', { data: { type: 'playerRoleChanged', playerPeerId: selfPeerId, newRole: newRole } });
    }
  }

  function toggleManagerPlays() {
      managerPlays = !managerPlays;
      players.update(map => {
          const managerPlayer = map.get(selfPeerId!);
          if (managerPlayer) {
              map.set(selfPeerId!, { 
                  ...managerPlayer, 
                  hasAnswered: managerPlays ? managerPlayer.hasAnswered : false,
                  lastAnswer: managerPlays ? managerPlayer.lastAnswer : null
              });
          }
          return map;
      });
      // Diğer oyunculara yöneticinin oynayıp oynamadığını bildir
      dispatch('sendData', { data: { type: 'managerPlaysUpdate', managerPlays: managerPlays } });
  }

  function sendAutoNextState() {
      if (selfRole === 'manager') {
          dispatch('sendData', { data: { type: 'autoNextUpdate', autoNextQuestion: autoNextQuestion } });
      }
  }


  function generateWordQuestions(wordPairs: WordPair[]): Question[] {
    const questions: Question[] = [];
    wordPairs.forEach((pair, index) => {
      const correctAnswer = pair.translation;
      const otherTranslations = wordPairs.filter((_, i) => i !== index).map(p => p.translation);
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

  function getOptionClasses(
    index: number,
    option: string
  ): string {
    let classes = ['option'];
    
    if (selectedAnswer === index) classes.push('selected');
    
    // Yöneticinin oynayıp oynamadığı veya katılımcı olup olmadığına göre sınıflandırma
    const canSeeCorrectAnswer = isAnswered || selfRole === 'viewer' || (selfRole === 'manager' && !managerPlays);

    if (canSeeCorrectAnswer) {
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion || !currentQuestion.options) return classes.join(' ');

      const isActuallyCorrect = quizType === 'word' 
        ? currentQuestion.options[index] === currentQuestion.answer
        : index === currentQuestion.answer;
      
      if (isActuallyCorrect) classes.push('correct');
      if ((selfRole === 'participant' || (selfRole === 'manager' && managerPlays)) && selectedAnswer === index && !isCorrect && isAnswered) {
          classes.push('incorrect');
      }
    }
    
    return classes.join(' ');
  }

  // Tüm oyuncuların cevap verip vermediğini kontrol eden reaktif değişken
  $: allPlayersAnswered = (() => {
    if (selfRole !== 'manager' || !isGameInitialized || questions.length === 0) return false;

    const currentPlayersMap = get(players);
    if (!currentPlayersMap) return false;

    // Aktif oyuncular: Katılımcılar ve oynayan yönetici
    const activePlayers = Array.from(currentPlayersMap.values()).filter(p => 
        p.role === 'participant' || (p.peerId === selfPeerId && selfRole === 'manager' && managerPlays)
    );

    if (activePlayers.length === 0) return false; // Hiç aktif oyuncu yoksa

    return activePlayers.every(player => player.hasAnswered);
  })();

  // Tüm oyuncular cevap verdiğinde otomatik geçiş (yönetici oynuyorsa VE otomatik geçiş açıksa)
  $: {
    if (selfRole === 'manager' && managerPlays && autoNextQuestion && allPlayersAnswered && currentQuestionIndex < totalQuestions) {
        setTimeout(() => {
            managerNextQuestion();
        }, 1500); // 1.5 saniye bekleme
    }
  }

  // players bir store olduğu için, değerine erişmek için $players veya get(players) kullanın
  const sortedPlayers = derived(players, ($players) => {
    // Yöneticinin oynayıp oynamadığına göre listeyi filtrele
    return Array.from($players.values())
        .filter(p => p.role !== 'manager' || (p.peerId === selfPeerId && managerPlays)) // Eğer yönetici oynamıyorsa onu gösterme (sadece oyuncu listesinde)
        .sort((a, b) => b.score - a.score);
  });
  // Note: sortedPlayers'ı dışarıya aktarmaya gerek yoksa 'export' anahtar kelimesini kaldırın.


  // connectedPeers bir Map'tir (SmartTogether'dan $connectedPeers.value olarak gelir)
  $: {
    if (selfPeerId) {
        // connectedPeers burada direkt Map olduğu varsayılıyor.
        // Eğer SmartTogether'dan {$connectedPeers} olarak değil de connectedPeers={$connectedPeers} olarak geliyorsa
        // buradaki connectedPeers değişkeni zaten Map'in kendisidir.
        // Bu kod parçacığı doğru çalışıyorsa, prop zaten Map'in kendisidir.
        connectedPeers.forEach((_, peerId) => {
            if (!get(players).has(peerId)) {
                players.update(map => {
                    map.set(peerId, { peerId: peerId, role: 'participant', score: 0, hasAnswered: false, lastAnswer: null });
                    return map;
                });
            }
        });
    }
  }

  function startGameAsManager() {
    if (selfRole === 'manager' && !isGameInitialized) {
        dispatch('sendData', { data: { type: 'startGame' } });
        sendGameStatusTo('all');
    }
  }

</script>

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
  .role-manager { background-color: #4CAF50; color: white; }
  .role-manager:hover { background-color: #43A047; }
  .role-participant { background-color: #2196F3; color: white; }
  .role-participant:hover { background-color: #1976D2; }
  .role-viewer { background-color: #9E9E9E; color: white; }
  .role-viewer:hover { background-color: #757575; }
  .toggle-manager-play {
      background-color: #f59e0b; /* Turuncu renk */
      color: white;
  }
  .toggle-manager-play:hover {
      background-color: #d97706; /* Koyu turuncu */
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
    background-color: #ECEFF1;
    border-radius: 8px;
  }
  .player-list h4 {
    margin-top: 0;
    color: #455A64;
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
    background-color: #FFFFFF;
    padding: 0.6rem 1rem;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .player-list li span {
    font-weight: bold;
    color: #3f51b5;
  }

  .question-section {
    margin-top: 2rem;
    padding: 1.5rem;
    border: 1px solid #D1D5DB;
    border-radius: 10px;
    background-color: white;
  }
  .progress {
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: #64748B;
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
    border: 1px solid #D1D5DB;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .option:hover {
    background-color: #F3F4F6;
  }
  .option.selected {
    border-color: #3B82F6;
    background-color: #EFF6FF;
  }
  .option.correct {
    border-color: #10B981;
    background-color: #ECFDF5;
  }
  .option.incorrect {
    border-color: #EF4444;
    background-color: #FEF2F2;
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
    background-color: #3B82F6;
    color: white;
    border: none;
  }
  .check-button:hover {
    background-color: #2563EB;
  }
  .next-button {
    background-color: #10B981;
    color: white;
    border: none;
  }
  .next-button:hover {
    background-color: #059669;
  }
  .reset-button {
    background-color: #F59E0B;
    color: white;
    border: none;
  }
  .reset-button:hover {
    background-color: #D97706;
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
    background-color: #ECFDF5;
    color: #059669;
  }
  .incorrect-feedback {
    background-color: #FEF2F2;
    color: #DC2626;
  }
  .explanation {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #F8FAFC;
    border-radius: 8px;
    border-left: 4px solid #94A3B8;
  }
  .score-final {
    font-weight: bold;
    margin-top: 1rem;
    font-size: 1.5rem;
    text-align: center;
    color: #1A237E;
  }
  .waiting-message {
    text-align: center;
    padding: 2rem;
    font-size: 1.2rem;
    color: #666;
  }
</style>

<div class="quiz-container">
  <h2 class="quiz-title">{title} ({t('multiplayer')})</h2>

  <div class="role-selection">
    <div class="current-role">
      {t('yourRole')}: <strong>{t(selfRole)}</strong>
      {#if selfRole === 'manager'}
          ({t('managerStatus', { status: managerPlays ? t('playing') : t('notPlaying')})})
      {/if}
    </div>
    {#if selfPeerId && !isGameInitialized}
        {#if selfRole !== 'manager'}
            <button class="button role-manager" on:click={() => changeMyRole('manager')}>
                {t('becomeManager')}
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
    {#if selfRole === 'manager'}
        <div class="manager-controls">
            <button 
                class="button toggle-manager-play" 
                on:click={toggleManagerPlays}
                disabled={isGameInitialized && currentQuestionIndex < totalQuestions}
            >
                {managerPlays ? t('stopPlaying') : t('startPlayingAsManager')}
            </button>
            <label class="auto-next-label">
                <input type="checkbox" bind:checked={autoNextQuestion} on:change={sendAutoNextState}>
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
          {player.peerId} ({t(player.role)}): <span>{player.score}</span>
        </li>
      {/each}
    </ul>
  </div>

  {#if selfRole === 'manager' && !isGameInitialized}
    <div class="button-group">
        <button class="button start-game-button" on:click={startGameAsManager} disabled={totalQuestions === 0}>
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
              class={getOptionClasses(index, option)}
              on:click={() => (selfRole === 'participant' || (selfRole === 'manager' && managerPlays)) && !isAnswered && (selectedAnswer = index)}
              class:disabled={!(selfRole === 'participant' || (selfRole === 'manager' && managerPlays)) || isAnswered}
              role="option"
              tabindex={((selfRole === 'participant' || (selfRole === 'manager' && managerPlays)) && !isAnswered) ? '0' : '-1'}
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if ((selfRole === 'participant' || (selfRole === 'manager' && managerPlays)) && !isAnswered) {
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
          {#if selfRole === 'participant' || (selfRole === 'manager' && managerPlays)}
            {#if !isAnswered}
              <button 
                class="button check-button" 
                on:click={submitAnswer}
                disabled={selectedAnswer === null}
              >
                {t('submitAnswerText')}
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
              {#if questions[currentQuestionIndex] && questions[currentQuestionIndex].explanation}
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
            {/if}
          {:else if selfRole === 'manager'}
            <button class="button next-button" on:click={managerNextQuestion} disabled={totalQuestions === 0}>
              {t('nextQuestionText')} (Yönetici)
            </button>
            {#if questions[currentQuestionIndex] && questions[currentQuestionIndex].explanation}
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
          {/if}
        </div>
      </div>
    {:else}
      <div class="score-final">
        {t('quizCompleteText', {
          score: Array.from(get(players).values()).find(p => p.peerId === selfPeerId)?.score || 0,
          totalQuestions: totalQuestions.toString(),
          percentage: ((Array.from(get(players).values()).find(p => p.peerId === selfPeerId)?.score || 0) / totalQuestions * 100).toFixed(1)
        })}
        <br>
        <h4>{t('finalScores')}:</h4>
        <ul>
          {#each $sortedPlayers as player}
              <li>{player.peerId} ({t(player.role)}): <span>{player.score}</span></li>
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
// $lib/gameTypes.ts
import TogetherQuiz from './TogetherQuiz.svelte';
export type GameType = {
  id: string;
  name: string;
  description: string;
  component: any; // Svelte bileşeni
  defaultValue: string; // Yönetici için tam oyun verisi
};

export const gameTypes: GameType[] = [
  {
    id: 'quiz',
    name: 'Birlikte Bilgi Yarışması',
    description: 'İngilizce-Türkçe kelime testi veya genel bilgi yarışması.',
    component: TogetherQuiz,
    defaultValue: "title🌟İngilizce-Türkçe Kelime Testi🚀type🌟word🚀wordPairs🌟word🛢️apple⚡translation🛢️elma🌟word🛢️book⚡translation🛢️kitap🌟word🛢️pen⚡translation🛢️kalem🌟word🛢️orange⚡translation🛢️portakal🌟word🛢️banana⚡translation🛢️muz",
  },
  // Gelecekteki oyunlar buraya eklenecek:
  /*
  {
    id: 'chess',
    name: 'Birlikte Satranç',
    description: 'Arkadaşlarınızla P2P satranç oynayın.',
    component: TogetherChess,
    defaultValue: 'board_setup🌟rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // Örnek satranç verisi
  },
  */
];

export function getGameTypeById(id: string): GameType | undefined {
  return gameTypes.find(game => game.id === id);
}
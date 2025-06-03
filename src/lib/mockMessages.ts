import type { Message } from './types';

export const mockMessages: Message[] = [
    /*{
      id: '1',
      sender: 'user',
      content: 'Merhaba!',
      timestamp: new Date('2025-06-01T10:00:00'),
    },
    {
      id: '2',
      sender: 'ai',
      content: 'Merhaba! Sana nasıl yardımcı olabilirim?',
      timestamp: new Date('2025-06-01T10:00:02'),
    },*/
    {
        id: '3',
        sender: 'user',
        content: 'Şuandan itibaren sohbetimizde akıllı pencere mekanizması kullanarak bana yardımcı ol.',
        timestamp: new Date('2025-06-01T10:00:10'),
    },
    {
        id: '4',
        sender: 'ai',
        content: 'Tamam, şuandan itibaren isteklerinize göre akıllı pencereler oluşturacağım, istekleriniz için burada hazır olarak bekliyorum.',
        timestamp: new Date('2025-06-01T10:00:13'),
    },
    {
        id: '5',
        sender: 'user',
        content: 'chat-db kullanarak ingilizce kelimeler diye bir veri tabanı oluştur, orda ingilizce kelimelerimi ve onların türkçe anlamlarını tutacağım.',
        timestamp: new Date('2025-06-01T10:00:10'),
    },
    {
        id: '6',
        sender: 'ai',
        content: "Tamam işleminiz için gerekli akıllı pencere yapısını oluşturdum ordan veritabanını oluştur düğmesine basmanız yeterli. [[smart-window][create-db][name='ingilizce kelimeler'; description='İngilizce ve Türkçe kelimeler kaydedilecek'; columns={{ 'name': 'id', 'type': 'number', 'primary': true }, { 'name': 'türkçe', 'type': 'text' }, { 'name': 'ingilizce', 'type': 'text' }}]]",
        timestamp: new Date('2025-06-01T10:00:14'),
    },
    {
        id: '7',
        sender: 'user',
        content: 'bu veri tabanına 4 tane basit kelime ekle.',
        timestamp: new Date('2025-06-01T10:00:10'),
    },
    {
        id: '8',
        sender: 'ai',
        content: "Tamam işleminiz için gerekli akıllı pencere yapısını oluşturdum ordan veritabanına gerekli eklemeleri yapabilirsiniz. [[smart-window][add-value-db][dbName='ingilizce kelimeler'; columns={ {name:'id', type:'number'}, {name:'türkçe', type:'text'}, {name:'ingilizce', type:'text'} }; values={ {id:1, türkçe:'elma', ingilizce:'apple'}, {id:2, türkçe:'kitap', ingilizce:'book'}, {id:3, türkçe:'masa', ingilizce:'table'}, {id:4, türkçe:'kalem', ingilizce:'pen'} }]]",
        timestamp: new Date('2025-06-01T10:00:14'),
    }
    ,
    {
        id: '9',
        sender: 'user',
        content: 'chat-script ve bu veritabanını kullanarak bana bir quiz yapısı oluştur.',
        timestamp: new Date('2025-06-01T10:00:10'),
    },
    {
        id: '10',
        sender: 'ai',
        content: "Tamam sizin için gerekli quiz mekanizmasını oluşturdum umarım tüm soruları doğru bilirsiniz. [[smart-window][chat-script][dbName='ingilizce kelimeler'; mode='quiz']]",
        timestamp: new Date('2025-06-01T10:00:14'),
    }
    ,
    {
        id: '11',
        sender: 'user',
        content: 'veritabanı gibi yapılarda, önüme bir buton çıkartmak yerine, niye kendin hemen oluşturmuyorsun.',
        timestamp: new Date('2025-06-01T10:00:10'),
    },
    {
        id: '12',
        sender: 'ai',
        content: "Yapay zeka ne kadar gelişirse gelişsin, bütün işleyiş , karar ve hakimiyet her zaman kullanıcıda olmalıdır, yapay zeka hata üretme , hayal görme gibi derin sorunları hep yan cebinde taşır, yanında bir doğru yoksa şalvar bank gibi cebinden süslü bir bilgi çıkarır, ve sırıtarak işte bilgi der..",
        timestamp: new Date('2025-06-01T10:00:14'),
    }
];

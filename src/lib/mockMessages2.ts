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
        content: 'akıllı pencereleri kullanarak tabanı 10 yüksekliği 5 olan üçgenin alanını hesaplamak istiyorum.',
        timestamp: new Date('2025-06-01T10:00:10'),
    },
    {
        id: '6',
        sender: 'ai',
        content: "Tamam bunun için akıllı pencereler sisteminin bir alt sistemi olan akıllı formülleri kullanarak size kullanışlı bir pencere sunacağım bu pencerede istediğiniz gibi taban veya yükseklik değerlerini değiştirerek istediğiniz şekilde alan hesaplamaya devam edebilirsiniz. [[smart-window][chat-calculate][title='Alan Hesaplama'; formula='(taban * yükseklik) / 2'; inputs=[{ name: 'Taban', key: 'taban', type: 'number', value: 10, unit: 'cm' }, { name: 'Yükseklik', key: 'yükseklik', type: 'number', value: 5, unit: 'cm' }]; resultKey='alan'; unit='cm²']]",
        timestamp: new Date('2025-06-01T10:00:14'),
    },
    {
        id: '7',
        sender: 'user',
        content: 'Arabam 20 litre benzinle 800 kilometre yol alıyor. 1 litre benzinin fiyatı 40 TL olduğuna göre, arabamın kilometre başına kaç TL yakıt harcadığını hesaplamak istiyorum.',
        timestamp: new Date('2025-06-01T10:00:10'),
    },
    {
        id: '8',
        sender: 'ai',
        content: "Tamam, bunun için akıllı pencereler sisteminin bir alt sistemi olan akıllı hesaplamaları kullanarak size kullanışlı bir pencere sunacağım. Bu pencerede istediğiniz gibi yakıt miktarı, mesafe veya birim fiyat değerlerini değiştirerek istediğiniz şekilde maliyet hesaplamaya devam edebilirsiniz. [[smart-window][chat-calculate][title='Km Başına Yakıt Maliyeti Hesaplama';formula='(yakıt_miktari * birim_fiyat) / mesafe';inputs=[ { name: 'Yakıt Miktarı', key: 'yakıt_miktari', type: 'number', value: 20, unit: 'litre' },  { name: 'Mesafe', key: 'mesafe', type: 'number', value: 800, unit: 'km' },  { name: 'Birim Fiyat', key: 'birim_fiyat', type: 'number', value: 40, unit: 'TL' }];resultKey='Km başı maliyetiniz';unit='TL/km']]",
        timestamp: new Date('2025-06-01T10:00:14'),
    }
    ,{
    id: '9',
    sender: 'user',
    content: 'Boyum 1.75 metre, kilom 70 kg. Vücut kitle endeksimi hesaplamak istiyorum.',
    timestamp: new Date('2025-06-01T10:05:00'),
},
{
    id: '10',
    sender: 'ai',
    content: "Tabii, BMI hesaplamanız için akıllı hesaplama penceresi oluşturuyorum. Bu pencerede boy ve kilo değerlerinizi istediğiniz gibi güncelleyerek anlık sonuçları görebilirsiniz. [[smart-window][chat-calculate][title='Vücut Kitle Endeksi (BMI) Hesaplama';formula='kilo / (boy * boy)';inputs=[ { name: 'Kilo', key: 'kilo', type: 'number', value: 70, unit: 'kg' },  { name: 'Boy', key: 'boy', type: 'number', value: 1.75, unit: 'm' }];resultKey='BMI Sonucunuz';unit='kg/m²']]",
    timestamp: new Date('2025-06-01T10:05:05'),
}
    // {
    //     id: '11',
    //     sender: 'user',
    //     content: 'veritabanı gibi yapılarda, önüme bir buton çıkartmak yerine, niye kendin hemen oluşturmuyorsun.',
    //     timestamp: new Date('2025-06-01T10:00:10'),
    // },
    // {
    //     id: '12',
    //     sender: 'ai',
    //     content: "Yapay zeka ne kadar gelişirse gelişsin, bütün işleyiş , karar ve hakimiyet her zaman kullanıcıda olmalıdır, yapay zeka hata üretme , hayal görme gibi derin sorunları hep yan cebinde taşır, yanında bir doğru yoksa şalvar bank gibi cebinden süslü bir bilgi çıkarır, ve sırıtarak işte bilgi der..",
    //     timestamp: new Date('2025-06-01T10:00:14'),
    // }
];

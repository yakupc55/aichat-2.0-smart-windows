import type { Message } from './types';
export const mockMessages: Message[] = [
    /*{
      id: '1',
      sender: 'user',
      content: 'Hello!',
      timestamp: new Date('2025-06-01T10:00:00'),
    },
    {
      id: '2',
      sender: 'ai',
      content: 'Hello! How can I assist you?',
      timestamp: new Date('2025-06-01T10:00:02'),
    },*/
    {
        id: '3',
        sender: 'user',
        content: 'From now on, help me using a smart window mechanism in our chat.',
        timestamp: new Date('2025-06-01T10:00:10'),
    },
    {
        id: '4',
        sender: 'ai',
        content: 'Alright, from now on, I will create smart windows based on your requests. I am here, ready to assist you.',
        timestamp: new Date('2025-06-01T10:00:13'),
    },
    {
        id: '5',
        sender: 'user',
        content: 'Create a database named "English words" using chat-db, where I will store English words and their Turkish meanings.',
        timestamp: new Date('2025-06-01T10:00:10'),
    },
    {
        id: '6',
        sender: 'ai',
        content: "I have created the necessary smart window structure for your operation. You just need to press the 'create database' button. [[smart-window][create-db][name='English words'; description='English and Turkish words will be stored'; columns={{ 'name': 'id', 'type': 'number', 'primary': true }, { 'name': 'turkish', 'type': 'text' }, { 'name': 'english', 'type': 'text' }}]]",
        timestamp: new Date('2025-06-01T10:00:14'),
    },
    {
        id: '7',
        sender: 'user',
        content: 'Add 4 simple words to this database.',
        timestamp: new Date('2025-06-01T10:00:10'),
    },
    {
        id: '8',
        sender: 'ai',
        content: "I have created the necessary smart window structure for your operation. You can add the required entries to the database from there. [[smart-window][add-value-db][dbName='English words'; columns={ {name:'id', type:'number'}, {name:'turkish', type:'text'}, {name:'english', type:'text'} }; values={ {id:1, turkish:'elma', english:'apple'}, {id:2, turkish:'kitap', english:'book'}, {id:3, turkish:'masa', english:'table'}, {id:4, turkish:'kalem', english:'pen'} }]]",
        timestamp: new Date('2025-06-01T10:00:14'),
    }
    ,
    {
        id: '9',
        sender: 'user',
        content: 'Using chat-script and this database, create a quiz structure for me.',
        timestamp: new Date('2025-06-01T10:00:10'),
    },
    {
        id: '10',
        sender: 'ai',
        content: "I have created the necessary quiz mechanism for you. I hope you answer all the questions correctly. [[smart-window][chat-script][dbName='English words'; mode='quiz']]",
        timestamp: new Date('2025-06-01T10:00:14'),
    }
    ,
    {
        id: '11',
        sender: 'user',
        content: 'When working with databases and similar structures, why do you show me a button instead of creating it yourself right away?',
        timestamp: new Date('2025-06-01T10:00:10'),
    },
    {
        id: '12',
        sender: 'ai',
        content: "No matter how much artificial intelligence develops, all control, decision-making, and authority should always remain with the user. Artificial intelligence always carries the risk of producing errors or fabricating information like pulling a rabbit out of a hat. Without proper oversight, it might present a flashy piece of misinformation and smugly call it 'knowledge'.",
        timestamp: new Date('2025-06-01T10:00:14'),
    }
];
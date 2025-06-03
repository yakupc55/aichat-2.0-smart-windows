import type { Message } from './types';

export const mockMessages: Message[] = [
    {
    id: '3',
    sender: 'user',
    content: 'From now on, use the smart window mechanism to assist me in our chat.',
    timestamp: new Date('2025-06-01T10:00:10'),
},
{
    id: '4',
    sender: 'ai',
    content: 'Understood, I will now create smart windows according to your requests. I am ready and waiting for your instructions.',
    timestamp: new Date('2025-06-01T10:00:13'),
},
{
    id: '5',
    sender: 'user',
    content: 'Using smart windows, I want to calculate the area of a triangle with base 10 and height 5.',
    timestamp: new Date('2025-06-01T10:00:10'),
},
{
    id: '6',
    sender: 'ai',
    content: "Okay, I'll use the smart formulas subsystem of the smart windows system to provide you with a convenient window. In this window, you can modify the base or height values as you wish to continue calculating the area. [[smart-window][chat-calculate][title='Area Calculation'; formula='(base * height) / 2'; inputs=[{ name: 'Base', key: 'base', type: 'number', value: 10, unit: 'cm' }, { name: 'Height', key: 'height', type: 'number', value: 5, unit: 'cm' }]; resultKey='area'; unit='cm²']]",
    timestamp: new Date('2025-06-01T10:00:14'),
},
{
    id: '7',
    sender: 'user',
    content: 'My car travels 800 kilometers with 20 liters of fuel. Since the price of 1 liter of fuel is 40 TL, I want to calculate how much fuel cost per kilometer my car consumes.',
    timestamp: new Date('2025-06-01T10:00:10'),
},
{
    id: '8',
    sender: 'ai',
    content: "Okay, I'll use the smart calculations subsystem of the smart windows system to provide you with a convenient window. In this window, you can modify the fuel amount, distance, or unit price values as you wish to continue calculating the cost. [[smart-window][chat-calculate][title='Fuel Cost Per Kilometer Calculation';formula='(fuel_amount * unit_price) / distance';inputs=[ { name: 'Fuel Amount', key: 'fuel_amount', type: 'number', value: 20, unit: 'liters' },  { name: 'Distance', key: 'distance', type: 'number', value: 800, unit: 'km' },  { name: 'Unit Price', key: 'unit_price', type: 'number', value: 40, unit: 'TL' }];resultKey='Your cost per km';unit='TL/km']]",
    timestamp: new Date('2025-06-01T10:00:14'),
},
{
    id: '9',
    sender: 'user',
    content: 'My height is 1.75 meters and my weight is 70 kg. I want to calculate my body mass index (BMI).',
    timestamp: new Date('2025-06-01T10:05:00'),
},
{
    id: '10',
    sender: 'ai',
    content: "Certainly, I'm creating a smart calculation window for your BMI. In this window, you can update your height and weight values as you wish to see instant results. [[smart-window][chat-calculate][title='Body Mass Index (BMI) Calculation';formula='weight / (height * height)';inputs=[ { name: 'Weight', key: 'weight', type: 'number', value: 70, unit: 'kg' },  { name: 'Height', key: 'height', type: 'number', value: 1.75, unit: 'm' }];resultKey='Your BMI Result';unit='kg/m²']]",
    timestamp: new Date('2025-06-01T10:05:05'),
}
];

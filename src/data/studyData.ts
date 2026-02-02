// Sentence Builder Data - S + V + O patterns
export const sentenceTemplates = [
  { subject: 'I', verb: 'eat', object: 'rice', translation: 'Saya makan nasi' },
  { subject: 'She', verb: 'likes', object: 'coffee', translation: 'Dia (perempuan) suka kopi' },
  { subject: 'They', verb: 'play', object: 'football', translation: 'Mereka bermain sepak bola' },
  { subject: 'He', verb: 'reads', object: 'books', translation: 'Dia (pria) membaca buku' },
  { subject: 'We', verb: 'watch', object: 'movies', translation: 'Kami menonton film' },
  { subject: 'You', verb: 'drink', object: 'water', translation: 'Kamu minum air' },
  { subject: 'The cat', verb: 'catches', object: 'mice', translation: 'Kucing itu menangkap tikus' },
  { subject: 'My mother', verb: 'cooks', object: 'dinner', translation: 'Ibu saya memasak makan malam' },
  { subject: 'The students', verb: 'study', object: 'English', translation: 'Para siswa belajar Bahasa Inggris' },
  { subject: 'John', verb: 'drives', object: 'a car', translation: 'John mengendarai mobil' },
  { subject: 'The dog', verb: 'chases', object: 'the ball', translation: 'Anjing itu mengejar bola' },
  { subject: 'My friend', verb: 'writes', object: 'letters', translation: 'Teman saya menulis surat' },
];

export const subjects = ['I', 'You', 'We', 'They', 'He', 'She', 'It', 'The cat', 'My mother', 'The students', 'John', 'The dog', 'My friend'];
export const verbs = ['eat', 'eats', 'like', 'likes', 'play', 'plays', 'read', 'reads', 'watch', 'watches', 'drink', 'drinks', 'catch', 'catches', 'cook', 'cooks', 'study', 'studies', 'drive', 'drives', 'chase', 'chases', 'write', 'writes'];
export const objects = ['rice', 'coffee', 'football', 'books', 'movies', 'water', 'mice', 'dinner', 'English', 'a car', 'the ball', 'letters'];

// Verb 1/2/3 Data
export const verbList = [
  { v1: 'eat', v2: 'ate', v3: 'eaten', meaning: 'makan' },
  { v1: 'go', v2: 'went', v3: 'gone', meaning: 'pergi' },
  { v1: 'see', v2: 'saw', v3: 'seen', meaning: 'melihat' },
  { v1: 'make', v2: 'made', v3: 'made', meaning: 'membuat' },
  { v1: 'take', v2: 'took', v3: 'taken', meaning: 'mengambil' },
  { v1: 'do', v2: 'did', v3: 'done', meaning: 'melakukan' },
  { v1: 'have', v2: 'had', v3: 'had', meaning: 'mempunyai' },
  { v1: 'get', v2: 'got', v3: 'gotten', meaning: 'mendapat' },
  { v1: 'write', v2: 'wrote', v3: 'written', meaning: 'menulis' },
  { v1: 'speak', v2: 'spoke', v3: 'spoken', meaning: 'berbicara' },
  { v1: 'come', v2: 'came', v3: 'come', meaning: 'datang' },
  { v1: 'give', v2: 'gave', v3: 'given', meaning: 'memberi' },
];

// Grammar Quiz Data - is/am/are + a/an/the
export const grammarQuestions = [
  { question: 'I ___ a student.', answer: 'am', options: ['am', 'is', 'are'], explanation: 'Untuk "I" gunakan "am"' },
  { question: 'She ___ a teacher.', answer: 'is', options: ['am', 'is', 'are'], explanation: 'Untuk he/she/it gunakan "is"' },
  { question: 'They ___ my friends.', answer: 'are', options: ['am', 'is', 'are'], explanation: 'Untuk they/we/you gunakan "are"' },
  { question: 'This is ___ apple.', answer: 'an', options: ['a', 'an', 'the'], explanation: '"An" digunakan sebelum kata yang diawali vokal (a, i, u, e, o)' },
  { question: 'He is ___ doctor.', answer: 'a', options: ['a', 'an', 'the'], explanation: '"A" digunakan sebelum kata yang diawali konsonan' },
  { question: 'We ___ happy today.', answer: 'are', options: ['am', 'is', 'are'], explanation: 'Untuk "we" gunakan "are"' },
  { question: 'The cat ___ on the table.', answer: 'is', options: ['am', 'is', 'are'], explanation: 'Untuk subjek tunggal (singular) gunakan "is"' },
  { question: 'I saw ___ elephant at the zoo.', answer: 'an', options: ['a', 'an', 'the'], explanation: '"An" digunakan sebelum "elephant" karena diawali huruf "e"' },
  { question: 'You ___ very smart.', answer: 'are', options: ['am', 'is', 'are'], explanation: 'Untuk "you" selalu gunakan "are"' },
  { question: '___ sun is very bright.', answer: 'The', options: ['A', 'An', 'The'], explanation: '"The" digunakan untuk sesuatu yang spesifik/unik' },
  { question: 'My parents ___ at home.', answer: 'are', options: ['am', 'is', 'are'], explanation: 'Untuk subjek jamak (plural) gunakan "are"' },
  { question: 'This is ___ university.', answer: 'a', options: ['a', 'an', 'the'], explanation: '"A" digunakan karena "university" diucapkan dengan bunyi konsonan /ju/' },
  { question: 'He ___ an honest person.', answer: 'is', options: ['am', 'is', 'are'], explanation: 'Untuk "he" gunakan "is"' },
  { question: 'I need ___ hour to finish.', answer: 'an', options: ['a', 'an', 'the'], explanation: '"An" digunakan karena "hour" diucapkan tanpa "h" (bunyi vokal)' },
  { question: 'The children ___ playing outside.', answer: 'are', options: ['am', 'is', 'are'], explanation: '"Children" adalah jamak, gunakan "are"' },
];

// Seeded random untuk konsistensi harian
const seededRandom = (seed: number) => {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// Shuffle dengan seed berdasarkan tanggal hari ini
export const shuffleArray = <T,>(array: T[], useDailySeed = false): T[] => {
  const shuffled = [...array];
  
  if (useDailySeed) {
    // Gunakan tanggal sebagai seed agar soal konsisten per hari
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(seed + i) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  } else {
    // Random biasa
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }
  
  return shuffled;
};

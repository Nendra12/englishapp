import { useState } from 'react';
import translate from 'translate';
import { Search, BookmarkPlus, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Phonetic {
  text?: string;
  audio?: string;
}

interface Definition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
  synonyms?: string[];
  antonyms?: string[];
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
  sourceUrls?: string[];
}

export default function DictionarySearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [indonesianTranslation, setIndonesianTranslation] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTranslation = async (word: string): Promise<string> => {
    // 1. Validasi input: jangan kirim request jika string kosong
    if (!word.trim()) return '';

    try {
        // 2. Siapkan parameter. Gunakan parameter 'de' dengan email Anda
        // agar limit naik dari 1.000 menjadi 10.000 kata per hari.
        const query = encodeURIComponent(word.trim());
        const email = "danendragaming123@gmail.com"; // Ganti dengan email aktif Anda
        const url = `https://api.mymemory.translated.net/get?q=${query}&langpair=en|id&de=${email}`;

        const response = await fetch(url);

        // 3. Cek status HTTP
        if (!response.ok) {
        throw new Error(`MyMemory API error: ${response.status}`);
        }

        const data = await response.json();

        // 4. Ambil teks terjemahan
        const translatedText = data.responseData?.translatedText;

        // Kadang MyMemory mengembalikan pesan error dalam bentuk teks jika limit habis
        if (data.responseStatus !== 200) {
        console.warn("API Message:", data.responseDetails);
        return word; // Kembalikan kata asli jika API menolak
        }

        return translatedText || word;

    } catch (err) {
        console.error('Translation error:', err);
        return word; // Fallback: kembalikan input asli jika koneksi gagal
    }
    };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setIndonesianTranslation('');

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${searchTerm.trim()}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError('Kata tidak ditemukan. Coba kata lain atau periksa ejaan.');
        } else {
          setError('Terjadi kesalahan. Silakan coba lagi.');
        }
        return;
      }

      const data = await response.json();
      setResult(data[0]);
      
      // Fetch Indonesian translation
      const translation = await fetchTranslation(searchTerm.trim());
      setIndonesianTranslation(translation);
    } catch (err) {
      setError('Gagal mengambil data. Periksa koneksi internet Anda.');
      console.error('Dictionary API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const saveToVocabulary = async () => {
    if (!result || !user) return;

    setSaving(true);
    try {
      // Ambil definisi dan contoh pertama
      const firstMeaning = result.meanings[0];
      const firstDefinition = firstMeaning?.definitions[0];

      const { error: saveError } = await supabase.from('user_vocabulary').insert({
        user_id: user.id,
        word: result.word,
        phonetic: result.phonetic || result.phonetics[0]?.text || '',
        part_of_speech: firstMeaning?.partOfSpeech || '',
        definition: firstDefinition?.definition || '',
        example: firstDefinition?.example || null,
        synonyms: firstDefinition?.synonyms || [],
        audio_url: result.phonetics.find(p => p.audio)?.audio || null,
        indonesian_translation: indonesianTranslation || null,
      });

      if (saveError) {
        if (saveError.code === '23505') {
          toast({
            title: 'Kata sudah ada',
            description: 'Kata ini sudah ada di kosakata Anda.',
            variant: 'destructive',
          });
        } else {
          throw saveError;
        }
      } else {
        toast({
          title: 'Berhasil disimpan!',
          description: `"${result.word}" telah ditambahkan ke kosakata Anda.`,
        });
      }
    } catch (err) {
      console.error('Save vocabulary error:', err);
      toast({
        title: 'Gagal menyimpan',
        description: 'Terjadi kesalahan saat menyimpan kata.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  console.log(indonesianTranslation)

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">English Dictionary</h1>
        <p className="text-muted-foreground">
          Cari arti kata bahasa Inggris dan simpan ke kosakata Anda
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cari Kata</CardTitle>
          <CardDescription>Masukkan kata dalam bahasa Inggris</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Contoh: hello, beautiful, education..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !searchTerm.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mencari...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Cari
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-4xl mb-2">{result.word}</CardTitle>
                {
                    indonesianTranslation && (
                    
                  <p className="text-xl font-semibold text-primary mb-1">
                    {indonesianTranslation}
                  </p>
                )}
                {(result.phonetic || result.phonetics[0]?.text) && (
                  <CardDescription className="text-lg">
                    {result.phonetic || result.phonetics[0]?.text}
                  </CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                {result.phonetics.find(p => p.audio) && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const audio = result.phonetics.find(p => p.audio)?.audio;
                      if (audio) playAudio(audio);
                    }}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                )}
                <Button onClick={saveToVocabulary} disabled={saving || !user}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BookmarkPlus className="mr-2 h-4 w-4" />
                  )}
                  Simpan
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.meanings.map((meaning, index) => (
              <div key={index} className="space-y-3">
                <Badge variant="secondary" className="text-sm">
                  {meaning.partOfSpeech}
                </Badge>

                <div className="space-y-3">
                  {meaning.definitions.slice(0, 3).map((def, defIndex) => (
                    <div key={defIndex} className="pl-4 border-l-2 border-primary/20">
                      <p className="font-medium mb-1">
                        {defIndex + 1}. {def.definition}
                      </p>
                      {def.example && (
                        <p className="text-sm text-muted-foreground italic">
                          "{def.example}"
                        </p>
                      )}
                      {def.synonyms && def.synonyms.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-semibold">Synonyms:</span>{' '}
                          {def.synonyms.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {meaning.synonyms && meaning.synonyms.length > 0 && (
                  <div className="text-sm">
                    <span className="font-semibold">Synonyms:</span>{' '}
                    <span className="text-muted-foreground">
                      {meaning.synonyms.join(', ')}
                    </span>
                  </div>
                )}

                {meaning.antonyms && meaning.antonyms.length > 0 && (
                  <div className="text-sm">
                    <span className="font-semibold">Antonyms:</span>{' '}
                    <span className="text-muted-foreground">
                      {meaning.antonyms.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {result.sourceUrls && result.sourceUrls.length > 0 && (
              <div className="pt-4 border-t text-xs text-muted-foreground">
                <span className="font-semibold">Source:</span>{' '}
                <a
                  href={result.sourceUrls[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  {result.sourceUrls[0]}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!result && !error && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Mulai mencari kata untuk melihat definisi, contoh penggunaan, dan sinonim
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

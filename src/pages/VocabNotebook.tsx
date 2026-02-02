import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  BookOpen,
  Star,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VocabItem {
  id: string;
  word: string;
  meaning: string;
  example: string | null;
  tags: string[];
  mastered: boolean;
  created_at: string;
}

const VocabNotebook: React.FC = () => {
  const { user } = useAuth();
  const [vocabulary, setVocabulary] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMastered, setFilterMastered] = useState<'all' | 'mastered' | 'learning'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVocab, setEditingVocab] = useState<VocabItem | null>(null);
  
  // Form states
  const [formWord, setFormWord] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formExample, setFormExample] = useState('');
  const [formTags, setFormTags] = useState('');

  useEffect(() => {
    fetchVocabulary();
  }, [user]);

  const fetchVocabulary = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Gagal memuat kosakata');
    } else {
      setVocabulary(data as VocabItem[] || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormWord('');
    setFormMeaning('');
    setFormExample('');
    setFormTags('');
    setEditingVocab(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (vocab: VocabItem) => {
    setEditingVocab(vocab);
    setFormWord(vocab.word);
    setFormMeaning(vocab.meaning);
    setFormExample(vocab.example || '');
    setFormTags(vocab.tags?.join(', ') || '');
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !formWord.trim() || !formMeaning.trim()) {
      toast.error('Kata dan arti wajib diisi');
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const vocabData = {
      user_id: user.id,
      word: formWord.trim(),
      meaning: formMeaning.trim(),
      example: formExample.trim() || null,
      tags: tagsArray,
    };

    if (editingVocab) {
      const { error } = await supabase
        .from('vocabulary')
        .update(vocabData)
        .eq('id', editingVocab.id);
      
      if (error) {
        toast.error('Gagal mengupdate kosakata');
      } else {
        toast.success('Kosakata diupdate');
        fetchVocabulary();
      }
    } else {
      const { error } = await supabase
        .from('vocabulary')
        .insert(vocabData);
      
      if (error) {
        toast.error('Gagal menambah kosakata');
      } else {
        toast.success('Kosakata ditambahkan');
        fetchVocabulary();
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('vocabulary')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Gagal menghapus kosakata');
    } else {
      toast.success('Kosakata dihapus');
      setVocabulary(prev => prev.filter(v => v.id !== id));
    }
  };

  const toggleMastered = async (vocab: VocabItem) => {
    const { error } = await supabase
      .from('vocabulary')
      .update({ mastered: !vocab.mastered })
      .eq('id', vocab.id);
    
    if (error) {
      toast.error('Gagal mengupdate status');
    } else {
      setVocabulary(prev =>
        prev.map(v => v.id === vocab.id ? { ...v, mastered: !v.mastered } : v)
      );
    }
  };

  const filteredVocabulary = vocabulary.filter(vocab => {
    const matchesSearch = 
      vocab.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vocab.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterMastered === 'all' ||
      (filterMastered === 'mastered' && vocab.mastered) ||
      (filterMastered === 'learning' && !vocab.mastered);
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: vocabulary.length,
    mastered: vocabulary.filter(v => v.mastered).length,
    learning: vocabulary.filter(v => !v.mastered).length,
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kosakata Saya</h1>
            <p className="text-muted-foreground">Catat dan pelajari kosakata baru</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingVocab ? 'Edit Kosakata' : 'Tambah Kosakata Baru'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="word">Kata (Inggris)</Label>
                  <Input
                    id="word"
                    value={formWord}
                    onChange={(e) => setFormWord(e.target.value)}
                    placeholder="e.g. beautiful"
                  />
                </div>
                <div>
                  <Label htmlFor="meaning">Arti (Indonesia)</Label>
                  <Input
                    id="meaning"
                    value={formMeaning}
                    onChange={(e) => setFormMeaning(e.target.value)}
                    placeholder="e.g. cantik, indah"
                  />
                </div>
                <div>
                  <Label htmlFor="example">Contoh Kalimat (opsional)</Label>
                  <Textarea
                    id="example"
                    value={formExample}
                    onChange={(e) => setFormExample(e.target.value)}
                    placeholder="e.g. The sunset is beautiful."
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
                  <Input
                    id="tags"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="e.g. adjective, daily, travel"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingVocab ? 'Simpan' : 'Tambah'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="flex items-center gap-3 p-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Kata</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="flex items-center gap-3 p-4">
              <Star className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.mastered}</p>
                <p className="text-xs text-muted-foreground">Dikuasai</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="flex items-center gap-3 p-4">
              <BookOpen className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.learning}</p>
                <p className="text-xs text-muted-foreground">Dipelajari</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari kata..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'mastered', 'learning'] as const).map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={filterMastered === filter ? 'default' : 'outline'}
                onClick={() => setFilterMastered(filter)}
              >
                {filter === 'all' ? 'Semua' : filter === 'mastered' ? 'Dikuasai' : 'Belajar'}
              </Button>
            ))}
          </div>
        </div>

        {/* Vocabulary List */}
        {loading ? (
          <div className="text-center text-muted-foreground">Memuat...</div>
        ) : filteredVocabulary.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-lg font-medium text-foreground">Belum ada kosakata</p>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery ? 'Tidak ditemukan' : 'Tambahkan kosakata pertamamu'}
              </p>
              {!searchQuery && (
                <Button onClick={openAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kosakata
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredVocabulary.map((vocab) => (
              <Card key={vocab.id} className={cn('border-border card-hover', vocab.mastered && 'bg-success/5')}>
                <CardContent className="flex items-start gap-4 p-4">
                  <Button
                    size="icon"
                    variant={vocab.mastered ? 'default' : 'outline'}
                    className={cn(
                      'shrink-0',
                      vocab.mastered && 'bg-success hover:bg-success/90'
                    )}
                    onClick={() => toggleMastered(vocab)}
                  >
                    {vocab.mastered ? <Star className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{vocab.word}</p>
                        <p className="text-muted-foreground">{vocab.meaning}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(vocab)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(vocab.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {vocab.example && (
                      <p className="mt-2 text-sm italic text-muted-foreground">"{vocab.example}"</p>
                    )}
                    {vocab.tags && vocab.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {vocab.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabNotebook;

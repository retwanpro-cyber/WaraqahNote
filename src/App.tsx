import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, Pin, Trash2, Folder, 
  Moon, Sun, Download, CheckSquare, 
  Edit3, Bold, Italic, List, 
  Heading1, CheckCircle2, BookOpen
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

const CATEGORIES = ['الكل', 'شخصي', 'العمل', 'أفكار', 'مشاريع', 'مهم'];

export default function App() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('waraqah_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      {
        id: '1',
        title: 'مرحباً بك في WaraqahNote (ورقة نوت)',
        content: '# أهلاً بك في تطبيق ورقة نوت 📝\n\nتطبيق ملاحظات ويندوز فائق السرعة، يعمل محلياً 100% بدون الحاجة لإنترنت.\n\n### المميزات الرئيسية:\n- ⚡ حفظ تلقائي فوري بكل حرف\n- 🔒 خصوصية مطلقة وأمان كامل لبياناتك\n- 🏷️ تصنيفات ووسوم ذكية\n- 🔍 بحث لحظي فوري وسريع\n- 📋 دعم قوائم المهام (To-Do) والماركداون\n\nجرّب إضافة ملاحظتك الأولى الآن عبر زر (+) أو اضغط Ctrl + N!',
        category: 'شخصي',
        tags: ['مهم', 'يومي'],
        isPinned: true,
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now()
      }
    ];
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem('waraqah_notes', JSON.stringify(notes));
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewNote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes]);

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'ملاحظة جديدة',
      content: '',
      category: selectedCategory === 'الكل' ? 'شخصي' : selectedCategory,
      tags: [],
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const updateActiveNote = (fields: Partial<Note>) => {
    if (!activeNote) return;
    setNotes(notes.map(note => {
      if (note.id === activeNote.id) {
        return { ...note, ...fields, updatedAt: Date.now() };
      }
      return note;
    }));
  };

  const deleteNote = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const filtered = notes.filter(n => n.id !== id);
    setNotes(filtered);
    if (activeNoteId === id) {
      setActiveNoteId(filtered[0]?.id || '');
    }
  };

  const togglePin = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  const addTag = (tag: string) => {
    if (!tag.trim() || !activeNote) return;
    const cleanTag = tag.trim().replace(/^#/, '');
    if (!activeNote.tags.includes(cleanTag)) {
      updateActiveNote({ tags: [...activeNote.tags, cleanTag] });
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    if (!activeNote) return;
    updateActiveNote({ tags: activeNote.tags.filter(t => t !== tagToRemove) });
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea || !activeNote) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = activeNote.content;
    const selection = text.substring(start, end);
    const newContent = text.substring(0, start) + before + selection + after + text.substring(end);
    updateActiveNote({ content: newContent });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 10);
  };

  const exportAsTxt = () => {
    if (!activeNote) return;
    const element = document.createElement('a');
    const file = new Blob([`${activeNote.title}\n\n${activeNote.content}`], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeNote.title || 'WaraqahNote'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        const matchesCategory = selectedCategory === 'الكل' || note.category === selectedCategory;
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, selectedCategory, searchQuery]);

  const wordCount = activeNote ? activeNote.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = activeNote ? activeNote.content.length : 0;

  return (
    <div className={`h-screen w-screen flex flex-col font-sans select-none overflow-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      
      {/* الشريط العلوي */}
      <header className={`h-11 border-b flex items-center justify-between px-3 shrink-0 ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            WaraqahNote
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            أصلي • بدون إنترنت
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={`p-1.5 rounded-lg border transition ${isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
            title="تبديل المظهر"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* الشريط الجانبي */}
        <aside className={`w-52 border-l p-3 flex flex-col justify-between shrink-0 ${isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-100/70 border-slate-200'}`}>
          <div className="space-y-4">
            <button
              onClick={createNewNote}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-950/20 transition active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>ملاحظة جديدة</span>
              <kbd className="mr-auto text-[10px] bg-emerald-700/60 px-1 py-0.5 rounded text-emerald-100">Ctrl+N</kbd>
            </button>

            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-2 px-1">المجلدات</p>
              <div className="space-y-0.5">
                {CATEGORIES.map(category => {
                  const count = category === 'الكل' ? notes.length : notes.filter(n => n.category === category).length;
                  const isActive = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                        isActive 
                          ? (isDarkMode ? 'bg-emerald-500/15 text-emerald-400 font-medium' : 'bg-emerald-50 text-emerald-700 font-semibold')
                          : (isDarkMode ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-200/60')
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-3.5 h-3.5 opacity-70" />
                        <span>{category}</span>
                      </div>
                      <span className="text-[10px] opacity-60 bg-black/10 dark:bg-white/10 px-1.5 py-0.2 rounded-full">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/40 text-[11px] text-slate-500 flex items-center justify-between">
            <span>الناشر: Radwan Almsora</span>
            <span>v1.0.0</span>
          </div>
        </aside>

        {/* قائمة الملاحظات */}
        <div className={`w-72 border-l flex flex-col shrink-0 ${isDarkMode ? 'bg-slate-900/20 border-slate-800/60' : 'bg-white border-slate-200'}`}>
          <div className="p-2.5 border-b border-inherit">
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="بحث في الملاحظات..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                لا توجد ملاحظات
              </div>
            ) : (
              filteredNotes.map(note => {
                const isActive = note.id === activeNote?.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition relative group ${
                      isActive 
                        ? (isDarkMode ? 'bg-slate-800/90 border-emerald-500/40 shadow-sm' : 'bg-emerald-50/70 border-emerald-300 shadow-sm')
                        : (isDarkMode ? 'border-slate-800/60 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50')
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h4 className="font-semibold truncate text-slate-100">
                        {note.title || 'بدون عنوان'}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        {note.isPinned && <Pin className="w-3 h-3 text-amber-400 rotate-45" />}
                        <button
                          onClick={(e) => deleteNote(note.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition"
                          title="حذف"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {note.content || 'ملاحظة فارغة...'}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/30 text-[10px] text-slate-500">
                      <span>{new Date(note.updatedAt).toLocaleDateString('ar-SA')}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800/50 text-slate-400">
                        {note.category}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* محرر الملاحظة */}
        {activeNote ? (
          <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            <div className={`h-11 border-b flex items-center justify-between px-4 shrink-0 ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-1">
                <button onClick={() => insertText('**', '**')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300" title="عريض"><Bold className="w-3.5 h-3.5" /></button>
                <button onClick={() => insertText('*', '*')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300" title="مائل"><Italic className="w-3.5 h-3.5" /></button>
                <button onClick={() => insertText('# ')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300" title="عنوان رئيسي"><Heading1 className="w-3.5 h-3.5" /></button>
                <button onClick={() => insertText('- [ ] ')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300" title="مهمة"><CheckSquare className="w-3.5 h-3.5" /></button>
                <button onClick={() => insertText('- ')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300" title="قائمة"><List className="w-3.5 h-3.5" /></button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePin(activeNote.id)}
                  className={`p-1.5 rounded-lg border transition ${activeNote.isPinned ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' : 'border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                  title="تثبيت"
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={exportAsTxt}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
                  title="تصدير"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير</span>
                </button>
              </div>
            </div>

            <div className="p-5 border-b border-slate-900 space-y-3">
              <input
                type="text"
                value={activeNote.title}
                onChange={e => updateActiveNote({ title: e.target.value })}
                placeholder="عنوان الملاحظة..."
                className="w-full text-xl font-bold bg-transparent outline-none text-slate-100 placeholder:text-slate-600"
              />

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={activeNote.category}
                  onChange={e => updateActiveNote({ category: e.target.value })}
                  className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 outline-none text-xs"
                >
                  {CATEGORIES.filter(c => c !== 'الكل').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {activeNote.tags.map(tag => (
                  <span
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="cursor-pointer px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400 transition"
                  >
                    #{tag} ×
                  </span>
                ))}

                <form onSubmit={e => { e.preventDefault(); addTag(tagInput); }}>
                  <input
                    type="text"
                    placeholder="+ إضافة وسم..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    className="bg-transparent border-b border-dashed border-slate-700 text-slate-400 px-1 py-0.5 outline-none text-xs w-20 focus:w-28 transition-all"
                  />
                </form>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-hidden">
              <textarea
                ref={textareaRef}
                value={activeNote.content}
                onChange={e => updateActiveNote({ content: e.target.value })}
                placeholder="ابدأ بكتابة أفكارك وملاحظاتك هنا بكل حرية..."
                className="w-full h-full bg-transparent outline-none resize-none text-slate-200 leading-relaxed font-sans text-sm placeholder:text-slate-700"
                autoFocus
              />
            </div>

            <footer className="h-7 border-t border-slate-900 bg-slate-950/80 px-4 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-4">
                <span>{wordCount} كلمة</span>
                <span>{charCount} حرف</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500/80">
                <CheckCircle2 className="w-3 h-3" />
                <span>محفوظ محلياً</span>
              </div>
            </footer>
          </main>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            <BookOpen className="w-12 h-12 stroke-1 mb-2 opacity-40" />
            <p className="text-sm">اختر ملاحظة أو أنشئ واحدة جديدة</p>
          </div>
        )}

      </div>
    </div>
  );
}

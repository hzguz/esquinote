
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash, Book, Book2, Notebook, Quote, Pencil, Bookmark, Typography, Search, Bulb, Heart, Circle, Bold, Italic, Underline, ChevronDown, Lock, FolderPlus } from 'tabler-icons-react';
import { NoteData, TitleSize, Language } from '../types';
import { COLORS, COLOR_KEYS, TITLE_ICONS, TITLE_SIZE_CLASSES, TRANSLATIONS } from '../constants';
import StarRating from './StarRating';
import DOMPurify from 'dompurify';

interface NoteEditorProps {
  note: NoteData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: NoteData) => void;
  onDelete: (id: string) => void;
  stroke: number;
  lang: Language;
  readOnly?: boolean;
}

const IconMap: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; fill?: string; color?: string }>> = {
  Book, Book2, Notebook, Quote, Pencil, Bookmark, Typography, Search, Bulb, Heart, Circle
};

const NoteEditor: React.FC<NoteEditorProps> = ({ note, isOpen, onClose, onSave, onDelete, stroke, lang = 'pt', readOnly = false }) => {
  const t = TRANSLATIONS[lang];
  const [editedNote, setEditedNote] = useState<NoteData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false });
  const [triggeredRatings, setTriggeredRatings] = useState<Set<number>>(new Set());
  const [pulsingId, setPulsingId] = useState<number | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const lastSyncId = useRef<string | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (note) {
      setEditedNote({ ...note });
    }
    setShowDeleteConfirm(false);
    setTriggeredRatings(new Set());
    setPulsingId(null);
    setActiveFormats({ bold: false, italic: false, underline: false });
  }, [note, isOpen]);

  useEffect(() => {
    if (contentEditableRef.current && editedNote && isOpen) {
      if (lastSyncId.current === editedNote.id) return;

      lastSyncId.current = editedNote.id;
      const rawContent = editedNote.content || "";
      let cleanContent = rawContent;
      try {
        if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
          cleanContent = DOMPurify.sanitize(rawContent, {
            ADD_TAGS: ['div', 'span', 'svg', 'path', 'br'],
            ADD_ATTR: ['class', 'contenteditable', 'data-placeholder', 'viewBox', 'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'width', 'height']
          });
        }
      } catch (e) {
        console.warn("Sanitization skipped", e);
      }

      contentEditableRef.current.innerHTML = cleanContent;

      setTimeout(() => {
        // Content loaded
      }, 100);
    }

    if (!isOpen) {
      lastSyncId.current = null;
    }
  }, [isOpen, editedNote?.id]);

  const handleChange = <K extends keyof NoteData>(field: K, value: NoteData[K], event?: React.MouseEvent) => {
    if (readOnly) return;
    if (editedNote) {
      setEditedNote({ ...editedNote, [field]: value });
      if (editedNote.type === 'note' && field === 'rating') {
        const ratingVal = value as number;
        if (ratingVal === 5 && !triggeredRatings.has(5)) {
          setPulsingId(5);
          setTriggeredRatings(prev => {
            const newSet = new Set(prev);
            newSet.add(5);
            return newSet;
          });
          setTimeout(() => setPulsingId(null), 1000);
        }
      }
    }
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const html = e.currentTarget.innerHTML;
    if (editedNote) {
      setEditedNote(prev => prev ? { ...prev, content: html } : null);
    }
    checkFormats();
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  };

  const execFormat = (command: string, value: string | undefined = undefined) => {
    if (readOnly) return;
    document.execCommand(command, false, value);
    if (contentEditableRef.current) contentEditableRef.current.focus();
    checkFormats();
  };

  const createGroup = () => {
    if (readOnly) return;

    // Garante que o editor está focado
    if (!contentEditableRef.current) return;

    // Verifica se a seleção está dentro do contenteditable
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Se não há seleção, foca no editor e coloca cursor no final
      contentEditableRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(contentEditableRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
      return; // Usuário precisa clicar de novo após focar
    }

    const range = selection.getRangeAt(0);

    // CRÍTICO: Verifica se a seleção está dentro do contenteditable
    const isInsideEditor = contentEditableRef.current.contains(range.commonAncestorContainer);
    if (!isInsideEditor) {
      // Foca no editor e coloca cursor no final
      contentEditableRef.current.focus();
      const newRange = document.createRange();
      newRange.selectNodeContents(contentEditableRef.current);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
      // Agora cria o grupo na posição do cursor
      setTimeout(() => createGroup(), 10);
      return;
    }

    // CRÍTICO: Impede a criação de grupos aninhados
    const container = range.commonAncestorContainer;
    const isInsideGroup = container.nodeType === 1
      ? (container as HTMLElement).closest('.note-group')
      : container.parentElement?.closest('.note-group');

    if (isInsideGroup) return;

    const isCollapsed = selection.isCollapsed;
    const content = isCollapsed ? document.createTextNode('\u00A0') : range.extractContents();

    const group = document.createElement('div');
    group.className = 'note-group';
    group.setAttribute('contenteditable', 'false');

    const header = document.createElement('div');
    header.className = 'note-group-header';

    const title = document.createElement('span');
    title.className = 'note-group-title';
    title.innerText = t.groupTitle;
    title.setAttribute('contenteditable', 'false');

    title.ondblclick = (e) => {
      e.stopPropagation();
      title.setAttribute('contenteditable', 'true');
      title.focus();

      setTimeout(() => {
        const range = document.createRange();
        range.selectNodeContents(title);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }, 0);
    };

    title.onkeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const range = document.createRange();
        range.selectNodeContents(title);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    };

    title.onblur = () => {
      title.setAttribute('contenteditable', 'false');
      if (contentEditableRef.current) handleContentChange({ currentTarget: contentEditableRef.current } as any);
    };

    title.oninput = (e) => {
      e.stopPropagation();
      if (contentEditableRef.current) handleContentChange({ currentTarget: contentEditableRef.current } as any);
    };

    const actions = document.createElement('div');
    actions.className = 'note-group-actions';

    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'note-group-btn note-group-delete';
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;


    // O evento onclick agora é gerenciado pelo handleEditorClick via event delegation
    // para garantir que funcione após reloads do conteúdo.


    const toggle = document.createElement('span');
    toggle.className = 'note-group-btn note-group-toggle';
    toggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;

    toggle.onclick = (e) => {
      e.stopPropagation();
      group.classList.toggle('collapsed');
      if (contentEditableRef.current) handleContentChange({ currentTarget: contentEditableRef.current } as any);
    };

    // Ícone de edição do título
    const editIcon = document.createElement('span');
    editIcon.className = 'note-group-edit-icon';
    editIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`;

    editIcon.onclick = (e) => {
      e.stopPropagation();
      title.setAttribute('contenteditable', 'true');
      title.focus();
      const range = document.createRange();
      range.selectNodeContents(title);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    };

    actions.appendChild(deleteBtn);
    actions.appendChild(toggle);

    header.appendChild(title);
    header.appendChild(editIcon);
    header.appendChild(actions);

    // Wrapper para animação CSS Grid
    const bodyWrapper = document.createElement('div');
    bodyWrapper.className = 'note-group-body';

    const body = document.createElement('div');
    body.className = 'note-group-content';
    body.setAttribute('contenteditable', 'true');
    body.oninput = (e) => {
      e.stopPropagation();
      if (contentEditableRef.current) handleContentChange({ currentTarget: contentEditableRef.current } as any);
    };
    body.appendChild(content);

    bodyWrapper.appendChild(body);

    group.appendChild(header);
    group.appendChild(bodyWrapper);

    // Inserção do grupo
    range.insertNode(group);

    // CRÍTICO: Sempre insere um nó de texto (espaço) após o grupo para garantir que o usuário 
    // consiga clicar abaixo/depois do grupo no editor principal.
    const afterSpace = document.createTextNode('\u00A0');
    group.after(afterSpace);

    if (isCollapsed) {
      // Se não havia texto selecionado, focamos no corpo do grupo para digitar
      body.focus();
      const newRange = document.createRange();
      newRange.selectNodeContents(body);
      newRange.collapse(false);
      const newSelection = window.getSelection();
      if (newSelection) {
        newSelection.removeAllRanges();
        newSelection.addRange(newRange);
      }
    } else {
      // Se havia texto (o grupo "envelopou" a seleção), colocamos o foco no espaço após o grupo
      const newRange = document.createRange();
      newRange.setStartAfter(afterSpace);
      newRange.setEndAfter(afterSpace);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    if (contentEditableRef.current) {
      handleContentChange({ currentTarget: contentEditableRef.current } as any);
    }
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    const toggleBtn = target.closest('.note-group-toggle');
    if (toggleBtn) {
      e.preventDefault();
      e.stopPropagation();
      const group = toggleBtn.closest('.note-group');
      if (group) {
        group.classList.toggle('collapsed');
        if (contentEditableRef.current) handleContentChange({ currentTarget: contentEditableRef.current } as any);
      }
      return;
    }

    const deleteBtn = target.closest('.note-group-delete');
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();

      if (readOnly) return;

      const btn = deleteBtn as HTMLElement;
      const group = btn.closest('.note-group') as HTMLElement;

      if (btn.classList.contains('confirming')) {
        // Preservar o conteúdo do grupo antes de remover
        const bodyContent = group.querySelector('.note-group-content');
        if (bodyContent) {
          const fragment = document.createRange().createContextualFragment(bodyContent.innerHTML);
          group.parentNode?.insertBefore(fragment, group);
        }
        group.remove();
        if (contentEditableRef.current) handleContentChange({ currentTarget: contentEditableRef.current } as any);
      } else {
        btn.classList.add('confirming');
        // Salva o HTML original do ícone para restaurar depois
        const originalIcon = btn.innerHTML;
        btn.innerText = t.deleteConfirm; // "Confirm?"

        // Remove a classe após 2.5s se não confirmar
        setTimeout(() => {
          if (btn && btn.isConnected) { // Verifica se ainda existe
            btn.classList.remove('confirming');
            // Restaura o ícone de lixeira
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;
          }
        }, 2500);
      }
      return;
    }

    if (target.classList.contains('note-group-title')) {
      e.stopPropagation();
    }
  };

  const handleSaveAndClose = () => {
    if (editedNote && !readOnly) {
      let finalContent = contentEditableRef.current?.innerHTML || editedNote.content || "";
      try {
        if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
          finalContent = DOMPurify.sanitize(finalContent, {
            ADD_TAGS: ['div', 'span', 'svg', 'path', 'br'],
            ADD_ATTR: ['class', 'contenteditable', 'data-placeholder', 'viewBox', 'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'width', 'height']
          });
        }
      } catch (e) {
        console.warn('Sanitization on save skipped:', e);
      }
      onSave({ ...editedNote, content: finalContent });
    }
    onClose();
  };

  const handleDelete = () => {
    if (readOnly) return;
    if (editedNote) {
      if (editedNote.type === 'title') {
        onDelete(editedNote.id);
        onClose();
        return;
      }
      if (showDeleteConfirm) {
        onDelete(editedNote.id);
        onClose();
      } else {
        setShowDeleteConfirm(true);
      }
    }
  };

  if (!isOpen || !editedNote) return null;

  const { bg, text, dark } = COLORS[editedNote.color];
  const isTitle = editedNote.type === 'title';
  const titleInputClass = isTitle ? TITLE_SIZE_CLASSES[editedNote.titleSize || 'small'] : 'text-lg md:text-3xl';

  const containerVariants = isMobile ? {
    hidden: { y: "100%", scale: 0.95, opacity: 0.5 },
    visible: {
      y: "0%",
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
        mass: 0.8,
        staggerChildren: 0.04,
        delayChildren: 0.1
      }
    },
    exit: {
      y: "100%",
      scale: 0.95,
      opacity: 0,
      transition: {
        type: "spring",
        damping: 35,
        stiffness: 400
      }
    }
  } : {
    hidden: { scale: 0.7, opacity: 0, y: 10, filter: 'blur(10px)' },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: "spring",
        stiffness: 320,
        damping: 28,
        mass: 0.8,
        staggerChildren: 0.05,
        delayChildren: 0.05
      }
    },
    exit: {
      scale: 0.85,
      opacity: 0,
      y: 20,
      filter: 'blur(8px)',
      transition: {
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 30 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/30 z-[50000] flex items-end md:items-center justify-center md:p-4 backdrop-blur-[4px] overflow-hidden"
          >
            <motion.div
              ref={modalRef}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full overflow-x-hidden overflow-y-hidden flex flex-col shadow-2xl shadow-primary/20 ${isMobile ? 'h-[70dvh] rounded-t-3xl' : 'max-w-2xl max-h-[90vh] rounded-3xl'}`}
              style={{ backgroundColor: bg, color: text }}
            >
              <motion.div variants={contentVariants} className="flex justify-between items-center p-3 md:p-5 pb-2 md:pb-3 shrink-0 z-30">
                <div className="flex gap-2 md:gap-3 items-center">
                  {!readOnly ? COLOR_KEYS.map((c) => (
                    <motion.button
                      key={c}
                      whileHover={{ scale: 1.25 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleChange('color', c)}
                      className={`w-6 h-6 md:w-6 md:h-6 rounded-full border-2 transition-all box-border ${editedNote.color === c ? 'border-current scale-110' : 'border-black/10 opacity-70 hover:opacity-100 hover:border-black/30'}`}
                      style={{ backgroundColor: COLORS[c].bg }}
                    />
                  )) : (
                    <div className="flex items-center gap-2 opacity-40 text-[10px] md:text-xs font-bold tracking-widest lowercase">
                      <Lock size={14} /> {lang === 'pt' ? 'modo leitura' : 'read only'}
                    </div>
                  )}
                </div>
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSaveAndClose}
                  className="p-2 md:p-2 hover:bg-black/5 rounded-full transition-colors flex items-center justify-center"
                >
                  {isMobile ? <ChevronDown size={28} color={text} strokeWidth={stroke} /> : <X size={24} color={text} strokeWidth={stroke} />}
                </motion.button>
              </motion.div>

              <motion.div variants={contentVariants} className={`px-4 md:px-7 ${!isTitle && !readOnly ? 'pb-3 md:pb-4' : 'pb-6 md:pb-8'} border-b-[1px] border-black/5 shrink-0 z-20 flex flex-col relative`}>
                <input
                  type="text"
                  readOnly={readOnly}
                  value={editedNote.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder={isTitle ? t.titlePlaceholder : t.titleDef}
                  className={`${titleInputClass} font-bold bg-transparent border-none outline-none placeholder-current opacity-90 w-full transition-all duration-300 select-text flex-shrink-0 mt-2`}
                />

                {!isTitle && !readOnly && (
                  <div className="flex items-center gap-2 mt-4 md:mt-6 border-[1px] border-black/10 rounded-2xl p-1.5 w-fit bg-black/5">
                    <button onMouseDown={(e) => { e.preventDefault(); execFormat('bold'); }} className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${activeFormats.bold ? 'bg-black/10 opacity-100 ring-1 ring-black/5 shadow-sm' : 'hover:bg-black/5 opacity-60 hover:opacity-100'}`} title="bold"><Bold size={isMobile ? 18 : 16} strokeWidth={activeFormats.bold ? 3 : 2.5} /></button>
                    <button onMouseDown={(e) => { e.preventDefault(); execFormat('italic'); }} className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${activeFormats.italic ? 'bg-black/10 opacity-100 ring-1 ring-black/5 shadow-sm' : 'hover:bg-black/5 opacity-60 hover:opacity-100'}`} title="italic"><Italic size={isMobile ? 18 : 16} strokeWidth={activeFormats.italic ? 3 : 2.5} /></button>
                    <button onMouseDown={(e) => { e.preventDefault(); execFormat('underline'); }} className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${activeFormats.underline ? 'bg-black/10 opacity-100 ring-1 ring-black/5 shadow-sm' : 'hover:bg-black/5 opacity-60 hover:opacity-100'}`} title="underline"><Underline size={isMobile ? 18 : 16} strokeWidth={activeFormats.underline ? 3 : 2.5} /></button>
                    <div className="w-[1px] h-4 bg-black/10 mx-1"></div>
                    <button onMouseDown={(e) => { e.preventDefault(); createGroup(); }} className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all hover:bg-black/5 opacity-60 hover:opacity-100`} title={t.createGroup}><FolderPlus size={isMobile ? 18 : 16} strokeWidth={2.5} /></button>
                  </div>
                )}
              </motion.div>

              <motion.div ref={scrollContainerRef} variants={contentVariants} className="flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar relative bg-black/[0.01]">
                <div className="p-4 md:p-7 pt-5 md:pt-6 min-h-full flex flex-col">

                  {!isTitle && (
                    <div
                      ref={contentEditableRef}
                      contentEditable={!readOnly}
                      onInput={handleContentChange}
                      onSelect={checkFormats}
                      onClick={handleEditorClick}
                      onKeyUp={checkFormats}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`w-full flex-grow text-[15px] md:text-[17px] leading-relaxed bg-transparent border-none outline-none resize-none transition-opacity empty:before:content-[attr(data-placeholder)] empty:before:opacity-50 select-text min-h-[50vh] ${readOnly ? 'opacity-80 cursor-default' : 'opacity-90 focus:opacity-100 cursor-text'}`}
                      data-placeholder={t.writeThoughts}
                      style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', outline: 'none' }}
                    />
                  )}

                  {isTitle && (
                    <div className="flex-grow">
                      <span className="text-xs md:text-sm font-bold opacity-60 lowercase pl-1 block mb-2">{readOnly ? (lang === 'pt' ? 'ícone selecionado' : 'selected icon') : t.selectIcon}</span>
                      <div className="border-[1px] border-black/10 rounded-2xl p-3 md:p-4 bg-white/10">
                        <div className="grid grid-cols-5 gap-2 md:gap-3">
                          {TITLE_ICONS.map((iconName) => {
                            const IconComp = IconMap[iconName] || Circle;
                            const isSelected = editedNote.icon === iconName;
                            if (readOnly && !isSelected) return null;
                            return (
                              <button
                                key={iconName}
                                disabled={readOnly}
                                onClick={() => handleChange('icon', iconName)}
                                className={`p-3 md:p-4 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-black/5 ring-1 ring-black/10 shadow-sm scale-105' : 'hover:bg-black/5 opacity-70 hover:opacity-100'}`}
                              >
                                <IconComp size={isMobile ? 24 : 32} strokeWidth={stroke} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="h-32 md:h-12 w-full shrink-0 select-none pointer-events-none" />
                </div>
              </motion.div>

              <motion.div variants={contentVariants} className="shrink-0 z-30 flex flex-col border-t-[1px] border-black/5 pb-safe" style={{ backgroundColor: bg }}>
                <div className="py-3 px-4 md:px-7 flex justify-between items-center mb-safe">
                  <div className="flex flex-col gap-2">
                    {!isTitle && (
                      <StarRating rating={editedNote.rating} onChange={readOnly ? undefined : (r) => handleChange('rating', r)} readonly={readOnly} size={24} gap="gap-0" color={text} stroke={stroke} pulsingId={pulsingId} />
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2 ml-auto">
                      {showDeleteConfirm ? (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-xs md:text-sm font-medium flex items-center gap-2 p-1.5 pr-2 md:px-4 md:py-2 rounded-2xl md:rounded-full lowercase bg-white/60 backdrop-blur-md border-[1px] border-black/10">
                          <span className="pl-2 md:pl-0 font-bold opacity-80">{t.deleteConfirm}</span>
                          <div className="flex gap-1 md:gap-2">
                            <button onClick={handleDelete} className="px-3 py-2 md:py-1 rounded-xl font-bold lowercase" style={{ backgroundColor: dark, color: text }}>{t.yes}</button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="bg-white/50 hover:bg-white px-3 py-2 md:py-1 rounded-xl font-medium lowercase">{t.no}</button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.button whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }} whileTap={{ scale: 0.9 }} onClick={handleDelete} className="p-2 md:p-3 text-current opacity-60 hover:opacity-100 rounded-2xl transition-all"><Trash size={24} strokeWidth={stroke} /></motion.button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NoteEditor;

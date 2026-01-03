
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Heading, FilePlus, AlertTriangle, X, Login, LayoutDashboard, GridDots, User, ShieldCheck, EyeOff, Target, LayoutColumns, WifiOff } from 'tabler-icons-react';
import { motion, AnimatePresence, LayoutGroup, useMotionValue, animate } from 'framer-motion';

import Note from './components/Note';
import NoteEditor from './components/NoteEditor';
import DataControl from './components/DataControl';
import AdminPanel from './components/AdminPanel';

import ColumnContainer from './components/ColumnContainer';
import Header from './components/Header';
import FABMenu from './components/FABMenu';
import NoteSkeleton from './components/NoteSkeleton';
import { DesktopGridPattern, EmptyStateParticles, EmptyStateFooter, EmptyStateMessage } from './components/EmptyState';
import { useLanguage } from './contexts/LanguageContext';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { NoteData, NoteType, ColumnData, UserProfile, Language } from './types';
import { STORAGE_KEY, STORAGE_COLS_KEY, INITIAL_NOTE_WIDTH, INITIAL_NOTE_HEIGHT, COLOR_KEYS, TITLE_ICONS, ICON_STROKE_WIDTH, ADMIN_EMAIL, TRANSLATIONS } from './constants';
import { auth, loginWithGoogle, logout, subscribeToNotes, saveNoteToCloud, deleteNoteFromCloud, syncLocalToCloud, subscribeToUserProfile, initializeUserProfile } from './services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthErrorState {
    title: string;
    message: string;
    instruction?: string;
}

type ViewMode = 'free' | 'grid';

function App() {
    const { lang, setLang, t } = useLanguage();
    const isOnline = useOnlineStatus();
    const [notes, setNotes] = useState<NoteData[]>([]);

    // Helper to get column storage key based on context
    const getColumnsStorageKey = (uid?: string) => uid ? `${STORAGE_COLS_KEY}_${uid}` : STORAGE_COLS_KEY;

    const defaultColumns = (): ColumnData[] => [{ id: 'default-col', title: t.colDefault || 'principal', x: 0, y: 0, zIndex: 1, createdAt: Date.now() }];

    const [columns, setColumns] = useState<ColumnData[]>(() => {
        // Initial load from localStorage (no user context yet)
        const saved = localStorage.getItem(STORAGE_COLS_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((c: any) => ({
                    ...c,
                    x: c.x ?? 0,
                    y: c.y ?? 0,
                    zIndex: c.zIndex ?? 1,
                    createdAt: c.createdAt ?? Date.now()
                }));
            } catch (e) {
                console.error('Failed to parse columns from localStorage:', e);
            }
        }
        return defaultColumns();
    });
    const [activeNote, setActiveNote] = useState<NoteData | null>(null);
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
    const [maxZIndex, setMaxZIndex] = useState(10);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [viewMode, setViewMode] = useState<ViewMode>('free');
    const [isModeTransitioning, setIsModeTransitioning] = useState(false);
    const [hasSwitchedMode, setHasSwitchedMode] = useState(false);
    const [logoText, setLogoText] = useState("muranote");
    const [currentStroke, setCurrentStroke] = useState(ICON_STROKE_WIDTH.desktop);

    const viewportX = useMotionValue(0);
    const viewportY = useMotionValue(0);
    const [isPanning, setIsPanning] = useState(false);
    const [showResetView, setShowResetView] = useState(false);

    const [isLoadingNotes, setIsLoadingNotes] = useState(true);
    const [isRunningAway, setIsRunningAway] = useState(false);
    const runTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [authError, setAuthError] = useState<AuthErrorState | null>(null);

    const [viewingPartner, setViewingPartner] = useState(false);
    const [spyTarget, setSpyTarget] = useState<{ id: string, name: string } | null>(null);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

    // Ref to store user's columns when switching to match/spy view
    const userColumnsRef = useRef<ColumnData[]>([]);
    // Flag to prevent save from running before initial load
    const hasLoadedColumnsRef = useRef(false);
    // Flag to prevent notes save before load completes
    const hasLoadedNotesRef = useRef(false);

    // Reading filter state (0 = off, 1-50 = intensity)
    const [readingFilterIntensity, setReadingFilterIntensity] = useState(() => {
        const saved = localStorage.getItem('muranote_reading_filter');
        return saved ? JSON.parse(saved) : 0;
    });



    // What's New Modal Logic
    // deleted what's new modal logic


    const containerRef = useRef<HTMLDivElement>(null);

    const isGridMode = isMobile || viewMode === 'grid';
    const isAdmin = user?.email === ADMIN_EMAIL;
    const isReadOnly = viewingPartner;
    useEffect(() => {
        setColumns(cols => cols.map(c => c.id === 'default-col' ? { ...c, title: t.colDefault } : c));
    }, [lang, t.colDefault]);


    useEffect(() => {
        const calculateStroke = () => {
            const w = window.innerWidth;
            if (w < 768) setCurrentStroke(ICON_STROKE_WIDTH.mobile);
            else if (w < 1024) setCurrentStroke(ICON_STROKE_WIDTH.tablet);
            else setCurrentStroke(ICON_STROKE_WIDTH.desktop);
        };
        calculateStroke();
        window.addEventListener('resize', calculateStroke);
        return () => window.removeEventListener('resize', calculateStroke);
    }, []);

    useEffect(() => {
        const unsubscribeX = viewportX.on("change", (latestX) => {
            const dist = Math.sqrt(latestX * latestX + viewportY.get() * viewportY.get());
            setShowResetView(dist > 500);
        });
        const unsubscribeY = viewportY.on("change", (latestY) => {
            const dist = Math.sqrt(viewportX.get() * viewportX.get() + latestY * latestY);
            setShowResetView(dist > 500);
        });
        return () => { unsubscribeX(); unsubscribeY(); };
    }, [viewportX, viewportY]);

    const handleResetView = () => {
        animate(viewportX, 0, { type: "spring", stiffness: 200, damping: 25 });
        animate(viewportY, 0, { type: "spring", stiffness: 200, damping: 25 });
    };

    useEffect(() => {
        let unsubscribeNotes: () => void = () => { };
        let unsubscribeProfile: () => void = () => { };

        if (auth) {
            const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser: FirebaseUser | null) => {
                setUser(currentUser);
                if (currentUser) {
                    try { await initializeUserProfile(currentUser); } catch (e) {
                        console.error('Failed to initialize user profile:', e);
                    }
                    unsubscribeProfile = subscribeToUserProfile(currentUser.uid, (profile) => {
                        setUserProfile(profile);
                        if (profile?.matchStatus !== 'matched' && viewingPartner) setViewingPartner(false);
                    });

                    const localNotes = localStorage.getItem(STORAGE_KEY);
                    if (localNotes) {
                        try {
                            const parsed = JSON.parse(localNotes);
                            if (parsed.length > 0) {
                                setIsSyncing(true);
                                await syncLocalToCloud(currentUser.uid, parsed);
                                localStorage.removeItem(STORAGE_KEY);
                                setIsSyncing(false);
                            }
                        } catch (e) {
                            console.error('Failed to parse/sync local notes:', e);
                        }
                    }

                    if (!viewingPartner && !spyTarget) {
                        unsubscribeNotes = subscribeToNotes(currentUser.uid, (cloudNotes) => {
                            setNotes(cloudNotes);
                            const zIndices = cloudNotes.map(n => n.zIndex);
                            if (zIndices.length > 0) setMaxZIndex(Math.max(...zIndices) + 1);
                            hasLoadedNotesRef.current = true;
                            setIsLoadingNotes(false);
                        });
                    }
                } else {
                    unsubscribeNotes(); unsubscribeProfile();
                    setUserProfile(null); setViewingPartner(false); setSpyTarget(null);
                    const saved = localStorage.getItem(STORAGE_KEY);
                    if (saved) {
                        try {
                            const parsed = JSON.parse(saved);
                            setNotes(parsed);
                            const zIndices = parsed.map((n: NoteData) => n.zIndex);
                            if (zIndices.length > 0) setMaxZIndex(Math.max(...zIndices) + 1);
                        } catch (e) {
                            console.error('Failed to parse notes from localStorage:', e);
                        }
                    } else setNotes([]);
                    hasLoadedNotesRef.current = true;
                    setIsLoadingNotes(false);
                }
            });
            return () => { unsubscribeAuth(); unsubscribeNotes(); unsubscribeProfile(); };
        } else {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    setNotes(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to parse notes from localStorage:', e);
                }
            }
            hasLoadedNotesRef.current = true;
            setIsLoadingNotes(false);
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        let unsubscribe = () => { };
        setIsLoadingNotes(true);
        if (spyTarget) {
            unsubscribe = subscribeToNotes(spyTarget.id, (targetNotes) => {
                setNotes(targetNotes);
                setIsLoadingNotes(false);
                const zIndices = targetNotes.map(n => n.zIndex);
                if (zIndices.length > 0) setMaxZIndex(Math.max(...zIndices) + 1);
            });
        } else if (viewingPartner && userProfile?.matchPartnerId) {
            unsubscribe = subscribeToNotes(userProfile.matchPartnerId, (partnerNotes) => {
                setNotes(partnerNotes);
                setIsLoadingNotes(false);
            });
        } else {
            unsubscribe = subscribeToNotes(user.uid, (myNotes) => {
                setNotes(myNotes);
                const zIndices = myNotes.map(n => n.zIndex);
                if (zIndices.length > 0) setMaxZIndex(Math.max(...zIndices) + 1);
                setIsLoadingNotes(false);
            });
        }
        return () => unsubscribe();
    }, [viewingPartner, user, userProfile?.matchPartnerId, spyTarget]);

    useEffect(() => {
        if (isGridMode && notes.length > 0 && columns.length > 0) {
            const notesWithoutCol = notes.filter(n => !n.columnId || !columns.find(c => c.id === n.columnId));
            if (notesWithoutCol.length > 0) {
                const firstColId = columns[0].id;
                setNotes(prev => prev.map(n => {
                    if (!n.columnId || !columns.find(c => c.id === n.columnId)) return { ...n, columnId: firstColId };
                    return n;
                }));
            }
        }
    }, [isGridMode, notes.length, columns]);

    useEffect(() => {
        if (isGridMode) { viewportX.set(0); viewportY.set(0); }
    }, [isGridMode, viewportX, viewportY]);

    const handleLogin = async () => { try { await loginWithGoogle(); } catch (error: unknown) { console.error(error); } };

    useEffect(() => {
        if (!user && hasLoadedNotesRef.current) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        }
    }, [notes, user]);

    // Save columns to localStorage with user-specific key
    useEffect(() => {
        if (viewingPartner || spyTarget) return; // Don't save columns when viewing others
        const key = user ? getColumnsStorageKey(user.uid) : STORAGE_COLS_KEY;
        localStorage.setItem(key, JSON.stringify(columns));
        // Also update the ref so we have latest user columns
        userColumnsRef.current = columns;
    }, [columns, user, viewingPartner, spyTarget]);

    // Load columns when user or viewing context changes
    useEffect(() => {
        if (viewingPartner || spyTarget) {
            // Save current columns to ref before switching (if they're user's columns)
            if (userColumnsRef.current.length === 0 && columns.length > 0) {
                userColumnsRef.current = columns;
            }
            // When viewing partner or spy, use default columns (don't mix with theirs)
            setColumns(defaultColumns());
            return;
        }

        // Restore from ref if we have saved columns (returning from viewing match/spy)
        if (userColumnsRef.current.length > 0) {
            setColumns(userColumnsRef.current);
            hasLoadedColumnsRef.current = true;
            return;
        }

        // Load user-specific columns from localStorage
        const key = user ? getColumnsStorageKey(user.uid) : STORAGE_COLS_KEY;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const loadedColumns = parsed.map((c: any) => ({
                    ...c,
                    icon: c.icon, // Preserve icon field
                    x: c.x ?? 0,
                    y: c.y ?? 0,
                    zIndex: c.zIndex ?? 1,
                    createdAt: c.createdAt ?? Date.now()
                }));
                setColumns(loadedColumns);
                userColumnsRef.current = loadedColumns;
                hasLoadedColumnsRef.current = true;
            } catch (e) {
                console.error('Failed to parse columns:', e);
                setColumns(defaultColumns());
                hasLoadedColumnsRef.current = true;
            }
        } else {
            setColumns(defaultColumns());
            hasLoadedColumnsRef.current = true;
        }
    }, [user?.uid, viewingPartner, spyTarget?.id]);

    // Save reading filter settings
    useEffect(() => {
        localStorage.setItem('muranote_reading_filter', JSON.stringify(readingFilterIntensity));
    }, [readingFilterIntensity]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isGridMode || activeNote) return;
        if (e.button === 1) { e.preventDefault(); setIsPanning(true); }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isPanning) { e.preventDefault(); viewportX.set(viewportX.get() + e.movementX); viewportY.set(viewportY.get() + e.movementY); }
    };

    const handlePointerUp = () => setIsPanning(false);

    const addColumn = () => {
        const timestamp = Date.now();
        const newCol: ColumnData = {
            id: uuidv4(),
            title: t.colNew,
            x: (window.innerWidth / 2) - viewportX.get() - 250,
            y: (window.innerHeight / 2) - viewportY.get() - 250,
            zIndex: maxZIndex + 1,
            createdAt: timestamp
        };
        setColumns([...columns, newCol]);
        setMaxZIndex(prev => prev + 1);
        setIsFabMenuOpen(false);
    };

    const removeColumn = (colId: string) => {
        if (columns.length <= 1) return;
        const newColumns = columns.filter(c => c.id !== colId);
        const targetColId = newColumns[0].id;
        setNotes(prev => prev.map(n => n.columnId === colId ? { ...n, columnId: targetColId } : n));
        setColumns(newColumns);
    };

    // --- LÓGICA UNIFICADA DE DROP ---
    // Funciona para: Modo Livre, Modo Grid, Desktop e Mobile
    const handleGridDrop = useCallback((noteId: string, point: { x: number, y: number }, finalPos?: { x: number, y: number }, dragOffset?: { x: number, y: number }) => {
        if (isReadOnly && !spyTarget) return;
        setDraggingId(null);
        setDragOverColumnId(null);

        // 1. Detectar elementos no ponto de drop
        const elements = document.elementsFromPoint(point.x, point.y);
        const targetNoteEl = elements.find(el => el.getAttribute('data-note-id') && el.getAttribute('data-note-id') !== noteId);
        let targetColEl = elements.find(el => el.getAttribute('data-column-id'));

        // 2. Fallback: se não encontrou coluna via elementsFromPoint, buscar todas as colunas
        // e verificar qual contém o ponto de drop (importante para mobile com scroll)
        if (!targetColEl && isMobile && isGridMode) {
            const allColumnEls = document.querySelectorAll('[data-column-id]');
            allColumnEls.forEach(el => {
                const rect = el.getBoundingClientRect();
                // Verificar se o ponto está dentro dos limites horizontais e verticais da coluna
                if (point.x >= rect.left && point.x <= rect.right &&
                    point.y >= rect.top && point.y <= rect.bottom) {
                    targetColEl = el;
                }
            });

            // 2.1 Super-fallback: se arrastou perto do TOPO da tela e não encontrou coluna,
            // encontrar a coluna mais ao topo (parcialmente visível)
            if (!targetColEl && point.y < 150) {
                let topMostCol: Element | null = null;
                let topMostY = Infinity;
                allColumnEls.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    // Só considerar colunas que estão pelo menos parcialmente visíveis
                    if (rect.bottom > 64 && rect.top < topMostY) { // 64 = header height
                        topMostY = rect.top;
                        topMostCol = el;
                    }
                });
                if (topMostCol) targetColEl = topMostCol;
            }
        }

        // 3. Obter IDs e dados relevantes
        const targetNoteId = targetNoteEl?.getAttribute('data-note-id') || null;
        // Prioridade: coluna detectada no ponto de drop > dragOverColumnId (pode estar desatualizado)
        let targetColId = targetColEl?.getAttribute('data-column-id') || dragOverColumnId || null;

        // Se soltou sobre uma nota, pegar a coluna dessa nota
        if (targetNoteId && !targetColId) {
            const tNote = notes.find(n => n.id === targetNoteId);
            if (tNote?.columnId) targetColId = tNote.columnId;
        }

        setNotes(prev => {
            const sourceNote = prev.find(n => n.id === noteId);
            if (!sourceNote) return prev;

            const sourceColId = sourceNote.columnId;
            const targetNote = targetNoteId ? prev.find(n => n.id === targetNoteId) : null;

            // ========================================
            // CASO 1: SWAP - Ambas notas na MESMA coluna
            // ========================================
            if (targetNote && sourceColId && sourceColId === targetNote.columnId) {
                const sourceIndex = prev.findIndex(n => n.id === noteId);
                const targetIndex = prev.findIndex(n => n.id === targetNoteId);
                if (sourceIndex === -1 || targetIndex === -1) return prev;

                const newNotes = [...prev];
                const sNote = { ...newNotes[sourceIndex] };
                const tNote = { ...newNotes[targetIndex] };

                // Trocar orders
                const tempOrder = sNote.order;
                sNote.order = tNote.order;
                tNote.order = tempOrder;

                newNotes[sourceIndex] = sNote;
                newNotes[targetIndex] = tNote;

                if (user && !viewingPartner) {
                    const uid = spyTarget ? spyTarget.id : user.uid;
                    saveNoteToCloud(uid, sNote);
                    saveNoteToCloud(uid, tNote);
                }
                return newNotes;
            }

            // ========================================
            // CASO 2: INSERT - Nota entra em coluna (vem de fora ou de outra coluna)
            // ========================================
            if (targetColId) {
                const colNotes = prev.filter(n => n.columnId === targetColId && n.id !== noteId)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                // Calcular nova ordem - sempre como última nota
                const newOrder = colNotes.length > 0
                    ? (colNotes[colNotes.length - 1].order || 0) + 1000
                    : Date.now();

                const updated = {
                    ...sourceNote,
                    columnId: targetColId,
                    order: newOrder,
                    zIndex: maxZIndex + 1
                };

                if (user && !viewingPartner) {
                    const uid = spyTarget ? spyTarget.id : user.uid;
                    saveNoteToCloud(uid, updated);
                }
                return prev.map(n => n.id === noteId ? updated : n);
            }

            // ========================================
            // CASO 3: RELEASE - Modo livre, soltou fora de qualquer coluna
            // ========================================
            if (!isGridMode && sourceColId) {
                // IMPORTANTE: Notas dentro de colunas usam position: relative, então seus motion values
                // NÃO são atualizados durante o drag. Devemos sempre converter screen coords para viewport.
                // Também subtraímos o dragOffset para posicionar a nota corretamente baseado em onde o usuário clicou.
                const vx = viewportX.get();
                const vy = viewportY.get();
                const offsetX = dragOffset?.x ?? 0;
                const offsetY = dragOffset?.y ?? 0;
                const x = point.x - vx - offsetX;
                const y = point.y - vy - offsetY;

                const updated = {
                    ...sourceNote,
                    x,
                    y,
                    columnId: undefined,
                    zIndex: maxZIndex + 1
                };

                if (user && !viewingPartner) {
                    const uid = spyTarget ? spyTarget.id : user.uid;
                    saveNoteToCloud(uid, updated);
                }
                return prev.map(n => n.id === noteId ? updated : n);
            }


            // ========================================
            // CASO 4: MOVE - Modo livre, nota já livre reposicionada
            // ========================================
            if (!isGridMode && !sourceColId) {
                // Usar finalPos se disponível (motion values) - posição já correta
                const x = finalPos?.x ?? point.x;
                const y = finalPos?.y ?? point.y;

                const updated = {
                    ...sourceNote,
                    x,
                    y,
                    zIndex: maxZIndex + 1
                };

                if (user && !viewingPartner) {
                    const uid = spyTarget ? spyTarget.id : user.uid;
                    saveNoteToCloud(uid, updated);
                }
                return prev.map(n => n.id === noteId ? updated : n);
            }

            // Nenhum caso aplicável - manter estado atual
            return prev;
        });
    }, [dragOverColumnId, maxZIndex, user, spyTarget, isReadOnly, viewingPartner, isGridMode, viewportX, viewportY, notes]);

    const handleNoteSwap = useCallback((sourceId: string, targetId: string) => {
        if (isReadOnly && !spyTarget) return;
        setNotes(prev => {
            const sourceIndex = prev.findIndex(n => n.id === sourceId);
            const targetIndex = prev.findIndex(n => n.id === targetId);
            if (sourceIndex === -1 || targetIndex === -1) return prev;
            const newNotes = [...prev];
            const sourceNote = { ...newNotes[sourceIndex] };
            const targetNote = { ...newNotes[targetIndex] };
            const tempOrder = sourceNote.order;
            sourceNote.order = targetNote.order;
            targetNote.order = tempOrder;
            newNotes[sourceIndex] = sourceNote;
            newNotes[targetIndex] = targetNote;
            if (user && !viewingPartner) {
                const targetUid = spyTarget ? spyTarget.id : user.uid;
                saveNoteToCloud(targetUid, sourceNote);
                saveNoteToCloud(targetUid, targetNote);
            }
            return newNotes;
        });
    }, [isReadOnly, spyTarget, user, viewingPartner]);

    const createItem = useCallback(async (type: NoteType) => {
        if (isReadOnly && !spyTarget) return;
        const randomColor = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
        const randomRotation = (Math.random() * 6) - 3;
        let x, y;
        if (isGridMode) { x = 0; y = 0; } else {
            x = (window.innerWidth / 2) - viewportX.get() - (INITIAL_NOTE_WIDTH / 2);
            y = (window.innerHeight / 2) - viewportY.get() - (INITIAL_NOTE_HEIGHT / 2);
            x += (Math.random() * 40 - 20); y += (Math.random() * 40 - 20);
        }
        const currentColumnId = columns.length > 0 ? columns[columns.length - 1].id : undefined;
        const timestamp = Date.now();
        const newNote: NoteData = {
            id: uuidv4(), type, title: '', content: '', color: randomColor, rating: 0,
            icon: type === 'title' ? TITLE_ICONS[0] : undefined,
            titleSize: type === 'title' ? 'small' : undefined,
            columnId: isGridMode ? currentColumnId : undefined,
            x, y, zIndex: maxZIndex + 1, rotation: randomRotation,
            createdAt: timestamp, updatedAt: timestamp, order: timestamp
        };
        const targetUid = spyTarget ? spyTarget.id : (user ? user.uid : null);
        if (user && targetUid) await saveNoteToCloud(targetUid, newNote);
        else setNotes((prev) => [...prev, newNote]);
        setMaxZIndex((prev) => prev + 1);
        setActiveNote(newNote); setIsFabMenuOpen(false);
    }, [isReadOnly, spyTarget, columns, isGridMode, maxZIndex, user, viewportX, viewportY]);

    const updateNotePosition = useCallback(async (id: string, screenX: number, screenY: number) => {
        if (isGridMode || (isReadOnly && !spyTarget)) return;

        // Convert screen coordinates to viewport coordinates
        const vx = viewportX.get();
        const vy = viewportY.get();
        const x = screenX - vx;
        const y = screenY - vy;

        // Use dragOverColumnId which was already detected during drag via elementsFromPoint
        // This is more accurate than manual bounding box calculations since it considers
        // the actual visible column area including when columns grow with more notes
        const columnId = dragOverColumnId || undefined;

        setNotes((prev) => prev.map(n => n.id === id ? { ...n, x, y, columnId } : n));
        if (user) {
            const targetUid = spyTarget ? spyTarget.id : user.uid;
            const note = notes.find(n => n.id === id);
            if (note) await saveNoteToCloud(targetUid, { ...note, x, y, columnId });
        }
    }, [notes, user, isGridMode, isReadOnly, spyTarget, dragOverColumnId, viewportX, viewportY]);

    const updateColumnPosition = (id: string, x: number, y: number) => {
        if (isGridMode || (isReadOnly && !spyTarget)) return;
        setColumns(prev => prev.map(c => c.id === id ? { ...c, x, y } : c));
    };

    const updateColumnTitle = (id: string, title: string) => {
        // Columns are local - block when viewing partner OR in read-only mode
        if (viewingPartner || isReadOnly) return;
        setColumns(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    };

    const updateColumnIcon = (id: string, icon: string) => {
        // Columns are local - block when viewing partner OR in read-only mode
        if (viewingPartner || isReadOnly) return;
        setColumns(prev => prev.map(c => c.id === id ? { ...c, icon } : c));
    };

    const bringToFront = useCallback(async (id: string) => {
        if (isReadOnly && !spyTarget) return;
        const newZ = maxZIndex + 1; setMaxZIndex(newZ);
        setNotes((prev) => prev.map(n => n.id === id ? { ...n, zIndex: newZ } : n));
        if (user) {
            const targetUid = spyTarget ? spyTarget.id : user.uid;
            const note = notes.find(n => n.id === id);
            if (note) await saveNoteToCloud(targetUid, { ...note, zIndex: newZ });
        }
    }, [maxZIndex, notes, user, isReadOnly, spyTarget]);

    const bringColumnToFront = useCallback((id: string) => {
        // Columns are local - block when viewing partner OR in read-only mode
        if (viewingPartner || isReadOnly) return;
        const newZ = maxZIndex + 1;
        setMaxZIndex(newZ);
        setColumns(prev => prev.map(c => c.id === id ? { ...c, zIndex: newZ } : c));
    }, [maxZIndex, isReadOnly, viewingPartner]);

    const saveNoteContent = useCallback(async (updatedNote: NoteData) => {
        if (isReadOnly && !spyTarget) return;
        const noteWithTimestamp = { ...updatedNote, updatedAt: Date.now() };
        setNotes((prev) => prev.map(n => n.id === noteWithTimestamp.id ? noteWithTimestamp : n));
        if (user) {
            const targetUid = spyTarget ? spyTarget.id : user.uid;
            await saveNoteToCloud(targetUid, noteWithTimestamp);
        }
    }, [isReadOnly, spyTarget, user]);

    const deleteNote = useCallback(async (id: string) => {
        if (isReadOnly && !spyTarget) return;
        setNotes((prev) => prev.filter(n => n.id !== id));
        if (user) {
            const targetUid = spyTarget ? spyTarget.id : user.uid;
            await deleteNoteFromCloud(targetUid, id);
        }
    }, [isReadOnly, spyTarget, user]);

    const handleImport = useCallback(async (importedNotes: NoteData[]) => {
        if (isReadOnly && !spyTarget) return;
        if (user) {
            const targetUid = spyTarget ? spyTarget.id : user.uid;
            await syncLocalToCloud(targetUid, importedNotes);
        }
        else setNotes(importedNotes);
        const zIndices = importedNotes.map(n => n.zIndex);
        if (zIndices.length > 0) setMaxZIndex(Math.max(...zIndices) + 1);
    }, [isReadOnly, spyTarget, user]);

    const handleLogoEnter = () => { setLogoText("schizonote"); runTimerRef.current = setTimeout(() => { setIsRunningAway(true); }, 1000); };
    const handleLogoLeave = () => { setLogoText("muranote"); if (runTimerRef.current) clearTimeout(runTimerRef.current); setIsRunningAway(false); };

    const handleDragOverColumn = useCallback((colId: string | null) => { if (!isReadOnly || spyTarget) setDragOverColumnId(colId); }, [isReadOnly, spyTarget]);

    const renderGridLayout = () => (
        <div className={`flex w-full items-stretch p-4 md:p-8 gap-4 ${isMobile ? 'flex-col pb-32 min-h-full h-auto' : 'flex-row overflow-auto h-full'}`}>
            <LayoutGroup>
                {columns.map(col => {
                    const colNotes = notes
                        .filter(n => n.columnId === col.id)
                        .sort((a, b) => (a.order || 0) - (b.order || 0));

                    return (
                        <ColumnContainer
                            key={col.id}
                            column={col}
                            notes={colNotes}
                            isGridMode={true}
                            onUpdatePosition={() => { }} // Not used in grid
                            onRemove={removeColumn}
                            isReadOnly={isReadOnly && !spyTarget}
                            lang={lang}
                            isDragTarget={dragOverColumnId === col.id && draggingId !== null}
                            onFocus={bringColumnToFront}
                            onUpdateTitle={updateColumnTitle}
                            onUpdateIcon={updateColumnIcon}
                            isDefaultColumn={col.id === 'default-col'}
                            renderNote={(item) => (
                                <Note
                                    key={item.id}
                                    layoutId={item.id}
                                    note={item}
                                    onUpdatePosition={updateNotePosition}
                                    onOpen={setActiveNote}
                                    onFocus={(id) => { bringToFront(id); bringColumnToFront(col.id); }}
                                    isMobile={isMobile}
                                    isGridMode={true}
                                    onGridDrop={handleGridDrop}
                                    onDragStart={() => { setDraggingId(item.id); setDragOverColumnId(item.columnId || null); }}
                                    onDragEnd={() => { setDraggingId(null); setDragOverColumnId(null); }}
                                    onSwap={handleNoteSwap}
                                    onDragOverColumn={handleDragOverColumn}
                                    draggingId={draggingId}
                                    stroke={currentStroke}
                                    readOnly={(isReadOnly && !spyTarget)}
                                    lang={lang}
                                />
                            )}
                        />
                    );
                })}
                {(!isReadOnly || spyTarget) && (
                    <button onClick={addColumn} className={`rounded-full border border-primary/20 flex items-center justify-center text-primary/60 font-bold gap-2 transition-colors hover:bg-primary/5 lowercase shrink-0 ${isMobile ? 'w-full h-14' : 'w-[524px] h-[50px]'}`}>
                        <Plus size={18} strokeWidth={currentStroke} />
                        <span>{t.addCol}</span>
                    </button>
                )}
            </LayoutGroup>
        </div>
    );

    return (
        <div ref={containerRef} onPointerDown={!isGridMode ? handlePointerDown : undefined} onPointerMove={!isGridMode ? handlePointerMove : undefined} onPointerUp={!isGridMode ? handlePointerUp : undefined} onPointerLeave={!isGridMode ? handlePointerUp : undefined} className={`relative bg-[#f8f6f2] transition-all duration-500 select-none ${isGridMode ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`} style={{ minWidth: '100vw', minHeight: '100vh', width: '100%', height: '100%', cursor: !isGridMode ? (isPanning ? 'grabbing' : 'default') : 'default' }}>
            {/* Filtro de leitura amarelo */}
            {readingFilterIntensity > 0 && (
                <div
                    className="fixed inset-0 pointer-events-none z-[999999]"
                    style={{
                        backgroundColor: `rgba(255, 235, 150, ${readingFilterIntensity / 100})`,
                        mixBlendMode: 'multiply'
                    }}
                />
            )}
            <motion.div style={!isGridMode ? { x: viewportX, y: viewportY } : {}} className="w-full h-full relative">
                {!isGridMode && <DesktopGridPattern />}
                <main className={`w-full pt-16 relative ${isGridMode ? 'h-full' : 'h-full'}`}>
                    {isGridMode ? renderGridLayout() : (
                        <AnimatePresence>
                            {columns.map(col => {
                                const colNotes = notes
                                    .filter(n => n.columnId === col.id)
                                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                                return (
                                    <ColumnContainer
                                        key={col.id}
                                        column={col}
                                        notes={colNotes}
                                        isGridMode={false}
                                        onUpdatePosition={updateColumnPosition}
                                        onRemove={removeColumn}
                                        onUpdateTitle={updateColumnTitle}
                                        onUpdateIcon={updateColumnIcon}
                                        isReadOnly={isReadOnly && !spyTarget}
                                        lang={lang}
                                        isDragTarget={dragOverColumnId === col.id && draggingId !== null}
                                        onFocus={bringColumnToFront}
                                        isDefaultColumn={col.id === 'default-col'}
                                        onNoteDropOut={(noteId, screenX, screenY) => {
                                            // Convert screen coords to viewport coords and release note from column
                                            const vx = viewportX.get();
                                            const vy = viewportY.get();
                                            const x = screenX - vx;
                                            const y = screenY - vy;

                                            const noteToUpdate = notes.find(n => n.id === noteId);
                                            if (noteToUpdate) {
                                                const updatedNote = { ...noteToUpdate, x, y, columnId: undefined };
                                                setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
                                                if (user) {
                                                    const targetUid = spyTarget ? spyTarget.id : user.uid;
                                                    saveNoteToCloud(targetUid, updatedNote);
                                                }
                                            }
                                        }}
                                        renderNote={(item) => (
                                            <Note
                                                key={item.id}
                                                // layoutId removido para evitar glitch de animação "voando" ao entrar na coluna
                                                note={item}
                                                onUpdatePosition={updateNotePosition}
                                                onOpen={setActiveNote}
                                                onFocus={(id) => { bringToFront(id); bringColumnToFront(col.id); }}
                                                isMobile={isMobile}
                                                isGridMode={true}
                                                onGridDrop={handleGridDrop}
                                                onDragStart={() => { setDraggingId(item.id); setDragOverColumnId(item.columnId || null); }}
                                                onDragEnd={() => { setDraggingId(null); setDragOverColumnId(null); }}
                                                onSwap={handleNoteSwap}
                                                onDragOverColumn={handleDragOverColumn}
                                                draggingId={draggingId}
                                                stroke={currentStroke}
                                                readOnly={(isReadOnly && !spyTarget)}
                                                lang={lang}
                                            />
                                        )}
                                    />
                                );
                            })}
                            {notes.filter(n => !n.columnId).map((note) => (
                                <Note
                                    key={note.id}
                                    note={note}
                                    onUpdatePosition={updateNotePosition}
                                    onOpen={setActiveNote}
                                    onFocus={bringToFront}
                                    stroke={currentStroke}
                                    isMobile={isMobile}
                                    isGridMode={false}
                                    onDragStart={() => setDraggingId(note.id)}
                                    onDragEnd={() => { setDraggingId(null); setDragOverColumnId(null); }}
                                    onDragOverColumn={handleDragOverColumn}
                                    onGridDrop={handleGridDrop}
                                    readOnly={(isReadOnly && !spyTarget)}
                                    lang={lang}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </main>
            </motion.div>

            {/* Loading Skeleton */}
            <AnimatePresence>
                {isLoadingNotes && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center z-[9998] pointer-events-none bg-[#f8f6f2]"
                    >
                        <div className="flex gap-4 flex-wrap justify-center max-w-lg px-4">
                            <NoteSkeleton count={6} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {!isLoadingNotes && notes.length === 0 && !viewingPartner && !spyTarget && (
                    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 flex items-center justify-center z-[9999] pointer-events-none bg-[#f8f6f2]">
                        <EmptyStateParticles />
                        <div className="pointer-events-auto">
                            <EmptyStateMessage onCreate={() => createItem('note')} isMobile={isMobile} stroke={currentStroke} lang={lang} />
                        </div>
                        <EmptyStateFooter lang={lang} />
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {!isGridMode && showResetView && (
                    <motion.button initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} onClick={handleResetView} className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-lg z-[40000] flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors border border-white/10">
                        <Target size={16} />
                        {t.centerView}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Overlay de transição entre modos */}
            <AnimatePresence>
                {isModeTransitioning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed top-16 left-0 right-0 bottom-0 bg-[#f8f6f2] z-[39999] pointer-events-none flex items-center justify-center"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full"
                            style={{ borderWidth: '3px' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <Header
                user={user}
                userProfile={userProfile}
                isAdmin={isAdmin}
                isMobile={isMobile}
                viewMode={viewMode}
                setViewMode={(mode) => {
                    if (mode !== viewMode) {
                        setIsModeTransitioning(true);
                        const delay = !hasSwitchedMode ? 1000 : 150;
                        if (!hasSwitchedMode) setHasSwitchedMode(true);

                        setTimeout(() => {
                            setViewMode(mode);
                            setTimeout(() => setIsModeTransitioning(false), delay);
                        }, delay);
                    }
                }}
                currentStroke={currentStroke}
                spyTarget={spyTarget}
                setSpyTarget={setSpyTarget}
                onOpenDataModal={() => setIsDataModalOpen(true)}
                onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
                lang={lang}
                readingFilterIntensity={readingFilterIntensity}
                setReadingFilterIntensity={setReadingFilterIntensity}
            />

            {/* Offline Indicator */}
            <AnimatePresence>
                {!isOnline && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-16 left-0 right-0 z-[39999] flex justify-center pointer-events-none"
                    >
                        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 rounded-b-xl shadow-lg flex items-center gap-2 text-sm font-bold lowercase">
                            <WifiOff size={16} />
                            <span>{t.offline || 'sem conexão'}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {authError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60000] flex items-center justify-center p-4" onClick={() => setAuthError(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                            <div className="flex items-center gap-3 text-red-600 mb-4"><div className="bg-red-100 p-2 rounded-full"><AlertTriangle size={24} strokeWidth={currentStroke} /></div><h3 className="text-lg font-bold text-gray-800 lowercase">{authError.title}</h3></div>
                            <p className="text-gray-600 mb-4 leading-relaxed lowercase">{authError.message}</p>
                            <div className="flex justify-end"><button onClick={() => setAuthError(null)} className="px-5 py-2.5 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-colors lowercase">got it</button></div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Banned User Blocking Modal */}
            <AnimatePresence>
                {userProfile?.isBanned && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-red-950 z-[70000] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center"
                        >
                            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle size={40} className="text-red-600" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2 lowercase">conta suspensa</h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {userProfile.banReason || 'sua conta foi suspensa por violar os termos de uso.'}
                            </p>
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                                <p className="text-xs text-gray-400 mb-1 uppercase font-bold tracking-wide">conta</p>
                                <p className="text-sm text-gray-700">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => logout()}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors lowercase"
                            >
                                sair
                            </button>
                            <p className="text-[10px] text-gray-400 mt-4">
                                se acredita que isso é um erro, entre em contato com o suporte.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <FABMenu
                isOpen={isFabMenuOpen}
                setIsOpen={setIsFabMenuOpen}
                viewingPartner={viewingPartner}
                spyTarget={spyTarget}
                setSpyTarget={setSpyTarget}
                userProfile={userProfile}
                user={user}
                onAddColumn={addColumn}
                onCreateItem={createItem}
                setViewingPartner={setViewingPartner}
                currentStroke={currentStroke}
                lang={lang}
            />
            <NoteEditor note={activeNote} isOpen={!!activeNote} onClose={() => setActiveNote(null)} onSave={saveNoteContent} onDelete={deleteNote} stroke={currentStroke} lang={lang} readOnly={isReadOnly && !spyTarget} />
            <DataControl isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} notes={notes} onImport={handleImport} user={user} onLogin={handleLogin} onLogout={logout} stroke={currentStroke} lang={lang} />
            <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} user={user} notes={notes} userProfile={userProfile} onSpyUser={setSpyTarget} lang={lang} setLang={setLang} />
        </div>
    );
}

export default App;


import { NoteColor, TitleSize } from './types';

export const APP_NAME = "muranote";
export const STORAGE_KEY = "muranote_data_v1";
export const STORAGE_COLS_KEY = "muranote_cols_v1";

// --- ADMIN CONFIGURATION ---
export const ADMIN_EMAIL = 'gustasoaresdesigner@gmail.com';

// --- UI CONFIGURATION ---
export const RESET_VIEW_THRESHOLD = 500; // Distance in pixels to show reset view button
export const COLUMN_WIDTH = 524; // Width of column containers in pixels
export const COLUMN_HEIGHT_ESTIMATE = 500; // Estimated height for column drop detection
export const FAB_Z_INDEX = 40000; // Z-index for floating action buttons
export const MODAL_Z_INDEX = 60000; // Z-index for modals
export const MOBILE_BREAKPOINT = 768; // Breakpoint for mobile detection

// --- ICON STROKE CONFIGURATION ---
export const ICON_STROKE_WIDTH = {
  mobile: 1.3,
  tablet: 1.3,
  desktop: 1.3
};

export const COLORS: Record<NoteColor, { bg: string; dark: string; text: string }> = {
  yellow: { bg: '#fef3c7', dark: '#fde68a', text: '#78350f' },
  green: { bg: '#dcfce7', dark: '#bbf7d0', text: '#14532d' },
  blue: { bg: '#dbeafe', dark: '#bfdbfe', text: '#1e3a8a' },
  purple: { bg: '#f3e8ff', dark: '#e9d5ff', text: '#581c87' },
  pink: { bg: '#fce7f3', dark: '#fbcfe8', text: '#831843' },
  orange: { bg: '#ffedd5', dark: '#fed7aa', text: '#7c2d12' },
};

export const COLOR_KEYS: NoteColor[] = ['yellow', 'green', 'blue', 'purple', 'pink', 'orange'];

export const INITIAL_NOTE_WIDTH = 220;
export const INITIAL_NOTE_HEIGHT = 220;

export const TITLE_SIZE_CLASSES: Record<TitleSize, string> = {
  small: 'text-lg md:text-2xl',
  medium: 'text-2xl md:text-3xl',
  large: 'text-4xl md:text-5xl',
};

export const TITLE_ICON_SIZES: Record<TitleSize, number> = {
  small: 20,
  medium: 32,
  large: 48,
};

export const TITLE_ICONS = [
  'Book',
  'Book2',
  'Notebook',
  'Quote',
  'Star',
  'Bookmark',
  'Typography',
  'Search',
  'Bulb',
  'Heart'
];

export const TRANSLATIONS = {
  en: {
    developedBy: 'developed by',
    startJourney: 'start your journey',
    tapToCreate: 'tap here to create your first note',
    signIn: 'sign in',
    signInGoogle: 'sign in with google',
    signInDesc: 'sync your notes and match with friends.',
    enterNow: 'enter now',
    myProfile: 'settings',
    addTitle: 'add title',
    addNote: 'add note',
    newCol: 'create new column',
    spyMode: 'spy:',
    exitSpy: 'exit spy mode',
    colDefault: 'main',
    colNew: 'new column',
    addCol: 'add column',
    centerView: 'return to center',
    newTitle: 'new title',
    newNote: 'new note',
    titlePlaceholder: 'title text...',
    titleDef: 'set a title...',
    writeThoughts: 'write your thoughts here',
    selectIcon: 'select icon',
    deleteConfirm: 'delete?',
    yes: 'yes',
    no: 'no',
    accessData: 'access & data',
    loadingProfile: 'loading profile...',
    matchActive: 'match active',
    pending: 'pending...',
    cancel: 'cancel',
    matchRequest: 'match request!',
    codePlaceholder: 'code',
    connect: 'connect',
    logout: 'sign out',
    localBackup: 'local backup',
    download: 'download',
    restore: 'restore',
    copyCode: 'code copied!',
    reqSent: 'request sent!',
    errorCode: 'code must be 5 digits.',
    errorConnect: 'connection error.',
    matchSuccess: 'match successful! ❤️',
    matchUndo: 'unmatched.',
    backupExport: 'backup exported!',
    backupRestore: 'backup restored!',
    errorFile: 'invalid file.',
    undoMatchConfirm: 'do you really want to unmatch? you will lose access to partner notes.',
    groupTitle: 'new group',
    createGroup: 'create group',
    godMode: 'god mode',
    secureAccess: 'restricted access',
    restrictedMsg: 'enter admin password.',
    unlock: 'unlock',
    setupPass: 'setup password',
    setupMsg: 'set administrative password.',
    setPass: 'set password',
    tools: 'tools',
    users: 'users',
    genNotes: 'generate 10 notes',
    resetMatch: 'reset match',
    nukeNotes: 'nuke all notes',
    userList: 'user list',
    update: 'refresh',
    loadMore: 'load more',
    adminConsole: 'admin console',
    whatsNewTitle: "what's new!",
    whatsNewContent: 'Now you can add groups within your notes and create columns in free mode!',
    gotIt: 'got it',
    readingFilter: 'reading filter',
    filterIntensity: 'intensity',
    errorAccept: 'failed to accept.',
    errorDecline: 'failed to decline.',
    errorUnmatch: 'failed to unmatch.',
    errorExport: 'export failed.',
    undoMatch: 'undo match?',
    confirm: 'confirm',
    mainColumn: 'main column',
    dragNotesHere: 'drag notes here',
    offline: 'offline'
  }
};

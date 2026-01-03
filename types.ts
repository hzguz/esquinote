
export type NoteColor = 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'orange';
export type NoteType = 'note' | 'title';
export type TitleSize = 'small' | 'medium' | 'large';
export type Language = 'en';

export interface NoteData {
  id: string;
  type: NoteType; // 'note' or 'title'
  title: string;
  content: string; // Used for note content
  color: NoteColor;
  rating: number; // 0 to 5, only for notes

  // Title Fields
  icon?: string; // Icon name for titles
  titleSize?: TitleSize; // Font size preference

  // Grid/Kanban Fields
  columnId?: string;
  order?: number;

  x: number;
  y: number;
  zIndex: number;
  rotation: number;
  createdAt: number;
  updatedAt?: number; // Last modified timestamp
}

export interface ColumnData {
  id: string;
  title: string;
  icon?: string; // Icon name for column header
  x: number;
  y: number;
  zIndex: number;
  createdAt: number;
}

export interface DragPosition {
  x: number;
  y: number;
}

export interface ExportData {
  version: number;
  appName: string;
  notes: NoteData[];
  columns?: ColumnData[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  matchCode: string; // 5 digit unique code
  matchStatus: 'none' | 'pending_sent' | 'pending_received' | 'matched';
  matchPartnerId?: string;
  matchPartnerName?: string;
  matchPartnerPhoto?: string;
  matchRequestFrom?: string; // UID of the requester
  adminPassword?: string; // Password for admin actions
}

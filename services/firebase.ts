import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, setDoc, deleteDoc, onSnapshot, query, writeBatch, getDoc, getDocs, where, updateDoc, orderBy, limit, startAfter, DocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { NoteData, UserProfile } from '../types';

// =================================================================
// FIREBASE CONFIGURATION
// Uses environment variables with fallback to hardcoded values
// =================================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCSnilocgCe3lKuH_JTjraupEQmUeT-TLM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "esquinote-74cde.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "esquinote-74cde",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "esquinote-74cde.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "607504984748",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:607504984748:web:0dd900fbab8047bf3ecd09",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LSERJ5NTMB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with persistent multi-tab cache
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export { auth, db };

// HELPER: Remove campos undefined (Firestore não aceita undefined)
const cleanUndefined = (data: Record<string, any>) => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

// --- AUTH & PROFILE ---

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    await initializeUserProfile(result.user);
  } catch (error: any) {
    console.error("Erro no login:", error);
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
};

// --- ADMIN USERS LIST ---

export const getUsersPaginated = async (lastDoc: DocumentSnapshot | null, pageSize: number = 10) => {
  let q = query(
    collection(db, 'users'),
    orderBy('email'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      collection(db, 'users'),
      orderBy('email'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const documentSnapshots = await getDocs(q);

  const users: UserProfile[] = [];
  documentSnapshots.forEach((doc) => {
    users.push(doc.data() as UserProfile);
  });

  const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];

  return { users, lastVisible };
};

// --- MATCH LOGIC ---

const generateMatchCode = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

export const initializeUserProfile = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // New user, create profile with code
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      matchCode: generateMatchCode(),
      matchStatus: 'none'
    };
    await setDoc(userRef, profile);
  } else {
    // Existing user, ensure they have a code if legacy
    const data = snap.data();
    if (!data.matchCode) {
      await updateDoc(userRef, { matchCode: generateMatchCode() });
    }
  }
};

export const subscribeToUserProfile = (userId: string, callback: (profile: UserProfile | null) => void) => {
  return onSnapshot(
    doc(db, 'users', userId),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as UserProfile);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Firestore profile subscription error:', error);
      callback(null);
    }
  );
};

export const updateAdminPassword = async (userId: string, password: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { adminPassword: password });
};

export const banUser = async (userId: string, reason?: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { isBanned: true, banReason: reason || null });
};

export const unbanUser = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { isBanned: false, banReason: null });
};

export const sendMatchRequest = async (currentUserId: string, targetCode: string) => {

  // 1. Find user by code
  const q = query(collection(db, 'users'), where('matchCode', '==', targetCode));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Código não encontrado.");
  }

  const targetDoc = querySnapshot.docs[0];
  const targetUser = targetDoc.data() as UserProfile;

  if (targetUser.uid === currentUserId) {
    throw new Error("Você não pode dar match com você mesmo.");
  }
  if (targetUser.matchStatus === 'matched') {
    throw new Error("Este usuário já tem um match.");
  }

  // 2. Update both profiles
  const batch = writeBatch(db);
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUser.uid);

  // Update Sender
  batch.update(currentUserRef, {
    matchStatus: 'pending_sent',
    matchPartnerId: targetUser.uid
  });

  // Update Receiver
  batch.update(targetUserRef, {
    matchStatus: 'pending_received',
    matchRequestFrom: currentUserId
  });

  await batch.commit();
};

export const acceptMatchRequest = async (currentUserId: string, requesterId: string) => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const requesterRef = doc(db, 'users', requesterId);

  // Get user details for cross-saving names/photos if needed, 
  // but simpler is just to store ID and fetch or use basic auth data
  const requesterSnap = await getDoc(requesterRef);
  const currentUserSnap = await getDoc(currentUserRef);

  const requesterData = requesterSnap.data() as UserProfile;
  const currentUserData = currentUserSnap.data() as UserProfile;

  const batch = writeBatch(db);

  batch.update(currentUserRef, {
    matchStatus: 'matched',
    matchPartnerId: requesterId,
    matchPartnerName: requesterData.displayName,
    matchPartnerPhoto: requesterData.photoURL,
    matchRequestFrom: null
  });

  batch.update(requesterRef, {
    matchStatus: 'matched',
    matchPartnerId: currentUserId,
    matchPartnerName: currentUserData.displayName,
    matchPartnerPhoto: currentUserData.photoURL,
    matchRequestFrom: null // clear logic
  });

  await batch.commit();
};

export const declineMatchRequest = async (currentUserId: string, requesterId: string) => {
  const batch = writeBatch(db);
  const currentUserRef = doc(db, 'users', currentUserId);
  const requesterRef = doc(db, 'users', requesterId);

  batch.update(currentUserRef, { matchStatus: 'none', matchRequestFrom: null, matchPartnerId: null });
  batch.update(requesterRef, { matchStatus: 'none', matchPartnerId: null });

  await batch.commit();
};

export const unmatchUser = async (currentUserId: string, partnerId: string) => {
  const batch = writeBatch(db);
  const currentUserRef = doc(db, 'users', currentUserId);
  const partnerRef = doc(db, 'users', partnerId);

  batch.update(currentUserRef, { matchStatus: 'none', matchPartnerId: null, matchPartnerName: null, matchPartnerPhoto: null });
  batch.update(partnerRef, { matchStatus: 'none', matchPartnerId: null, matchPartnerName: null, matchPartnerPhoto: null });

  await batch.commit();
};

// --- NOTES SYNC ---

// Updated to accept an optional specific userId to fetch notes from (for match viewing)
export const subscribeToNotes = (userId: string, callback: (notes: NoteData[]) => void) => {
  const q = query(collection(db, `users/${userId}/notes`));

  const unsubscribe = onSnapshot(
    q,
    (snapshot: QuerySnapshot) => {
      const notes: NoteData[] = [];
      snapshot.forEach((docSnap) => {
        notes.push(docSnap.data() as NoteData);
      });
      callback(notes);
    },
    (error) => {
      console.error('Firestore notes subscription error:', error);
      callback([]);
    }
  );

  return unsubscribe;
};

export const saveNoteToCloud = async (userId: string, note: NoteData) => {
  await setDoc(doc(db, `users/${userId}/notes`, note.id), cleanUndefined(note));
};

export const deleteNoteFromCloud = async (userId: string, noteId: string) => {
  await deleteDoc(doc(db, `users/${userId}/notes`, noteId));
};

export const syncLocalToCloud = async (userId: string, localNotes: NoteData[]) => {
  if (localNotes.length === 0) return;

  // Batch write to upload all local notes
  const batch = writeBatch(db);
  localNotes.forEach(note => {
    const ref = doc(db, `users/${userId}/notes`, note.id);
    batch.set(ref, cleanUndefined(note));
  });

  await batch.commit();
};
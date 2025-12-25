import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, loginWithGoogle, logout, subscribeToUserProfile, initializeUserProfile } from '../services/firebase';
import { UserProfile } from '../types';

// Hardcoded admin email - can be moved to constants
const ADMIN_EMAIL = 'gustasoaresdesigner@gmail.com';

interface UseAuthReturn {
    user: FirebaseUser | null;
    userProfile: UserProfile | null;
    isAdmin: boolean;
    isLoading: boolean;
    handleLogin: () => Promise<void>;
    handleLogout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        if (!auth) {
            setIsLoading(false);
            return;
        }

        let unsubscribeProfile: () => void = () => { };

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser: FirebaseUser | null) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    await initializeUserProfile(currentUser);
                } catch (e) {
                    console.error('Failed to initialize user profile:', e);
                }

                unsubscribeProfile = subscribeToUserProfile(currentUser.uid, (profile) => {
                    setUserProfile(profile);
                });
            } else {
                unsubscribeProfile();
                setUserProfile(null);
            }

            setIsLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeProfile();
        };
    }, []);

    const handleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    };

    return {
        user,
        userProfile,
        isAdmin,
        isLoading,
        handleLogin,
        handleLogout,
    };
}

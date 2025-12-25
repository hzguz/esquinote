
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'tabler-icons-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface WhatsNewModalProps {
    onClose: () => void;
    lang: Language;
}

const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ onClose, lang }) => {
    const t = TRANSLATIONS[lang];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[50000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 30 }}
                    transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
                    className="bg-white w-full max-w-sm md:max-w-md rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden text-center border border-white/40"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Decorative Gradients */}
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(108,120,82,0.1)_0%,transparent_50%)] pointer-events-none animate-spin-slow" />
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5:bg-white/10 transition-colors text-gray-400 hover:text-gray-600:text-gray-300 z-20"
                    >
                        <X size={20} />
                    </button>

                    <div className="relative z-10 flex flex-col items-center pt-2">
                        {/* Icon Container with Glow */}
                        <div className="relative mb-6">
                            <motion.div
                                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary relative shadow-inner">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <Star size={40} fill="currentColor" className="opacity-20 absolute" />
                                    <Star size={40} strokeWidth={1.5} />
                                </motion.div>
                                <motion.div
                                    className="absolute -top-2 -right-2 text-yellow-500"
                                    animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Star size={20} fill="currentColor" />
                                </motion.div>
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-gray-800 lowercase tracking-tight mb-3">
                            {t.whatsNewTitle}
                        </h2>

                        <p className="text-gray-500 font-medium leading-relaxed max-w-[280px] mx-auto mb-8 text-sm md:text-base">
                            {t.whatsNewContent}
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onClose}
                            className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-primary/30 shadow-primary/20 transition-all text-lg tracking-wide lowercase relative overflow-hidden group"
                        >
                            <span className="relative z-10">{t.gotIt}</span>
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-out" />
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default WhatsNewModal;

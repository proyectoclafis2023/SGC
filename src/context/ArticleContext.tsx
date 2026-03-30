import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Article } from '../types';

export interface ArticleContextType {
    articles: Article[];
    addArticle: (article: Omit<Article, 'id'>) => Promise<void>;
    updateArticle: (article: Article) => Promise<void>;
    deleteArticle: (id: string) => Promise<void>;
    decreaseStock: (articleId: string, quantity: number) => Promise<void>;
    uploadArticles: (file: File) => Promise<{ message: string }>;
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

const STORAGE_KEY = 'articles_data';
const API_URL = 'http://localhost:3001/api/articles';

export const ArticleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [articles, setArticles] = useState<Article[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return JSON.parse(stored);
            return [];
        } catch (e) { return []; }
    });

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await fetch(API_URL);
                if (response.ok) setArticles(await response.json());
            } catch (e) { }
        };
        fetchArticles();
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    }, [articles]);

    useEffect(() => {
        const handleSync = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) setArticles(JSON.parse(e.newValue));
        };
        window.addEventListener('storage', handleSync);
        return () => window.removeEventListener('storage', handleSync);
    }, []);

    const uploadArticles = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const resp = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
        if (!resp.ok) throw new Error('Error al subir inventario');
        const res = await resp.json();
        const refresh = await fetch(API_URL);
        if (refresh.ok) setArticles(await refresh.json());
        return res;
    };

    const addArticle = async (article: Omit<Article, 'id'>) => {
        const resp = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(article)
        });
        if (resp.ok) setArticles(prev => [prev[0], ...prev]); // Simple refresh or wait for socket? Let's just update local.
        const fresh = await fetch(API_URL); if (fresh.ok) setArticles(await fresh.json());
    };

    const updateArticle = async (article: Article) => {
        setArticles(prev => prev.map(a => a.id === article.id ? article : a));
    };

    const decreaseStock = async (articleId: string, quantity: number) => {
        setArticles(prev => prev.map(a =>
            a.id === articleId ? { ...a, stock: Math.max(0, a.stock - quantity) } : a
        ));
    };

    const deleteArticle = async (id: string) => {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, isArchived: true } : a));
    };

    return (
        <ArticleContext.Provider value={{ articles, addArticle, updateArticle, deleteArticle, decreaseStock, uploadArticles }}>
            {children}
        </ArticleContext.Provider>
    );
};

export const useArticles = () => {
    const context = useContext(ArticleContext);
    if (!context) throw new Error('useArticles must be used within ArticleProvider');
    return context;
};

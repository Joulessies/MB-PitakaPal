import { useUser } from '@clerk/clerk-expo';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

// Define the Transaction Type
export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    account: string;
    date: Date;
    note?: string;
    locationName?: string;
    lat?: number;
    lng?: number;
    user_id?: string;
}

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (t: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    balance: number;
    loading: boolean;
    refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType>({
    transactions: [],
    addTransaction: async () => { },
    deleteTransaction: async () => { },
    balance: 0,
    loading: true,
    refreshTransactions: async () => { },
});

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        if (!user) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) {
                console.error('Error fetching transactions:', error);
            } else {
                // Map database fields to Transaction type
                const mappedData: Transaction[] = (data || []).map((t: any) => ({
                    id: t.id,
                    type: t.type,
                    amount: parseFloat(t.amount) || 0,
                    category: t.category || 'other',
                    account: t.account || '',
                    date: new Date(t.date),
                    note: t.note || undefined,
                    locationName: t.location_name || undefined,
                    lat: t.lat != null ? parseFloat(t.lat) : undefined,
                    lng: t.lng != null ? parseFloat(t.lng) : undefined,
                    user_id: t.user_id
                }));
                setTransactions(mappedData);
            }
        } catch (err) {
            console.error('Unexpected error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const addTransaction = async (newTx: Transaction) => {
        if (!user) throw new Error("User not authenticated");

        // Prepare payload for Supabase — let Supabase generate the id
        const txPayload = {
            user_id: user.id,
            type: newTx.type,
            amount: newTx.amount,
            category: newTx.category,
            account: newTx.account,
            date: newTx.date.toISOString(),
            note: newTx.note || null,
            location_name: newTx.locationName || null,
            lat: newTx.lat ?? null,
            lng: newTx.lng ?? null
        };

        const { data, error } = await supabase
            .from('transactions')
            .insert([txPayload])
            .select()
            .single();

        if (error) {
            console.error('Error adding transaction:', error);
            throw new Error('Failed to add transaction: ' + error.message);
        }

        if (data) {
            // Update local state with the returned data from Supabase
            const addedTx: Transaction = {
                id: data.id,
                type: data.type,
                amount: parseFloat(data.amount) || 0,
                category: data.category || 'other',
                account: data.account || '',
                date: new Date(data.date),
                note: data.note || undefined,
                locationName: data.location_name || undefined,
                lat: data.lat != null ? parseFloat(data.lat) : undefined,
                lng: data.lng != null ? parseFloat(data.lng) : undefined,
                user_id: data.user_id
            };

            setTransactions(prev => [addedTx, ...prev]);
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting transaction:', error);
            throw new Error('Failed to delete transaction: ' + error.message);
        }

        setTransactions(prev => prev.filter(tx => tx.id !== id));
    };

    const balance = transactions.reduce((acc, curr) => {
        return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
    }, 0);

    return (
        <TransactionContext.Provider value={{ transactions, addTransaction, deleteTransaction, balance, loading, refreshTransactions: fetchTransactions }}>
            {children}
        </TransactionContext.Provider>
    );
};

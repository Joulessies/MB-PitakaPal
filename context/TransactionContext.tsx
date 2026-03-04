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
    note: string;
    locationName?: string;
    lat?: number;
    lng?: number;
    user_id?: string;
}

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (t: Transaction) => Promise<void>;
    balance: number;
    loading: boolean;
}

const TransactionContext = createContext<TransactionContextType>({
    transactions: [],
    addTransaction: async () => { },
    balance: 0,
    loading: true,
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
                    amount: parseFloat(t.amount),
                    category: t.category,
                    account: t.account,
                    date: new Date(t.date),
                    note: t.note,
                    locationName: t.location_name,
                    lat: t.lat ? parseFloat(t.lat) : undefined,
                    lng: t.lng ? parseFloat(t.lng) : undefined,
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
    }, [user]);

    const addTransaction = async (newTx: Transaction) => {
        if (!user) return;

        // Prepare payload for Supabase
        // We exclude 'id' to let Supabase generate UUID, unless specifically required
        const txPayload = {
            user_id: user.id,
            type: newTx.type,
            amount: newTx.amount,
            category: newTx.category,
            account: newTx.account,
            date: newTx.date.toISOString(),
            note: newTx.note,
            location_name: newTx.locationName,
            lat: newTx.lat,
            lng: newTx.lng
        };

        const { data, error } = await supabase
            .from('transactions')
            .insert([txPayload])
            .select()
            .single();

        if (error) {
            console.error('Error adding transaction:', error);
            // Fallback for UI responsiveness or offline handling could go here
        } else {
            console.log('Transaction added:', data);

            // Optimistically update local state with the returned data
            const addedTx: Transaction = {
                id: data.id,
                type: data.type,
                amount: parseFloat(data.amount),
                category: data.category,
                account: data.account,
                date: new Date(data.date),
                note: data.note,
                locationName: data.location_name,
                lat: data.lat ? parseFloat(data.lat) : undefined,
                lng: data.lng ? parseFloat(data.lng) : undefined,
                user_id: data.user_id
            };

            setTransactions(prev => [addedTx, ...prev]);
        }
    };

    const balance = transactions.reduce((acc, curr) => {
        return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
    }, 0);

    return (
        <TransactionContext.Provider value={{ transactions, addTransaction, balance, loading }}>
            {children}
        </TransactionContext.Provider>
    );
};

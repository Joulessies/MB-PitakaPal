import { useUser } from '@clerk/clerk-expo';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export interface Account {
    id: string;
    name: string;
    balance: number;
    type: string;
    icon: string;
    colors: string[];
    number: string;
    theme: string;
}

interface AccountContextType {
    accounts: Account[];
    addAccount: (acc: Omit<Account, 'id'>) => Promise<void>;
    updateAccountBalance: (id: string, newBalance: number) => Promise<void>;
    renameAccount: (id: string, newName: string) => Promise<void>;
    deleteAccount: (id: string) => Promise<void>;
    loading: boolean;
}

const AccountContext = createContext<AccountContextType>({
    accounts: [],
    addAccount: async () => { },
    updateAccountBalance: async () => { },
    renameAccount: async () => { },
    deleteAccount: async () => { },
    loading: true,
});

export const useAccounts = () => useContext(AccountContext);

/**
 * Safely parse color_theme from the database.
 * Handles both `jsonb` (already-parsed array) and `text` (JSON string) column types.
 */
const parseColorTheme = (raw: any): string[] => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            // malformed JSON string — fall through to default
        }
    }
    return ['#000000', '#000000'];
};

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAccounts = async () => {
        if (!user) {
            setAccounts([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('accounts')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            if (data) {
                const mappedAccounts = data.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    balance: parseFloat(d.balance) || 0,
                    type: d.type,
                    icon: d.icon || 'credit-card',
                    colors: parseColorTheme(d.color_theme),
                    number: d.number || '',
                    theme: d.theme || 'light'
                }));
                setAccounts(mappedAccounts);
            }
        } catch (e) {
            console.error('Error fetching accounts:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const addAccount = async (newAcc: Omit<Account, 'id'>) => {
        if (!user) throw new Error("User not authenticated");

        const payload = {
            user_id: user.id,
            name: newAcc.name,
            balance: newAcc.balance,
            type: newAcc.type,
            icon: newAcc.icon,
            color_theme: JSON.stringify(newAcc.colors),
            number: newAcc.number,
            theme: newAcc.theme
        };

        const { data, error } = await supabase
            .from('accounts')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('Error adding account:', error);
            throw new Error('Failed to add account: ' + error.message);
        }

        if (data) {
            setAccounts(prev => [...prev, {
                id: data.id,
                name: data.name,
                balance: parseFloat(data.balance) || 0,
                type: data.type,
                icon: data.icon || 'credit-card',
                colors: parseColorTheme(data.color_theme),
                number: data.number || '',
                theme: data.theme || 'light'
            }]);
        }
    };

    const updateAccountBalance = async (id: string, newBalance: number) => {
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error updating balance:', error);
            throw new Error('Failed to update balance: ' + error.message);
        }

        setAccounts(prev => prev.map(acc =>
            acc.id === id ? { ...acc, balance: newBalance } : acc
        ));
    };

    const renameAccount = async (id: string, newName: string) => {
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase
            .from('accounts')
            .update({ name: newName })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error renaming account:', error);
            throw error;
        }

        setAccounts(prev => prev.map(acc =>
            acc.id === id ? { ...acc, name: newName } : acc
        ));
    };

    const deleteAccount = async (id: string) => {
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting account:', error);
            throw error;
        }

        setAccounts(prev => prev.filter(acc => acc.id !== id));
    };

    return (
        <AccountContext.Provider value={{ accounts, addAccount, updateAccountBalance, renameAccount, deleteAccount, loading }}>
            {children}
        </AccountContext.Provider>
    );
};

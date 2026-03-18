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
                    balance: parseFloat(d.balance),
                    type: d.type,
                    icon: d.icon,
                    colors: JSON.parse(d.color_theme || '["#000","#000"]'),
                    number: d.number,
                    theme: d.theme || 'light' // Add 'theme' column or default
                }));
                setAccounts(mappedAccounts);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
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
            alert('Failed to add account');
            return;
        }

        if (data) {
            setAccounts(prev => [...prev, {
                id: data.id,
                name: data.name,
                balance: parseFloat(data.balance),
                type: data.type,
                icon: data.icon,
                colors: JSON.parse(data.color_theme),
                number: data.number,
                theme: data.theme || 'light'
            }]);
        }
    };

    const updateAccountBalance = async (id: string, newBalance: number) => {
        const { error } = await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', id);

        if (!error) {
            setAccounts(prev => prev.map(acc =>
                acc.id === id ? { ...acc, balance: newBalance } : acc
            ));
        }
    };

    const renameAccount = async (id: string, newName: string) => {
        const { error } = await supabase
            .from('accounts')
            .update({ name: newName })
            .eq('id', id);

        if (error) {
            console.error('Error renaming account:', error);
            throw error;
        }

        setAccounts(prev => prev.map(acc =>
            acc.id === id ? { ...acc, name: newName } : acc
        ));
    };

    const deleteAccount = async (id: string) => {
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', id);

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

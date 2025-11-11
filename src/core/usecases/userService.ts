import { supabase } from '../../infrastructure/supabaseClient';
import bcrypt from 'bcrypt';

export interface User {
    id: string;
    user_name: string;
    password_hash: string;
    last_logged_in: string | null;
    created_at: string;
}

export async function createUser(user_name: string, password: string): Promise<User | null> {
    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
        .from('user_details')
        .insert([{ user_name, password_hash }])
        .select()
        .single();

    if (error) throw error;
    return data as User | null;
}

export async function authenticateUser(user_name: string, password: string): Promise<User> {
    const { data, error } = await supabase
        .from('user_details')
        .select('*')
        .eq('user_name', user_name)
        .single();

    if (error) throw error;
    if (!data) throw new Error('User not found');

    const match = await bcrypt.compare(password, (data as User).password_hash);
    if (!match) throw new Error('Invalid credentials');


    const { error: updateError } = await supabase
        .from('user_details')
        .update({ last_logged_in: new Date().toISOString() })
        .eq('id', data.id);

    if (updateError) throw updateError;

    return data as User;
}


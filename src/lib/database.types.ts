export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            investments: {
                Row: {
                    id: string
                    amount: number
                    payment_id: string | null
                    proposal_id: string
                    investor_id: string
                    status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED'
                }
                Insert: {
                    id?: string
                    amount: number
                    payment_id?: string | null
                    proposal_id: string
                    investor_id: string
                    status?: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED'
                }
                Update: {
                    id?: string
                    amount?: number
                    payment_id?: string | null
                    proposal_id?: string
                    investor_id?: string
                    status?: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED'
                }
            }
            proposals: {
                Row: {
                    id: string
                    title: string
                    description: string
                    budget: number
                    amount_raised: number
                    investor_count: number
                    status: string
                    user_id: string
                    created_at: string
                    updated_at: string
                    category: string
                }
                Insert: {
                    id?: string
                    title: string
                    description: string
                    budget: number
                    amount_raised?: number
                    investor_count?: number
                    status?: string
                    user_id: string
                    created_at?: string
                    updated_at?: string
                    category: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string
                    budget?: number
                    amount_raised?: number
                    investor_count?: number
                    status?: string
                    user_id?: string
                    created_at?: string
                    updated_at?: string
                    category?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            increment_proposal_investment: {
                Args: {
                    p_proposal_id: string
                    p_amount: number
                }
                Returns: void
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
} 
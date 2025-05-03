export type ProposalStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DECLINED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Proposal {
    id: string;
    title: string;
    description: string;
    submittedBy: {
        id: string;
        name: string;
    };
    status: ProposalStatus;
    createdAt: Date;
    updatedAt: Date;
    targetDate?: Date;
    category: string;
    budget?: {
        amount: number;
        currency: string;
    };
    businessCase?: string;
    expectedOutcomes?: string[];
} 
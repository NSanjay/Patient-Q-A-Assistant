import { ConfigService } from '@nestjs/config';
export interface AgentInput {
    query: string;
    patientContext: any;
    variant: 'A' | 'B';
    conversationHistory: Array<{
        role: string;
        content: string;
    }>;
}
export interface AgentOutput {
    answer: string;
    citations: Array<{
        table: string;
        field: string;
        value: string;
    }>;
    confidence: 'High' | 'Medium' | 'Low';
    rawOutput: string;
}
export declare class AgentService {
    private config;
    private llm;
    constructor(config: ConfigService);
    run(input: AgentInput): Promise<AgentOutput>;
    private buildVariantAPrompt;
    private buildVariantBPrompt;
    private buildUserMessage;
    private parseResponse;
}

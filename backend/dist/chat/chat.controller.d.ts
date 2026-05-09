import { ChatService } from './chat.service';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    message(req: any, message: string, conversationHistory?: Array<{
        role: string;
        content: string;
    }>): Promise<{
        answer: string;
        citations: never[];
        confidence: string;
        injectionDetected: boolean;
        clarificationNeeded?: undefined;
        patient?: undefined;
        variant?: undefined;
    } | {
        answer: string | undefined;
        citations: never[];
        confidence: string;
        clarificationNeeded: boolean;
        injectionDetected?: undefined;
        patient?: undefined;
        variant?: undefined;
    } | {
        answer: string;
        citations: never[];
        confidence: string;
        injectionDetected?: undefined;
        clarificationNeeded?: undefined;
        patient?: undefined;
        variant?: undefined;
    } | {
        answer: string;
        citations: {
            table: string;
            field: string;
            value: string;
        }[];
        confidence: "High" | "Medium" | "Low";
        patient: {
            id: string;
            name: string;
        };
        variant: "A" | "B";
        injectionDetected?: undefined;
        clarificationNeeded?: undefined;
    }>;
}

import {
  Controller, Post, Body, UseGuards, Request, HttpCode
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('message')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async message(
    @Request() req,
    @Body('message') message: string,
    @Body('conversationHistory') conversationHistory: Array<{role: string, content: string}> = [],
  ) {
    // Backend sanitization — strip disallowed chars, enforce length
    const sanitized = (message ?? '')
      .replace(/[^a-zA-Z0-9\s'&().,-?]/g, '')
      .trim()
      .slice(0, 200);

    if (!sanitized.length) {
      return {
        answer: 'Please enter a valid question.',
        citations: [],
        confidence: 'Low',
      };
    }
    
    const { cohort, sessionId, variant } = req.user;
    return this.chatService.handleMessage({
      message,
      cohort,
      sessionId,
      variant,
      conversationHistory,
    });
  }
}

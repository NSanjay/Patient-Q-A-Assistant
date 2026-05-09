import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AgentService } from './agent.service';
import { PatientResolverService } from './patient-resolver.service';
import { LoggingService } from '../logging/logging.service';
import { PatientsModule } from '../patients/patients.module';
import { RequestLog } from '../common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestLog]),
    PatientsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, AgentService, PatientResolverService, LoggingService],
})
export class ChatModule {}

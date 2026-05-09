import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import {
  Patient, PatientAllergy, PatientCondition,
  PatientMedication, PatientObservation, RequestLog
} from './common/entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        database: config.get<string>('DB_NAME', 'patientqa'),
        username: config.get<string>('DB_USER', 'admin'),
        password: config.get<string>('DB_PASSWORD', 'secret'),
        synchronize: false,
        entities: [
          Patient,
          PatientAllergy,
          PatientCondition,
          PatientMedication,
          PatientObservation,
          RequestLog,
        ],
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ChatModule,
  ],
})
export class AppModule {}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const chat_controller_1 = require("./chat.controller");
const chat_service_1 = require("./chat.service");
const agent_service_1 = require("./agent.service");
const patient_resolver_service_1 = require("./patient-resolver.service");
const logging_service_1 = require("../logging/logging.service");
const patients_module_1 = require("../patients/patients.module");
const entities_1 = require("../common/entities");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([entities_1.RequestLog]),
            patients_module_1.PatientsModule,
        ],
        controllers: [chat_controller_1.ChatController],
        providers: [chat_service_1.ChatService, agent_service_1.AgentService, patient_resolver_service_1.PatientResolverService, logging_service_1.LoggingService],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map
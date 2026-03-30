import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "@backend/config/configuration";
import { validateEnvironment } from "@backend/config/environment";
import { PrismaModule } from "@backend/common/database/prisma.module";
import { RequestLoggerMiddleware } from "@backend/common/middleware/request-logger.middleware";
import { AuthModule } from "@backend/modules/auth/auth.module";
import { ChatModule } from "@backend/modules/chat/chat.module";
import { ClientsModule } from "@backend/modules/clients/clients.module";
import { DealsModule } from "@backend/modules/deals/deals.module";
import { LeadsModule } from "@backend/modules/leads/leads.module";
import { MeetingsModule } from "@backend/modules/meetings/meetings.module";
import { PromoCodesModule } from "@backend/modules/promo-codes/promo-codes.module";
import { TasksModule } from "@backend/modules/tasks/tasks.module";
import { UsersModule } from "@backend/modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    ChatModule,
    ClientsModule,
    LeadsModule,
    DealsModule,
    MeetingsModule,
    PromoCodesModule,
    TasksModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { Rule, RuleSchema } from './entities/rule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rule.name, schema: RuleSchema }]),
  ],
  controllers: [RulesController],
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}
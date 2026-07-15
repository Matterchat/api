import { Controller, Get } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import {
  type AuthenticatedUser,
  CurrentUser,
} from 'src/auth/current-user.decorator';

@Controller('/gateway')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get('/ticket')
  async requestTicket(@CurrentUser() user: AuthenticatedUser) {
    return this.gatewayService.requestTicket(user);
  }
}

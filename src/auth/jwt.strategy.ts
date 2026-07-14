import { ApiConfiguration } from '@matterchat/config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/routes/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,

      issuer: ApiConfiguration.keycloak.issuer,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${ApiConfiguration.keycloak.issuer}/protocol/openid-connect/certs`,
      }),
    });
  }

  async validate(payload: any) {
    await this.usersService.$upsertUser(
      payload.sub,
      payload.email,
      payload.name,
    );

    return {
      userId: payload.sub,
      email: payload.email,
      fullName: payload.name,
      roles: payload.realm_access?.roles || [],
    };
  }
}

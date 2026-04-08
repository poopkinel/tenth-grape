import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): { googleId: string; email: string; name: string; avatar: string | null } {
    const email = profile.emails?.[0]?.value;
    const avatar = profile.photos?.[0]?.value ?? null;
    return {
      googleId: profile.id,
      email: email!,
      name: profile.displayName,
      avatar,
    };
  }
}

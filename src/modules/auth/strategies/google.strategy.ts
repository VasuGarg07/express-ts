import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import CONFIG from '../../../config/config';
import User from '../userModel';

const googleStrategy = new GoogleStrategy({
    clientID: CONFIG.GOOGLE_CLIENT_ID,
    clientSecret: CONFIG.GOOGLE_CLIENT_SECRET,
    callbackURL: CONFIG.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) throw new Error('No email returned from Google');

        const avatar = profile.photos?.[0]?.value;

        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.findOne({ email });

            if (user) {
                // Link Google
                user.username = profile.username || profile.displayName,
                user.googleId = profile.id;
                user.avatar = user.avatar || avatar;
                user.authProvider = 'google';
                await user.save();
            } else {
                // New User
                user = await User.create({
                    username: profile.username || profile.displayName,
                    email,
                    googleId: profile.id,
                    avatar,
                    authProvider: 'google',
                });
            }
        }

        return done(null, user)
    } catch (error) {
        return done(error, undefined)
    }
});

passport.use(googleStrategy);
export default passport;
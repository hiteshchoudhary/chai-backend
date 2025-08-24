import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/api/v1/users/auth/google/callback",
}, (accessToken, refreshToken, profile, done) => {
  // In a real app, save or lookup user in DB
  return done(null, profile);
}));

// Serialize & deserialize for session
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

export default passport;

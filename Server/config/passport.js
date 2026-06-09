import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from './db.js';

passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:`${process.env.BASE_URL}/auth/google/callback`
},
async (accessToken, refreshToken, profile, done) => {
    console.log(profile)
    try {
    const email = profile.emails[0].value;
    const googleId = profile.id;

   
    const byGoogleId = await db.query('SELECT * FROM users WHERE google_id=$1', [googleId]);
    if (byGoogleId.rows.length > 0) {
      return done(null, byGoogleId.rows[0]);
    }

    const byEmail = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (byEmail.rows.length > 0) {
      const updated = await db.query(
        'UPDATE users SET google_id=$1, is_verified=true WHERE email=$2 RETURNING *',
        [googleId, email]
      );
      return done(null, updated.rows[0]);
    }

    
    const newUser = await db.query(
      'INSERT INTO users (email, name, google_id, is_verified) VALUES ($1,$2,$3,true) RETURNING *',
      [email, profile.displayName, googleId]
    );
    return done(null, newUser.rows[0]);

  } catch (err) {
    return done(err);
  }
} 
   
));
export default passport;
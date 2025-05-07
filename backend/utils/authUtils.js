const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

/**
 * Utilitar pentru autentificare și gestionarea JWT
 */
class AuthUtils {
  /**
   * Generează un hash pentru parolă
   * @param {string} password - Parola în text simplu
   * @returns {Promise<string>} Hash-ul parolei
   */
  async hashPassword(password) {
    try {
      // Generează un salt cu cost-ul de 10
      const salt = await bcrypt.genSalt(10);
      
      // Generează hash-ul parolei
      const hash = await bcrypt.hash(password, salt);
      
      return hash;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verifică dacă o parolă corespunde unui hash
   * @param {string} password - Parola în text simplu
   * @param {string} hash - Hash-ul parolei salvat
   * @returns {Promise<boolean>} true dacă parola corespunde, false altfel
   */
  async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Error comparing password:', error);
      throw new Error('Password comparison failed');
    }
  }

  /**
   * Generează un token JWT
   * @param {Object} payload - Payload-ul tokenului
   * @returns {string} Tokenul JWT
   */
  generateToken(payload) {
    try {
      return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Verifică și decodează un token JWT
   * @param {string} token - Tokenul JWT
   * @returns {Object|null} Payload-ul decodat sau null dacă verificarea eșuează
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Token expirat sau invalid
      console.error('Token verification failed:', error.message);
      return null;
    }
  }
}

module.exports = new AuthUtils();
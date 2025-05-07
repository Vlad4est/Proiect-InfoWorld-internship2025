const authUtils = require('../utils/authUtils');
const dbService = require('../services/dbService');

/**
 * Middleware pentru verificarea autentificării
 */
const authMiddleware = {
  /**
   * Verifică dacă utilizatorul este autentificat
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  authenticate: async (req, res, next) => {
    try {
      // Verifică dacă există un token în header-ul Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized - No token provided'
        });
      }
      
      // Extrage tokenul din header
      const token = authHeader.split(' ')[1];
      
      // Verifică și decodează tokenul
      const decoded = authUtils.verifyToken(token);
      
      if (!decoded) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized - Invalid token'
        });
      }
      
      // Verifică dacă utilizatorul există
      let user;
      
      if (decoded.role === 'admin' || decoded.role === 'tehnician') {
        user = await dbService.getById('admins', decoded.id);
      } else {
        user = await dbService.getById('clients', decoded.id);
      }
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized - User not found'
        });
      }
      
      // Verifică dacă utilizatorul este activ
      if (!user.active) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized - Account is inactive'
        });
      }
      
      // Adaugă informațiile utilizatorului la request
      req.user = {
        id: user.id,
        username: user.username,
        role: decoded.role || 'client',
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      next();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verifică dacă utilizatorul are rolul specificat
   * @param  {...string} roles - Rolurile permise
   * @returns {Function} Middleware pentru verificarea rolului
   */
  authorize: (...roles) => {
    return (req, res, next) => {
      // Verifică dacă middleware-ul authenticate a fost executat
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized - Authentication required'
        });
      }
      
      // Verifică dacă utilizatorul are rolul necesar
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden - Insufficient permissions'
        });
      }
      
      next();
    };
  }
};

module.exports = authMiddleware;
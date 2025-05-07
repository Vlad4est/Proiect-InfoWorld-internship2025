const dbService = require('../services/dbService');
const authUtils = require('../utils/authUtils');
const Validator = require('../utils/validator');

/**
 * Controller pentru gestionarea autentificării
 */
class AuthController {
  /**
   * Înregistrează un client nou
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async registerClient(req, res, next) {
    try {
      const { username, password, firstName, lastName, phoneNumbers, email } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator
        .validate(req.body, 'username', 'string')
        .minLength(req.body, 'username', 4)
        .maxLength(req.body, 'username', 20)
        .validate(req.body, 'password', 'string')
        .minLength(req.body, 'password', 6)
        .validate(req.body, 'firstName', 'string')
        .minLength(req.body, 'firstName', 2)
        .maxLength(req.body, 'firstName', 50)
        .validate(req.body, 'lastName', 'string')
        .minLength(req.body, 'lastName', 2)
        .maxLength(req.body, 'lastName', 50)
        .validate(req.body, 'phoneNumbers', 'array')
        .arrayItems(req.body, 'phoneNumbers', (item) => {
          if (typeof item !== 'string' || !/^0[0-9]{9}$/.test(item)) {
            throw new Error('Numărul de telefon trebuie să fie valid (format: 07XXXXXXXX)');
          }
        })
        .validate(req.body, 'email', 'email');
      
      validator.throwIfErrors();
      
      // Verifică dacă username-ul este deja folosit
      const existingClient = await dbService.find('clients', { username });
      if (existingClient.length > 0) {
        const error = new Error('Username already in use');
        error.statusCode = 400;
        throw error;
      }
      
      // Verifică dacă email-ul este deja folosit
      const existingEmail = await dbService.find('clients', { email });
      if (existingEmail.length > 0) {
        const error = new Error('Email already in use');
        error.statusCode = 400;
        throw error;
      }
      
      // Generează hash pentru parolă
      const hashedPassword = await authUtils.hashPassword(password);
      
      // Creează client nou
      const newClient = await dbService.create('clients', {
        username,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumbers,
        email,
        active: true
      });
      
      // Exclude parola din răspuns
      const { password: _, ...clientWithoutPassword } = newClient;
      
      res.status(201).json({
        status: 'success',
        message: 'Client registered successfully',
        data: clientWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Autentifică un client sau admin
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator
        .validate(req.body, 'username', 'string')
        .validate(req.body, 'password', 'string');
      
      validator.throwIfErrors();
      
      // Caută utilizatorul (mai întâi în admin, apoi în clienți)
      let user = null;
      let role = null;
      
      // Verifică dacă este admin
      const adminResult = await dbService.find('admins', { username });
      if (adminResult.length > 0) {
        user = adminResult[0];
        role = user.role;
      } else {
        // Verifică dacă este client
        const clientResult = await dbService.find('clients', { username });
        if (clientResult.length > 0) {
          user = clientResult[0];
          role = 'client';
        }
      }
      
      // Verifică dacă utilizatorul există
      if (!user) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
      }
      
      // Verifică dacă utilizatorul este activ
      if (!user.active) {
        const error = new Error('Account is inactive');
        error.statusCode = 401;
        throw error;
      }
      
      // Verifică parola
      const isPasswordValid = await authUtils.comparePassword(password, user.password);
      if (!isPasswordValid) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
      }
      
      // Generează token JWT
      const token = authUtils.generateToken({
        id: user.id,
        username: user.username,
        role
      });
      
      // Exclude parola din răspuns
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            ...userWithoutPassword,
            role
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creează un admin nou (doar admin poate crea alți admini)
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async createAdmin(req, res, next) {
    try {
      const { username, password, firstName, lastName, email, role } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator
        .validate(req.body, 'username', 'string')
        .minLength(req.body, 'username', 4)
        .maxLength(req.body, 'username', 20)
        .validate(req.body, 'password', 'string')
        .minLength(req.body, 'password', 6)
        .validate(req.body, 'firstName', 'string')
        .minLength(req.body, 'firstName', 2)
        .maxLength(req.body, 'firstName', 50)
        .validate(req.body, 'lastName', 'string')
        .minLength(req.body, 'lastName', 2)
        .maxLength(req.body, 'lastName', 50)
        .validate(req.body, 'email', 'email')
        .validate(req.body, 'role', 'string')
        .enum(req.body, 'role', ['admin', 'tehnician']);
      
      validator.throwIfErrors();
      
      // Verifică dacă username-ul este deja folosit
      const existingAdmin = await dbService.find('admins', { username });
      if (existingAdmin.length > 0) {
        const error = new Error('Username already in use');
        error.statusCode = 400;
        throw error;
      }
      
      // Verifică dacă email-ul este deja folosit
      const existingEmail = await dbService.find('admins', { email });
      if (existingEmail.length > 0) {
        const error = new Error('Email already in use');
        error.statusCode = 400;
        throw error;
      }
      
      // Generează hash pentru parolă
      const hashedPassword = await authUtils.hashPassword(password);
      
      // Creează admin nou
      const newAdmin = await dbService.create('admins', {
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        role,
        active: true
      });
      
      // Exclude parola din răspuns
      const { password: _, ...adminWithoutPassword } = newAdmin;
      
      res.status(201).json({
        status: 'success',
        message: 'Admin created successfully',
        data: adminWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obține profilul utilizatorului autentificat
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getProfile(req, res, next) {
    try {
      // Obține utilizatorul din request (adăugat de middleware-ul authenticate)
      const { id, role } = req.user;
      
      // Obține datele complete ale utilizatorului
      let user;
      
      if (role === 'admin' || role === 'tehnician') {
        user = await dbService.getById('admins', id);
      } else {
        user = await dbService.getById('clients', id);
      }
      
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Exclude parola din răspuns
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        status: 'success',
        data: {
          ...userWithoutPassword,
          role
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizează parola utilizatorului autentificat
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async updatePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const { id, role } = req.user;
      
      // Validare date
      const validator = new Validator();
      validator
        .validate(req.body, 'currentPassword', 'string')
        .validate(req.body, 'newPassword', 'string')
        .minLength(req.body, 'newPassword', 6);
      
      validator.throwIfErrors();
      
      // Obține utilizatorul
      let user;
      let collection;
      
      if (role === 'admin' || role === 'tehnician') {
        user = await dbService.getById('admins', id);
        collection = 'admins';
      } else {
        user = await dbService.getById('clients', id);
        collection = 'clients';
      }
      
      // Verifică parola curentă
      const isPasswordValid = await authUtils.comparePassword(currentPassword, user.password);
      if (!isPasswordValid) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        throw error;
      }
      
      // Generează hash pentru parola nouă
      const hashedPassword = await authUtils.hashPassword(newPassword);
      
      // Actualizează parola
      await dbService.update(collection, id, { password: hashedPassword });
      
      res.json({
        status: 'success',
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obține lista de administratori (doar pentru admin)
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getAdmins(req, res, next) {
    try {
      // Obține toți administratorii
      const admins = await dbService.getAll('admins');
      
      // Exclude parolele din răspuns
      const adminsWithoutPasswords = admins.map(admin => {
        const { password, ...adminWithoutPassword } = admin;
        return adminWithoutPassword;
      });
      
      res.json({
        status: 'success',
        data: adminsWithoutPasswords
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activează sau dezactivează un admin (doar pentru admin)
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async toggleAdminActive(req, res, next) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator.validate(req.body, 'active', 'boolean');
      validator.throwIfErrors();
      
      // Verifică dacă admin-ul există
      const admin = await dbService.getById('admins', id);
      if (!admin) {
        const error = new Error('Admin not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Nu se poate dezactiva propriul cont
      if (parseInt(id) === req.user.id && !active) {
        const error = new Error('Cannot deactivate your own account');
        error.statusCode = 400;
        throw error;
      }
      
      // Activează/dezactivează admin-ul
      const updatedAdmin = await dbService.toggleActive('admins', id, active);
      
      // Exclude parola din răspuns
      const { password, ...adminWithoutPassword } = updatedAdmin;
      
      res.json({
        status: 'success',
        data: adminWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
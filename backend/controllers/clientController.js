const dbService = require('../services/dbService');
const Validator = require('../utils/validator');

/**
 * Controller pentru gestionarea clienților
 */
class ClientController {
  /**
   * Obține toți clienții
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getAllClients(req, res, next) {
    try {
      // Obține parametrii de filtrare opționali
      const { active, search } = req.query;
      
      // Obține toți clienții
      let clients = await dbService.getAll('clients');
      
      // Filtrare după status activ/inactiv dacă e specificat
      if (active !== undefined) {
        const isActive = active === 'true';
        clients = clients.filter(client => client.active === isActive);
      }
      
      // Filtrare după text de căutare
      if (search) {
        const searchLower = search.toLowerCase();
        clients = clients.filter(client => 
          client.firstName.toLowerCase().includes(searchLower) || 
          client.lastName.toLowerCase().includes(searchLower) || 
          client.email.toLowerCase().includes(searchLower)
        );
      }
      
      res.json({
        status: 'success',
        data: clients
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obține un client după ID
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getClientById(req, res, next) {
    try {
      const { id } = req.params;
      const client = await dbService.getById('clients', id);
      
      if (!client) {
        const error = new Error('Client not found');
        error.statusCode = 404;
        throw error;
      }
      
      res.json({
        status: 'success',
        data: client
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obține mașinile unui client
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getClientCars(req, res, next) {
    try {
      const { id } = req.params;
      
      // Verifică dacă clientul există
      const client = await dbService.getById('clients', id);
      if (!client) {
        const error = new Error('Client not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Obține mașinile clientului
      const cars = await dbService.find('cars', { clientId: parseInt(id) });
      
      res.json({
        status: 'success',
        data: cars
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Acest endpoint a fost înlocuit de /api/auth/register
   * Dar este menținut pentru compatibilitate cu codul existent
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async createClient(req, res, next) {
    try {
      const error = new Error('This endpoint is deprecated. Please use /api/auth/register instead');
      error.statusCode = 410; // Gone
      throw error;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizează un client
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async updateClient(req, res, next) {
    try {
      const { id } = req.params;
      const { firstName, lastName, phoneNumbers, email } = req.body;
      
      // Verifică dacă clientul există
      const client = await dbService.getById('clients', id);
      if (!client) {
        const error = new Error('Client not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Validare date
      const validator = new Validator();
      if (firstName !== undefined) {
        validator
          .validate(req.body, 'firstName', 'string')
          .minLength(req.body, 'firstName', 2)
          .maxLength(req.body, 'firstName', 50);
      }
      
      if (lastName !== undefined) {
        validator
          .validate(req.body, 'lastName', 'string')
          .minLength(req.body, 'lastName', 2)
          .maxLength(req.body, 'lastName', 50);
      }
      
      if (phoneNumbers !== undefined) {
        validator
          .validate(req.body, 'phoneNumbers', 'array')
          .arrayItems(req.body, 'phoneNumbers', (item) => {
            if (typeof item !== 'string' || !/^0[0-9]{9}$/.test(item)) {
              throw new Error('Numărul de telefon trebuie să fie valid (format: 07XXXXXXXX)');
            }
          });
      }
      
      if (email !== undefined) {
        validator.validate(req.body, 'email', 'email');
      }
      
      validator.throwIfErrors();
      
      // Actualizează clientul
      const updatedClient = await dbService.update('clients', id, {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phoneNumbers !== undefined && { phoneNumbers }),
        ...(email !== undefined && { email })
      });
      
      res.json({
        status: 'success',
        data: updatedClient
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activează sau dezactivează un client
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async toggleClientActive(req, res, next) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator.validate(req.body, 'active', 'boolean');
      validator.throwIfErrors();
      
      // Verifică dacă clientul există
      const client = await dbService.getById('clients', id);
      if (!client) {
        const error = new Error('Client not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Activează/dezactivează clientul
      const updatedClient = await dbService.toggleActive('clients', id, active);
      
      res.json({
        status: 'success',
        data: updatedClient
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Șterge un client
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async deleteClient(req, res, next) {
    try {
      const { id } = req.params;
      
      // Verifică dacă clientul există
      const client = await dbService.getById('clients', id);
      if (!client) {
        const error = new Error('Client not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Verifică dacă clientul are mașini
      const cars = await dbService.find('cars', { clientId: parseInt(id) });
      if (cars.length > 0) {
        const error = new Error('Clientul nu poate fi șters deoarece are mașini înregistrate');
        error.statusCode = 400;
        throw error;
      }
      
      // Verifică dacă clientul are programări
      const appointments = await dbService.find('appointments', { clientId: parseInt(id) });
      if (appointments.length > 0) {
        const error = new Error('Clientul nu poate fi șters deoarece are programări');
        error.statusCode = 400;
        throw error;
      }
      
      // Șterge clientul
      await dbService.delete('clients', id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClientController();
const dbService = require('../services/dbService');
const Validator = require('../utils/validator');

/**
 * Controller pentru gestionarea mașinilor
 */
class CarController {
  /**
   * Obține toate mașinile
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getAllCars(req, res, next) {
    try {
      // Obține parametrii de filtrare opționali
      const { active, clientId, brand, engineType, search } = req.query;
      
      // Obține toate mașinile
      let cars = await dbService.getAll('cars');
      
      // Filtrare după status activ/inactiv dacă e specificat
      if (active !== undefined) {
        const isActive = active === 'true';
        cars = cars.filter(car => car.active === isActive);
      }
      
      // Filtrare după client
      if (clientId) {
        cars = cars.filter(car => car.clientId === parseInt(clientId));
      }
      
      // Filtrare după marcă
      if (brand) {
        cars = cars.filter(car => car.brand.toLowerCase() === brand.toLowerCase());
      }
      
      // Filtrare după tip motor
      if (engineType) {
        cars = cars.filter(car => car.engineType.toLowerCase() === engineType.toLowerCase());
      }
      
      // Filtrare după text de căutare
      if (search) {
        const searchLower = search.toLowerCase();
        cars = cars.filter(car => 
          car.brand.toLowerCase().includes(searchLower) || 
          car.model.toLowerCase().includes(searchLower) || 
          car.licensePlate.toLowerCase().includes(searchLower)
        );
      }
      
      res.json({
        status: 'success',
        data: cars
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obține o mașină după ID
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getCarById(req, res, next) {
    try {
      const { id } = req.params;
      const car = await dbService.getById('cars', id);
      
      if (!car) {
        const error = new Error('Car not found');
        error.statusCode = 404;
        throw error;
      }
      
      res.json({
        status: 'success',
        data: car
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creează o mașină nouă
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async createCar(req, res, next) {
    try {
      const { 
        clientId, licensePlate, chassisNumber, brand, model, 
        year, engineType, engineCapacity, horsePower 
      } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator
        .validate(req.body, 'clientId', 'number')
        .validate(req.body, 'licensePlate', 'string')
        .minLength(req.body, 'licensePlate', 2)
        .maxLength(req.body, 'licensePlate', 20)
        .validate(req.body, 'chassisNumber', 'string')
        .minLength(req.body, 'chassisNumber', 5)
        .maxLength(req.body, 'chassisNumber', 30)
        .validate(req.body, 'brand', 'string')
        .validate(req.body, 'model', 'string')
        .validate(req.body, 'year', 'number')
        .min(req.body, 'year', 1900)
        .max(req.body, 'year', new Date().getFullYear() + 1)
        .validate(req.body, 'engineType', 'string')
        .enum(req.body, 'engineType', ['diesel', 'benzina', 'hibrid', 'electric'])
        .validate(req.body, 'engineCapacity', 'number')
        .min(req.body, 'engineCapacity', 0)
        .validate(req.body, 'horsePower', 'number')
        .min(req.body, 'horsePower', 0);
      
      validator.throwIfErrors();
      
      // Verifică dacă clientul există
      const client = await dbService.getById('clients', clientId);
      if (!client) {
        const error = new Error('Client not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Verifică dacă numărul de înmatriculare este deja folosit
      const existingCar = await dbService.find('cars', { licensePlate });
      if (existingCar.length > 0) {
        const error = new Error('License plate already in use');
        error.statusCode = 400;
        throw error;
      }
      
      // Calculează puterea în kW
      const powerKW = Math.round(horsePower * 0.7355);
      
      // Creează mașina
      const newCar = await dbService.create('cars', {
        clientId,
        licensePlate,
        chassisNumber,
        brand,
        model,
        year,
        engineType,
        engineCapacity,
        horsePower,
        powerKW,
        active: true
      });
      
      res.status(201).json({
        status: 'success',
        data: newCar
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizează o mașină
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async updateCar(req, res, next) {
    try {
      const { id } = req.params;
      const { 
        licensePlate, chassisNumber, brand, model, 
        year, engineType, engineCapacity, horsePower 
      } = req.body;
      
      // Verifică dacă mașina există
      const car = await dbService.getById('cars', id);
      if (!car) {
        const error = new Error('Car not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Validare date
      const validator = new Validator();
      
      if (licensePlate !== undefined) {
        validator
          .validate(req.body, 'licensePlate', 'string')
          .minLength(req.body, 'licensePlate', 2)
          .maxLength(req.body, 'licensePlate', 20);
          
        // Verifică dacă numărul de înmatriculare este deja folosit
        const existingCar = await dbService.find('cars', { licensePlate });
        if (existingCar.length > 0 && existingCar[0].id !== parseInt(id)) {
          const error = new Error('License plate already in use');
          error.statusCode = 400;
          throw error;
        }
      }
      
      if (chassisNumber !== undefined) {
        validator
          .validate(req.body, 'chassisNumber', 'string')
          .minLength(req.body, 'chassisNumber', 5)
          .maxLength(req.body, 'chassisNumber', 30);
      }
      
      if (brand !== undefined) {
        validator.validate(req.body, 'brand', 'string');
      }
      
      if (model !== undefined) {
        validator.validate(req.body, 'model', 'string');
      }
      
      if (year !== undefined) {
        validator
          .validate(req.body, 'year', 'number')
          .min(req.body, 'year', 1900)
          .max(req.body, 'year', new Date().getFullYear() + 1);
      }
      
      if (engineType !== undefined) {
        validator
          .validate(req.body, 'engineType', 'string')
          .enum(req.body, 'engineType', ['diesel', 'benzina', 'hibrid', 'electric']);
      }
      
      if (engineCapacity !== undefined) {
        validator
          .validate(req.body, 'engineCapacity', 'number')
          .min(req.body, 'engineCapacity', 0);
      }
      
      if (horsePower !== undefined) {
        validator
          .validate(req.body, 'horsePower', 'number')
          .min(req.body, 'horsePower', 0);
      }
      
      validator.throwIfErrors();
      
      // Calculează puterea în kW dacă s-a schimbat puterea în cai putere
      let powerKW;
      if (horsePower !== undefined) {
        powerKW = Math.round(horsePower * 0.7355);
      }
      
      // Actualizează mașina
      const updatedCar = await dbService.update('cars', id, {
        ...(licensePlate !== undefined && { licensePlate }),
        ...(chassisNumber !== undefined && { chassisNumber }),
        ...(brand !== undefined && { brand }),
        ...(model !== undefined && { model }),
        ...(year !== undefined && { year }),
        ...(engineType !== undefined && { engineType }),
        ...(engineCapacity !== undefined && { engineCapacity }),
        ...(horsePower !== undefined && { horsePower }),
        ...(powerKW !== undefined && { powerKW })
      });
      
      res.json({
        status: 'success',
        data: updatedCar
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activează sau dezactivează o mașină
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async toggleCarActive(req, res, next) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator.validate(req.body, 'active', 'boolean');
      validator.throwIfErrors();
      
      // Verifică dacă mașina există
      const car = await dbService.getById('cars', id);
      if (!car) {
        const error = new Error('Car not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Activează/dezactivează mașina
      const updatedCar = await dbService.toggleActive('cars', id, active);
      
      res.json({
        status: 'success',
        data: updatedCar
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Șterge o mașină
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async deleteCar(req, res, next) {
    try {
      const { id } = req.params;
      
      // Verifică dacă mașina există
      const car = await dbService.getById('cars', id);
      if (!car) {
        const error = new Error('Car not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Verifică dacă mașina are programări
      const appointments = await dbService.find('appointments', { carId: parseInt(id) });
      if (appointments.length > 0) {
        const error = new Error('Mașina nu poate fi ștearsă deoarece are programări');
        error.statusCode = 400;
        throw error;
      }
      
      // Șterge mașina
      await dbService.delete('cars', id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CarController();
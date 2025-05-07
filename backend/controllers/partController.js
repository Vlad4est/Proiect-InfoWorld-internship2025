const dbService = require('../services/dbService');
const Validator = require('../utils/validator');

/**
 * Controller pentru gestionarea pieselor
 */
class PartController {
  /**
   * Obține toate piesele
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getAllParts(req, res, next) {
    try {
      // Obține parametrii de filtrare opționali
      const { active, category, search } = req.query;
      
      // Obține toate piesele
      let parts = await dbService.getAll('parts');
      
      // Filtrare după status activ/inactiv dacă e specificat
      if (active !== undefined) {
        const isActive = active === 'true';
        parts = parts.filter(part => part.active === isActive);
      }
      
      // Filtrare după categorie
      if (category) {
        parts = parts.filter(part => part.category.toLowerCase() === category.toLowerCase());
      }
      
      // Filtrare după text de căutare
      if (search) {
        const searchLower = search.toLowerCase();
        parts = parts.filter(part => 
          part.name.toLowerCase().includes(searchLower) || 
          part.category.toLowerCase().includes(searchLower)
        );
      }
      
      res.json({
        status: 'success',
        data: parts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obține o piesă după ID
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getPartById(req, res, next) {
    try {
      const { id } = req.params;
      const part = await dbService.getById('parts', id);
      
      if (!part) {
        const error = new Error('Part not found');
        error.statusCode = 404;
        throw error;
      }
      
      res.json({
        status: 'success',
        data: part
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obține categoriile distincte de piese
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getCategories(req, res, next) {
    try {
      const parts = await dbService.getAll('parts');
      
      // Extragere categorii unice
      const categories = [...new Set(parts.map(part => part.category))];
      
      res.json({
        status: 'success',
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creează o piesă nouă
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async createPart(req, res, next) {
    try {
      const { name, category, stock, unitPrice, unitType } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator
        .validate(req.body, 'name', 'string')
        .minLength(req.body, 'name', 3)
        .maxLength(req.body, 'name', 100)
        .validate(req.body, 'category', 'string')
        .validate(req.body, 'stock', 'number')
        .min(req.body, 'stock', 0)
        .validate(req.body, 'unitPrice', 'number')
        .min(req.body, 'unitPrice', 0)
        .validate(req.body, 'unitType', 'string');
      
      validator.throwIfErrors();
      
      // Creează piesa
      const newPart = await dbService.create('parts', {
        name,
        category,
        stock,
        unitPrice,
        unitType,
        active: true
      });
      
      res.status(201).json({
        status: 'success',
        data: newPart
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizează o piesă
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async updatePart(req, res, next) {
    try {
      const { id } = req.params;
      const { name, category, stock, unitPrice, unitType } = req.body;
      
      // Verifică dacă piesa există
      const part = await dbService.getById('parts', id);
      if (!part) {
        const error = new Error('Part not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Validare date
      const validator = new Validator();
      
      if (name !== undefined) {
        validator
          .validate(req.body, 'name', 'string')
          .minLength(req.body, 'name', 3)
          .maxLength(req.body, 'name', 100);
      }
      
      if (category !== undefined) {
        validator.validate(req.body, 'category', 'string');
      }
      
      if (stock !== undefined) {
        validator
          .validate(req.body, 'stock', 'number')
          .min(req.body, 'stock', 0);
      }
      
      if (unitPrice !== undefined) {
        validator
          .validate(req.body, 'unitPrice', 'number')
          .min(req.body, 'unitPrice', 0);
      }
      
      if (unitType !== undefined) {
        validator.validate(req.body, 'unitType', 'string');
      }
      
      validator.throwIfErrors();
      
      // Actualizează piesa
      const updatedPart = await dbService.update('parts', id, {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(stock !== undefined && { stock }),
        ...(unitPrice !== undefined && { unitPrice }),
        ...(unitType !== undefined && { unitType })
      });
      
      res.json({
        status: 'success',
        data: updatedPart
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activează sau dezactivează o piesă
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async togglePartActive(req, res, next) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator.validate(req.body, 'active', 'boolean');
      validator.throwIfErrors();
      
      // Verifică dacă piesa există
      const part = await dbService.getById('parts', id);
      if (!part) {
        const error = new Error('Part not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Activează/dezactivează piesa
      const updatedPart = await dbService.toggleActive('parts', id, active);
      
      res.json({
        status: 'success',
        data: updatedPart
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizează stocul unei piese
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async updateStock(req, res, next) {
    try {
      const { id } = req.params;
      const { stock, operation } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator.validate(req.body, 'stock', 'number');
      
      if (operation) {
        validator
          .validate(req.body, 'operation', 'string')
          .enum(req.body, 'operation', ['add', 'subtract', 'set']);
      }
      
      validator.throwIfErrors();
      
      // Verifică dacă piesa există
      const part = await dbService.getById('parts', id);
      if (!part) {
        const error = new Error('Part not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Calculează noul stoc
      let newStock;
      
      switch (operation || 'set') {
        case 'add':
          newStock = part.stock + stock;
          break;
        case 'subtract':
          newStock = part.stock - stock;
          // Verifică dacă stocul devine negativ
          if (newStock < 0) {
            const error = new Error('Stock cannot be negative');
            error.statusCode = 400;
            throw error;
          }
          break;
        case 'set':
        default:
          newStock = stock;
      }
      
      // Actualizează piesa
      const updatedPart = await dbService.update('parts', id, { stock: newStock });
      
      res.json({
        status: 'success',
        data: updatedPart
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Șterge o piesă
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async deletePart(req, res, next) {
    try {
      const { id } = req.params;
      
      // Verifică dacă piesa există
      const part = await dbService.getById('parts', id);
      if (!part) {
        const error = new Error('Part not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Verifică dacă piesa este folosită în înregistrări de service
      const serviceRecords = await dbService.getAll('serviceRecords');
      
      const isUsed = serviceRecords.some(record => {
        if (!record.processing || !record.processing.replacedParts) return false;
        
        return record.processing.replacedParts.some(replacedPart => 
          replacedPart.name === part.name
        );
      });
      
      if (isUsed) {
        const error = new Error('Part cannot be deleted because it is used in service records');
        error.statusCode = 400;
        throw error;
      }
      
      // Șterge piesa
      await dbService.delete('parts', id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PartController();
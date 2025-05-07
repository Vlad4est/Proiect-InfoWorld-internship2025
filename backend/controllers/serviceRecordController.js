const dbService = require('../services/dbService');
const Validator = require('../utils/validator');

/**
 * Controller pentru gestionarea înregistrărilor de service
 */
class ServiceRecordController {
  /**
   * Obține toate înregistrările de service
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getAllServiceRecords(req, res, next) {
    try {
      // Obține parametrii de filtrare opționali
      const { appointmentId, completed } = req.query;
      
      // Obține toate înregistrările de service
      let serviceRecords = await dbService.getAll('serviceRecords');
      
      // Filtrare după programare
      if (appointmentId) {
        serviceRecords = serviceRecords.filter(record => record.appointmentId === parseInt(appointmentId));
      }
      
      // Filtrare după status completat
      if (completed !== undefined) {
        const isCompleted = completed === 'true';
        serviceRecords = serviceRecords.filter(record => record.completed === isCompleted);
      }
      
      // Încarcă informații suplimentare pentru fiecare înregistrare
      const enrichedRecords = await Promise.all(serviceRecords.map(async (record) => {
        const appointment = await dbService.getById('appointments', record.appointmentId);
        
        let clientInfo = null;
        let carInfo = null;
        
        if (appointment) {
          const client = await dbService.getById('clients', appointment.clientId);
          const car = await dbService.getById('cars', appointment.carId);
          
          clientInfo = client ? {
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName
          } : null;
          
          carInfo = car ? {
            id: car.id,
            brand: car.brand,
            model: car.model,
            licensePlate: car.licensePlate
          } : null;
        }
        
        return {
          ...record,
          appointmentInfo: appointment ? {
            id: appointment.id,
            date: appointment.date,
            description: appointment.description
          } : null,
          clientInfo,
          carInfo
        };
      }));
      
      res.json({
        status: 'success',
        data: enrichedRecords
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obține o înregistrare de service după ID
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getServiceRecordById(req, res, next) {
    try {
      const { id } = req.params;
      const serviceRecord = await dbService.getById('serviceRecords', id);
      
      if (!serviceRecord) {
        const error = new Error('Service record not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Încarcă informații suplimentare
      const appointment = await dbService.getById('appointments', serviceRecord.appointmentId);
      
      let clientInfo = null;
      let carInfo = null;
      
      if (appointment) {
        const client = await dbService.getById('clients', appointment.clientId);
        const car = await dbService.getById('cars', appointment.carId);
        
        clientInfo = client ? {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName
        } : null;
        
        carInfo = car ? {
          id: car.id,
          brand: car.brand,
          model: car.model,
          licensePlate: car.licensePlate
        } : null;
      }
      
      const enrichedRecord = {
        ...serviceRecord,
        appointmentInfo: appointment ? {
          id: appointment.id,
          date: appointment.date,
          description: appointment.description
        } : null,
        clientInfo,
        carInfo
      };
      
      res.json({
        status: 'success',
        data: enrichedRecord
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creează o înregistrare de service pentru o programare
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async createServiceRecord(req, res, next) {
    try {
      const { appointmentId, reception } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator
        .validate(req.body, 'appointmentId', 'number')
        .validate(req.body, 'reception', 'object')
        .objectProps(req.body, 'reception', {
          'visualIssues': [['validate', 'string', false]],
          'clientReportedIssues': [['validate', 'string']],
          'receivedBy': [['validate', 'string']]
        });
      
      validator.throwIfErrors();
      
      // Verifică dacă programarea există
      const appointment = await dbService.getById('appointments', appointmentId);
      if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Verifică dacă programarea este validă pentru înregistrarea service
      if (appointment.status !== 'programat') {
        const error = new Error('Cannot create service record for a cancelled or completed appointment');
        error.statusCode = 400;
        throw error;
      }
      
      // Verifică dacă există deja o înregistrare pentru această programare
      const existingRecord = await dbService.find('serviceRecords', { appointmentId: parseInt(appointmentId) });
      if (existingRecord.length > 0) {
        const error = new Error('Service record already exists for this appointment');
        error.statusCode = 400;
        throw error;
      }
      
      // Timestamp pentru primire
      const receivedAt = new Date().toISOString();
      
      // Creează înregistrarea de service
      const newServiceRecord = await dbService.create('serviceRecords', {
        appointmentId,
        reception: {
          ...reception,
          receivedAt
        },
        completed: false
      });
      
      // Actualizează statusul programării
      await dbService.update('appointments', appointmentId, { status: 'in_curs' });
      
      res.status(201).json({
        status: 'success',
        data: newServiceRecord
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adaugă informații de procesare la o înregistrare de service
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async addProcessing(req, res, next) {
    try {
      const { id } = req.params;
      const { operations, replacedParts, additionalIssues, repaired, processingDuration, processedBy } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator
        .validate(req.body, 'operations', 'array')
        .arrayItems(req.body, 'operations', (item) => {
          if (typeof item !== 'string') {
            throw new Error('Operațiunile trebuie să fie texte');
          }
        })
        .validate(req.body, 'replacedParts', 'array', false)
        .validate(req.body, 'additionalIssues', 'string', false)
        .validate(req.body, 'repaired', 'string')
        .enum(req.body, 'repaired', ['complet', 'parțial', 'nerealizat'])
        .validate(req.body, 'processingDuration', 'number')
        .validate(req.body, 'processedBy', 'string');
      
      // Validare piese înlocuite
      if (replacedParts && replacedParts.length > 0) {
        replacedParts.forEach((part, index) => {
          if (typeof part !== 'object' || !part.name || !part.quantity || !part.unitPrice) {
            validator.errors.push(`Piesa înlocuită ${index + 1} trebuie să conțină name, quantity și unitPrice`);
          }
        });
      }
      
      validator.throwIfErrors();
      
      // Verifică dacă înregistrarea de service există
      const serviceRecord = await dbService.getById('serviceRecords', id);
      if (!serviceRecord) {
        const error = new Error('Service record not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Verifică dacă înregistrarea are deja informații de procesare
      if (serviceRecord.processing) {
        const error = new Error('Processing information already exists for this service record');
        error.statusCode = 400;
        throw error;
      }
      
      // Verifică dacă durata procesării este un multiplu de 10 minute
      if (processingDuration % 10 !== 0) {
        const error = new Error('Processing duration must be a multiple of 10 minutes');
        error.statusCode = 400;
        throw error;
      }
      
      // Timestamp pentru procesare
      const processedAt = new Date().toISOString();
      
      // Actualizează înregistrarea de service
      const updatedServiceRecord = await dbService.update('serviceRecords', id, {
        processing: {
          operations,
          replacedParts: replacedParts || [],
          additionalIssues: additionalIssues || '',
          repaired,
          processingDuration,
          processedBy,
          processedAt
        },
        completed: true
      });
      
      // Actualizează statusul programării
      const appointment = await dbService.getById('appointments', serviceRecord.appointmentId);
      if (appointment) {
        await dbService.update('appointments', appointment.id, { status: 'finalizat' });
      }
      
      res.json({
        status: 'success',
        data: updatedServiceRecord
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizează o înregistrare de service
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async updateServiceRecord(req, res, next) {
    try {
      const { id } = req.params;
      const { reception, processing, completed } = req.body;
      
      // Verifică dacă înregistrarea de service există
      const serviceRecord = await dbService.getById('serviceRecords', id);
      if (!serviceRecord) {
        const error = new Error('Service record not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Validare date
      const validator = new Validator();
      
      // Validare informații recepție
      if (reception) {
        validator
          .validate(req.body, 'reception', 'object')
          .objectProps(req.body, 'reception', {
            'visualIssues': [['validate', 'string', false]],
            'clientReportedIssues': [['validate', 'string']],
            'receivedBy': [['validate', 'string']]
          });
      }
      
      // Validare informații procesare
      if (processing) {
        validator
          .validate(req.body, 'processing', 'object')
          .objectProps(req.body, 'processing', {
            'operations': [['validate', 'array']],
            'repaired': [['validate', 'string'], ['enum', ['complet', 'parțial', 'nerealizat']]],
            'processingDuration': [['validate', 'number']],
            'processedBy': [['validate', 'string']]
          });
          
        // Verifică dacă durata procesării este un multiplu de 10 minute
        if (processing.processingDuration && processing.processingDuration % 10 !== 0) {
          validator.errors.push('Processing duration must be a multiple of 10 minutes');
        }
      }
      
      if (completed !== undefined) {
        validator.validate(req.body, 'completed', 'boolean');
      }
      
      validator.throwIfErrors();
      
      // Construiește obiectul pentru actualizare
      const updateData = {};
      
      if (reception) {
        updateData.reception = {
          ...serviceRecord.reception,
          ...reception
        };
      }
      
      if (processing) {
        // Dacă nu există informații de procesare, adaugă timestamp-ul
        const processedAt = serviceRecord.processing?.processedAt || new Date().toISOString();
        
        updateData.processing = {
          ...(serviceRecord.processing || {}),
          ...processing,
          processedAt
        };
      }
      
      if (completed !== undefined) {
        updateData.completed = completed;
      }
      
      // Actualizează înregistrarea de service
      const updatedServiceRecord = await dbService.update('serviceRecords', id, updateData);
      
      // Actualizează statusul programării dacă s-a finalizat
      if (completed === true && !serviceRecord.completed) {
        const appointment = await dbService.getById('appointments', serviceRecord.appointmentId);
        if (appointment) {
          await dbService.update('appointments', appointment.id, { status: 'finalizat' });
        }
      }
      
      res.json({
        status: 'success',
        data: updatedServiceRecord
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Șterge o înregistrare de service
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async deleteServiceRecord(req, res, next) {
    try {
      const { id } = req.params;
      
      // Verifică dacă înregistrarea de service există
      const serviceRecord = await dbService.getById('serviceRecords', id);
      if (!serviceRecord) {
        const error = new Error('Service record not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Actualizează statusul programării
      const appointment = await dbService.getById('appointments', serviceRecord.appointmentId);
      if (appointment && appointment.status === 'in_curs') {
        await dbService.update('appointments', appointment.id, { status: 'programat' });
      }
      
      // Șterge înregistrarea de service
      await dbService.delete('serviceRecords', id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServiceRecordController();
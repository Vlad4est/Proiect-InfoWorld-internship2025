const dbService = require('../services/dbService');
const Validator = require('../utils/validator');

/**
 * Controller pentru gestionarea programărilor
 */
class AppointmentController {
  /**
   * Obține toate programările
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getAllAppointments(req, res, next) {
    try {
      // Obține parametrii de filtrare opționali
      const { clientId, carId, date, status } = req.query;
      
      // Obține toate programările
      let appointments = await dbService.getAll('appointments');
      
      // Filtrare după client
      if (clientId) {
        appointments = appointments.filter(app => app.clientId === parseInt(clientId));
      }
      
      // Filtrare după mașină
      if (carId) {
        appointments = appointments.filter(app => app.carId === parseInt(carId));
      }
      
      // Filtrare după dată
      if (date) {
        appointments = appointments.filter(app => app.date === date);
      }
      
      // Filtrare după status
      if (status) {
        appointments = appointments.filter(app => app.status === status);
      }
      
      // Încarcă informații despre client și mașină pentru fiecare programare
      const enrichedAppointments = await Promise.all(appointments.map(async (appointment) => {
        const client = await dbService.getById('clients', appointment.clientId);
        const car = await dbService.getById('cars', appointment.carId);
        
        return {
          ...appointment,
          client: client ? {
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phoneNumbers: client.phoneNumbers
          } : null,
          car: car ? {
            id: car.id,
            brand: car.brand,
            model: car.model,
            licensePlate: car.licensePlate,
            year: car.year
          } : null
        };
      }));
      
      res.json({
        status: 'success',
        data: enrichedAppointments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obține o programare după ID
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async getAppointmentById(req, res, next) {
    try {
      const { id } = req.params;
      const appointment = await dbService.getById('appointments', id);
      
      if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Încarcă informații despre client și mașină
      const client = await dbService.getById('clients', appointment.clientId);
      const car = await dbService.getById('cars', appointment.carId);
      
      const enrichedAppointment = {
        ...appointment,
        client: client ? {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phoneNumbers: client.phoneNumbers
        } : null,
        car: car ? {
          id: car.id,
          brand: car.brand,
          model: car.model,
          licensePlate: car.licensePlate,
          year: car.year
        } : null
      };
      
      res.json({
        status: 'success',
        data: enrichedAppointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creează o programare nouă
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async createAppointment(req, res, next) {
    try {
      const { 
        clientId, carId, date, startTime, endTime, 
        description, contactMethod 
      } = req.body;
      
      // Validare date
      const validator = new Validator();
      validator
        .validate(req.body, 'clientId', 'number')
        .validate(req.body, 'carId', 'number')
        .validate(req.body, 'date', 'date')
        .validate(req.body, 'startTime', 'string')
        .validate(req.body, 'endTime', 'string')
        .validate(req.body, 'description', 'string')
        .validate(req.body, 'contactMethod', 'string')
        .enum(req.body, 'contactMethod', ['telefon', 'email', 'in_persoana']);
      
      validator.throwIfErrors();
      
      // Verifică dacă clientul există
      const client = await dbService.getById('clients', clientId);
      if (!client) {
        const error = new Error('Client not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Verifică dacă mașina există
      const car = await dbService.getById('cars', carId);
      if (!car) {
        const error = new Error('Car not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Verifică dacă mașina aparține clientului
      if (car.clientId !== clientId) {
        const error = new Error('Car does not belong to the specified client');
        error.statusCode = 400;
        throw error;
      }
      
      // Validare ore de program (8:00 - 17:00)
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);
      const startMinute = parseInt(startTime.split(':')[1]);
      const endMinute = parseInt(endTime.split(':')[1]);
      
      if (startHour < 8 || (startHour === 17 && startMinute > 0) || startHour > 17) {
        const error = new Error('Start time must be between 8:00 and 17:00');
        error.statusCode = 400;
        throw error;
      }
      
      if (endHour < 8 || (endHour === 17 && endMinute > 0) || endHour > 17) {
        const error = new Error('End time must be between 8:00 and 17:00');
        error.statusCode = 400;
        throw error;
      }
      
      // Calcul durată în minute
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;
      const duration = endTimeMinutes - startTimeMinutes;
      
      if (duration <= 0) {
        const error = new Error('End time must be after start time');
        error.statusCode = 400;
        throw error;
      }
      
      if (duration % 30 !== 0) {
        const error = new Error('Duration must be a multiple of 30 minutes');
        error.statusCode = 400;
        throw error;
      }
      
      // Verifică suprapuneri cu alte programări în aceeași zi
      const appointmentsOnSameDay = await dbService.find('appointments', { date });
      
      const hasOverlap = appointmentsOnSameDay.some(app => {
        const appStartHour = parseInt(app.startTime.split(':')[0]);
        const appStartMinute = parseInt(app.startTime.split(':')[1]);
        const appEndHour = parseInt(app.endTime.split(':')[0]);
        const appEndMinute = parseInt(app.endTime.split(':')[1]);
        
        const appStartTimeMinutes = appStartHour * 60 + appStartMinute;
        const appEndTimeMinutes = appEndHour * 60 + appEndMinute;
        
        // Verifică dacă există suprapunere
        return (
          (startTimeMinutes < appEndTimeMinutes && endTimeMinutes > appStartTimeMinutes) ||
          (appStartTimeMinutes < endTimeMinutes && appEndTimeMinutes > startTimeMinutes)
        );
      });
      
      if (hasOverlap) {
        const error = new Error('Appointment overlaps with an existing appointment');
        error.statusCode = 400;
        throw error;
      }
      
      // Creează programarea
      const newAppointment = await dbService.create('appointments', {
        clientId,
        carId,
        date,
        startTime,
        endTime,
        duration,
        description,
        contactMethod,
        status: 'programat'
      });
      
      res.status(201).json({
        status: 'success',
        data: newAppointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizează o programare
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async updateAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const { 
        date, startTime, endTime, description,
        contactMethod, status 
      } = req.body;
      
      // Verifică dacă programarea există
      const appointment = await dbService.getById('appointments', id);
      if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Validare date
      const validator = new Validator();
      
      if (date !== undefined) {
        validator.validate(req.body, 'date', 'date');
      }
      
      if (startTime !== undefined) {
        validator.validate(req.body, 'startTime', 'string');
      }
      
      if (endTime !== undefined) {
        validator.validate(req.body, 'endTime', 'string');
      }
      
      if (description !== undefined) {
        validator.validate(req.body, 'description', 'string');
      }
      
      if (contactMethod !== undefined) {
        validator
          .validate(req.body, 'contactMethod', 'string')
          .enum(req.body, 'contactMethod', ['telefon', 'email', 'in_persoana']);
      }
      
      if (status !== undefined) {
        validator
          .validate(req.body, 'status', 'string')
          .enum(req.body, 'status', ['programat', 'anulat', 'finalizat', 'in_curs']);
      }
      
      validator.throwIfErrors();
      
      // Calculează durata dacă s-au schimbat orele
      let duration = appointment.duration;
      
      if (startTime !== undefined && endTime !== undefined) {
        // Validare ore de program (8:00 - 17:00)
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        const startMinute = parseInt(startTime.split(':')[1]);
        const endMinute = parseInt(endTime.split(':')[1]);
        
        if (startHour < 8 || (startHour === 17 && startMinute > 0) || startHour > 17) {
          const error = new Error('Start time must be between 8:00 and 17:00');
          error.statusCode = 400;
          throw error;
        }
        
        if (endHour < 8 || (endHour === 17 && endMinute > 0) || endHour > 17) {
          const error = new Error('End time must be between 8:00 and 17:00');
          error.statusCode = 400;
          throw error;
        }
        
        // Calcul durată în minute
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;
        duration = endTimeMinutes - startTimeMinutes;
        
        if (duration <= 0) {
          const error = new Error('End time must be after start time');
          error.statusCode = 400;
          throw error;
        }
        
        if (duration % 30 !== 0) {
          const error = new Error('Duration must be a multiple of 30 minutes');
          error.statusCode = 400;
          throw error;
        }
      } else if (startTime !== undefined || endTime !== undefined) {
        const error = new Error('Both start time and end time must be provided together');
        error.statusCode = 400;
        throw error;
      }
      
      // Verifică suprapuneri dacă s-a schimbat data sau orele
      if (date !== undefined || startTime !== undefined || endTime !== undefined) {
        const checkDate = date || appointment.date;
        const checkStartTime = startTime || appointment.startTime;
        const checkEndTime = endTime || appointment.endTime;
        
        const startHour = parseInt(checkStartTime.split(':')[0]);
        const startMinute = parseInt(checkStartTime.split(':')[1]);
        const endHour = parseInt(checkEndTime.split(':')[0]);
        const endMinute = parseInt(checkEndTime.split(':')[1]);
        
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;
        
        // Verifică suprapuneri cu alte programări în aceeași zi
        const appointmentsOnSameDay = await dbService.find('appointments', { date: checkDate });
        
        const hasOverlap = appointmentsOnSameDay.some(app => {
          // Exclude programarea curentă
          if (app.id === parseInt(id)) {
            return false;
          }
          
          const appStartHour = parseInt(app.startTime.split(':')[0]);
          const appStartMinute = parseInt(app.startTime.split(':')[1]);
          const appEndHour = parseInt(app.endTime.split(':')[0]);
          const appEndMinute = parseInt(app.endTime.split(':')[1]);
          
          const appStartTimeMinutes = appStartHour * 60 + appStartMinute;
          const appEndTimeMinutes = appEndHour * 60 + appEndMinute;
          
          // Verifică dacă există suprapunere
          return (
            (startTimeMinutes < appEndTimeMinutes && endTimeMinutes > appStartTimeMinutes) ||
            (appStartTimeMinutes < endTimeMinutes && appEndTimeMinutes > startTimeMinutes)
          );
        });
        
        if (hasOverlap) {
          const error = new Error('Appointment overlaps with an existing appointment');
          error.statusCode = 400;
          throw error;
        }
      }
      
      // Actualizează programarea
      const updatedAppointment = await dbService.update('appointments', id, {
        ...(date !== undefined && { date }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(duration !== appointment.duration && { duration }),
        ...(description !== undefined && { description }),
        ...(contactMethod !== undefined && { contactMethod }),
        ...(status !== undefined && { status })
      });
      
      res.json({
        status: 'success',
        data: updatedAppointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Șterge o programare
   * @param {Request} req - Request Express
   * @param {Response} res - Response Express
   * @param {NextFunction} next - Next middleware
   */
  async deleteAppointment(req, res, next) {
    try {
      const { id } = req.params;
      
      // Verifică dacă programarea există
      const appointment = await dbService.getById('appointments', id);
      if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Verifică dacă programarea are înregistrări de service
      const serviceRecords = await dbService.find('serviceRecords', { appointmentId: parseInt(id) });
      if (serviceRecords.length > 0) {
        const error = new Error('Appointment cannot be deleted because it has service records');
        error.statusCode = 400;
        throw error;
      }
      
      // Șterge programarea
      await dbService.delete('appointments', id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AppointmentController();
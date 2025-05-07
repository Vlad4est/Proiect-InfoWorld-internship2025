const express = require('express');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

/**
 * @route GET /api/appointments
 * @desc Obține toate programările
 * @access Public
 */
router.get('/', appointmentController.getAllAppointments);

/**
 * @route GET /api/appointments/:id
 * @desc Obține o programare după ID
 * @access Public
 */
router.get('/:id', appointmentController.getAppointmentById);

/**
 * @route POST /api/appointments
 * @desc Creează o programare nouă
 * @access Public
 */
router.post('/', appointmentController.createAppointment);

/**
 * @route PUT /api/appointments/:id
 * @desc Actualizează o programare
 * @access Public
 */
router.put('/:id', appointmentController.updateAppointment);

/**
 * @route DELETE /api/appointments/:id
 * @desc Șterge o programare
 * @access Public
 */
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;
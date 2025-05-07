const express = require('express');
const serviceRecordController = require('../controllers/serviceRecordController');

const router = express.Router();

/**
 * @route GET /api/service-records
 * @desc Obține toate înregistrările de service
 * @access Public
 */
router.get('/', serviceRecordController.getAllServiceRecords);

/**
 * @route GET /api/service-records/:id
 * @desc Obține o înregistrare de service după ID
 * @access Public
 */
router.get('/:id', serviceRecordController.getServiceRecordById);

/**
 * @route POST /api/service-records
 * @desc Creează o înregistrare de service nouă
 * @access Public
 */
router.post('/', serviceRecordController.createServiceRecord);

/**
 * @route POST /api/service-records/:id/processing
 * @desc Adaugă informații de procesare la o înregistrare de service
 * @access Public
 */
router.post('/:id/processing', serviceRecordController.addProcessing);

/**
 * @route PUT /api/service-records/:id
 * @desc Actualizează o înregistrare de service
 * @access Public
 */
router.put('/:id', serviceRecordController.updateServiceRecord);

/**
 * @route DELETE /api/service-records/:id
 * @desc Șterge o înregistrare de service
 * @access Public
 */
router.delete('/:id', serviceRecordController.deleteServiceRecord);

module.exports = router;
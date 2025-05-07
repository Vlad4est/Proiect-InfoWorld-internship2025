const express = require('express');
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route GET /api/clients
 * @desc Obține toți clienții
 * @access Private - doar admin și tehnician
 */
router.get('/', 
  authMiddleware.authorize('admin', 'tehnician'), 
  clientController.getAllClients
);

/**
 * @route GET /api/clients/:id
 * @desc Obține un client după ID
 * @access Private - client (doar propriul profil), admin sau tehnician
 */
router.get('/:id', (req, res, next) => {
  // Verifică dacă clientul încearcă să acceseze propriul profil
  if (req.user.role === 'client' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden - You can only access your own profile'
    });
  }
  next();
}, clientController.getClientById);

/**
 * @route GET /api/clients/:id/cars
 * @desc Obține mașinile unui client
 * @access Private - client (doar propriile mașini), admin sau tehnician
 */
router.get('/:id/cars', (req, res, next) => {
  // Verifică dacă clientul încearcă să acceseze propriile mașini
  if (req.user.role === 'client' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden - You can only access your own cars'
    });
  }
  next();
}, clientController.getClientCars);

/**
 * @route POST /api/clients
 * @desc Creează un client nou (DEPRECATED)
 * @access Private - doar admin
 */
router.post('/', 
  authMiddleware.authorize('admin'), 
  clientController.createClient
);

/**
 * @route PUT /api/clients/:id
 * @desc Actualizează un client
 * @access Private - client (doar propriul profil), admin
 */
router.put('/:id', (req, res, next) => {
  // Verifică dacă clientul încearcă să-și actualizeze propriul profil
  if (req.user.role === 'client' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden - You can only update your own profile'
    });
  }
  next();
}, clientController.updateClient);

/**
 * @route PATCH /api/clients/:id/active
 * @desc Activează sau dezactivează un client
 * @access Private - doar admin
 */
router.patch('/:id/active', 
  authMiddleware.authorize('admin'), 
  clientController.toggleClientActive
);

/**
 * @route DELETE /api/clients/:id
 * @desc Șterge un client
 * @access Private - doar admin
 */
router.delete('/:id', 
  authMiddleware.authorize('admin'), 
  clientController.deleteClient
);

module.exports = router;
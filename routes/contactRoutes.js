const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public route - submit contact form (NO AUTH REQUIRED)
router.post('/', contactController.submitContact);

// Admin routes - protected
router.get('/', authenticate, isAdmin, contactController.getAllContacts);
router.get('/:id', authenticate, isAdmin, contactController.getContactById);
router.put('/:id', authenticate, isAdmin, contactController.updateContactStatus);
router.delete('/:id', authenticate, isAdmin, contactController.deleteContact);

module.exports = router;

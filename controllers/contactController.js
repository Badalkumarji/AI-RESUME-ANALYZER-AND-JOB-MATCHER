const Contact = require('../models/Contact');

// Submit contact form
exports.submitContact = async (req, res) => {
  try {
    console.log('📥 Contact form received:', req.body);

    const { name, email, subject, message } = req.body;

    // Validation with detailed error messages
    if (!name) {
      console.log('❌ Missing name');
      return res.status(400).json({ error: 'Name is required' });
    }
    
    if (!email) {
      console.log('❌ Missing email');
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!subject) {
      console.log('❌ Missing subject');
      return res.status(400).json({ error: 'Subject is required' });
    }
    
    if (!message) {
      console.log('❌ Missing message');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Create contact message
    const contact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject,
      message: message.trim()
    });

    await contact.save();

    console.log('✅ Contact message saved:', contact._id);

    res.status(201).json({
      message: 'Thank you for contacting us! We will get back to you soon.',
      contactId: contact._id,
      success: true
    });
  } catch (error) {
    console.error('❌ Contact submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit contact form',
      message: error.message 
    });
  }
};

// Get all contact messages (Admin only)
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ submittedDate: -1 });
    
    res.json({
      totalContacts: contacts.length,
      unreadCount: contacts.filter(c => c.status === 'unread').length,
      contacts: contacts
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

// Get single contact message
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    // Mark as read if it was unread
    if (contact.status === 'unread') {
      contact.status = 'read';
      await contact.save();
    }

    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
};

// Update contact status
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const contact = await Contact.findById(id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    if (status) contact.status = status;
    if (adminNotes !== undefined) contact.adminNotes = adminNotes;

    await contact.save();

    res.json({
      message: 'Contact updated successfully',
      contact: contact
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

// Delete contact message
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    res.json({
      message: 'Contact message deleted successfully',
      deletedContact: contact
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};

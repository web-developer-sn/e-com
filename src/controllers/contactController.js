const contactService = require('../services/contactService');

class ContactController {
  async submitContactForm(req, res) {
    const requestInfo = {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    };

    const result = await contactService.submitContactForm(req.body, requestInfo);

    res.status(201).json({
      status: 'success',
      message: result.message,
      data: {
        id: result.id,
        email_sent: result.emailSent
      }
    });
  }

  // Admin endpoints
  async getContactSubmissions(req, res) {
    const result = await contactService.getContactSubmissions(req.query, {
      page: req.query.page,
      limit: req.query.limit
    });

    res.json({
      status: 'success',
      data: result.data,
      meta: result.meta
    });
  }

  async getContactSubmissionById(req, res) {
    const submission = await contactService.getContactSubmissionById(req.params.id);

    res.json({
      status: 'success',
      data: submission
    });
  }

  async updateContactSubmissionStatus(req, res) {
    const { status } = req.body;
    const submission = await contactService.updateContactSubmissionStatus(
      req.params.id,
      status,
      req.user.id
    );

    res.json({
      status: 'success',
      message: 'Contact submission status updated',
      data: submission
    });
  }

  async deleteContactSubmission(req, res) {
    const result = await contactService.deleteContactSubmission(req.params.id);

    res.json({
      status: 'success',
      message: result.message
    });
  }

  async getContactStats(req, res) {
    const stats = await contactService.getContactStats(req.query);

    res.json({
      status: 'success',
      data: stats
    });
  }
}

module.exports = new ContactController();

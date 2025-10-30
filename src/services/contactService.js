const { db } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const notificationService = require('./notificationService');
const logger = require('../config/logger');

class ContactService {
  async submitContactForm(contactData, requestInfo = {}) {
    const {
      name,
      email,
      subject,
      message,
      phone = null,
      company = null
    } = contactData;

    const { userAgent, ipAddress } = requestInfo;
    const trx = await db.transaction();
    try {

      const [contactId] = await trx('contact_submissions').insert({
        name,
        email,
        phone,
        company,
        subject,
        message,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'new'
      });

      await trx.commit();

      const emailResult = await notificationService.sendContactFormEmail({
        name,
        email,
        subject,
        message,
        phone,
        company,
        userAgent,
        ipAddress
      });

      logger.info('Contact form submitted', {
        contactId,
        name,
        email: this.maskEmail(email),
        subject,
        ipAddress,
        emailSent: emailResult.success
      });

      return {
        id: contactId,
        message: 'Contact form submitted successfully',
        emailSent: emailResult.success
      };
    } catch (error) {
      await trx.rollback();
      
      logger.error('Failed to process contact form', {
        error: error.message,
        name,
        email: this.maskEmail(email),
        subject
      });
      
      throw error;
    }
  }

  async getContactSubmissions(filters = {}, pagination = {}) {
    let query = db('contact_submissions')
      .select([
        'id',
        'name',
        'email',
        'phone',
        'company',
        'subject',
        'message',
        'status',
        'ip_address',
        'created_at',
        'updated_at'
      ])
      .orderBy('created_at', 'desc');

    const { status, from_date, to_date, search } = filters;

    if (status) {
      query = query.where('status', status);
    }

    if (from_date) {
      query = query.where('created_at', '>=', from_date);
    }

    if (to_date) {
      query = query.where('created_at', '<=', to_date);
    }

    if (search) {
      query = query.where(function() {
        this.where('name', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`)
          .orWhere('subject', 'like', `%${search}%`)
          .orWhere('message', 'like', `%${search}%`);
      });
    }

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const [{ total }] = await query.clone().count('* as total');

    const submissions = await query.limit(limit).offset(offset);

    return {
      data: submissions,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  async getContactSubmissionById(id) {
    const submission = await db('contact_submissions')
      .where('id', id)
      .first();

    if (!submission) {
      throw new AppError('Contact submission not found', 404);
    }

    return submission;
  }

  async updateContactSubmissionStatus(id, status, adminId = null) {
    const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
    
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const submission = await db('contact_submissions').where('id', id).first();
    if (!submission) {
      throw new AppError('Contact submission not found', 404);
    }

    await db('contact_submissions')
      .where('id', id)
      .update({
        status,
        updated_at: db.fn.now(),
        ...(adminId && { updated_by: adminId })
      });

    logger.info('Contact submission status updated', {
      id,
      oldStatus: submission.status,
      newStatus: status,
      adminId
    });

    return await this.getContactSubmissionById(id);
  }

  async deleteContactSubmission(id) {
    const submission = await db('contact_submissions').where('id', id).first();
    if (!submission) {
      throw new AppError('Contact submission not found', 404);
    }

    await db('contact_submissions').where('id', id).del();

    logger.info('Contact submission deleted', {
      id,
      email: this.maskEmail(submission.email)
    });

    return { message: 'Contact submission deleted successfully' };
  }

  async getContactStats(dateRange = {}) {
    const { from_date, to_date } = dateRange;
    
    let query = db('contact_submissions');
    
    if (from_date) {
      query = query.where('created_at', '>=', from_date);
    }
    
    if (to_date) {
      query = query.where('created_at', '<=', to_date);
    }

    const [totalSubmissions] = await query.clone().count('* as count');
    
    const statusCounts = await query.clone()
      .select('status')
      .count('* as count')
      .groupBy('status');

    const dailySubmissions = await query.clone()
      .select(db.raw('DATE(created_at) as date'))
      .count('* as count')
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'desc')
      .limit(30);

    return {
      total_submissions: totalSubmissions.count,
      status_breakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
      daily_submissions: dailySubmissions
    };
  }

  maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [username, domain] = email.split('@');
    return `${username.substring(0, 2)}***@${domain}`;
  }
}

module.exports = new ContactService();

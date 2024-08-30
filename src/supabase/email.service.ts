// src/services/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter;

  constructor() {
    try {
      this.transporter = nodemailer.createTransport({
        host: 'mail.sanearbrasil.com.br',
        port: parseInt('465', 10),
        secure: true, // true for 465, false for other ports
        auth: {
          user: 'log@sanearbrasil.com.br',
          pass: 'mNrZ-m2$R{S[',
        },
      });
      this.logger.log('Email transporter configured successfully.');
    } catch (error) {
      this.logger.error('Failed to configure email transporter.', error);
      throw new Error('Email transporter configuration failed.');
    }
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const mailOptions = {
      from: 'Sanear Brasil <log@sanearbrasil.com.br>',
      to,
      subject,
      text,
    };

    try {
      this.logger.log(`Sending email to ${to} with subject: ${subject}`);
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw new Error('Email sending failed.');
    }
  }

  getEmailTemplate(templateName: string): string {
    try {
      const templatePath = path.join(
        __dirname,
        '..',
        'templates',
        `${templateName}.txt`,
      );
      this.logger.log(`Reading email template from ${templatePath}`);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      this.logger.log(`Email template ${templateName} loaded successfully.`);
      return templateContent;
    } catch (error) {
      this.logger.error(
        `Failed to load email template: ${templateName}`,
        error,
      );
      throw new Error('Email template loading failed.');
    }
  }
}

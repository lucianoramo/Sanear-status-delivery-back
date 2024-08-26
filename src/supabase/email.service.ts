// src/services/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'mail.sanearbrasil.com',
      port: parseInt('465', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'log@sanearbrasil.com.br',
        pass: 'mNrZ-m2$R{S[',
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const mailOptions = {
      from: 'Sanear Brasil <no-reply@sanearbrasil.com>',
      to,
      subject,
      text,
    };

    await this.transporter.sendMail(mailOptions);
  }

  getEmailTemplate(templateName: string): string {
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      `${templateName}.txt`,
    );
    return fs.readFileSync(templatePath, 'utf-8');
  }
}

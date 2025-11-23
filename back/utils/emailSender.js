// utils/emailSender.js
// Acá configuro y manejo el envío de emails usando Nodemailer
// Se usa para enviar alertas de vencimiento a los administradores

import nodemailer from 'nodemailer';
import 'dotenv/config';

// Configuro el transportador SMTP con las credenciales de Hostinger
// Esto se ejecuta una sola vez al inicio del servidor
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true para puerto 465 (SSL)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Envío un email de notificación
 * @param {string} to - Email del destinatario (admin de la farmacia)
 * @param {string} subject - Asunto del correo
 * @param {string} htmlContent - Contenido HTML del mensaje
 * @returns {Promise<boolean>} true si se envió correctamente
 */
export const enviarEmailNotificacion = async (to, subject, htmlContent) => {
    // Opciones del correo
    const mailOptions = {
        from: process.env.EMAIL_USER, // Remitente
        to: to,                        // Destinatario
        subject: subject,              // Asunto
        html: htmlContent,             // Contenido HTML
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Notificación enviada a ${to}. ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('🚨 [EMAIL ERROR] Falló el envío:', error);
        throw new Error('Error al enviar la notificación por correo.');
    }
};
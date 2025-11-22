// utils/emailSender.js

import nodemailer from 'nodemailer';
import 'dotenv/config'; // Asegurar que las variables estén cargadas

// 1. Configuración del Transportador (Conexión al servidor SMTP)
// Esto debe ejecutarse una sola vez al inicio.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true para 465, false para otros puertos
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Función que envía el correo con la alerta de vencimiento.
 * @param {string} to - Destinatario (ej: correo del ADMIN).
 * @param {string} subject - Asunto del correo (ej: ALERTA URGENTE).
 * @param {string} htmlContent - Contenido HTML del mensaje.
 */
export const enviarEmailNotificacion = async (to, subject, htmlContent) => {
    
    // Opciones del correo
    const mailOptions = {
        from: process.env.EMAIL_USER, // Remitente
        to: to,                      // Destinatario (el correo del admin)
        subject: subject,            // Asunto
        html: htmlContent,           // Contenido
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Notificación enviada a ${to}. ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('🚨 [EMAIL ERROR] Falló el envío:', error);
        // Lanzamos un error para que el Servicio pueda capturarlo y manejarlo
        throw new Error('Error al enviar la notificación por correo.');
    }
};
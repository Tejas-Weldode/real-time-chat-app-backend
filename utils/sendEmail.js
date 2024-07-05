import nodemailer from "nodemailer";

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: process.env.MAIL_SERVICE,
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_EMAIL_PORT),
            secure: Boolean(process.env.MAIL_SECURE),
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: subject,
            text: text,
        });
        console.log("email sent successfully");
    } catch (error) {
        console.log("email not sent!");
        console.error(error);
        return error;
    }
};

export default sendEmail;

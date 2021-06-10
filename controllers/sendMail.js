const nodemailer = require("nodemailer");

const {google} = require("googleapis");

const dotenv = require("dotenv");

const {OAuth2} = google.auth;

const OAUTH_PLAYGROUND = "https://developers.google.com/oauthplayground";

dotenv.config();

const {
    MAILING_SERVICE_CLIENT_ID,
    MAILING_SERVICE_CLIENT_SECRET,
    MAILING_SERVICE_REFRESH_TOKEN,
    SENDER_EMAIL
} = process.env;

const oauth2Client = new OAuth2(
    MAILING_SERVICE_CLIENT_ID,
    MAILING_SERVICE_CLIENT_SECRET,
    MAILING_SERVICE_REFRESH_TOKEN,
    OAUTH_PLAYGROUND
);

const sendEmail = (to, url, txt) => {
    oauth2Client.setCredentials({
        refresh_token: MAILING_SERVICE_REFRESH_TOKEN
    });

    const accessToken = oauth2Client.getAccessToken();
    const smtpTransport = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: SENDER_EMAIL,
            clientId: MAILING_SERVICE_CLIENT_ID,
            clientSecret: MAILING_SERVICE_CLIENT_SECRET,
            refreshToken: MAILING_SERVICE_REFRESH_TOKEN,
            accessToken
        }
    });

    const mailOptions = {
        from: SENDER_EMAIL,
        to: to,
        subject: "Deviga Institute",
        html: `
       <div style = "maxWidth:700px; margin:auto; border:10px solid #ddd;padding:50px 20px;font-size:110%;">
       <h2 style = "text-align:center;text-transform:uppercase;color:teal;">
         Welcome to Deviga Institute
       </h2>
       <p>Congratulations.Click the button below to validate your email address</p>
       <a href = ${url} style = "background:crimson;text-decoration:none;color:#fff;padding:10px 20px;margin:10px 0;display:inline-block">
       ${txt}
       </a>

       <p>If the button did not redirect you click on the link below:</p>
       <div>${url}</div>

       </div>

     `,
    }

    smtpTransport.sendMail(mailOptions, (err, info) => {
        if (err) return err;

        return info;
    });
}

module.exports = sendEmail;

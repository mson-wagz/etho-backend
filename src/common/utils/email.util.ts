export function buildInquiryEmailBody(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  const { name, email, subject, message } = params;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Inquiry – ${subject}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #fffdf2;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(2, 1, 1, 0.10);
      border: 1px solid #dcd6bd;
    }
    .header {
      background-color: #020101;
      padding: 28px 32px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-accent {
      display: inline-block;
      width: 6px;
      height: 36px;
      background-color: #efcb18;
      border-radius: 3px;
      vertical-align: middle;
      margin-right: 14px;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 0.02em;
      display: inline;
      vertical-align: middle;
    }
    .header h1 span {
      color: #efcb18;
    }
    .body {
      padding: 32px;
      background-color: #ffffff;
    }
    .field {
      margin-bottom: 22px;
    }
    .field-label {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      color: #c89f00;
      letter-spacing: 0.1em;
      margin-bottom: 5px;
    }
    .field-value {
      font-size: 15px;
      color: #020101;
      word-break: break-word;
    }
    .divider {
      border: none;
      border-top: 1px solid #dcd6bd;
      margin: 24px 0;
    }
    .message-box {
      background-color: #f8f4e3;
      border-left: 4px solid #efcb18;
      padding: 16px 18px;
      border-radius: 0 6px 6px 0;
      white-space: pre-wrap;
      font-size: 15px;
      line-height: 1.7;
      color: #020101;
    }
    .footer {
      background-color: #020101;
      padding: 16px 32px;
      text-align: center;
      font-size: 12px;
      color: #c89f00;
      letter-spacing: 0.04em;
    }
    .footer a {
      color: #efcb18;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="header-accent"></span>
      <h1>New Inquiry — <span>Etho</span></h1>
    </div>
    <div class="body">
      <div class="field">
        <div class="field-label">From</div>
        <div class="field-value">${name} &lt;${email}&gt;</div>
      </div>
      <div class="field">
        <div class="field-label">Subject</div>
        <div class="field-value">${subject}</div>
      </div>
      <hr class="divider" />
      <div class="field">
        <div class="field-label">Message</div>
        <div class="message-box">${message}</div>
      </div>
    </div>
    <div class="footer">
      Sent via the contact form at <a href="https://etho.com">etho.com</a>
    </div>
  </div>
</body>
</html>
  `.trim();
}

import type { INewAssignmentTemplate } from "@/types/assignment";

export function NewAssignmentTemplate({
  username,
  type,
  title,
  description,
  reward,
  formattedDeadline,
  url,
}: INewAssignmentTemplate) {
  return `
    <!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Assignment Template</title>
    <style>
      /* Reset styles for email clients */
      body,
      table,
      td,
      div,
      p,
      a {
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
          Arial, sans-serif;
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table {
        border-collapse: collapse;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        border: 0;
        line-height: 100%;
        outline: none;
        text-decoration: none;
        -ms-interpolation-mode: bicubic;
      }

      /* Custom Styles */
      body {
        background-color: #f4f4f5;
        color: #3f3f46;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      .header {
        background-color: #5ea500;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        color: #ffffff;
        font-size: 24px;
        margin: 0;
        font-weight: 600;
      }
      .content {
        padding: 30px;
      }
      .greeting {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 20px;
        color: #18181b;
      }
      .task-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 20px;
        margin-bottom: 25px;
      }
      .task-title {
        font-size: 20px;
        color: #0f172a;
        margin-bottom: 10px;
        font-weight: 700;
      }
      .badge {
        display: inline-block;
        background-color: rgba(94, 165, 0, 0.15);
        color: #5ea500;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 15px;
      }
      .task-desc {
        font-size: 15px;
        line-height: 1.6;
        color: #475569;
        padding-bottom: 20px;
        border-bottom: 1px solid #e2e8f0;
      }
      .details-table {
        width: 100%;
        margin-top: 15px;
      }
      .details-row {
        padding-bottom: 10px;
      }
      .details-label {
        font-weight: 600;
        color: #64748b;
        font-size: 14px;
        width: 80px;
        vertical-align: top;
        padding-bottom: 8px;
      }
      .details-value {
        font-size: 14px;
        color: #0f172a;
        font-weight: 500;
        padding-bottom: 8px;
      }
      .reward-highlight {
        color: #5ea500;
        font-weight: 700;
      }
      .deadline-highlight {
        color: #ea580c;
      }
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .button {
        background-color: #5ea500;
        color: #ffffff;
        text-decoration: none;
        padding: 14px 28px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 16px;
        display: inline-block;
      }
      .footer {
        text-align: center;
        padding: 20px;
        font-size: 12px;
        color: #94a3b8;
        background-color: #f8fafc;
        border-top: 1px solid #f1f5f9;
      }
    </style>
  </head>
  <body style="margin: 0; padding: 20px; background-color: #f4f4f5">
    <table
      role="presentation"
      width="100%"
      border="0"
      cellspacing="0"
      cellpadding="0"
    >
      <tr>
        <td align="center">
          <!-- Main Container -->
          <table
            role="presentation"
            class="container"
            border="0"
            cellspacing="0"
            cellpadding="0"
          >
            <!-- Header -->
            <tr>
              <td class="header">
                <h1>New Assignment Available</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td class="content">
                <p class="greeting">${username},</p>
                <p style="margin-bottom: 20px; line-height: 1.5">
                  You have been assigned a new task. Please review the details
                  below and ensure completion before the deadline.
                </p>

                <!-- Task Details Card -->
                <div class="task-card">
                  <span class="badge">${type}</span>
                  <h2 class="task-title">${title}</h2>
                  <p class="task-desc">
                    ${description}
                  </p>

                  <table
                    role="presentation"
                    class="details-table"
                    border="0"
                    cellspacing="0"
                    cellpadding="0"
                  >
                    <tr>
                      <td class="details-label">Reward:</td>
                      <td class="details-value">
                        <span class="reward-highlight">🏆 ${reward} points</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="details-label">Deadline:</td>
                      <td class="details-value">
                        <span class="deadline-highlight"
                          >📅 ${formattedDeadline}</span
                        >
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Call to Action -->
                <div class="button-container">
                  <a href="${url}" class="button" style="color: #ffffff"
                    >View your own Assignment</a
                  >
                </div>

                <p
                  style="
                    font-size: 14px;
                    line-height: 1.5;
                    color: #64748b;
                    margin-top: 20px;
                  "
                >
                  If you have any questions or encounter blockers, please reach
                  out to your project manager.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="footer">
                <p style="margin: 0; margin-bottom: 8px">
                  This is an automated message from the COM7 Assignment System.
                </p>
                <p style="margin: 0">
                  &copy; 2026 COM7 Assignment System. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

const paymentSuccessTemplate = ({ customerName, amount, paymentId }) => {
  return {
    subject: "Payment Successful - PayRecover AI",

    text: `Hello ${customerName || "Customer"},

Your payment of ₹${amount} has been successfully completed.

Payment ID: ${paymentId}

Thank you for using PayRecover AI.

Regards,
PayRecover AI Team`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Payment Successful</h2>

        <p>Hello ${customerName || "Customer"},</p>

        <p>
          Your payment of <strong>₹${amount}</strong>
          has been successfully completed.
        </p>

        <p>
          <strong>Payment ID:</strong> ${paymentId}
        </p>

        <p>Thank you for using PayRecover AI.</p>

        <p>
          Regards,<br>
          <strong>PayRecover AI Team</strong>
        </p>
      </div>
    `,
  };
};


const paymentFailedTemplate = ({
  customerName,
  amount,
  failureReason,
}) => {
  return {
    subject: "Payment Failed - PayRecover AI",

    text: `Hello ${customerName || "Customer"},

Unfortunately, your payment of ₹${amount} could not be completed.

Reason: ${failureReason || "Payment failed"}

Please try the payment again.

Regards,
PayRecover AI Team`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Payment Failed</h2>

        <p>Hello ${customerName || "Customer"},</p>

        <p>
          Unfortunately, your payment of
          <strong>₹${amount}</strong>
          could not be completed.
        </p>

        <p>
          <strong>Reason:</strong>
          ${failureReason || "Payment failed"}
        </p>

        <p>
          Please try the payment again.
        </p>

        <p>
          Regards,<br>
          <strong>PayRecover AI Team</strong>
        </p>
      </div>
    `,
  };
};


const paymentPendingTemplate = ({
  customerName,
  amount,
  paymentId,
}) => {
  return {
    subject: "Payment Pending - PayRecover AI",

    text: `Hello ${customerName || "Customer"},

Your payment of ₹${amount} is currently being processed.

Payment ID: ${paymentId}

We will update you once the payment status is confirmed.

Regards,
PayRecover AI Team`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Payment Pending</h2>

        <p>Hello ${customerName || "Customer"},</p>

        <p>
          Your payment of <strong>₹${amount}</strong>
          is currently being processed.
        </p>

        <p>
          <strong>Payment ID:</strong> ${paymentId}
        </p>

        <p>
          We will update you once the payment status is confirmed.
        </p>

        <p>
          Regards,<br>
          <strong>PayRecover AI Team</strong>
        </p>
      </div>
    `,
  };
};


const paymentRecoveryTemplate = ({
  customerName,
  amount,
  recoveryMessage,
}) => {
  return {
    subject: "Complete Your Payment - PayRecover AI",

    text: `Hello ${customerName || "Customer"},

Your recent payment of ₹${amount} was not completed.

${recoveryMessage}

Please try completing your payment again.

Regards,
PayRecover AI Team`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Complete Your Payment</h2>

        <p>Hello ${customerName || "Customer"},</p>

        <p>
          Your recent payment of
          <strong>₹${amount}</strong>
          was not completed.
        </p>

        <p>
          ${recoveryMessage}
        </p>

        <p>
          Please try completing your payment again.
        </p>

        <p>
          Regards,<br>
          <strong>PayRecover AI Team</strong>
        </p>
      </div>
    `,
  };
};


module.exports = {
  paymentSuccessTemplate,
  paymentFailedTemplate,
  paymentPendingTemplate,
  paymentRecoveryTemplate,
};
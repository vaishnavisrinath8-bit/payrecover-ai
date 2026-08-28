const express = require("express");
const router = express.Router();
const { handleRazorpayWebhook } = require("../controllers/webhookController");

// Razorpay signature verification needs the raw, unparsed body —
// this express.raw() middleware is scoped to ONLY this route.
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook
);

module.exports = router;
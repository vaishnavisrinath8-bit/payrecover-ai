
const RecoveryRule = require("../models/RecoveryRule");
const Recovery = require("../models/Recovery");

// ============================================================
// PAYRECOVER AI - RECOVERY RULE SERVICE
// ============================================================


// ============================================================
// DEFAULT RULES
// ============================================================

const DEFAULT_RULES = {
  maxPaymentRetries: 3,

  maxReminders: 3,

  reminderIntervalHours: 24,

  recoveryWindowDays: 7,

  autoStopOnRecovery: true,

  autoStopOnRetryExhaustion: true,

  autoStopOnWindowExpiry: true,

  escalationEnabled: true,

  minimumRecoveryProbability: 20,

  minimumAIScore: 30,

  preventDuplicateActions: true,

  minimumContactIntervalHours: 24,

  contactCustomersAutomatically: true,

  allowEscalationToHuman: true,

  updatedBy: "system",

  active: true,
};


// ============================================================
// GET ACTIVE RULES
// ============================================================

const getActiveRules = async () => {

  let rules =
    await RecoveryRule.findOne({
      active: true,
    }).sort({
      updatedAt: -1,
    });


  // ----------------------------------------------------------
  // Create default rules automatically
  // ----------------------------------------------------------

  if (!rules) {

    rules =
      await RecoveryRule.create(
        DEFAULT_RULES
      );
  }


  return rules;
};


// ============================================================
// UPDATE RULES
// ============================================================

const updateRecoveryRules = async (
  updates = {},
  updatedBy = "admin"
) => {

  let rules =
    await getActiveRules();


  const allowedFields = [
    "maxPaymentRetries",
    "maxReminders",
    "reminderIntervalHours",
    "recoveryWindowDays",
    "autoStopOnRecovery",
    "autoStopOnRetryExhaustion",
    "autoStopOnWindowExpiry",
    "escalationEnabled",
    "minimumRecoveryProbability",
    "minimumAIScore",
    "preventDuplicateActions",
    "minimumContactIntervalHours",
    "contactCustomersAutomatically",
    "allowEscalationToHuman",
  ];


  allowedFields.forEach(
    (field) => {

      if (
        updates[field] !==
        undefined
      ) {

        rules[field] =
          updates[field];
      }
    }
  );


  rules.updatedBy =
    updatedBy || "admin";


  await rules.save();


  return rules;
};


// ============================================================
// AUDIT EVENT HELPER
// ============================================================

const createRuleAuditEvent = ({
  action,
  reason,
  status = "stopped",
  metadata = {},
}) => {

  return {
    timestamp: new Date(),

    action,

    status,

    reason,

    metadata: {
      ...metadata,

      actor:
        metadata.actor ||
        "system",
    },
  };
};


// ============================================================
// ADD AUDIT EVENT
// ============================================================

const addAuditEvent = async (
  recovery,
  event
) => {

  recovery.metadata =
    recovery.metadata || {};


  recovery.metadata.auditTrail =
    recovery.metadata.auditTrail ||
    [];


  recovery.metadata.auditTrail.push(
    event
  );


  await recovery.save();
};


// ============================================================
// CHECK RECOVERY RULES
// ============================================================

const checkRecoveryRules = async (
  recoveryId
) => {

  const recovery =
    await Recovery.findById(
      recoveryId
    );


  if (!recovery) {

    throw new Error(
      "Recovery record not found"
    );
  }


  const rules =
    await getActiveRules();


  const now =
    new Date();


  const violations = [];

  let action =
    "continue";


  let stoppingReason =
    null;


  let escalationRequired =
    false;


  // ----------------------------------------------------------
  // RULE 1 - Already recovered
  // ----------------------------------------------------------

  if (
    recovery.status ===
    "recovered"
  ) {

    violations.push(
      "Recovery already completed"
    );

    action =
      "stop";

    stoppingReason =
      "recovered";
  }


  // ----------------------------------------------------------
  // RULE 2 - Customer contact disabled
  // ----------------------------------------------------------

  if (
    recovery.contactAllowed ===
    false
  ) {

    violations.push(
      "Customer contact is not allowed"
    );

    action =
      "stop";

    stoppingReason =
      "compliance_limit";
  }


  // ----------------------------------------------------------
  // RULE 3 - Maximum attempts
  // ----------------------------------------------------------

  const maximumAttempts =
    Math.min(
      Number(
        recovery.maxAttempts ||
        rules.maxPaymentRetries
      ),

      Number(
        rules.maxPaymentRetries
      )
    );


  if (
    recovery.attemptCount >=
    maximumAttempts
  ) {

    violations.push(
      "Maximum recovery attempts reached"
    );

    if (
      rules.autoStopOnRetryExhaustion
    ) {

      action =
        "stop";

      stoppingReason =
        "maximum_attempts";
    }
  }


  // ----------------------------------------------------------
  // RULE 4 - Recovery window
  // ----------------------------------------------------------

  const createdAt =
    new Date(
      recovery.createdAt
    );


  const recoveryWindowEnd =
    new Date(
      createdAt.getTime() +
      Number(
        rules.recoveryWindowDays
      ) *
        24 *
        60 *
        60 *
        1000
    );


  if (
    now >
    recoveryWindowEnd
  ) {

    violations.push(
      "Recovery window has expired"
    );

    if (
      rules.autoStopOnWindowExpiry
    ) {

      action =
        "stop";

      stoppingReason =
        "expired";
    }
  }


  // ----------------------------------------------------------
  // RULE 5 - Low AI confidence
  // ----------------------------------------------------------

  if (
    Number(
      recovery.recoveryProbability ||
      0
    ) <
    Number(
      rules.minimumRecoveryProbability
    )
  ) {

    violations.push(
      "Recovery probability is below the allowed threshold"
    );

    if (
      rules.escalationEnabled
    ) {

      action =
        "escalate";

      escalationRequired =
        true;

      stoppingReason =
        "low_recovery_probability";
    }
  }


  // ----------------------------------------------------------
  // RULE 6 - Low AI score
  // ----------------------------------------------------------

  if (
    Number(
      recovery.aiScore ||
      0
    ) <
    Number(
      rules.minimumAIScore
    )
  ) {

    violations.push(
      "AI confidence score is below the allowed threshold"
    );

    if (
      rules.escalationEnabled
    ) {

      action =
        "escalate";

      escalationRequired =
        true;
    }
  }


  // ----------------------------------------------------------
  // RULE 7 - Minimum contact interval
  // ----------------------------------------------------------

  if (
    rules.preventDuplicateActions &&
    recovery.lastActionAt
  ) {

    const minimumInterval =
      Number(
        rules.minimumContactIntervalHours
      ) *
      60 *
      60 *
      1000;


    const nextAllowedContact =
      new Date(
        new Date(
          recovery.lastActionAt
        ).getTime() +
        minimumInterval
      );


    if (
      now <
      nextAllowedContact
    ) {

      violations.push(
        "Minimum contact interval has not elapsed"
      );


      if (
        !recovery.nextActionAt ||
        new Date(
          recovery.nextActionAt
        ) <
          nextAllowedContact
      ) {

        recovery.nextActionAt =
          nextAllowedContact;
      }


      if (
        action ===
        "continue"
      ) {

        action =
          "wait";
      }
    }
  }


  // ----------------------------------------------------------
  // RULE 8 - Automatic customer contact
  // ----------------------------------------------------------

  if (
    !rules.contactCustomersAutomatically
  ) {

    violations.push(
      "Automatic customer contact is disabled"
    );


    if (
      action ===
      "continue"
    ) {

      action =
        "escalate";

      escalationRequired =
        true;
    }
  }


  // ----------------------------------------------------------
  // APPLY STOP
  // ----------------------------------------------------------

  if (
    action ===
    "stop"
  ) {

    recovery.status =
      "stopped";

    recovery.stoppingReason =
      stoppingReason ||
      "compliance_limit";

    recovery.nextActionAt =
      null;

    recovery.lastActionAt =
      now;


    await addAuditEvent(
      recovery,

      createRuleAuditEvent({
        action:
          "recovery_stopped",

        reason:
          stoppingReason ||
          "Recovery stopping rule triggered",

        status:
          "stopped",

        metadata: {
          violations,
          actor: "system",
        },
      })
    );
  }


  // ----------------------------------------------------------
  // APPLY ESCALATION
  // ----------------------------------------------------------

  if (
    action ===
    "escalate"
  ) {

    recovery.escalationLevel =
      Math.min(
        Number(
          recovery.escalationLevel ||
          0
        ) + 1,

        5
      );


    recovery.status =
      "in_progress";


    if (
      rules.allowEscalationToHuman
    ) {

      await addAuditEvent(
        recovery,

        createRuleAuditEvent({
          action:
            "recovery_escalated",

          reason:
            "Recovery requires human review",

          status:
            "escalated",

          metadata: {
            violations,

            escalationLevel:
              recovery.escalationLevel,

            actor:
              "system",
          },
        })
      );
    }
  }


  // ----------------------------------------------------------
  // SAVE WAITING STATE
  // ----------------------------------------------------------

  if (
    action ===
    "wait"
  ) {

    await recovery.save();
  }


  return {

    allowed:
      action ===
      "continue",

    action,

    stoppingReason,

    escalationRequired,

    violations,

    recoveryWindowEnd,

    rules: {
      maxPaymentRetries:
        rules.maxPaymentRetries,

      maxReminders:
        rules.maxReminders,

      reminderIntervalHours:
        rules.reminderIntervalHours,

      recoveryWindowDays:
        rules.recoveryWindowDays,

      minimumRecoveryProbability:
        rules.minimumRecoveryProbability,

      minimumAIScore:
        rules.minimumAIScore,

      escalationEnabled:
        rules.escalationEnabled,

      preventDuplicateActions:
        rules.preventDuplicateActions,
    },

    recovery,
  };
};


// ============================================================
// MANUAL STOP
// ============================================================

const stopRecovery = async (
  recoveryId,
  reason = "manual_stop",
  actor = "admin"
) => {

  const recovery =
    await Recovery.findById(
      recoveryId
    );


  if (!recovery) {

    throw new Error(
      "Recovery record not found"
    );
  }


  if (
    recovery.status ===
    "recovered"
  ) {

    throw new Error(
      "Recovered recovery cannot be stopped"
    );
  }


  recovery.status =
    "stopped";


  recovery.stoppingReason =
    reason;


  recovery.nextActionAt =
    null;


  recovery.lastActionAt =
    new Date();


  await addAuditEvent(
    recovery,

    createRuleAuditEvent({
      action:
        "manual_recovery_stop",

      reason,

      status:
        "stopped",

      metadata: {
        actor,
      },
    })
  );


  return recovery;
};


// ============================================================
// ESCALATE RECOVERY
// ============================================================

const escalateRecovery = async (
  recoveryId,
  reason = "manual_escalation",
  actor = "admin"
) => {

  const recovery =
    await Recovery.findById(
      recoveryId
    );


  if (!recovery) {

    throw new Error(
      "Recovery record not found"
    );
  }


  if (
    recovery.status ===
    "recovered"
  ) {

    throw new Error(
      "Recovered recovery cannot be escalated"
    );
  }


  recovery.escalationLevel =
    Math.min(
      Number(
        recovery.escalationLevel ||
        0
      ) + 1,

      5
    );


  recovery.status =
    "in_progress";


  await addAuditEvent(
    recovery,

    createRuleAuditEvent({
      action:
        "manual_recovery_escalation",

      reason,

      status:
        "escalated",

      metadata: {
        actor,

        escalationLevel:
          recovery.escalationLevel,
      },
    })
  );


  return recovery;
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  getActiveRules,

  updateRecoveryRules,

  checkRecoveryRules,

  stopRecovery,

  escalateRecovery,
};


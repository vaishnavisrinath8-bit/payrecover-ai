import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  FileCheck2,
  Gauge,
  Mail,
  MessageSquare,
  PauseCircle,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  StopCircle,
  Target,
  User,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import {
  getAllRecoveries,
  getRecoveryAnalytics,
  sendRecovery,
  markRecoveryRecovered,
  markRecoveryUnrecoverable,
} from "../services/api";

import "./Recoveries.css";

/* =========================================================
   FORMATTERS
========================================================= */

const formatCurrency = (value, currency = "INR") => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeStatus = (status) =>
  String(status || "pending")
    .toLowerCase()
    .replace(/\s+/g, "_");

const capitalize = (value) => {
  if (!value) return "—";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/* =========================================================
   RESPONSE HELPERS
========================================================= */

const extractRecoveries = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.recoveries)) {
    return response.recoveries;
  }

  if (Array.isArray(response?.data?.recoveries)) {
    return response.data.recoveries;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
};

const extractAnalytics = (response) => {
  if (!response) return {};

  if (response?.data && !Array.isArray(response.data)) {
    return response.data;
  }

  return response;
};

/* =========================================================
   SETTINGS
========================================================= */

const getLocalSettings = () => {
  const defaults = {
    automationEnabled: true,
    autoCreateRecovery: true,
    autoSendRecovery: false,
    aiRecommendations: true,

    maxAttempts: 3,
    retryWindow: "24 hours",
    recoveryExpiry: "7 days",
    preferredChannel: "email",

    messageLanguage: "English",
    emailEnabled: true,
    recoveryAlerts: true,

    criticalAlerts: true,
    dailySummary: true,

    complianceEnabled: true,
    respectContactRules: true,
    stopAfterLimit: true,
    requireApproval: false,
  };

  try {
    const saved = localStorage.getItem("payrecover_settings");

    if (!saved) return defaults;

    return {
      ...defaults,
      ...JSON.parse(saved),
    };
  } catch {
    return defaults;
  }
};

/* =========================================================
   PAYMENT / RECOVERY FIELD HELPERS
========================================================= */

const getPayment = (recovery) => {
  return recovery?.paymentId &&
    typeof recovery.paymentId === "object"
    ? recovery.paymentId
    : recovery?.payment || {};
};

const getCustomerName = (recovery) => {
  const payment = getPayment(recovery);

  return (
    recovery?.customerName ||
    payment?.customerName ||
    "Customer"
  );
};

const getCustomerEmail = (recovery) => {
  const payment = getPayment(recovery);

  return (
    recovery?.customerEmail ||
    payment?.customerEmail ||
    "—"
  );
};

const getAmount = (recovery) => {
  const payment = getPayment(recovery);

  return Number(
    recovery?.amount ??
      payment?.amount ??
      0
  );
};

const getCurrency = (recovery) => {
  const payment = getPayment(recovery);

  return (
    recovery?.currency ||
    payment?.currency ||
    "INR"
  );
};

const getFailureReason = (recovery) => {
  const payment = getPayment(recovery);

  return (
    recovery?.failureReason ||
    payment?.failureReason ||
    recovery?.reason ||
    "Payment failure"
  );
};

const getPaymentMethod = (recovery) => {
  const payment = getPayment(recovery);

  return (
    recovery?.paymentMethod ||
    payment?.paymentMethod ||
    "Unknown"
  );
};

const getPriority = (recovery) => {
  return (
    recovery?.priority ||
    recovery?.recoveryPriority ||
    "MEDIUM"
  ).toUpperCase();
};

const getProbability = (recovery) => {
  const value =
    recovery?.recoveryProbability ??
    recovery?.ai?.recoveryProbability ??
    recovery?.aiScore ??
    0;

  const numeric = Number(value);

  if (numeric <= 1) {
    return Math.round(numeric * 100);
  }

  return Math.round(Math.min(100, numeric));
};

const getAttempts = (recovery) => {
  return Number(
    recovery?.attemptCount ??
      recovery?.attempts ??
      0
  );
};

const getMaxAttempts = (recovery, settings) => {
  return Number(
    recovery?.maxAttempts ??
      settings.maxAttempts ??
      3
  );
};

/* =========================================================
   AI MESSAGE ENGINE
========================================================= */

const generateAIMessage = (
  recovery,
  channel,
  language
) => {
  const name = getCustomerName(recovery);
  const amount = formatCurrency(
    getAmount(recovery),
    getCurrency(recovery)
  );

  const reason = getFailureReason(recovery);

  const action =
    recovery?.recommendedAction ||
    recovery?.ai?.recommendedAction ||
    "retry the payment";

  const safeAction =
    String(action).toLowerCase();

  const isRetry =
    safeAction.includes("retry") ||
    safeAction.includes("payment");

  if (language === "Hindi") {
    if (channel === "SMS") {
      return `नमस्ते ${name}, आपका ${amount} का भुगतान पूरा नहीं हो पाया क्योंकि ${reason.toLowerCase()}। कृपया अपना भुगतान दोबारा प्रयास करें।`;
    }

    return `नमस्ते ${name},

आपका ${amount} का भुगतान पूरा नहीं हो पाया क्योंकि ${reason.toLowerCase()}।

हमारा सुझाव है कि आप ${isRetry ? "भुगतान दोबारा प्रयास करें" : "अपना भुगतान विवरण जांचें और फिर प्रयास करें"}।

यदि आपको किसी सहायता की आवश्यकता है, तो हमारी टीम आपकी मदद के लिए उपलब्ध है।

धन्यवाद,
PayRecover AI`;
  }

  if (language === "Hinglish") {
    if (channel === "SMS") {
      return `Hi ${name}, aapka ${amount} payment complete nahi ho paya because ${reason.toLowerCase()}. Please payment ek baar phir try karein.`;
    }

    return `Hi ${name},

Aapka ${amount} payment complete nahi ho paya because ${reason.toLowerCase()}.

AI recovery engine ke according, ${isRetry ? "payment ko dobara retry karna" : "payment details check karke dobara try karna"} best next step hai.

Agar aapko help chahiye, hum assist karne ke liye available hain.

Thanks,
PayRecover AI`;
  }

  if (channel === "SMS") {
    return `Hi ${name}, your ${amount} payment could not be completed due to ${reason.toLowerCase()}. Please try the payment again. PayRecover AI`;
  }

  if (channel === "Payment Retry") {
    return `Hi ${name},

Your payment of ${amount} could not be completed due to ${reason.toLowerCase()}.

Please try the payment again using your preferred payment method.

PayRecover AI`;
  }

  return `Hi ${name},

We noticed that your payment of ${amount} could not be completed due to ${reason.toLowerCase()}.

Our AI recovery engine recommends that you ${isRetry ? "retry the payment" : "review your payment details and try again"}.

You can safely try the payment again at your convenience.

If you need any assistance, our team is here to help.

Regards,
PayRecover AI`;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Recoveries() {
  const [recoveries, setRecoveries] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [settings, setSettings] = useState(
    getLocalSettings()
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [priorityFilter, setPriorityFilter] =
    useState("all");

  const [selectedRecovery, setSelectedRecovery] =
    useState(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [channel, setChannel] =
    useState("Email");

  const [language, setLanguage] =
    useState("English");

  const [actionLoading, setActionLoading] =
    useState(false);

  /* =======================================================
     AGENT STATE
  ======================================================= */

  const [agentRunning, setAgentRunning] =
    useState(false);

  const [agentPaused, setAgentPaused] =
    useState(false);

  const [agentStage, setAgentStage] =
    useState("idle");

  const [agentProcessed, setAgentProcessed] =
    useState(0);

  const [agentResult, setAgentResult] =
    useState(null);

  const [agentLog, setAgentLog] =
    useState([]);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [recoveryResponse, analyticsResponse] =
        await Promise.all([
          getAllRecoveries(),
          getRecoveryAnalytics(),
        ]);

      const recoveryData =
        extractRecoveries(recoveryResponse);

      const analyticsData =
        extractAnalytics(analyticsResponse);

      setRecoveries(recoveryData);
      setAnalytics(analyticsData);

      console.log(
        "PayRecover recovery response:",
        recoveryResponse
      );

      console.log(
        "PayRecover recovery records:",
        recoveryData
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load recovery data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setSettings(getLocalSettings());
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  /* =======================================================
     FILTERING
  ======================================================= */

  const filteredRecoveries = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

    return recoveries.filter((recovery) => {
      const name =
        getCustomerName(recovery).toLowerCase();

      const email =
        getCustomerEmail(recovery).toLowerCase();

      const reason =
        getFailureReason(recovery).toLowerCase();

      const status =
        normalizeStatus(recovery?.status);

      const priority =
        getPriority(recovery).toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        email.includes(query) ||
        reason.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    recoveries,
    searchTerm,
    statusFilter,
    priorityFilter,
  ]);

  /* =======================================================
     METRICS
  ======================================================= */

  const metrics = useMemo(() => {
    const active =
      analytics?.activeCount ??
      recoveries.filter((item) => {
        const status = normalizeStatus(
          item?.status
        );

        return ![
          "recovered",
          "unrecoverable",
          "closed",
        ].includes(status);
      }).length;

    const atRisk =
      analytics?.totalAtRisk ??
      recoveries.reduce(
        (total, item) =>
          total + getAmount(item),
        0
      );

    const recovered =
      analytics?.recoveredAmount ??
      recoveries
        .filter(
          (item) =>
            normalizeStatus(item?.status) ===
            "recovered"
        )
        .reduce(
          (total, item) =>
            total +
            Number(
              item?.recoveredAmount ??
                getAmount(item)
            ),
          0
        );

    const recoveryRate =
      analytics?.recoveryRate ??
      (atRisk > 0
        ? (recovered / atRisk) * 100
        : 0);

    return {
      atRisk,
      recovered,
      active,
      recoveryRate:
        Number(recoveryRate).toFixed(2),
    };
  }, [analytics, recoveries]);

  /* =======================================================
     OPEN RECOVERY
  ======================================================= */

  const openRecovery = (recovery) => {
    setSelectedRecovery(recovery);

    const preferredChannel =
      recovery?.recoveryChannel === "sms"
        ? "SMS"
        : recovery?.recoveryChannel ===
          "payment_retry"
        ? "Payment Retry"
        : "Email";

    const preferredLanguage =
      recovery?.messageLanguage ||
      settings.messageLanguage ||
      "English";

    setChannel(preferredChannel);
    setLanguage(preferredLanguage);

    const generated =
      generateAIMessage(
        recovery,
        preferredChannel,
        preferredLanguage
      );

    setMessage(
      recovery?.generatedMessage ||
        recovery?.recoveryMessage ||
        generated
    );

    setModalOpen(true);
  };

  const closeRecovery = () => {
    if (actionLoading) return;

    setModalOpen(false);
    setSelectedRecovery(null);
    setMessage("");
  };

  /* =======================================================
     AI MESSAGE CENTER
  ======================================================= */

  const regenerateMessage = () => {
    if (!selectedRecovery) return;

    const generated =
      generateAIMessage(
        selectedRecovery,
        channel,
        language
      );

    setMessage(generated);
  };

  const handleChannelChange = (value) => {
    setChannel(value);

    if (selectedRecovery) {
      setMessage(
        generateAIMessage(
          selectedRecovery,
          value,
          language
        )
      );
    }
  };

  const handleLanguageChange = (value) => {
    setLanguage(value);

    if (selectedRecovery) {
      setMessage(
        generateAIMessage(
          selectedRecovery,
          channel,
          value
        )
      );
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(
        message
      );
    } catch {
      console.warn(
        "Clipboard access unavailable."
      );
    }
  };

  /* =======================================================
     COMPLIANCE
  ======================================================= */

  const compliance = useMemo(() => {
    if (!selectedRecovery) {
      return {
        allowed: false,
        reason: "No recovery selected.",
        checks: [],
      };
    }

    const status =
      normalizeStatus(
        selectedRecovery?.status
      );

    const attempts =
      getAttempts(selectedRecovery);

    const maxAttempts =
      getMaxAttempts(
        selectedRecovery,
        settings
      );

    const contactAllowed =
      selectedRecovery?.contactAllowed !== false;

    const terminal =
      [
        "recovered",
        "unrecoverable",
        "closed",
      ].includes(status);

    const attemptLimit =
      attempts >= maxAttempts;

    const requireApproval =
      settings.requireApproval === true;

    const complianceEnabled =
      settings.complianceEnabled !== false;

    const respectContactRules =
      settings.respectContactRules !== false;

    let allowed = true;
    let reason =
      "Recovery action is permitted.";

    if (terminal) {
      allowed = false;
      reason =
        "Recovery is already in a terminal state.";
    }

    if (
      allowed &&
      settings.stopAfterLimit &&
      attemptLimit
    ) {
      allowed = false;
      reason =
        "Maximum recovery attempts reached.";
    }

    if (
      allowed &&
      respectContactRules &&
      !contactAllowed
    ) {
      allowed = false;
      reason =
        "Customer contact is restricted.";
    }

    if (
      allowed &&
      requireApproval
    ) {
      allowed = false;
      reason =
        "Manual approval is required by Settings.";
    }

    return {
      allowed,
      reason,
      checks: [
        {
          label: "Compliance policy",
          passed: complianceEnabled,
        },
        {
          label: "Contact permission",
          passed:
            !respectContactRules ||
            contactAllowed,
        },
        {
          label: "Attempt capacity",
          passed:
            !settings.stopAfterLimit ||
            !attemptLimit,
        },
        {
          label: "Terminal status",
          passed: !terminal,
        },
        {
          label: "Approval policy",
          passed: !requireApproval,
        },
      ],
    };
  }, [
    selectedRecovery,
    settings,
  ]);

  /* =======================================================
     AI SIGNALS
  ======================================================= */

  const getSignals = (recovery) => {
    const probability =
      getProbability(recovery);

    const amount =
      getAmount(recovery);

    const priority =
      getPriority(recovery);

    const attempts =
      getAttempts(recovery);

    const maxAttempts =
      getMaxAttempts(
        recovery,
        settings
      );

    const severity =
      priority === "HIGH"
        ? 92
        : priority === "MEDIUM"
        ? 65
        : 35;

    const recoveryLikelihood =
      probability;

    const revenueImpact =
      Math.min(
        100,
        Math.round(
          (amount / 20000) * 100
        )
      );

    const attemptCapacity =
      Math.max(
        0,
        Math.round(
          ((maxAttempts - attempts) /
            maxAttempts) *
            100
        )
      );

    return [
      {
        label: "Failure severity",
        value: severity,
      },
      {
        label: "Recovery likelihood",
        value: recoveryLikelihood,
      },
      {
        label: "Revenue impact",
        value: revenueImpact,
      },
      {
        label: "Attempt capacity",
        value: attemptCapacity,
      },
    ];
  };

  /* =======================================================
     WORKFLOW
  ======================================================= */

  const getWorkflow = (recovery) => {
    const status =
      normalizeStatus(
        recovery?.status
      );

    const probability =
      getProbability(recovery);

    const attempts =
      getAttempts(recovery);

    const maxAttempts =
      getMaxAttempts(
        recovery,
        settings
      );

    const terminal =
      [
        "recovered",
        "unrecoverable",
        "closed",
      ].includes(status);

    const executed =
      [
        "contacted",
        "retrying",
        "processing",
        "in_progress",
        "recovered",
      ].includes(status);

    const actionCompleted =
      status === "recovered";

    const stopped =
      status === "unrecoverable";

    return [
      {
        key: "diagnose",
        title: "Diagnose failure",
        description:
          getFailureReason(recovery),
        complete: true,
      },
      {
        key: "score",
        title: "Score recovery risk",
        description: `${probability}% recovery probability`,
        complete: true,
      },
      {
        key: "decision",
        title: "AI recovery decision",
        description:
          recovery?.recommendedAction ||
          recovery?.ai?.recommendedAction ||
          "Determine best next action",
        complete: true,
      },
      {
        key: "compliance",
        title: "Compliance check",
        description:
          compliance?.allowed
            ? "Action permitted"
            : "Action restricted",
        complete:
          compliance?.allowed ||
          terminal ||
          stopped,
      },
      {
        key: "message",
        title: "Generate recovery message",
        description:
          `${language} • ${channel}`,
        complete: true,
      },
      {
        key: "execute",
        title: "Execute recovery",
        description:
          executed
            ? "Recovery action executed"
            : "Waiting for execution",
        complete: executed,
      },
      {
        key: "outcome",
        title: "Measure outcome",
        description:
          actionCompleted
            ? "Revenue recovered"
            : stopped
            ? "Recovery stopped"
            : `${attempts}/${maxAttempts} attempts used`,
        complete:
          actionCompleted ||
          stopped,
      },
      {
        key: "audit",
        title: "Record audit trail",
        description:
          "Recovery event recorded",
        complete: true,
      },
    ];
  };

  /* =======================================================
     EXECUTE RECOVERY
  ======================================================= */

  const executeRecovery = async () => {
    if (!selectedRecovery) return;

    if (!compliance.allowed) {
      return;
    }

    try {
      setActionLoading(true);

      await sendRecovery({
        recoveryId:
          selectedRecovery._id ||
          selectedRecovery.id,
      });

      await loadData(false);

      const refreshed = recoveries.find(
        (item) =>
          String(item?._id || item?.id) ===
          String(
            selectedRecovery._id ||
              selectedRecovery.id
          )
      );

      if (refreshed) {
        setSelectedRecovery(refreshed);
      }

      setAgentLog((previous) => [
        ...previous,
        {
          time: new Date(),
          message:
            `Recovery action executed for ${getCustomerName(
              selectedRecovery
            )}`,
          type: "success",
        },
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Recovery action failed."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     MARK RECOVERED
  ======================================================= */

  const markRecovered = async () => {
    if (!selectedRecovery) return;

    try {
      setActionLoading(true);

      await markRecoveryRecovered(
        selectedRecovery._id ||
          selectedRecovery.id,
        getAmount(selectedRecovery)
      );

      await loadData(false);

      closeRecovery();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to mark recovery as recovered."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     STOP RECOVERY
  ======================================================= */

  const stopRecovery = async () => {
    if (!selectedRecovery) return;

    try {
      setActionLoading(true);

      await markRecoveryUnrecoverable(
        selectedRecovery._id ||
          selectedRecovery.id,
        "Stopped by recovery operator."
      );

      await loadData(false);

      closeRecovery();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to stop recovery."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     AI AGENT
  ======================================================= */

  const addAgentLog = (
    messageText,
    type = "info"
  ) => {
    setAgentLog((previous) => [
      ...previous.slice(-7),
      {
        time: new Date(),
        message: messageText,
        type,
      },
    ]);
  };

  const sleep = (ms) =>
    new Promise((resolve) =>
      setTimeout(resolve, ms)
    );

  const runRecoveryAgent = async () => {
    if (agentRunning) return;

    if (!settings.automationEnabled) {
      addAgentLog(
        "Automation is disabled in Settings.",
        "warning"
      );
      return;
    }

    setAgentRunning(true);
    setAgentPaused(false);
    setAgentStage("scanning");
    setAgentProcessed(0);
    setAgentResult(null);

    addAgentLog(
      "AI Recovery Agent started.",
      "success"
    );

    try {
      const candidates =
        recoveries.filter((recovery) => {
          const status =
            normalizeStatus(
              recovery?.status
            );

          if (
            [
              "recovered",
              "unrecoverable",
              "closed",
            ].includes(status)
          ) {
            return false;
          }

          if (
            settings.stopAfterLimit &&
            getAttempts(recovery) >=
              getMaxAttempts(
                recovery,
                settings
              )
          ) {
            return false;
          }

          if (
            settings.respectContactRules &&
            recovery?.contactAllowed === false
          ) {
            return false;
          }

          return true;
        });

      addAgentLog(
        `Agent found ${candidates.length} eligible recovery cases.`,
        "info"
      );

      const results = {
        scanned: recoveries.length,
        eligible: candidates.length,
        processed: 0,
        skipped: 0,
        executed: 0,
        blocked: 0,
      };

      for (
        let index = 0;
        index < candidates.length;
        index++
      ) {
        if (agentPaused) {
          setAgentStage("paused");

          while (agentPaused) {
            await sleep(300);
          }

          setAgentStage("processing");
        }

        const recovery =
          candidates[index];

        setAgentStage("processing");

        addAgentLog(
          `Analyzing ${getCustomerName(
            recovery
          )} • ${formatCurrency(
            getAmount(recovery),
            getCurrency(recovery)
          )}`,
          "info"
        );

        await sleep(250);

        const probability =
          getProbability(recovery);

        const priority =
          getPriority(recovery);

        addAgentLog(
          `AI diagnosis: ${capitalize(
            getFailureReason(recovery)
          )}. Recovery probability ${probability}%. Priority ${priority}.`,
          "info"
        );

        await sleep(250);

        const attempts =
          getAttempts(recovery);

        const maxAttempts =
          getMaxAttempts(
            recovery,
            settings
          );

        const contactAllowed =
          recovery?.contactAllowed !== false;

        const eligible =
          contactAllowed &&
          attempts < maxAttempts &&
          ![
            "recovered",
            "unrecoverable",
            "closed",
          ].includes(
            normalizeStatus(
              recovery?.status
            )
          );

        if (!eligible) {
          results.skipped += 1;

          addAgentLog(
            `Skipped ${getCustomerName(
              recovery
            )}: compliance or attempt limit.`,
            "warning"
          );

          setAgentProcessed(index + 1);

          continue;
        }

        const recommendedAction =
          recovery?.recommendedAction ||
          recovery?.ai?.recommendedAction ||
          "Retry payment";

        addAgentLog(
          `AI decision: ${recommendedAction}.`,
          "success"
        );

        await sleep(200);

        if (settings.requireApproval) {
          results.blocked += 1;

          addAgentLog(
            `Blocked ${getCustomerName(
              recovery
            )}: manual approval required.`,
            "warning"
          );

          setAgentProcessed(index + 1);

          continue;
        }

        if (
          settings.autoSendRecovery
        ) {
          try {
            await sendRecovery({
              recoveryId:
                recovery._id ||
                recovery.id,
            });

            results.executed += 1;

            addAgentLog(
              `Recovery action sent to ${getCustomerName(
                recovery
              )}.`,
              "success"
            );
          } catch (err) {
            results.skipped += 1;

            addAgentLog(
              `Execution failed for ${getCustomerName(
                recovery
              )}.`,
              "error"
            );
          }
        } else {
          addAgentLog(
            `Prepared recovery action for ${getCustomerName(
              recovery
            )}; auto-send is disabled.`,
            "info"
          );
        }

        results.processed += 1;

        setAgentProcessed(index + 1);

        await sleep(250);
      }

      setAgentStage("complete");

      setAgentResult(results);

      addAgentLog(
        `Agent completed: ${results.processed} processed, ${results.executed} actions executed, ${results.blocked} blocked.`,
        "success"
      );

      await loadData(false);
    } catch (err) {
      console.error(err);

      setAgentStage("error");

      addAgentLog(
        "AI Recovery Agent encountered an error.",
        "error"
      );
    } finally {
      setAgentRunning(false);
      setAgentPaused(false);
    }
  };

  const toggleAgentPause = () => {
    if (!agentRunning) return;

    setAgentPaused(
      (previous) => !previous
    );
  };

  const stopAgent = () => {
    setAgentRunning(false);
    setAgentPaused(false);
    setAgentStage("idle");

    addAgentLog(
      "AI Recovery Agent stopped by operator.",
      "warning"
    );
  };

  /* =======================================================
     AGENT PROGRESS
  ======================================================= */

  const eligibleCount = useMemo(() => {
    return recoveries.filter(
      (recovery) => {
        const status =
          normalizeStatus(
            recovery?.status
          );

        if (
          [
            "recovered",
            "unrecoverable",
            "closed",
          ].includes(status)
        ) {
          return false;
        }

        if (
          settings.stopAfterLimit &&
          getAttempts(recovery) >=
            getMaxAttempts(
              recovery,
              settings
            )
        ) {
          return false;
        }

        if (
          settings.respectContactRules &&
          recovery?.contactAllowed === false
        ) {
          return false;
        }

        return true;
      }
    ).length;
  }, [recoveries, settings]);

  const agentProgress =
    eligibleCount > 0
      ? Math.min(
          100,
          Math.round(
            (agentProcessed /
              eligibleCount) *
              100
          )
        )
      : agentStage === "complete"
      ? 100
      : 0;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="recoveries-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="recoveries-header">
        <div>
          <div className="eyebrow">
            AI Revenue Recovery
          </div>

          <h1>
            Recovery Command Center
          </h1>

          <p>
            AI-powered payment recovery,
            compliance-aware actions and
            automated revenue protection.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="secondary-button"
            onClick={() => loadData(false)}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            className="primary-button"
            onClick={runRecoveryAgent}
            disabled={
              agentRunning ||
              !settings.automationEnabled
            }
          >
            <Bot size={16} />

            {agentRunning
              ? "Agent Running"
              : "Run AI Recovery Agent"}
          </button>
        </div>
      </div>

      {/* =====================================================
          AUTOMATION BANNER
      ===================================================== */}

      <section className="automation-banner">
        <div className="automation-banner-icon">
          <Bot size={22} />
        </div>

        <div className="automation-banner-content">
          <div className="automation-banner-title">
            End-to-End AI Recovery Automation
          </div>

          <div className="automation-banner-description">
            Payment failure → AI diagnosis →
            risk scoring → recovery decision →
            compliance → recovery action →
            outcome tracking → audit trail
          </div>
        </div>

        <div className="automation-status">
          <span className="status-dot" />

          {settings.automationEnabled
            ? "Automation ACTIVE"
            : "Automation DISABLED"}
        </div>
      </section>

      {/* =====================================================
          AGENT CONTROL CENTER
      ===================================================== */}

      <section className="agent-panel">

        <div className="agent-panel-header">
          <div className="agent-title-wrap">
            <div className="agent-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <h2>
                AI Recovery Agent
              </h2>

              <p>
                Autonomous orchestration of
                eligible recovery cases using
                your configured safety policies.
              </p>
            </div>
          </div>

          <div className="agent-controls">

            {agentRunning && (
              <>
                <button
                  className="agent-control-button"
                  onClick={
                    toggleAgentPause
                  }
                >
                  {agentPaused ? (
                    <>
                      <Play size={15} />
                      Resume
                    </>
                  ) : (
                    <>
                      <PauseCircle size={15} />
                      Pause
                    </>
                  )}
                </button>

                <button
                  className="agent-stop-button"
                  onClick={stopAgent}
                >
                  <StopCircle size={15} />
                  Stop
                </button>
              </>
            )}

            {!agentRunning && (
              <button
                className="agent-run-button"
                onClick={
                  runRecoveryAgent
                }
                disabled={
                  !settings.automationEnabled
                }
              >
                <Zap size={15} />
                Start Agent
              </button>
            )}
          </div>
        </div>

        <div className="agent-workflow">

          {[
            {
              icon: Search,
              title: "Detect",
              text: "Find eligible failures",
            },
            {
              icon: Gauge,
              title: "Diagnose",
              text: "Score recovery risk",
            },
            {
              icon: Target,
              title: "Decide",
              text: "Choose intervention",
            },
            {
              icon: ShieldCheck,
              title: "Protect",
              text: "Apply guardrails",
            },
            {
              icon: MessageSquare,
              title: "Engage",
              text: "Prepare recovery message",
            },
            {
              icon: Play,
              title: "Execute",
              text: "Trigger recovery action",
            },
            {
              icon: CheckCircle2,
              title: "Measure",
              text: "Track recovery outcome",
            },
          ].map(
            (step, index) => {
              const Icon =
                step.icon;

              return (
                <React.Fragment
                  key={step.title}
                >
                  <div className="agent-step">
                    <div className="agent-step-icon">
                      <Icon size={17} />
                    </div>

                    <div>
                      <strong>
                        {step.title}
                      </strong>

                      <span>
                        {step.text}
                      </span>
                    </div>
                  </div>

                  {index <
                    6 && (
                    <ChevronRight
                      size={15}
                      className="agent-arrow"
                    />
                  )}
                </React.Fragment>
              );
            }
          )}

        </div>

        <div className="agent-progress-area">

          <div className="agent-progress-header">
            <span>
              Agent status
            </span>

            <strong>
              {agentStage ===
              "complete"
                ? "Completed"
                : agentStage ===
                  "processing"
                ? "Processing recovery cases"
                : agentStage ===
                  "scanning"
                ? "Scanning recovery queue"
                : agentStage ===
                  "paused"
                ? "Paused"
                : agentStage ===
                  "error"
                ? "Error"
                : "Ready"}
            </strong>
          </div>

          <div className="agent-progress-track">
            <div
              className="agent-progress-fill"
              style={{
                width: `${agentProgress}%`,
              }}
            />
          </div>

          <div className="agent-progress-meta">
            <span>
              {agentProcessed} /{" "}
              {eligibleCount} eligible cases
            </span>

            <span>
              {agentProgress}%
            </span>
          </div>
        </div>

        {agentResult && (
          <div className="agent-result-grid">

            <div className="agent-result-card">
              <span>
                Scanned
              </span>
              <strong>
                {agentResult.scanned}
              </strong>
            </div>

            <div className="agent-result-card">
              <span>
                Eligible
              </span>
              <strong>
                {agentResult.eligible}
              </strong>
            </div>

            <div className="agent-result-card">
              <span>
                Processed
              </span>
              <strong>
                {agentResult.processed}
              </strong>
            </div>

            <div className="agent-result-card">
              <span>
                Executed
              </span>
              <strong>
                {agentResult.executed}
              </strong>
            </div>

            <div className="agent-result-card">
              <span>
                Blocked
              </span>
              <strong>
                {agentResult.blocked}
              </strong>
            </div>
          </div>
        )}

        {agentLog.length > 0 && (
          <div className="agent-log">

            <div className="agent-log-title">
              <Clock3 size={15} />
              Live Agent Activity
            </div>

            {agentLog.map(
              (entry, index) => (
                <div
                  className={`agent-log-row ${entry.type}`}
                  key={`${entry.time}-${index}`}
                >
                  <span>
                    {entry.time.toLocaleTimeString(
                      "en-IN",
                      {
                        hour: "2-digit",
                        minute:
                          "2-digit",
                          second:
                          "2-digit",
                      }
                    )}
                  </span>

                  <p>
                    {entry.message}
                  </p>
                </div>
              )
            )}
          </div>
        )}

      </section>

      {/* =====================================================
          METRICS
      ===================================================== */}

      <div className="recovery-metrics">

        <div className="metric-card">
          <div className="metric-icon danger">
            <Wallet size={18} />
          </div>

          <div>
            <span>
              Revenue at risk
            </span>

            <strong>
              {formatCurrency(
                metrics.atRisk
              )}
            </strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon success">
            <CheckCircle2 size={18} />
          </div>

          <div>
            <span>
              Recovered revenue
            </span>

            <strong>
              {formatCurrency(
                metrics.recovered
              )}
            </strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon warning">
            <Target size={18} />
          </div>

          <div>
            <span>
              Active recoveries
            </span>

            <strong>
              {metrics.active}
            </strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon info">
            <Gauge size={18} />
          </div>

          <div>
            <span>
              Recovery rate
            </span>

            <strong>
              {metrics.recoveryRate}%
            </strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          AI STATUS
      ===================================================== */}

      <div className="ai-status-strip">

        <div className="ai-status-left">
          <div className="ai-pulse">
            <Bot size={17} />
          </div>

          <div>
            <strong>
              AI Recovery Engine
            </strong>

            <span>
              Decisioning and recovery
              orchestration active
            </span>
          </div>
        </div>

        <div className="ai-status-items">

          <span>
            <Check size={14} />
            AI-assisted
          </span>

          <span>
            <ShieldCheck size={14} />
            Compliance-aware
          </span>

          <span>
            <FileCheck2 size={14} />
            Audit-ready
          </span>

        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="recoveries-error">
          <AlertTriangle size={18} />

          <div>
            <strong>
              Recovery data error
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            onClick={() =>
              loadData(true)
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          QUEUE
      ===================================================== */}

      <section className="recovery-queue-section">

        <div className="section-header">

          <div>
            <h2>
              AI Recovery Queue
            </h2>

            <p>
              Cases prioritized by revenue
              impact, failure signals and
              recovery probability.
            </p>
          </div>

          <div className="queue-count">
            {filteredRecoveries.length} cases
          </div>
        </div>

        {/* TOOLBAR */}

        <div className="recovery-toolbar">

          <div className="search-box">
            <Search size={16} />

            <input
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search customer, email or failure reason..."
            />
          </div>

          <div className="filter-group">

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All statuses
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="in_progress">
                In progress
              </option>

              <option value="contacted">
                Contacted
              </option>

              <option value="retrying">
                Retrying
              </option>

              <option value="recovered">
                Recovered
              </option>

              <option value="unrecoverable">
                Unrecoverable
              </option>
            </select>

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All priorities
              </option>

              <option value="high">
                High
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="low">
                Low
              </option>
            </select>

          </div>
        </div>

        {/* TABLE */}

        {loading ? (
          <div className="recoveries-loading">
            <RefreshCw
              size={22}
              className="spin"
            />

            <span>
              Loading recovery queue...
            </span>
          </div>
        ) : filteredRecoveries.length ===
          0 ? (
          <div className="recoveries-empty">
            <Wallet size={30} />

            <h3>
              No recoveries found
            </h3>

            <p>
              No recovery records match
              your current filters.
            </p>
          </div>
        ) : (
          <div className="recovery-table-wrapper">

            <table className="recovery-table">

              <thead>
                <tr>
                  <th>
                    Customer
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Failure
                  </th>

                  <th>
                    Priority
                  </th>

                  <th>
                    AI probability
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRecoveries.map(
                  (recovery) => {
                    const status =
                      normalizeStatus(
                        recovery?.status
                      );

                    const priority =
                      getPriority(
                        recovery
                      );

                    const probability =
                      getProbability(
                        recovery
                      );

                    return (
                      <tr
                        key={
                          recovery._id ||
                          recovery.id
                        }
                      >

                        <td>
                          <div className="customer-cell">
                            <div className="customer-avatar">
                              <User
                                size={16}
                              />
                            </div>

                            <div>
                              <strong>
                                {getCustomerName(
                                  recovery
                                )}
                              </strong>

                              <span>
                                {getCustomerEmail(
                                  recovery
                                )}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="payment-cell">
                            <strong>
                              {formatCurrency(
                                getAmount(
                                  recovery
                                ),
                                getCurrency(
                                  recovery
                                )
                              )}
                            </strong>

                            <span>
                              <CreditCard
                                size={12}
                              />
                              {capitalize(
                                getPaymentMethod(
                                  recovery
                                )
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="failure-cell">
                            <strong>
                              {capitalize(
                                recovery?.failureCategory ||
                                  recovery?.failureCode ||
                                  getFailureReason(
                                    recovery
                                  )
                              )}
                            </strong>

                            <span>
                              {getFailureReason(
                                recovery
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`priority-badge ${priority.toLowerCase()}`}
                          >
                            {priority}
                          </span>
                        </td>

                        <td>
                          <div className="probability-cell">
                            <div className="probability-top">
                              <strong>
                                {probability}%
                              </strong>

                              <span>
                                likely
                              </span>
                            </div>

                            <div className="probability-track">
                              <div
                                className="probability-fill"
                                style={{
                                  width: `${probability}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${status}`}
                          >
                            {capitalize(
                              status
                            )}
                          </span>
                        </td>

                        <td>
                          <button
                            className="review-button"
                            onClick={() =>
                              openRecovery(
                                recovery
                              )
                            }
                          >
                            Review
                            <ArrowRight
                              size={14}
                            />
                          </button>
                        </td>

                      </tr>
                    );
                  }
                )}
              </tbody>

            </table>
          </div>
        )}

      </section>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {modalOpen &&
        selectedRecovery && (
          <div
            className="recovery-modal-backdrop"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeRecovery();
              }
            }}
          >

            <div className="recovery-modal">

              {/* MODAL HEADER */}

              <div className="modal-header">

                <div>
                  <div className="modal-eyebrow">
                    AI Recovery Decision
                  </div>

                  <h2>
                    {getCustomerName(
                      selectedRecovery
                    )}
                  </h2>

                  <p>
                    Review the AI decision,
                    compliance status and
                    recovery action.
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={
                    closeRecovery
                  }
                >
                  <X size={18} />
                </button>

              </div>

              {/* CUSTOMER SUMMARY */}

              <div className="customer-summary">

                <div>
                  <span>
                    Customer
                  </span>

                  <strong>
                    {getCustomerName(
                      selectedRecovery
                    )}
                  </strong>

                  <small>
                    {getCustomerEmail(
                      selectedRecovery
                    )}
                  </small>
                </div>

                <div>
                  <span>
                    Amount at risk
                  </span>

                  <strong>
                    {formatCurrency(
                      getAmount(
                        selectedRecovery
                      ),
                      getCurrency(
                        selectedRecovery
                      )
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Failure
                  </span>

                  <strong>
                    {capitalize(
                      getFailureReason(
                        selectedRecovery
                      )
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Attempts
                  </span>

                  <strong>
                    {getAttempts(
                      selectedRecovery
                    )}{" "}
                    /{" "}
                    {getMaxAttempts(
                      selectedRecovery,
                      settings
                    )}
                  </strong>
                </div>

              </div>

              {/* AI DECISION */}

              <div className="decision-grid">

                <div className="decision-card main-decision">

                  <div className="decision-card-title">
                    <Bot size={16} />
                    AI recommendation
                  </div>

                  <h3>
                    {selectedRecovery?.recommendedAction ||
                      selectedRecovery?.ai
                        ?.recommendedAction ||
                      "Retry payment"}
                  </h3>

                  <p>
                    {selectedRecovery?.explanation ||
                      selectedRecovery?.ai
                        ?.reason ||
                      `The AI engine detected a ${getFailureReason(
                        selectedRecovery
                      ).toLowerCase()} failure and selected the safest available recovery path.`}
                  </p>

                </div>

                <div className="decision-card">

                  <div className="decision-card-title">
                    <Gauge size={16} />
                    Recovery probability
                  </div>

                  <div className="confidence-ring">
                    <strong>
                      {getProbability(
                        selectedRecovery
                      )}%
                    </strong>

                    <span>
                      confidence
                    </span>
                  </div>

                </div>

              </div>

              {/* SIGNALS */}

              <div className="modal-section">

                <div className="modal-section-heading">
                  <h3>
                    AI Signal Breakdown
                  </h3>

                  <span>
                    Explainable decision
                  </span>
                </div>

                <div className="signal-grid">

                  {getSignals(
                    selectedRecovery
                  ).map(
                    (signal) => (
                      <div
                        className="signal-card"
                        key={
                          signal.label
                        }
                      >
                        <div>
                          <span>
                            {signal.label}
                          </span>

                          <strong>
                            {signal.value}%
                          </strong>
                        </div>

                        <div className="signal-track">
                          <div
                            className="signal-fill"
                            style={{
                              width: `${signal.value}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}

                </div>
              </div>

              {/* END-TO-END WORKFLOW */}

              <div className="modal-section">

                <div className="modal-section-heading">
                  <h3>
                    End-to-End Recovery Workflow
                  </h3>

                  <span>
                    AI agent orchestration
                  </span>
                </div>

                <div className="modal-workflow">

                  {getWorkflow(
                    selectedRecovery
                  ).map(
                    (step, index) => (
                      <div
                        className={`modal-workflow-step ${
                          step.complete
                            ? "complete"
                            : ""
                        }`}
                        key={
                          step.key
                        }
                      >

                        <div className="workflow-step-number">
                          {step.complete ? (
                            <Check size={14} />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <div>
                          <strong>
                            {step.title}
                          </strong>

                          <span>
                            {step.description}
                          </span>
                        </div>

                        {index <
                          getWorkflow(
                            selectedRecovery
                          ).length -
                            1 && (
                          <div className="workflow-line" />
                        )}

                      </div>
                    )
                  )}

                </div>
              </div>

              {/* REASONING */}

              <div className="reasoning-panel">

                <div className="reasoning-icon">
                  <Sparkles
                    size={17}
                  />
                </div>

                <div>
                  <strong>
                    Why the AI chose this action
                  </strong>

                  <p>
                    {selectedRecovery?.explanation ||
                      `The recovery engine considers the failure reason, payment amount, recovery probability, customer contact permissions and remaining attempt capacity before recommending an intervention.`}
                  </p>
                </div>

              </div>

              {/* COMPLIANCE */}

              <div className="modal-section">

                <div className="modal-section-heading">
                  <h3>
                    Compliance & Safety
                  </h3>

                  <span
                    className={
                      compliance.allowed
                        ? "safe-label"
                        : "blocked-label"
                    }
                  >
                    {compliance.allowed
                      ? "Action permitted"
                      : "Action restricted"}
                  </span>
                </div>

                <div className="compliance-panel">

                  {compliance.checks.map(
                    (check) => (
                      <div
                        className="compliance-row"
                        key={
                          check.label
                        }
                      >

                        <div>
                          {check.passed ? (
                            <CheckCircle2
                              size={16}
                            />
                          ) : (
                            <AlertTriangle
                              size={16}
                            />
                          )}
                        </div>

                        <span>
                          {check.label}
                        </span>

                        <strong>
                          {check.passed
                            ? "Passed"
                            : "Blocked"}
                        </strong>

                      </div>
                    )
                  )}

                </div>

                {!compliance.allowed && (
                  <div className="approval-warning">

                    <AlertTriangle
                      size={17}
                    />

                    <div>
                      <strong>
                        Recovery action blocked
                      </strong>

                      <span>
                        {compliance.reason}
                      </span>
                    </div>

                  </div>
                )}

              </div>

              {/* MESSAGE CENTER */}

              <div className="modal-section message-center">

                <div className="modal-section-heading">
                  <div>
                    <h3>
                      AI Recovery Message Center
                    </h3>

                    <span>
                      AI-assisted and
                      compliance-aware
                    </span>
                  </div>

                  <span className="ai-draft-badge">
                    <Sparkles
                      size={13}
                    />
                    AI-assisted draft
                  </span>
                </div>

                <div className="message-controls">

                  <label>
                    <span>
                      Channel
                    </span>

                    <select
                      value={channel}
                      onChange={(event) =>
                        handleChannelChange(
                          event.target.value
                        )
                      }
                    >
                      <option>
                        Email
                      </option>

                      <option>
                        SMS
                      </option>

                      <option>
                        Payment Retry
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>
                      Language
                    </span>

                    <select
                      value={language}
                      onChange={(event) =>
                        handleLanguageChange(
                          event.target.value
                        )
                      }
                    >
                      <option>
                        English
                      </option>

                      <option>
                        Hindi
                      </option>

                      <option>
                        Hinglish
                      </option>
                    </select>
                  </label>

                  <button
                    className="regenerate-button"
                    onClick={
                      regenerateMessage
                    }
                  >
                    <Sparkles
                      size={14}
                    />
                    Regenerate
                  </button>

                </div>

                <textarea
                  className="recovery-message-editor"
                  value={message}
                  onChange={(event) =>
                    setMessage(
                      event.target.value
                    )
                  }
                  rows={9}
                />

                <div className="message-footer">

                  <div className="message-quality">

                    <span>
                      <Check size={13} />
                      Customer context
                    </span>

                    <span>
                      <Check size={13} />
                      Recovery action
                    </span>

                    <span>
                      <Check size={13} />
                      Failure context
                    </span>

                    <span>
                      <Check size={13} />
                      Safe messaging
                    </span>

                  </div>

                  <div className="message-actions">

                    <span>
                      {message.length}
                      /1600
                    </span>

                    <button
                      className="copy-button"
                      onClick={
                        copyMessage
                      }
                    >
                      <Copy
                        size={14}
                      />
                      Copy
                    </button>

                  </div>

                </div>

              </div>

              {/* AUDIT */}

              <div className="audit-strip">

                <div>
                  <FileCheck2
                    size={15}
                  />

                  <span>
                    Audit trail
                  </span>
                </div>

                <span>
                  Decision generated{" "}
                  {formatDate(
                    new Date()
                  )}
                </span>

                <span>
                  Agent policy active
                </span>

                <span>
                  Contact rules enforced
                </span>

              </div>

              {/* MODAL FOOTER */}

              <div className="modal-footer">

                <button
                  className="modal-secondary-button"
                  onClick={
                    closeRecovery
                  }
                  disabled={
                    actionLoading
                  }
                >
                  Close
                </button>

                <button
                  className="stop-recovery-button"
                  onClick={
                    stopRecovery
                  }
                  disabled={
                    actionLoading ||
                    normalizeStatus(
                      selectedRecovery?.status
                    ) ===
                      "unrecoverable"
                  }
                >
                  <StopCircle
                    size={15}
                  />
                  Stop recovery
                </button>

                {normalizeStatus(
                  selectedRecovery?.status
                ) !== "recovered" && (
                  <button
                    className="recovered-button"
                    onClick={
                      markRecovered
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    <CheckCircle2
                      size={15}
                    />
                    Mark recovered
                  </button>
                )}

                <button
                  className="execute-button"
                  onClick={
                    executeRecovery
                  }
                  disabled={
                    actionLoading ||
                    !compliance.allowed
                  }
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="spin"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap
                        size={15}
                      />
                      {settings.requireApproval
                        ? "Approval Required"
                        : "Execute recovery"}
                    </>
                  )}
                </button>

              </div>

            </div>
          </div>
        )}

    </div>
  );
}
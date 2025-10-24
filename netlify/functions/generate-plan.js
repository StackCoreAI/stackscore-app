// netlify/functions/generate-plan.js
// Minimal working version that returns mock JSON so the UI composes.

export const handler = async (event) => {
  try {
    const params = new URLSearchParams(event.queryStringParameters || {});
    const stackKey = params.get("stackKey") || "foundation";

    const mock = {
      meta: { stackKey, source: "mock" },
      apps: [
        { name: "Dovly", features: ["Auto disputes"], website: "https://www.dovly.com" },
        { name: "Grow Credit", features: ["Bill builder"], website: "https://www.growcredit.com" }
      ],
      steps: [
        { title: "Download Dovly", detail: "Create an account and connect bureaus." },
        { title: "Add Netflix to Grow Credit", detail: "Let it report monthly." }
      ]
    };

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mock),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: String(err?.message || err) }),
    };
  }
};

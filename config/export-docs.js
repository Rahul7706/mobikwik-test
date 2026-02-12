const fs = require("fs");
const { Document, Packer, Paragraph, TextRun } = require("docx");

async function exportToDocx(filename, testResults) {
  const paragraphs = [];

  // HEADER
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "API TEST REPORT",
          bold: true,
          size: 40,
        }),
      ],
    }),
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated On: ${new Date().toLocaleString()}`,
          italics: true,
          size: 22,
        }),
      ],
    }),
  );

  paragraphs.push(new Paragraph(" "));
  paragraphs.push(
    new Paragraph("======================================================"),
  );
  paragraphs.push(new Paragraph(" "));

  testResults.forEach((resultObj, index) => {
    const testName = Object.keys(resultObj)[0];
    const testData = resultObj[testName];

    // TEST TITLE
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${testName}`,
            bold: true,
            size: 30,
          }),
        ],
      }),
    );

    paragraphs.push(new Paragraph(" "));

    // CURL
    paragraphs.push(
      new Paragraph({
        bullet: { level: 0 },
        children: [
          new TextRun({
            text: "CURL:",
            bold: true,
            size: 22,
          }),
        ],
      }),
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: testData.CURL || "N/A",
            size: 20,
          }),
        ],
      }),
    );

    paragraphs.push(new Paragraph(" "));

    // URL
    paragraphs.push(
      new Paragraph({
        bullet: { level: 0 },
        children: [
          new TextRun({
            text: "Request URL:",
            bold: true,
            size: 22,
          }),
        ],
      }),
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: testData["Request URL"] || "N/A",
            size: 20,
          }),
        ],
      }),
    );

    paragraphs.push(new Paragraph(" "));

    // BODY SECTION
    paragraphs.push(
      new Paragraph({
        bullet: { level: 0 },
        children: [
          new TextRun({
            text: "Request Body:",
            bold: true,
            size: 22,
          }),
        ],
      }),
    );

    paragraphs.push(new Paragraph(" "));

    if (!testName?.toLowerCase()?.includes("token generation")) {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: "Encrypted:",
              bold: true,
              size: 22,
            }),
          ],
        }),
      );

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: JSON.stringify(
                testData["Request Body"]?.Encrypted || {},
                null,
                2,
              ),
              size: 20,
            }),
          ],
        }),
      );

      paragraphs.push(new Paragraph(" "));

      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: "Decrypted:",
              bold: true,
              size: 22,
            }),
          ],
        }),
      );

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: JSON.stringify(
                testData["Request Body"]?.Decrypted || {},
                null,
                2,
              ),
              size: 20,
            }),
          ],
        }),
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: JSON.stringify(testData["Request Body"] || {}, null, 2),
              size: 20,
            }),
          ],
        }),
      );
    }

    paragraphs.push(new Paragraph(" "));

    paragraphs.push(
      new Paragraph({
        bullet: { level: 0 },
        children: [
          new TextRun({
            text: "Response:",
            bold: true,
            size: 22,
          }),
        ],
      }),
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: JSON.stringify(testData.Response || {}, null, 2),
            size: 20,
          }),
        ],
      }),
    );

    // FOOTER LINE
    paragraphs.push(new Paragraph(" "));
    paragraphs.push(
      new Paragraph("------------------------------------------------------"),
    );
    paragraphs.push(new Paragraph(" "));
  });

  // ==========================
  // ADD UAT NOTES SECTION AT END
  // ==========================
  paragraphs.push(new Paragraph(" "));
  paragraphs.push(
    new Paragraph("======================================================"),
  );
  paragraphs.push(new Paragraph(" "));

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "UAT VALIDATED TRANSACTION HANDLING NOTES",
          bold: true,
          size: 30,
        }),
      ],
    }),
  );

  paragraphs.push(new Paragraph(" "));
  paragraphs.push(new Paragraph(" "));

  // 1
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "1. Handling of Pending Transactions",
          bold: true,
          size: 26,
        }),
      ],
    }),
  );

  paragraphs.push(
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun("Transactions are marked Pending when:")],
    }),
  );

  paragraphs.push(
    new Paragraph({
      bullet: { level: 1 },
      children: [
        new TextRun(
          "The Recharge API does not return a final SUCCESS or FAILURE, or",
        ),
      ],
    }),
  );

  paragraphs.push(
    new Paragraph({
      bullet: { level: 1 },
      children: [
        new TextRun("The API response is delayed after request submission."),
      ],
    }),
  );

  paragraphs.push(
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun("System behavior verified in UAT:")],
    }),
  );

  [
    "Pending transactions are stored with Pending status.",
    "Duplicate retries for the same Request ID are blocked.",
    "Payment initiation is not retried.",
    "Background status check APIs are triggered instead.",
    "Transaction remains pending for 30-40 minutes.",
  ].forEach((item) => {
    paragraphs.push(
      new Paragraph({
        bullet: { level: 1 },
        children: [new TextRun(item)],
      }),
    );
  });

  paragraphs.push(
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun("Final outcome handling:")],
    }),
  );

  [
    "SUCCESS → Transaction confirmed and wallet settled.",
    "FAILED → Transaction amount reversed.",
    "If no final status is received → Transaction moved to Reconciliation.",
  ].forEach((item) => {
    paragraphs.push(
      new Paragraph({
        bullet: { level: 1 },
        children: [new TextRun(item)],
      }),
    );
  });

  paragraphs.push(new Paragraph(" "));

  // 2
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "2. Handling of Timeout Transactions",
          bold: true,
          size: 26,
        }),
      ],
    }),
  );

  paragraphs.push(
    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun(
          "A Timeout is identified when no API response is received within the configured network timeout.",
        ),
      ],
    }),
  );

  paragraphs.push(
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun("UAT-validated behavior:")],
    }),
  );

  [
    "Timeout transactions are not immediately marked as Failed.",
    "Timeout is treated as Pending.",
    "Payment API is not retried to avoid duplicate transactions.",
    "Final outcome is determined using Status Check APIs.",
  ].forEach((item) => {
    paragraphs.push(
      new Paragraph({
        bullet: { level: 1 },
        children: [new TextRun(item)],
      }),
    );
  });

  paragraphs.push(
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun("Transaction state differentiation:")],
    }),
  );

  [
    "Timeout → No response received.",
    "Pending → Non-final response received.",
    "Failed → Explicit failure response received.",
  ].forEach((item) => {
    paragraphs.push(
      new Paragraph({
        bullet: { level: 1 },
        children: [new TextRun(item)],
      }),
    );
  });

  paragraphs.push(
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun("Final settlement is completed via:")],
    }),
  );

  [
    "Automated reconciliation, or",
    "Manual reconciliation if required.",
  ].forEach((item) => {
    paragraphs.push(
      new Paragraph({
        bullet: { level: 1 },
        children: [new TextRun(item)],
      }),
    );
  });

  paragraphs.push(new Paragraph(" "));

  // 3
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "3. Status Check Interval & Retry Logic",
          bold: true,
          size: 26,
        }),
      ],
    }),
  );

  paragraphs.push(
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun("UAT-confirmed retry behavior:")],
    }),
  );

  [
    "First status check after 2 minutes from transaction initiation.",
    "Subsequent checks every 5 minutes.",
    "Total retry attempts: 6-8.",
    "Maximum retry window: 30-40 minutes.",
    "Retries stop immediately once a final status is received.",
  ].forEach((item) => {
    paragraphs.push(
      new Paragraph({
        bullet: { level: 1 },
        children: [new TextRun(item)],
      }),
    );
  });

  paragraphs.push(new Paragraph(" "));

  // 4
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "4. Handling of Token Expiry",
          bold: true,
          size: 26,
        }),
      ],
    }),
  );

  paragraphs.push(
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun("Token expiry is detected via:")],
    }),
  );

  ["HTTP 401 Unauthorized, or", 'Error message "Token is expired".'].forEach(
    (item) => {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 1 },
          children: [new TextRun(item)],
        }),
      );
    },
  );

  paragraphs.push(
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun("UAT-validated flow:")],
    }),
  );

  [
    "New token is generated using the Token Generation API.",
    "Failed request is retried only once with the refreshed token.",
  ].forEach((item) => {
    paragraphs.push(
      new Paragraph({
        bullet: { level: 1 },
        children: [new TextRun(item)],
      }),
    );
  });

  paragraphs.push(
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun("Fail-safe rules:")],
    }),
  );

  [
    "Single token refresh per expiry.",
    "No retries for invalid credentials.",
    "Infinite retry loops are prevented.",
  ].forEach((item) => {
    paragraphs.push(
      new Paragraph({
        bullet: { level: 1 },
        children: [new TextRun(item)],
      }),
    );
  });

  paragraphs.push(new Paragraph(" "));

  // 5
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "5. Mandatory Implementation Notes (UI & Backend)",
          bold: true,
          size: 26,
        }),
      ],
    }),
  );

  paragraphs.push(
    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun(
          "These rules were validated in UAT and must be enforced in production:",
        ),
      ],
    }),
  );

  [
    'The "Check Status" button must be disabled permanently once the transaction reaches a final status.',
    "After each manual status check: The button must remain disabled for at least 15 minutes.",
    "A minimum time gap of 15 minutes must be maintained between: Transaction initiation and any manual status check attempt.",
    "Backend validation must enforce these rules even if UI restrictions are bypassed.",
  ].forEach((item) => {
    paragraphs.push(
      new Paragraph({
        bullet: { level: 1 },
        children: [new TextRun(item)],
      }),
    );
  });

  const doc = new Document({
    sections: [
      {
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filename, buffer);

  return filename;
}

module.exports = { exportToDocx };

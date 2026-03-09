const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          text: "SkinHealth Platform Overview",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "System Architecture",
              bold: true,
              size: 28, // 14pt (measured in half-points)
            }),
          ],
          spacing: {
            before: 200,
            after: 200,
          },
        }),
        new Paragraph({
          text: "This project is a secure telemedicine platform featuring dedicated patient and doctor portals for uploading medical images, reviewing clinical cases, and managing online consultations, all powered by a React frontend, a Node.js backend API, and a role-secured Supabase PostgreSQL database.",
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "\nKey Features",
              bold: true,
              size: 28,
            }),
          ],
          spacing: {
            before: 200,
            after: 200,
          },
        }),
        new Paragraph({
          text: "• Patient Portal: Allows patients to securely register, upload skin concern images, view statuses, and schedule follow-up consultations.",
          bullet: {
            level: 0,
          },
        }),
        new Paragraph({
          text: "• Doctor Portal: Provides a specialized dashboard for licensed dermatologists to review patient submissions, manage their queue, and update consultation records.",
          bullet: {
            level: 0,
          },
        }),
        new Paragraph({
          text: "• Secure Data Storage: Relies on Supabase Storage for encrypted image hosting and PostgreSQL with Row Level Security (RLS) policies to ensure strict HIPAA-aligned data isolation between patients and doctors.",
          bullet: {
            level: 0,
          },
        }),
        new Paragraph({
          text: "• Modern Frontend Stack: Built with React, TypeScript, Tailwind CSS, React Node, React Query, and Framer Motion for a responsive, accessible, and fast user interface.",
          bullet: {
            level: 0,
          },
        }),
        new Paragraph({
          text: "• Robust Backend API: An Express API (Node.js) acting as a secure intermediary layer for processing uploads, orchestrating consultations, handling GDPR data erasure requests, and maintaining detailed audit logs.",
          bullet: {
            level: 0,
          },
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("SkinHealth_Project_Overview.docx", buffer);
  console.log(
    "Document created successfully at SkinHealth_Project_Overview.docx",
  );
});

import type { Metadata } from "next";
import InterviewForm from "@/app/components/interview";

export const metadata: Metadata = {
  title: "Conduct Interview — CommunityPulse",
  description:
    "Record patient stories and biographical data through a guided interview form.",
};

export default function InterviewPage() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        padding: "40px 24px 80px",
        background:
          "radial-gradient(ellipse at 20% 0%, rgba(0,201,167,0.06) 0%, transparent 50%), var(--navy)",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: 700,
            marginBottom: 8,
            textAlign: "center",
            letterSpacing: "-0.02em",
          }}
        >
          Conduct Interview
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "var(--gray-300)",
            marginBottom: 40,
            fontSize: "1.05rem",
          }}
        >
          Capture the encounter details below. Patient data will be obfuscated
          before analysis.
        </p>
        <InterviewForm />
      </div>
    </div>
  );
}

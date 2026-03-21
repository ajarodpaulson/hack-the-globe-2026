"use client";

import Link from "next/link";

export default function Home() {
    return (
        <div style={{ minHeight: "100vh" }}>
            {/* ===== HERO ===== */}
            <section
                style={{
                    position: "relative",
                    overflow: "hidden",
                    padding: "120px 24px 100px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    background:
                        "radial-gradient(ellipse at 30% 20%, rgba(0,201,167,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(255,179,71,0.08) 0%, transparent 50%), var(--navy)",
                }}
            >
                {/* Floating accent orb */}
                <div
                    style={{
                        position: "absolute",
                        top: -80,
                        right: -80,
                        width: 320,
                        height: 320,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(0,201,167,0.15) 0%, transparent 70%)",
                        filter: "blur(40px)",
                        pointerEvents: "none",
                    }}
                />

                <h1
                    className="animate-fade-in-up"
                    style={{
                        fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
                        fontWeight: 800,
                        lineHeight: 1.1,
                        letterSpacing: "-0.03em",
                        maxWidth: 780,
                        marginBottom: 20,
                    }}
                >
                    Upstream health equity,{" "}
                    <span className="gradient-text">one story at a time</span>
                </h1>

                <p
                    className="animate-fade-in-up delay-200"
                    style={{
                        fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                        color: "var(--gray-300)",
                        maxWidth: 600,
                        lineHeight: 1.7,
                        marginBottom: 40,
                        opacity: 0,
                    }}
                >
                    CommunityPulse empowers outreach workers to capture patient stories,
                    identify social determinants of health, and visualize community needs —
                    so decision-makers can intervene much earlier.
                </p>

                <div
                    className="animate-fade-in-up delay-300"
                    style={{
                        display: "flex",
                        gap: 16,
                        flexWrap: "wrap",
                        justifyContent: "center",
                        opacity: 0,
                    }}
                >
                    <Link href="/interview" className="btn-primary">
                        Start an Interview →
                    </Link>
                    <Link href="/heatmap" className="btn-secondary">
                        View Heatmap
                    </Link>
                </div>
            </section>

            {/* ===== PROBLEM STATS ===== */}
            <section
                style={{
                    padding: "80px 24px",
                    background:
                        "linear-gradient(180deg, var(--navy) 0%, var(--navy-dark) 100%)",
                }}
            >
                <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <h2
                        style={{
                            textAlign: "center",
                            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                            fontWeight: 700,
                            marginBottom: 12,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        The Problem
                    </h2>
                    <p
                        style={{
                            textAlign: "center",
                            color: "var(--gray-300)",
                            maxWidth: 640,
                            margin: "0 auto 48px",
                            fontSize: "1.05rem",
                            lineHeight: 1.7,
                        }}
                    >
                        Social determinants account for up to 55% of health outcomes — yet
                        most interventions come much too late.
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: 24,
                        }}
                    >
                        {[
                            {
                                stat: "80%",
                                label: "of health outcomes",
                                desc: "are driven by factors outside the clinical setting",
                                icon: "🏥",
                            },
                            {
                                stat: "55%",
                                label: "attributed to SDOH",
                                desc: "Social & economic conditions shape lifelong health trajectories",
                                icon: "📊",
                            },
                            {
                                stat: "3×",
                                label: "higher chronic disease",
                                desc: "in underserved communities without early upstream intervention",
                                icon: "⚠️",
                            },
                        ].map((card, i) => (
                            <div
                                key={i}
                                className="glass"
                                style={{
                                    padding: "32px 28px",
                                    textAlign: "center",
                                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.transform =
                                        "translateY(-4px)";
                                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                                        "var(--shadow-glow)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.transform =
                                        "translateY(0)";
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                                }}
                            >
                                <div style={{ fontSize: 36, marginBottom: 12 }}>{card.icon}</div>
                                <div
                                    className="gradient-text"
                                    style={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}
                                >
                                    {card.stat}
                                </div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        color: "var(--white)",
                                        marginTop: 8,
                                    }}
                                >
                                    {card.label}
                                </div>
                                <div
                                    style={{
                                        fontSize: 14,
                                        color: "var(--gray-400)",
                                        marginTop: 6,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {card.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section style={{ padding: "80px 24px" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <h2
                        style={{
                            textAlign: "center",
                            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                            fontWeight: 700,
                            marginBottom: 12,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        How It Works
                    </h2>
                    <p
                        style={{
                            textAlign: "center",
                            color: "var(--gray-300)",
                            maxWidth: 540,
                            margin: "0 auto 56px",
                            fontSize: "1.05rem",
                        }}
                    >
                        Three simple steps from community encounter to actionable insight.
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: 32,
                        }}
                    >
                        {[
                            {
                                step: "01",
                                title: "Interview",
                                desc: "Outreach workers record patient stories and basic demographics in the field using our secure form.",
                                icon: "🎙️",
                            },
                            {
                                step: "02",
                                title: "Analyze",
                                desc: "A local LLM obfuscates confidential patient data (I.e., PHI) and classifies each story against common social determinants of health.",
                                icon: "🧠",
                            },
                            {
                                step: "03",
                                title: "Visualize",
                                desc: "Results appear on a filterable heatmap, empowering stakeholders to plan upstream interventions.",
                                icon: "🗺️",
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="glass-strong"
                                style={{
                                    padding: "36px 28px",
                                    position: "relative",
                                    overflow: "hidden",
                                    transition: "transform 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.transform =
                                        "translateY(-4px)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.transform =
                                        "translateY(0)";
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 16,
                                        right: 20,
                                        fontSize: 64,
                                        fontWeight: 800,
                                        opacity: 0.04,
                                        lineHeight: 1,
                                        color: "var(--teal)",
                                    }}
                                >
                                    {item.step}
                                </div>
                                <div style={{ fontSize: 40, marginBottom: 16 }}>{item.icon}</div>
                                <h3
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 700,
                                        marginBottom: 8,
                                        color: "var(--teal)",
                                    }}
                                >
                                    {item.title}
                                </h3>
                                <p
                                    style={{
                                        fontSize: 15,
                                        color: "var(--gray-300)",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section
                style={{
                    padding: "80px 24px",
                    textAlign: "center",
                    background:
                        "radial-gradient(ellipse at 50% 50%, rgba(0,201,167,0.08) 0%, transparent 60%)",
                }}
            >
                <h2
                    style={{
                        fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
                        fontWeight: 700,
                        marginBottom: 16,
                    }}
                >
                    Ready to make a difference?
                </h2>
                <p
                    style={{
                        color: "var(--gray-300)",
                        maxWidth: 480,
                        margin: "0 auto 32px",
                        fontSize: "1.05rem",
                        lineHeight: 1.7,
                    }}
                >
                    Start capturing community stories today and help shape policies that
                    address the root causes of health inequity.
                </p>
                <Link href="/interview" className="btn-primary">
                    Begin an Interview →
                </Link>
            </section>

            {/* ===== FOOTER ===== */}
            <footer
                style={{
                    padding: "32px 24px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    textAlign: "center",
                }}
            >
                <p style={{ color: "var(--gray-500)", fontSize: 14 }}>
                    CommunityPulse — Built for Hack the Globe 2026
                </p>
            </footer>
        </div>
    );
}

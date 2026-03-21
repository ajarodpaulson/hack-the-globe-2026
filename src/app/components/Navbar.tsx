"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/interview", label: "Interview" },
    { href: "/heatmap", label: "Heatmap" },
  ];

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "rgba(11, 29, 58, 0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "var(--white)",
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--teal), var(--teal-dark))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 800,
              color: "var(--navy)",
            }}
          >
            CP
          </span>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
            CommunityPulse
          </span>
        </Link>

        {/* Desktop links */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
          className="desktop-nav"
        >
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "8px 18px",
                  borderRadius: "var(--radius-xl)",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  color: isActive ? "var(--navy)" : "var(--gray-300)",
                  background: isActive
                    ? "linear-gradient(135deg, var(--teal), var(--teal-dark))"
                    : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "var(--white)",
            fontSize: 24,
            cursor: "pointer",
            padding: 8,
          }}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="mobile-nav-menu"
          style={{
            padding: "12px 24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: "12px 18px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 15,
                  fontWeight: 500,
                  textDecoration: "none",
                  color: isActive ? "var(--teal)" : "var(--gray-300)",
                  background: isActive ? "rgba(0,201,167,0.08)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 640px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: block !important;
          }
        }
        @media (min-width: 641px) {
          .mobile-nav-menu {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}

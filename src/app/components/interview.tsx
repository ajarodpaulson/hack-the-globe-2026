"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";

/* ------------------------------------------------------------------ */
/*  Web Speech API type declarations (not in default TS lib.dom)       */
/* ------------------------------------------------------------------ */
interface ISpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: ISpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

interface ISpeechRecognitionEvent {
    resultIndex: number;
    results: {
        length: number;
        [index: number]: {
            isFinal: boolean;
            length: number;
            [index: number]: { transcript: string; confidence: number };
        };
    };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
type SpeechRecognition = ISpeechRecognition;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
type SpeechRecognitionEvent = ISpeechRecognitionEvent;

/* ------------------------------------------------------------------ */
/*  Dynamically import the map (Leaflet requires window / no SSR)      */
/* ------------------------------------------------------------------ */
const LocationPicker = dynamic(() => import("./LocationPicker"), {
    ssr: false,
    loading: () => (
        <div
            style={{
                height: 300,
                borderRadius: "var(--radius-md)",
                background: "var(--glass-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gray-400)",
            }}
        >
            Loading map…
        </div>
    ),
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface FormData {
    ageRange: string;
    gender: string;
    lat: number | null;
    lng: number | null;
    transcript: string;
    audioBlob: Blob | null;
}

const AGE_RANGES = [
    "Under 18",
    "18–24",
    "25–34",
    "35–44",
    "45–54",
    "55–64",
    "65+",
];

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

const STEPS = ["Biographical Info", "Patient Story", "Review & Submit"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function InterviewForm() {
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState<FormData>({
        ageRange: "",
        gender: "",
        lat: null,
        lng: null,
        transcript: "",
        audioBlob: null,
    });

    /* ---- audio / STT state ---- */
    const [recording, setRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    /* ---- helpers ---- */
    const update = (patch: Partial<FormData>) =>
        setForm((prev) => ({ ...prev, ...patch }));

    const canAdvance = useCallback(() => {
        if (step === 0)
            return form.ageRange && form.gender && form.lat !== null;
        if (step === 1) return form.transcript.trim().length > 0;
        return true;
    }, [step, form]);

    /* ---- audio recording ---- */
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                update({ audioBlob: blob });
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach((t) => t.stop());
            };

            mediaRecorder.start();
            setRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(
                () => setRecordingTime((t) => t + 1),
                1000
            );

            // Start speech recognition
            startSpeechRecognition();
        } catch {
            alert("Microphone access is required to record audio.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        stopSpeechRecognition();
    };

    /* ---- speech-to-text ---- */
    const startSpeechRecognition = () => {
        const SpeechRecognitionAPI =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).SpeechRecognition ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) return;

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        let finalTranscript = form.transcript;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += " " + t;
                    update({ transcript: finalTranscript.trim() });
                } else {
                    interim += t;
                }
            }
            // Show interim text in the textarea
            const ta = document.getElementById(
                "transcript-area"
            ) as HTMLTextAreaElement | null;
            if (ta) {
                ta.value = (finalTranscript + " " + interim).trim();
            }
        };

        recognition.onerror = () => {
            /* silently ignore — user can type instead */
        };

        recognition.start();
        recognitionRef.current = recognition;
    };

    const stopSpeechRecognition = () => {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
    };

    /* cleanup on unmount */
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            stopSpeechRecognition();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---- submit ---- */
    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                ageRange: form.ageRange,
                gender: form.gender,
                lat: form.lat,
                lng: form.lng,
                transcript: form.transcript,
            };

            await fetch("/api", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            setSubmitted(true);
        } catch {
            alert("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (s: number) =>
        `${Math.floor(s / 60)
            .toString()
            .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    /* ================================================================ */
    /*  RENDER                                                           */
    /* ================================================================ */

    if (submitted) {
        return (
            <div
                className="glass-strong animate-fade-in-up"
                style={{ padding: "60px 32px", textAlign: "center" }}
            >
                <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                    Interview Submitted
                </h2>
                <p style={{ color: "var(--gray-300)", marginBottom: 28 }}>
                    The data has been sent for processing. Thank you for making a
                    difference.
                </p>
                <button
                    className="btn-primary"
                    onClick={() => {
                        setSubmitted(false);
                        setStep(0);
                        setForm({
                            ageRange: "",
                            gender: "",
                            lat: null,
                            lng: null,
                            transcript: "",
                            audioBlob: null,
                        });
                        setAudioUrl(null);
                    }}
                >
                    Start New Interview
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* ===== Stepper ===== */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0,
                    marginBottom: 40,
                }}
            >
                {STEPS.map((label, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0,
                        }}
                    >
                        {/* step circle + label */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 6,
                                minWidth: 80,
                            }}
                        >
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    transition: "all 0.3s ease",
                                    background:
                                        i <= step
                                            ? "linear-gradient(135deg, var(--teal), var(--teal-dark))"
                                            : "var(--glass-bg)",
                                    color: i <= step ? "var(--navy)" : "var(--gray-400)",
                                    border:
                                        i <= step
                                            ? "none"
                                            : "1px solid var(--glass-border)",
                                }}
                            >
                                {i < step ? "✓" : i + 1}
                            </div>
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: i <= step ? "var(--teal)" : "var(--gray-500)",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {label}
                            </span>
                        </div>
                        {/* connector line */}
                        {i < STEPS.length - 1 && (
                            <div
                                style={{
                                    width: 60,
                                    height: 2,
                                    margin: "0 8px",
                                    marginBottom: 22,
                                    background:
                                        i < step ? "var(--teal)" : "rgba(255,255,255,0.08)",
                                    borderRadius: 1,
                                    transition: "background 0.3s ease",
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* ===== Step Content ===== */}
            <div className="glass-strong animate-fade-in" style={{ padding: "36px 32px" }}>
                {/* ---------- STEP 1: Bio ---------- */}
                {step === 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <h3
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: "var(--teal)",
                                marginBottom: 4,
                            }}
                        >
                            Biographical Information
                        </h3>

                        {/* Age range */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: 8,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "var(--gray-200)",
                                }}
                            >
                                Age Range
                            </label>
                            <select
                                id="age-range-select"
                                value={form.ageRange}
                                onChange={(e) => update({ ageRange: e.target.value })}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    borderRadius: "var(--radius-sm)",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid var(--glass-border)",
                                    color: "var(--white)",
                                    fontSize: 15,
                                    outline: "none",
                                }}
                            >
                                <option value="" disabled>
                                    Select age range…
                                </option>
                                {AGE_RANGES.map((a) => (
                                    <option key={a} value={a} style={{ color: "#000" }}>
                                        {a}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Gender */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: 8,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "var(--gray-200)",
                                }}
                            >
                                Gender
                            </label>
                            <select
                                id="gender-select"
                                value={form.gender}
                                onChange={(e) => update({ gender: e.target.value })}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    borderRadius: "var(--radius-sm)",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid var(--glass-border)",
                                    color: "var(--white)",
                                    fontSize: 15,
                                    outline: "none",
                                }}
                            >
                                <option value="" disabled>
                                    Select gender…
                                </option>
                                {GENDERS.map((g) => (
                                    <option key={g} value={g} style={{ color: "#000" }}>
                                        {g}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Location */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: 8,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "var(--gray-200)",
                                }}
                            >
                                Approximate Location of Encounter
                            </label>
                            <p
                                style={{
                                    fontSize: 13,
                                    color: "var(--gray-400)",
                                    marginBottom: 12,
                                }}
                            >
                                Click the map to place a pin at the approximate location. Drag to
                                adjust.
                            </p>
                            <LocationPicker
                                lat={form.lat}
                                lng={form.lng}
                                onChange={(lat: number, lng: number) => update({ lat, lng })}
                            />
                            {form.lat !== null && (
                                <p
                                    style={{
                                        marginTop: 10,
                                        fontSize: 13,
                                        color: "var(--teal)",
                                        fontFamily: "var(--font-mono)",
                                    }}
                                >
                                    📍 {form.lat.toFixed(5)}, {form.lng!.toFixed(5)}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* ---------- STEP 2: Story ---------- */}
                {step === 1 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <h3
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: "var(--teal)",
                                marginBottom: 4,
                            }}
                        >
                            Patient Story
                        </h3>
                        <p style={{ fontSize: 14, color: "var(--gray-300)", marginTop: -12 }}>
                            Record the patient&apos;s story using the microphone or type it
                            directly. Speech will be transcribed in real time.
                        </p>

                        {/* Recorder controls */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                flexWrap: "wrap",
                            }}
                        >
                            {!recording ? (
                                <button
                                    className="btn-primary"
                                    onClick={startRecording}
                                    style={{ padding: "12px 24px", fontSize: 15 }}
                                >
                                    🎙️ Start Recording
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    style={{
                                        padding: "12px 24px",
                                        fontSize: 15,
                                        fontWeight: 700,
                                        borderRadius: "var(--radius-xl)",
                                        border: "2px solid var(--coral)",
                                        background: "rgba(255,107,107,0.12)",
                                        color: "var(--coral)",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            background: "var(--coral)",
                                            display: "inline-block",
                                            animation: "pulse 1s ease-in-out infinite",
                                        }}
                                    />
                                    Stop — {formatTime(recordingTime)}
                                </button>
                            )}

                            {audioUrl && !recording && (
                                <audio
                                    controls
                                    src={audioUrl}
                                    style={{ height: 36, flexShrink: 0 }}
                                />
                            )}
                        </div>

                        {/* Transcript area */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: 8,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "var(--gray-200)",
                                }}
                            >
                                Transcript
                            </label>
                            <textarea
                                id="transcript-area"
                                value={form.transcript}
                                onChange={(e) => update({ transcript: e.target.value })}
                                placeholder="The transcript will appear here as you speak, or you can type directly…"
                                rows={10}
                                style={{
                                    width: "100%",
                                    padding: "14px 16px",
                                    borderRadius: "var(--radius-sm)",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid var(--glass-border)",
                                    color: "var(--white)",
                                    fontSize: 15,
                                    lineHeight: 1.6,
                                    resize: "vertical",
                                    outline: "none",
                                    fontFamily: "inherit",
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* ---------- STEP 3: Review ---------- */}
                {step === 2 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <h3
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: "var(--teal)",
                                marginBottom: 4,
                            }}
                        >
                            Review & Submit
                        </h3>
                        <p style={{ fontSize: 14, color: "var(--gray-300)", marginTop: -12 }}>
                            Please confirm the information below before submitting.
                        </p>

                        {/* Summary cards */}
                        <div
                            className="glass"
                            style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}
                        >
                            <Row label="Age Range" value={form.ageRange} />
                            <Row label="Gender" value={form.gender} />
                            <Row
                                label="Location"
                                value={
                                    form.lat !== null
                                        ? `${form.lat.toFixed(5)}, ${form.lng!.toFixed(5)}`
                                        : "Not set"
                                }
                            />
                        </div>

                        <div className="glass" style={{ padding: "20px 24px" }}>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--gray-400)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: 8,
                                }}
                            >
                                Transcript
                            </div>
                            <p
                                style={{
                                    fontSize: 15,
                                    color: "var(--gray-200)",
                                    lineHeight: 1.7,
                                    whiteSpace: "pre-wrap",
                                    maxHeight: 240,
                                    overflowY: "auto",
                                }}
                            >
                                {form.transcript}
                            </p>
                        </div>

                        {audioUrl && (
                            <div
                                className="glass"
                                style={{
                                    padding: "16px 24px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-400)" }}>
                                    Audio:
                                </span>
                                <audio controls src={audioUrl} style={{ height: 36, flex: 1 }} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ===== Navigation Buttons ===== */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 28,
                }}
            >
                {step > 0 ? (
                    <button className="btn-secondary" onClick={() => setStep((s) => s - 1)}>
                        ← Back
                    </button>
                ) : (
                    <div />
                )}

                {step < STEPS.length - 1 ? (
                    <button
                        className="btn-primary"
                        disabled={!canAdvance()}
                        onClick={() => setStep((s) => s + 1)}
                        style={{
                            opacity: canAdvance() ? 1 : 0.4,
                            cursor: canAdvance() ? "pointer" : "not-allowed",
                        }}
                    >
                        Next →
                    </button>
                ) : (
                    <button
                        className="btn-primary"
                        disabled={submitting}
                        onClick={handleSubmit}
                        style={{ opacity: submitting ? 0.6 : 1 }}
                    >
                        {submitting ? "Submitting…" : "Submit Interview ✓"}
                    </button>
                )}
            </div>
        </div>
    );
}

/* ---- Small helper component ---- */
function Row({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
                style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--gray-400)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                }}
            >
                {label}
            </span>
            <span style={{ fontSize: 15, color: "var(--white)", fontWeight: 500 }}>
                {value}
            </span>
        </div>
    );
}

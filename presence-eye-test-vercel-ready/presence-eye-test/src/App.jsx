import React, { useEffect, useRef, useState } from "react";

const stages = [
  {
    id: "detected",
    title: "Detected",
    label: "01 / Detection",
    desc: "The screen first shows an eye. The user clicks the screen to simulate being detected. After clicking, the interface changes and shows a confirmation mark: Detected.",
    instruction: "Click the eye to be detected.",
  },
  {
    id: "noticed",
    title: "Noticed",
    label: "02 / Gaze Following",
    desc: "After detection, the eye begins to look at the cursor. As the cursor moves, the gaze turns and follows it, creating the feeling of being noticed.",
    instruction: "Move your cursor around the screen.",
  },
  {
    id: "responded",
    title: "Responded to",
    label: "03 / Behaviour Response",
    desc: "The eye responds to cursor behaviour. Vertical cursor swings trigger a clear double nod. Horizontal cursor swings trigger a side-to-side shake, while the gaze keeps following the cursor.",
    instruction: "Move your cursor up/down or left/right.",
  },
  {
    id: "confirmed",
    title: "Confirmed",
    label: "04 / Autonomous Response",
    desc: "The eye keeps following the cursor and also responds more slowly. Vertical cursor movement can trigger a clear double nod. The eye occasionally blinks and gently moves by itself, making the response feel more autonomous.",
    instruction: "Move slowly, or move up/down to trigger a nod.",
  },
  {
    id: "rating",
    title: "Rating",
    label: "05 / Evaluation",
    desc: "After experiencing the four response stages, participants rate how strong the feeling of presence was and choose which stage felt most like a meaningful response.",
    instruction: "",
  },
];

function EyeLogo() {
  return <div className="eye-logo" />;
}

function PhoneFrame({ children }) {
  return (
    <div className="phone">
      <div className="screen">
        <div className="status">
          <span>9:41</span>
          <div className="island" />
          <div className="battery">
            <span />
            <span />
            <span />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Header({ stage, setStage }) {
  return (
    <div className="header">
      <div className="header-row">
        <div className="brand">
          <div className="brand-icon">
            <EyeLogo />
          </div>
          <span>Presence Eye Test</span>
        </div>
        <span className="pill">Cursor Prototype</span>
      </div>

      <div className="progress">
        {stages.map((_, index) => (
          <button
            key={index}
            onClick={() => setStage(index)}
            className={index <= stage ? "active" : ""}
            aria-label={`go to stage ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function RatingPage({ score, setScore, choice, setChoice, submitted }) {
  const ratings = [
    [1, "Very low"],
    [2, "Low"],
    [3, "Medium"],
    [4, "High"],
    [5, "Very high"],
  ];
  const choices = ["Detected", "Noticed", "Responded to", "Confirmed"];

  return (
    <div className="rating-page">
      <div className="rating-card">
        <div className="rating-title">How present did the response feel?</div>
        <div className="scale">
          {ratings.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setScore(value)}
              className={`score ${score === value ? "selected" : ""}`}
            >
              <div className="num">{value}</div>
              <div className="small">{label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rating-card">
        <div className="rating-title">Which stage felt most like a response?</div>
        <div className="choices">
          {choices.map((item) => (
            <button
              key={item}
              onClick={() => setChoice(item)}
              className={`choice ${choice === item ? "selected" : ""}`}
            >
              <span>{item}</span>
              <span>→</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rating-card">
        <div className="rating-title">
          Notes <span>(optional)</span>
        </div>
        <textarea placeholder="What made it feel present?" />
      </div>

      {submitted && <div className="submit-msg">Result submitted. Thank you.</div>}
    </div>
  );
}

function EyeArea({ stage, detected, setDetected }) {
  const areaRef = useRef(null);
  const historyRef = useRef([]);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [gesture, setGesture] = useState("still");
  const [blink, setBlink] = useState(false);
  const [autoMove, setAutoMove] = useState({ x: 0, y: 0 });
  const [nodState, setNodState] = useState({ started: 0, duration: 0, strength: 0 });
  const [shakeState, setShakeState] = useState({ started: 0, duration: 0, strength: 0 });
  const [, forceTick] = useState(0);

  useEffect(() => {
    let id;
    const loop = () => {
      forceTick((t) => (t + 1) % 100000);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (stage !== 3) return;
    const blinkTimer = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 220);
    }, 2400);
    const autoTimer = setInterval(() => {
      setAutoMove({ x: Math.random() * 12 - 6, y: Math.random() * 8 - 4 });
    }, 1200);
    return () => {
      clearInterval(blinkTimer);
      clearInterval(autoTimer);
    };
  }, [stage]);

  const handleMouseMove = (event) => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    const next = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
      t: Date.now(),
    };
    setCursor(next);

    const history = historyRef.current;
    history.push(next);
    if (history.length > 12) history.shift();

    if ((stage === 2 || stage === 3) && history.length > 6) {
      const xs = history.map((p) => p.x);
      const ys = history.map((p) => p.y);
      const xRange = Math.max(...xs) - Math.min(...xs);
      const yRange = Math.max(...ys) - Math.min(...ys);

      if (yRange > 0.75 && yRange > xRange * 1.12) {
        setGesture("double nod");
        setNodState({ started: performance.now(), duration: 1000, strength: Math.min(1, yRange) });
      } else if (stage === 2 && xRange > 0.85 && xRange > yRange * 1.12) {
        setGesture("shake");
        setShakeState({ started: performance.now(), duration: 850, strength: Math.min(1, xRange) });
      } else if (stage === 2) {
        setGesture("still");
      }
    }
  };

  const now = performance.now();
  const nodProgress = nodState.duration ? Math.min(1, (now - nodState.started) / nodState.duration) : 1;
  const shakeProgress = shakeState.duration ? Math.min(1, (now - shakeState.started) / shakeState.duration) : 1;
  const nodOffset = (stage === 2 || stage === 3) && nodProgress < 1
    ? Math.sin(nodProgress * Math.PI * 4) * 18 * nodState.strength
    : 0;
  const shakeOffset = stage === 2 && shakeProgress < 1
    ? Math.sin(shakeProgress * Math.PI * 4) * 11 * shakeState.strength
    : 0;

  const pupilX = stage === 0 ? 0 : cursor.x * 20;
  const pupilY = stage === 0 ? 0 : cursor.y * 10;
  const moveX = shakeOffset + (stage === 3 ? autoMove.x : 0);
  const moveY = nodOffset + (stage === 3 ? autoMove.y : 0);
  const showDetected = stage === 0 && detected;

  return (
    <div
      ref={areaRef}
      onMouseMove={handleMouseMove}
      onClick={() => stage === 0 && setDetected(true)}
      className="eye-area"
    >
      <div className="ring r1" />
      <div className="ring r2" />
      {stage === 0 && !detected && <div className="ping" />}

      {showDetected ? (
        <div className="detected-card">
          <div className="check">✓</div>
          <div className="detected-title">Detected</div>
          <div className="detected-sub">User has been found</div>
        </div>
      ) : (
        <div className="eye-wrap" style={{ transform: `translate(${moveX}px, ${moveY}px)` }}>
          {!blink ? (
            <div className="eye-open">
              <div
                className="pupil"
                style={{ transform: `translate(-50%, -50%) translate(${pupilX}px, ${pupilY}px)` }}
              >
                <div className="highlight" />
              </div>
            </div>
          ) : (
            <div className="eye-closed">
              <svg viewBox="0 0 240 110" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 55 C55 18, 185 18, 220 55" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
                <path d="M20 55 C55 92, 185 92, 220 55" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".18" />
                <path d="M40 57 C80 72, 160 72, 200 57" fill="none" stroke="#f7f3ea" strokeWidth="14" strokeLinecap="round" />
                <path d="M55 57 C90 65, 150 65, 185 57" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      )}

      <div className="tag left">{stage === 0 ? (detected ? "User detected" : "Click to detect") : "Following cursor"}</div>

      {stage >= 2 && stage < 4 && (
        <div className="tag right">
          {stage === 2 ? gesture : gesture === "double nod" ? "double nod + blink" : "blink + autonomous"}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState(0);
  const [detected, setDetected] = useState(false);
  const [score, setScore] = useState(null);
  const [choice, setChoice] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const current = stages[stage];
  const isRating = stage === 4;

  const next = () => {
    if (stage === 0 && !detected) setDetected(true);
    else if (stage === 4) setSubmitted(true);
    else setStage((s) => Math.min(4, s + 1));
  };

  return (
    <main className="page">
      <PhoneFrame>
        <Header stage={stage} setStage={setStage} />

        <div className="meta">
          <span>{current.label}</span>
          <span>{isRating ? "Final" : detected ? "Detected" : "Waiting"}</span>
        </div>

        <h1>{current.title}</h1>
        <p className="desc">{current.desc}</p>

        {!isRating ? (
          <>
            <EyeArea stage={stage} detected={detected} setDetected={setDetected} />
            <div className="instruction">
              <div className="instruction-label">Instruction</div>
              <div className="instruction-text">{current.instruction}</div>
            </div>
          </>
        ) : (
          <RatingPage score={score} setScore={setScore} choice={choice} setChoice={setChoice} submitted={submitted} />
        )}

        <div className="buttons">
          <button disabled={stage === 0} onClick={() => setStage((s) => Math.max(0, s - 1))}>
            Back
          </button>
          <button className="primary" onClick={next}>
            {stage === 4 ? (submitted ? "Submitted" : "Submit Result") : "Next →"}
          </button>
        </div>

        <div className="note">
          Cursor-based prototype. It uses mouse position and movement to simulate detection, gaze following, behavioural response, confirmation, and participant rating.
        </div>
      </PhoneFrame>
    </main>
  );
}

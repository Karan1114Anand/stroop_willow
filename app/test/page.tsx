'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  COLORS,
  COLOR_HEX,
  Color,
  generateBlock1,
  generateBlock2,
  generateBlock3,
  Trial,
  computeMeanRT,
} from '@/lib/stroop';

/* ── Types ── */
type Phase =
  | 'loading'
  | 'between-blocks'
  | 'fixation'
  | 'stimulus'
  | 'missed-flash'
  | 'done';

interface TrialResult {
  trial_number: number;
  block_number: number;
  block_type: string;
  word_shown: Color;
  ink_color: Color;
  user_response: Color | null;
  outcome: 'correct' | 'wrong' | 'missed';
  reaction_time_ms: number | null;
}

const BLOCK_NAMES = ['', 'Congruent', 'Incongruent', 'Time-Constrained Incongruent'];
const BLOCK_TYPES = ['', 'congruent', 'incongruent', 'stress'];

/* ── Main Component ── */
export default function TestPage() {
  const router = useRouter();

  /* Session */
  const [sessionId, setSessionId] = useState<string>('');
  const [participantId, setParticipantId] = useState<string>('');

  /* Phase state */
  const [phase, setPhase] = useState<Phase>('loading');
  const [blockNumber, setBlockNumber] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [buttonOrder, setButtonOrder] = useState<Color[]>([]);

  /* Results */
  const allResults = useRef<TrialResult[]>([]);
  const blockResults = useRef<TrialResult[]>([]);

  /* Timing */
  const stimulusStart = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Block 3 time constraint */
  const [timeConstraintMs, setTimeConstraintMs] = useState<number | null>(null);
  const [timeReductionMs, setTimeReductionMs] = useState<number>(120);
  const [countdownPct, setCountdownPct] = useState(100);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Init ── */
  useEffect(() => {
    const sid = sessionStorage.getItem('stroop_session_id');
    const pid = sessionStorage.getItem('stroop_participant_id');
    if (!sid || !pid) { router.replace('/'); return; }
    setSessionId(sid);
    setParticipantId(pid);
    
    // Fetch time reduction setting
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.time_reduction_ms) {
          setTimeReductionMs(data.time_reduction_ms);
        }
      })
      .catch(console.error);
    
    setPhase('between-blocks');
    setBlockNumber(1);
  }, [router]);

  /* ── Generate trials when block changes ── */
  useEffect(() => {
    if (blockNumber === 0 || phase !== 'between-blocks') return;
    const generated =
      blockNumber === 1 ? generateBlock1() :
      blockNumber === 2 ? generateBlock2() :
      generateBlock3();
    setTrials(generated);
    setTrialIndex(0);
    blockResults.current = [];
  }, [blockNumber, phase]);

  /* ── Button order shuffle ── */
  function shuffleButtons(): Color[] {
    const arr = [...COLORS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ── Start fixation for current trial ── */
  const startFixation = useCallback(() => {
    clearTimeout(timeoutRef.current!);
    clearInterval(countdownInterval.current!);

    const delay = 300 + Math.random() * 200; // 300–500 ms
    setPhase('fixation');
    timeoutRef.current = setTimeout(() => {
      setButtonOrder(shuffleButtons());
      stimulusStart.current = performance.now();
      setPhase('stimulus');
      setCountdownPct(100);

      if (blockNumber === 3 && timeConstraintMs !== null) {
        // countdown bar
        const tick = 50; // ms
        let elapsed = 0;
        countdownInterval.current = setInterval(() => {
          elapsed += tick;
          const pct = Math.max(0, 100 - (elapsed / timeConstraintMs) * 100);
          setCountdownPct(pct);
        }, tick);

        // auto-miss timeout
        timeoutRef.current = setTimeout(() => {
          clearInterval(countdownInterval.current!);
          recordResult(null);
        }, timeConstraintMs);
      }
    }, delay);
  }, [blockNumber, timeConstraintMs]); // eslint-disable-line

  /* ── Record a trial result ── */
  const recordResult = useCallback(
    (clickedColor: Color | null) => {
      clearTimeout(timeoutRef.current!);
      clearInterval(countdownInterval.current!);

      const currentTrial = trials[trialIndex];
      if (!currentTrial) return;

      const rt = clickedColor !== null ? Math.round(performance.now() - stimulusStart.current) : null;
      const outcome: TrialResult['outcome'] =
        clickedColor === null ? 'missed' :
        clickedColor === currentTrial.ink_color ? 'correct' : 'wrong';

      const result: TrialResult = {
        trial_number: currentTrial.trial_number,
        block_number: blockNumber,
        block_type: BLOCK_TYPES[blockNumber],
        word_shown: currentTrial.word_shown,
        ink_color: currentTrial.ink_color,
        user_response: clickedColor,
        outcome,
        reaction_time_ms: rt,
      };

      blockResults.current = [...blockResults.current, result];
      setTrialIndex((prev) => prev + 1);
    },
    [trials, trialIndex, blockNumber]
  );

  /* ── Advance to next trial or end block ── */
  useEffect(() => {
    if (phase !== 'stimulus' && phase !== 'missed-flash') return;
    if (trials.length === 0) return;

    if (trialIndex > 0 && trialIndex <= trials.length) {
      const lastResult = blockResults.current[blockResults.current.length - 1];
      if (!lastResult) return;

      if (lastResult.outcome === 'missed') {
        setPhase('missed-flash');
        setTimeout(() => {
          if (trialIndex < trials.length) {
            startFixation();
          } else {
            endBlock();
          }
        }, 400);
      } else {
        if (trialIndex < trials.length) {
          startFixation();
        } else {
          endBlock();
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trialIndex]);

  /* ── End of a block — save data, advance ── */
  async function endBlock() {
    const rts = blockResults.current.map((r) => r.reaction_time_ms);
    const validRTs = blockResults.current
      .filter((r) => r.outcome !== 'missed')
      .map((r) => r.reaction_time_ms);
    const meanRT = computeMeanRT(validRTs);
    const total = blockResults.current.length;
    const correct = blockResults.current.filter((r) => r.outcome === 'correct').length;
    const missed = blockResults.current.filter((r) => r.outcome === 'missed').length;
    const attempted = total - missed;
    const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

    let tcMs: number | null = null;
    if (blockNumber === 2 && meanRT !== null) {
      tcMs = Math.max(100, meanRT - timeReductionMs); // floor at 100ms, use configurable reduction
      setTimeConstraintMs(tcMs);
    }

    // POST trial data to API
    const payload = {
      trials: blockResults.current.map((r) => ({
        session_id: sessionId,
        participant_id: participantId,
        block_number: r.block_number,
        block_type: r.block_type,
        trial_number: r.trial_number,
        word_shown: r.word_shown,
        ink_color: r.ink_color,
        user_response: r.user_response,
        outcome: r.outcome,
        reaction_time_ms: r.reaction_time_ms,
      })),
      block_summary: {
        block_number: blockNumber,
        mean_rt: meanRT,
        accuracy,
        missed_count: missed,
        time_constraint_ms: tcMs,
      },
    };

    fetch('/api/trials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(console.error);

    allResults.current = [...allResults.current, ...blockResults.current];

    if (blockNumber < 3) {
      setBlockNumber((prev) => prev + 1);
      setPhase('between-blocks');
    } else {
      // All done — compute final metrics and mark session complete
      await finishTest();
    }
  }

  /* ── Finish test — PATCH session complete ── */
  async function finishTest() {
    const all = allResults.current;

    const rts1 = all.filter((r) => r.block_number === 1 && r.outcome !== 'missed').map((r) => r.reaction_time_ms);
    const rts2 = all.filter((r) => r.block_number === 2 && r.outcome !== 'missed').map((r) => r.reaction_time_ms);
    const rts3 = all.filter((r) => r.block_number === 3 && r.outcome !== 'missed').map((r) => r.reaction_time_ms);
    const allValid = all.filter((r) => r.outcome !== 'missed').map((r) => r.reaction_time_ms);

    const meanRT1 = computeMeanRT(rts1);
    const meanRT2 = computeMeanRT(rts2);
    const meanRT3 = computeMeanRT(rts3);
    const overallMeanRT = computeMeanRT(allValid);

    const calc = (block: number) => {
      const blockData = all.filter((r) => r.block_number === block);
      const missed = blockData.filter((r) => r.outcome === 'missed').length;
      const attempted = blockData.length - missed;
      const correct = blockData.filter((r) => r.outcome === 'correct').length;
      return { missed, accuracy: attempted > 0 ? (correct / attempted) * 100 : 0 };
    };

    const b1 = calc(1);
    const b2 = calc(2);
    const b3 = calc(3);

    await fetch(`/api/sessions/${sessionId}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mean_rt_block1: meanRT1,
        mean_rt_block2: meanRT2,
        mean_rt_block3: meanRT3,
        overall_mean_rt: overallMeanRT,
        time_constraint_ms: timeConstraintMs,
        accuracy_block1: b1.accuracy,
        accuracy_block2: b2.accuracy,
        accuracy_block3: b3.accuracy,
        missed_count_block3: b3.missed,
      }),
    }).catch(console.error);

    setPhase('done');
    router.push('/done');
  }

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current!);
      clearInterval(countdownInterval.current!);
    };
  }, []);

  /* ── RENDER ── */
  const currentTrial = trials[trialIndex] ?? null;
  const progress = trials.length > 0 ? (trialIndex / trials.length) * 100 : 0;

  /* Countdown color class */
  const cClass = countdownPct > 60 ? 'ample' : countdownPct > 30 ? 'middle' : 'urgent';

  /* ── Between blocks screen ── */
  if (phase === 'between-blocks') {
    return (
      <div className="test-page">
        <div className="between-block-screen">
          <span className="pill">Section {blockNumber} of 3</span>
          <h1 className="heading" style={{ textAlign: 'center' }}>
            {BLOCK_NAMES[blockNumber]}
          </h1>
          <p className="body-text" style={{ textAlign: 'center', maxWidth: 420 }}>
            {blockNumber === 1 && 'The word and its ink colour will match. Select the ink colour.'}
            {blockNumber === 2 && 'The word and its ink colour will NOT match. Select the ink colour.'}
            {blockNumber === 3 &&
              `This section has a personalised time limit. You must respond before time runs out or the trial will be skipped.`}
          </p>
          <button
            id={`start-block-${blockNumber}-btn`}
            className="btn btn-primary"
            style={{ padding: '0.85rem 2.5rem', fontSize: '1rem' }}
            onClick={startFixation}
          >
            Start Section {blockNumber} →
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (phase === 'loading') {
    return (
      <div className="test-page">
        <div className="between-block-screen">
          <p className="body-text">Preparing your test…</p>
        </div>
      </div>
    );
  }

  /* ── Main test arena ── */
  return (
    <div className="test-page">
      {/* Header */}
      <div className="test-header">
        <span className="block-label">Section {blockNumber} / 3 — {BLOCK_NAMES[blockNumber]}</span>
        <span className="test-header-info">
          Trial {Math.min(trialIndex + 1, trials.length)} of {trials.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-container">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Arena */}
      <div className="test-arena">
        {phase === 'fixation' && (
          <div className="fixation" aria-hidden="true">+</div>
        )}

        {(phase === 'stimulus' || phase === 'missed-flash') && currentTrial && (
          <>
            {/* Stimulus word */}
            <div
              id="stimulus-word"
              className="stimulus-word"
              style={{ color: COLOR_HEX[currentTrial.ink_color] }}
              aria-label={`Ink colour: ${currentTrial.ink_color}`}
            >
              {currentTrial.word_shown}
            </div>

            {/* Countdown bar for Block 3 */}
            {blockNumber === 3 && timeConstraintMs !== null && (
              <div className="countdown-wrap" aria-hidden="true">
                <span className="countdown-label">Time remaining</span>
                <div className="countdown-track">
                  <div
                    className={`countdown-fill ${cClass}`}
                    style={{ width: `${countdownPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Color response buttons */}
            <div className="color-buttons" role="group" aria-label="Select ink colour">
              {buttonOrder.map((color) => (
                <button
                  key={color}
                  id={`color-btn-${color.toLowerCase()}`}
                  className="color-btn"
                  data-color={color}
                  aria-label={color}
                  onClick={() => recordResult(color)}
                />
              ))}
            </div>
          </>
        )}

        {/* Missed flash overlay */}
        {phase === 'missed-flash' && <div className="missed-flash" aria-hidden="true" />}
      </div>
    </div>
  );
}

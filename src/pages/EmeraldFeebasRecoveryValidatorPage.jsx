import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import RseRoute119FeebasMap from "../components/feebas/RseRoute119FeebasMap";
import {
  EMERALD_EASY_CHAT_CONDITIONS,
  EMERALD_EASY_CHAT_SECOND_GROUPS,
  auditEmeraldEasyChatWords
} from "../data/feebas/emeraldEasyChatWords";
import Seo from "../seo/Seo";
import {
  calculateRseFeebasFromValue,
  route119FeebasAudit
} from "../utils/rseFeebasCalculator";
import {
  EMERALD_DEFAULT_MAX_SEARCH_ADVANCES,
  EMERALD_MIN_TREND_SEARCH_ADVANCES,
  EMERALD_NORMAL_RNG_INCREMENT,
  EMERALD_PARITY_CANDIDATE_COUNT,
  findEmeraldFeebasValueCandidates,
  getDewfordPhraseSignature,
  getEmeraldEasyChatAudit,
  normalizeTrainerId
} from "../utils/emeraldFeebasRecovery";
import "./EmeraldFeebasRecoveryValidatorPage.css";

const STORAGE_KEY =
  "pokelore-emerald-feebas-recovery-validation-v1";
const STATUS_UNVERIFIED = "unverified";
const STATUS_MATCH = "match";
const STATUS_MISMATCH = "mismatch";

const TEST_GROUPS = [
  {
    groupLabel: "Group A",
    firstWordIndex: 0,
    secondWordGroup: "lifestyle",
    secondWordIndex: 0,
    trainerIds: [
      "00000",
      "00001",
      "00123",
      "12345",
      "65535"
    ]
  },
  {
    groupLabel: "Group B",
    firstWordIndex: 20,
    secondWordGroup: "hobbies",
    secondWordIndex: 20,
    trainerIds: [
      "00042",
      "00999",
      "22222",
      "40000",
      "54321"
    ]
  },
  {
    groupLabel: "Group C",
    firstWordIndex: 40,
    secondWordGroup: "lifestyle",
    secondWordIndex: 35,
    trainerIds: [
      "01234",
      "10000",
      "32767",
      "50000",
      "60000"
    ]
  },
  {
    groupLabel: "Group D",
    firstWordIndex: 68,
    secondWordGroup: "hobbies",
    secondWordIndex: 53,
    trainerIds: [
      "00007",
      "07000",
      "31415",
      "44444",
      "65000"
    ]
  }
];

const PREDEFINED_TESTS = TEST_GROUPS.flatMap(
  (group, groupIndex) =>
    group.trainerIds.map((trainerId, index) => ({
      id: `${group.groupLabel}-${index + 1}`,
      groupIndex,
      groupLabel: group.groupLabel,
      trainerId,
      firstWordIndex: group.firstWordIndex,
      secondWordGroup: group.secondWordGroup,
      secondWordIndex: group.secondWordIndex
    }))
);

function readSavedState() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      window.localStorage.getItem(STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

function getInitialEntries(saved) {
  return PREDEFINED_TESTS.reduce((entries, test) => {
    const savedEntry = saved?.entries?.[test.id] ?? {};
    entries[test.id] = {
      status: [
        STATUS_UNVERIFIED,
        STATUS_MATCH,
        STATUS_MISMATCH
      ].includes(savedEntry.status)
        ? savedEntry.status
        : STATUS_UNVERIFIED,
      notes: String(savedEntry.notes ?? "")
    };
    return entries;
  }, {});
}

function normalizeSavedIndex(value) {
  const index = Number(value);
  return Number.isInteger(index)
    ? Math.min(
        PREDEFINED_TESTS.length - 1,
        Math.max(0, index)
      )
    : 0;
}

function isFormControl(target) {
  const tagName = target?.tagName?.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    tagName === "button" ||
    target?.isContentEditable
  );
}

function getStatusLabel(status) {
  if (status === STATUS_MATCH) return "Match";
  if (status === STATUS_MISMATCH) return "Mismatch";
  return "Unverified";
}

function useClipboardFeedback() {
  const [feedback, setFeedback] = useState("");

  const copyText = useCallback(async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(`${label} copied.`);
    } catch {
      setFeedback(`Could not copy ${label}.`);
    }
  }, []);

  return [feedback, copyText];
}

function buildDebugJson({
  result,
  downstreamCandidates
}) {
  return {
    game: "emerald",
    trainerId: result.trainerIdDisplay,
    phrase: {
      text: result.phraseSignature.phrase,
      firstWordIndex:
        result.phraseSignature.firstWordIndex,
      firstWord:
        result.phraseSignature.firstWordText,
      secondWordGroup:
        result.phraseSignature.secondWordGroup,
      secondWordGroupBit:
        result.phraseSignature.secondWordGroupBit,
      secondWordIndex:
        result.phraseSignature.secondWordIndex,
      secondWord:
        result.phraseSignature.secondWordText,
      secondGroupSize:
        result.phraseSignature.secondGroupSize
    },
    initialSeed: result.initialSeed,
    initialSeedHex: result.initialSeedHex,
    minimumTrendSearchAdvances:
      result.minimumAdvances,
    candidateCount: result.candidateCount,
    candidates: downstreamCandidates.map(entry => ({
      candidateNumber:
        entry.candidate.candidateNumber,
      value: entry.candidate.value,
      decimal: entry.candidate.decimal,
      scanAdvance: entry.candidate.scanAdvance,
      firstWordState:
        entry.candidate.firstWordStateHex,
      trendRandOffset:
        entry.candidate.trendRandOffset,
      test1: entry.candidate.test1,
      test2: entry.candidate.test2,
      spotIds: entry.downstream.generatedSpotIds,
      coordinates: entry.downstream.coordinates
    }))
  };
}

function EmeraldFeebasRecoveryValidatorPage() {
  const saved = useMemo(() => readSavedState(), []);
  const [testIndex, setTestIndex] = useState(() =>
    normalizeSavedIndex(saved?.currentTestIndex)
  );
  const [entries, setEntries] = useState(() =>
    getInitialEntries(saved)
  );
  const [autoAdvance, setAutoAdvance] = useState(
    Boolean(saved?.autoAdvance)
  );
  const [copyOnAutoAdvance, setCopyOnAutoAdvance] =
    useState(
      saved?.copyOnAutoAdvance === undefined
        ? true
        : Boolean(saved.copyOnAutoAdvance)
    );
  const [mode, setMode] = useState("preset");
  const [customTrainerId, setCustomTrainerId] =
    useState("00000");
  const [customFirstWordIndex, setCustomFirstWordIndex] =
    useState(0);
  const [
    customSecondWordValue,
    setCustomSecondWordValue
  ] = useState("lifestyle:0");
  const [conditionFilter, setConditionFilter] =
    useState("");
  const [secondFilter, setSecondFilter] = useState("");
  const [minimumAdvances, setMinimumAdvances] =
    useState(EMERALD_MIN_TREND_SEARCH_ADVANCES);
  const [candidateCount, setCandidateCount] =
    useState(EMERALD_PARITY_CANDIDATE_COUNT);
  const [maxSearchAdvances, setMaxSearchAdvances] =
    useState(
      EMERALD_DEFAULT_MAX_SEARCH_ADVANCES
    );
  const [
    assumeUnchangedPhrase,
    setAssumeUnchangedPhrase
  ] = useState(true);
  const [
    assumeNoRecordMixing,
    setAssumeNoRecordMixing
  ] = useState(true);
  const [showDiagnostics, setShowDiagnostics] =
    useState(true);
  const [showAllFishingSpots, setShowAllFishingSpots] =
    useState(false);
  const [selectedCandidateIndex, setSelectedCandidateIndex] =
    useState(0);
  const [phraseNotice, setPhraseNotice] =
    useState(null);
  const [feedback, copyText] = useClipboardFeedback();
  const easyChatAudit = useMemo(
    () => getEmeraldEasyChatAudit(),
    []
  );
  const rawAudit = useMemo(
    () => auditEmeraldEasyChatWords(),
    []
  );
  const currentTest = PREDEFINED_TESTS[testIndex];
  const currentEntry = entries[currentTest.id];
  const selectedSecondWord = useMemo(() => {
    const [secondWordGroup, rawIndex] =
      customSecondWordValue.split(":");
    return {
      secondWordGroup,
      secondWordIndex: Number(rawIndex)
    };
  }, [customSecondWordValue]);
  const activeInput = useMemo(() => {
    if (mode === "custom") {
      return {
        trainerId: customTrainerId,
        firstWordIndex: Number(customFirstWordIndex),
        secondWordGroup:
          selectedSecondWord.secondWordGroup,
        secondWordIndex:
          selectedSecondWord.secondWordIndex,
        id: "custom"
      };
    }

    return currentTest;
  }, [
    currentTest,
    customFirstWordIndex,
    customTrainerId,
    mode,
    selectedSecondWord
  ]);
  const normalizedTrainerId = useMemo(
    () => normalizeTrainerId(activeInput.trainerId),
    [activeInput.trainerId]
  );
  const phraseSignature = useMemo(() => {
    try {
      return getDewfordPhraseSignature({
        firstWordIndex: activeInput.firstWordIndex,
        secondWordGroup: activeInput.secondWordGroup,
        secondWordIndex: activeInput.secondWordIndex
      });
    } catch {
      return null;
    }
  }, [activeInput]);
  const canRecover =
    normalizedTrainerId.valid &&
    Boolean(phraseSignature) &&
    rawAudit.valid &&
    route119FeebasAudit.valid;
  const recoveryResult = useMemo(() => {
    if (!canRecover) return null;

    try {
      return findEmeraldFeebasValueCandidates({
        trainerId: normalizedTrainerId.trainerId,
        phraseSignature,
        minimumAdvances: Number(minimumAdvances),
        candidateCount: Number(candidateCount),
        maxSearchAdvances: Number(maxSearchAdvances)
      });
    } catch {
      return null;
    }
  }, [
    canRecover,
    candidateCount,
    maxSearchAdvances,
    minimumAdvances,
    normalizedTrainerId.trainerId,
    phraseSignature
  ]);
  const downstreamCandidates = useMemo(() => {
    if (!recoveryResult) return [];

    return recoveryResult.candidates.map(candidate => ({
      candidate,
      downstream: calculateRseFeebasFromValue(
        candidate.value
      )
    }));
  }, [recoveryResult]);
  const selectedCandidate =
    downstreamCandidates[selectedCandidateIndex] ??
    downstreamCandidates[0] ??
    null;
  const progress = useMemo(
    () =>
      PREDEFINED_TESTS.reduce(
        (counts, test) => {
          const status =
            entries[test.id]?.status ??
            STATUS_UNVERIFIED;
          counts.total += 1;
          counts[status] += 1;
          return counts;
        },
        {
          [STATUS_MATCH]: 0,
          [STATUS_MISMATCH]: 0,
          [STATUS_UNVERIFIED]: 0,
          total: 0
        }
      ),
    [entries]
  );
  const filteredConditions = useMemo(
    () =>
      EMERALD_EASY_CHAT_CONDITIONS.filter(word =>
        word.text
          .toLowerCase()
          .includes(conditionFilter.toLowerCase())
      ),
    [conditionFilter]
  );
  const allSecondWords = useMemo(
    () =>
      Object.entries(
        EMERALD_EASY_CHAT_SECOND_GROUPS
      ).flatMap(([group, words]) =>
        words.map(word => ({
          ...word,
          group,
          value: `${group}:${word.index}`,
          label: `${group.toUpperCase()} ${word.index}: ${word.text}`
        }))
      ),
    []
  );
  const filteredSecondWords = useMemo(
    () =>
      allSecondWords.filter(word =>
        word.label
          .toLowerCase()
          .includes(secondFilter.toLowerCase())
      ),
    [allSecondWords, secondFilter]
  );

  useEffect(() => {
    if (mode !== "preset") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentTestIndex: testIndex,
        entries,
        autoAdvance,
        copyOnAutoAdvance
      })
    );
  }, [
    autoAdvance,
    copyOnAutoAdvance,
    entries,
    mode,
    testIndex
  ]);

  const moveToTest = useCallback(
    async nextIndex => {
      const clamped = Math.min(
        PREDEFINED_TESTS.length - 1,
        Math.max(0, nextIndex)
      );
      const previous = PREDEFINED_TESTS[testIndex];
      const next = PREDEFINED_TESTS[clamped];
      setMode("preset");
      setTestIndex(clamped);
      setSelectedCandidateIndex(0);

      if (previous.groupIndex !== next.groupIndex) {
        const signature = getDewfordPhraseSignature({
          firstWordIndex: next.firstWordIndex,
          secondWordGroup: next.secondWordGroup,
          secondWordIndex: next.secondWordIndex
        });
        setPhraseNotice({
          groupLabel: next.groupLabel,
          phrase: signature.phrase
        });
      }
    },
    [testIndex]
  );

  useEffect(() => {
    const onKeyDown = event => {
      if (isFormControl(event.target)) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveToTest(testIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveToTest(testIndex + 1);
      } else if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        copyText(
          currentTest.trainerId,
          "Trainer ID"
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
  }, [
    copyText,
    currentTest.trainerId,
    moveToTest,
    testIndex
  ]);

  const updateCurrentStatus = useCallback(
    async status => {
      setEntries(previous => ({
        ...previous,
        [currentTest.id]: {
          ...previous[currentTest.id],
          status
        }
      }));

      if (
        status === STATUS_MATCH &&
        autoAdvance &&
        testIndex < PREDEFINED_TESTS.length - 1
      ) {
        const nextTest =
          PREDEFINED_TESTS[testIndex + 1];
        await moveToTest(testIndex + 1);
        if (copyOnAutoAdvance) {
          await copyText(
            nextTest.trainerId,
            "Next Trainer ID"
          );
        }
      }
    },
    [
      autoAdvance,
      copyOnAutoAdvance,
      copyText,
      currentTest.id,
      moveToTest,
      testIndex
    ]
  );

  const updateNotes = value => {
    setEntries(previous => ({
      ...previous,
      [currentTest.id]: {
        ...previous[currentTest.id],
        notes: value
      }
    }));
  };

  const copyCandidateValues = () => {
    copyText(
      downstreamCandidates
        .map(entry => entry.candidate.value)
        .join("\n"),
      "Candidate values"
    );
  };

  const copyDebugJson = () => {
    if (!recoveryResult) return;
    copyText(
      JSON.stringify(
        buildDebugJson({
          result: recoveryResult,
          downstreamCandidates
        }),
        null,
        2
      ),
      "Debug JSON"
    );
  };

  return (
    <main className="emerald-feebas-recovery">
      <Seo
        title="Emerald Feebas Value Recovery Validator | PokeLore"
        description="Developer-only Emerald Trainer ID and Dewford Trend Feebas value recovery validator."
        canonical="https://pokelore.net/dev/emerald-feebas-recovery-validator"
        robots="noindex, nofollow"
      />

      <header className="emerald-recovery-header">
        <div>
          <h1>
            Emerald Feebas Value Recovery Validator
          </h1>
          <p>
            Validate Trainer ID + Dewford Trend → candidate Feebas Values.
          </p>
        </div>
        <section className="emerald-progress-card">
          <h2>Validation Progress</h2>
          <dl>
            <div>
              <dt>Matches</dt>
              <dd>{progress.match}</dd>
            </div>
            <div>
              <dt>Mismatches</dt>
              <dd>{progress.mismatch}</dd>
            </div>
            <div>
              <dt>Unverified</dt>
              <dd>{progress.unverified}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{progress.total}</dd>
            </div>
          </dl>
        </section>
      </header>

      {!rawAudit.valid && (
        <section
          className="emerald-alert"
          role="alert"
        >
          Easy Chat word counts do not match Emerald.
          Recovery is disabled until the data audit passes.
        </section>
      )}

      {(!assumeUnchangedPhrase ||
        !assumeNoRecordMixing) && (
        <section
          className="emerald-alert"
          role="alert"
        >
          This recovery mode assumes the Dewford phrase
          was not manually changed and no record mixing
          changed the trend state.
        </section>
      )}

      {phraseNotice && (
        <section className="emerald-phrase-notice">
          <strong>PHRASE CHANGED</strong>
          <span>
            Update Muck's Dewford Trend to:
            {" "}
            {phraseNotice.phrase}
          </span>
          <button
            type="button"
            onClick={() =>
              copyText(
                phraseNotice.phrase,
                "Phrase"
              )
            }
          >
            Copy Phrase
          </button>
          <button
            type="button"
            onClick={() => setPhraseNotice(null)}
          >
            Dismiss
          </button>
        </section>
      )}

      <section className="emerald-recovery-grid">
        <article className="emerald-current-card">
          <span>
            {mode === "preset"
              ? `${currentTest.groupLabel} / Test ${testIndex + 1} of ${PREDEFINED_TESTS.length}`
              : "Custom Input"}
          </span>
          <strong>
            {normalizedTrainerId.paddedTrainerId ||
              activeInput.trainerId}
          </strong>
          <p>{phraseSignature?.phrase ?? "Invalid phrase"}</p>
          <p>
            {phraseSignature
              ? `Conditions ${phraseSignature.firstWordIndex} / ${phraseSignature.secondWordGroup} ${phraseSignature.secondWordIndex}`
              : "No phrase signature"}
          </p>
        </article>

        <article className="emerald-controls-card">
          <h2>Preset Workflow</h2>
          <div className="emerald-button-row">
            <button
              type="button"
              onClick={() => moveToTest(testIndex - 1)}
              disabled={testIndex === 0}
            >
              Previous Test
            </button>
            <button
              type="button"
              onClick={() =>
                copyText(
                  currentTest.trainerId,
                  "Trainer ID"
                )
              }
            >
              Copy TID
            </button>
            <button
              type="button"
              onClick={() => moveToTest(testIndex + 1)}
              disabled={
                testIndex ===
                PREDEFINED_TESTS.length - 1
              }
            >
              Next Test
            </button>
            <button
              type="button"
              onClick={async () => {
                const next =
                  PREDEFINED_TESTS[testIndex + 1];
                await moveToTest(testIndex + 1);
                if (next) {
                  await copyText(
                    next.trainerId,
                    "Next Trainer ID"
                  );
                }
              }}
              disabled={
                testIndex ===
                PREDEFINED_TESTS.length - 1
              }
            >
              Next + Copy TID
            </button>
          </div>

          <div className="emerald-button-row">
            <button
              type="button"
              className={
                currentEntry.status === STATUS_MATCH
                  ? "active"
                  : ""
              }
              onClick={() =>
                updateCurrentStatus(STATUS_MATCH)
              }
            >
              Mark Match
            </button>
            <button
              type="button"
              className={
                currentEntry.status ===
                STATUS_MISMATCH
                  ? "active is-danger"
                  : "is-danger"
              }
              onClick={() =>
                updateCurrentStatus(STATUS_MISMATCH)
              }
            >
              Mark Mismatch
            </button>
            <button
              type="button"
              onClick={() =>
                updateCurrentStatus(
                  STATUS_UNVERIFIED
                )
              }
            >
              Clear
            </button>
          </div>

          <label className="emerald-field">
            <span>Notes</span>
            <textarea
              value={currentEntry.notes}
              onChange={event =>
                updateNotes(event.target.value)
              }
              rows={3}
            />
          </label>

          <label className="emerald-toggle">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={event =>
                setAutoAdvance(event.target.checked)
              }
            />
            Auto-advance after match
          </label>
          <label className="emerald-toggle">
            <input
              type="checkbox"
              checked={copyOnAutoAdvance}
              onChange={event =>
                setCopyOnAutoAdvance(
                  event.target.checked
                )
              }
            />
            Copy next Trainer ID after match
          </label>
        </article>

        <article className="emerald-controls-card">
          <h2>Custom Input</h2>
          <div className="emerald-button-row">
            <button
              type="button"
              className={
                mode === "preset" ? "active" : ""
              }
              onClick={() => setMode("preset")}
            >
              Preset
            </button>
            <button
              type="button"
              className={
                mode === "custom" ? "active" : ""
              }
              onClick={() => setMode("custom")}
            >
              Custom
            </button>
          </div>
          <label className="emerald-field">
            <span>Trainer ID</span>
            <input
              inputMode="numeric"
              value={customTrainerId}
              onChange={event =>
                {
                  setCustomTrainerId(
                    event.target.value
                  );
                  setSelectedCandidateIndex(0);
                }
              }
            />
          </label>
          <label className="emerald-field">
            <span>Search Conditions</span>
            <input
              value={conditionFilter}
              onChange={event =>
                setConditionFilter(
                  event.target.value
                )
              }
            />
          </label>
          <label className="emerald-field">
            <span>Conditions Word</span>
            <select
              value={customFirstWordIndex}
              onChange={event =>
                {
                  setCustomFirstWordIndex(
                    Number(event.target.value)
                  );
                  setSelectedCandidateIndex(0);
                }
              }
            >
              {filteredConditions.map(word => (
                <option
                  key={word.index}
                  value={word.index}
                >
                  {word.index}: {word.text}
                </option>
              ))}
            </select>
          </label>
          <label className="emerald-field">
            <span>Search Lifestyle/Hobbies</span>
            <input
              value={secondFilter}
              onChange={event =>
                setSecondFilter(event.target.value)
              }
            />
          </label>
          <label className="emerald-field">
            <span>Second Word</span>
            <select
              value={customSecondWordValue}
              onChange={event =>
                {
                  setCustomSecondWordValue(
                    event.target.value
                  );
                  setSelectedCandidateIndex(0);
                }
              }
            >
              {filteredSecondWords.map(word => (
                <option
                  key={word.value}
                  value={word.value}
                >
                  {word.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setMode("custom")}
            disabled={!canRecover}
          >
            Calculate Candidates
          </button>
        </article>
      </section>

      <section className="emerald-recovery-grid emerald-secondary-grid">
        <article className="emerald-diagnostics-card">
          <h2>Phrase Index Debug</h2>
          <dl>
            <div>
              <dt>Trainer ID</dt>
              <dd>
                {normalizedTrainerId.valid
                  ? normalizedTrainerId.paddedTrainerId
                  : normalizedTrainerId.error}
              </dd>
            </div>
            <div>
              <dt>First word</dt>
              <dd>
                {phraseSignature
                  ? `${phraseSignature.firstWordIndex} / ${phraseSignature.firstWordText}`
                  : "-"}
              </dd>
            </div>
            <div>
              <dt>Second group bit</dt>
              <dd>
                {phraseSignature
                  ? `${phraseSignature.secondWordGroup} = ${phraseSignature.secondWordGroupBit}`
                  : "-"}
              </dd>
            </div>
            <div>
              <dt>Second word</dt>
              <dd>
                {phraseSignature
                  ? `${phraseSignature.secondWordIndex} / ${phraseSignature.secondWordText}`
                  : "-"}
              </dd>
            </div>
            <div>
              <dt>Word counts</dt>
              <dd>
                {easyChatAudit.counts.conditions} /{" "}
                {easyChatAudit.counts.lifestyle} /{" "}
                {easyChatAudit.counts.hobbies}
              </dd>
            </div>
          </dl>
        </article>

        <article className="emerald-diagnostics-card">
          <h2>Advanced Diagnostics</h2>
          <label className="emerald-field">
            <span>Min search advance</span>
            <input
              type="number"
              min="0"
              value={minimumAdvances}
              onChange={event =>
                setMinimumAdvances(
                  Number(event.target.value)
                )
              }
            />
          </label>
          <label className="emerald-field">
            <span>Candidate count</span>
            <input
              type="number"
              min="1"
              max="25"
              value={candidateCount}
              onChange={event =>
                setCandidateCount(
                  Number(event.target.value)
                )
              }
            />
          </label>
          <label className="emerald-field">
            <span>Max search guard</span>
            <input
              type="number"
              min={minimumAdvances}
              value={maxSearchAdvances}
              onChange={event =>
                setMaxSearchAdvances(
                  Number(event.target.value)
                )
              }
            />
          </label>
          <label className="emerald-toggle">
            <input
              type="checkbox"
              checked={assumeUnchangedPhrase}
              onChange={event =>
                setAssumeUnchangedPhrase(
                  event.target.checked
                )
              }
            />
            Assume Dewford phrase was not manually changed
          </label>
          <label className="emerald-toggle">
            <input
              type="checkbox"
              checked={assumeNoRecordMixing}
              onChange={event =>
                setAssumeNoRecordMixing(
                  event.target.checked
                )
              }
            />
            Assume no record mixing changed trend state
          </label>
        </article>

        <article className="emerald-diagnostics-card">
          <h2>Recovery Constants</h2>
          <dl>
            <div>
              <dt>Emerald RNG increment</dt>
              <dd>{EMERALD_NORMAL_RNG_INCREMENT}</dd>
            </div>
            <div>
              <dt>Minimum skipped advances</dt>
              <dd>
                {EMERALD_MIN_TREND_SEARCH_ADVANCES}
              </dd>
            </div>
            <div>
              <dt>Parity candidates</dt>
              <dd>
                {EMERALD_PARITY_CANDIDATE_COUNT}
              </dd>
            </div>
            <div>
              <dt>Route 119 dataset</dt>
              <dd>
                {route119FeebasAudit.valid
                  ? "ready"
                  : "blocked"}
              </dd>
            </div>
          </dl>
          <p>
            Timing around VBlank is still uncertain; this validator is for
            Muck parity and upstream value recovery.
          </p>
        </article>
      </section>

      <section className="emerald-candidates-card">
        <div className="emerald-section-header">
          <div>
            <h2>Candidate Feebas Values</h2>
            <p>
              Each value is sent through the existing
              Ruby/Sapphire/Emerald tile calculator.
            </p>
          </div>
          <div className="emerald-button-row">
            <button
              type="button"
              onClick={copyCandidateValues}
              disabled={downstreamCandidates.length === 0}
            >
              Copy Candidate Values
            </button>
            <button
              type="button"
              onClick={copyDebugJson}
              disabled={!recoveryResult}
            >
              Copy Debug JSON
            </button>
            <label className="emerald-toggle">
              <input
                type="checkbox"
                checked={showDiagnostics}
                onChange={event =>
                  setShowDiagnostics(
                    event.target.checked
                  )
                }
              />
              Diagnostics
            </label>
          </div>
        </div>

        <div className="emerald-feedback">
          {feedback}
        </div>

        {!canRecover && (
          <p>
            Candidate recovery is waiting on a valid Trainer ID,
            valid phrase, Easy Chat audit, and Route 119 dataset.
          </p>
        )}

        {downstreamCandidates.length > 0 && (
          <div className="emerald-candidate-list">
            {downstreamCandidates.map((entry, index) => (
              <button
                key={`${entry.candidate.candidateNumber}-${entry.candidate.value}`}
                type="button"
                className={
                  index === selectedCandidateIndex
                    ? "emerald-candidate active"
                    : "emerald-candidate"
                }
                onClick={() =>
                  setSelectedCandidateIndex(index)
                }
              >
                <span>
                  #{entry.candidate.candidateNumber}
                </span>
                <strong>{entry.candidate.value}</strong>
                <small>
                  {entry.downstream.generatedSpotIds.join(
                    ", "
                  )}
                </small>
              </button>
            ))}
          </div>
        )}

        {showDiagnostics &&
          downstreamCandidates.length > 0 && (
          <div className="emerald-diagnostics-table">
            {downstreamCandidates.map(entry => (
              <article
                key={`${entry.candidate.candidateNumber}-diagnostics`}
              >
                <h3>
                  Candidate {entry.candidate.candidateNumber}:{" "}
                  {entry.candidate.value}
                </h3>
                <dl>
                  <div>
                    <dt>Scan advance</dt>
                    <dd>{entry.candidate.scanAdvance}</dd>
                  </div>
                  <div>
                    <dt>First-word state</dt>
                    <dd>
                      {entry.candidate.firstWordStateHex}
                    </dd>
                  </div>
                  <div>
                    <dt>Indexes</dt>
                    <dd>
                      {entry.candidate.phraseMatch
                        .firstWordModulo}{" "}
                      /{" "}
                      {
                        entry.candidate.phraseMatch
                          .secondWordGroupBit
                      }{" "}
                      /{" "}
                      {entry.candidate.phraseMatch
                        .secondWordModulo}
                    </dd>
                  </div>
                  <div>
                    <dt>Branch</dt>
                    <dd>
                      test1 {entry.candidate.test1}; test2{" "}
                      {entry.candidate.test2}; offset +
                      {entry.candidate.trendRandOffset}
                    </dd>
                  </div>
                  <div>
                    <dt>Decimal</dt>
                    <dd>{entry.candidate.decimal}</dd>
                  </div>
                  <div>
                    <dt>Spot IDs</dt>
                    <dd>
                      {entry.downstream.generatedSpotIds.join(
                        ", "
                      )}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedCandidate && (
        <section className="emerald-map-card">
          <div className="emerald-section-header">
            <div>
              <h2>
                Route 119 Preview:{" "}
                {selectedCandidate.candidate.value}
              </h2>
              <p>
                Highlighting candidate spot IDs through the corrected
                444-coordinate Route 119 dataset.
              </p>
            </div>
            <label className="emerald-toggle">
              <input
                type="checkbox"
                checked={showAllFishingSpots}
                onChange={event =>
                  setShowAllFishingSpots(
                    event.target.checked
                  )
                }
              />
              Show all fishing spots
            </label>
          </div>
          <RseRoute119FeebasMap
            spotIds={
              selectedCandidate.downstream.generatedSpotIds
            }
            showAllFishingSpots={showAllFishingSpots}
            showGrid
            showMapImage
          />
        </section>
      )}

      <section className="emerald-table-card">
        <h2>Preset Status</h2>
        <div className="emerald-preset-table">
          {PREDEFINED_TESTS.map((test, index) => {
            const signature = getDewfordPhraseSignature({
              firstWordIndex: test.firstWordIndex,
              secondWordGroup: test.secondWordGroup,
              secondWordIndex: test.secondWordIndex
            });

            return (
              <button
                key={test.id}
                type="button"
                className={
                  index === testIndex ? "active" : ""
                }
                onClick={() => moveToTest(index)}
              >
                <span>{test.trainerId}</span>
                <small>{signature.phrase}</small>
                <b>
                  {getStatusLabel(
                    entries[test.id]?.status
                  )}
                </b>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default EmeraldFeebasRecoveryValidatorPage;

import {
  useMemo,
  useState
} from "react";
import RseRoute119FeebasMap from "../components/feebas/RseRoute119FeebasMap";
import {
  EMERALD_EASY_CHAT_CONDITIONS,
  EMERALD_EASY_CHAT_SECOND_GROUPS
} from "../data/feebas/emeraldEasyChatWords";
import Seo from "../seo/Seo";
import {
  calculateRseFeebasFromValue,
  route119FeebasAudit
} from "../utils/rseFeebasCalculator";
import {
  getDewfordPhraseSignature,
  normalizeTrainerId
} from "../utils/emeraldFeebasRecovery";
import {
  buildTileOverlapSummary,
  filterPriorityTiles
} from "../utils/feebasPriorityMap";
import {
  RS_DEAD_RTC_BOOT_SEED,
  RS_TID_TO_TREND_GAP_CANDIDATES,
  findRsDeadBatteryCandidates,
  findRsWorkingBatteryCandidates
} from "../utils/rsFeebasRecovery";
import { parseRubySapphireSave } from "../utils/emeraldSaveParser";
import "./RsFeebasRecoveryValidatorPage.css";

const DEFAULT_SECOND_WORD = "hobbies:0";

function getSecondWordSelection(value) {
  const [group, rawIndex] = value.split(":");
  return {
    secondWordGroup: group,
    secondWordIndex: Number(rawIndex)
  };
}

function isTrendUsable(trend) {
  return (
    trend?.firstWord?.decoded &&
    trend.firstWord.group === "conditions" &&
    trend?.secondWord?.decoded &&
    ["lifestyle", "hobbies"].includes(
      trend.secondWord.group
    )
  );
}

function formatTrendPhrase(trend) {
  if (!isTrendUsable(trend)) return "unresolved";
  return `${trend.firstWord.text} / ${trend.secondWord.text}`;
}

function RsFeebasRecoveryValidatorPage() {
  const [game, setGame] = useState("ruby");
  const [batteryMode, setBatteryMode] =
    useState("working");
  const [trainerIdInput, setTrainerIdInput] =
    useState("00000");
  const [firstWordIndex, setFirstWordIndex] =
    useState(0);
  const [secondWordValue, setSecondWordValue] =
    useState(DEFAULT_SECOND_WORD);
  const [otherTrendValues, setOtherTrendValues] =
    useState([]);
  const [parseResult, setParseResult] = useState(null);
  const [fileError, setFileError] = useState("");
  const [calculation, setCalculation] = useState(null);
  const [calculationError, setCalculationError] =
    useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [showAllFishingSpots, setShowAllFishingSpots] =
    useState(false);
  const [priorityDisplayMode, setPriorityDisplayMode] =
    useState("tiered");
  const [priorityShowMode, setPriorityShowMode] =
    useState("all");
  const [minimumOverlap, setMinimumOverlap] =
    useState(1);

  const secondWordOptions = useMemo(
    () =>
      Object.entries(
        EMERALD_EASY_CHAT_SECOND_GROUPS
      ).flatMap(([group, words]) =>
        words.map(word => ({
          value: `${group}:${word.index}`,
          label: `${group.toUpperCase()} ${word.index}: ${word.text}`
        }))
      ),
    []
  );
  const secondWordSelection = useMemo(
    () => getSecondWordSelection(secondWordValue),
    [secondWordValue]
  );
  const phraseSignature = useMemo(() => {
    try {
      return getDewfordPhraseSignature({
        firstWordIndex,
        secondWordGroup:
          secondWordSelection.secondWordGroup,
        secondWordIndex:
          secondWordSelection.secondWordIndex
      });
    } catch {
      return null;
    }
  }, [
    firstWordIndex,
    secondWordSelection.secondWordGroup,
    secondWordSelection.secondWordIndex
  ]);
  const additionalPhrases = useMemo(
    () =>
      otherTrendValues
        .map(value => {
          const [firstRaw, secondRaw] =
            value.split("|");
          const second = getSecondWordSelection(secondRaw);
          return getDewfordPhraseSignature({
            firstWordIndex: Number(firstRaw),
            secondWordGroup: second.secondWordGroup,
            secondWordIndex: second.secondWordIndex
          });
        })
        .filter(Boolean),
    [otherTrendValues]
  );
  const exactDownstream = useMemo(() => {
    if (!parseResult?.valid) return null;

    return calculateRseFeebasFromValue(
      parseResult.feebasValue.value
    );
  }, [parseResult]);
  const predictionValues = useMemo(
    () =>
      calculation?.uniqueValues ??
      calculation?.candidates ??
      [],
    [calculation]
  );
  const priorityCandidateValues = useMemo(
    () =>
      predictionValues.map(entry =>
        typeof entry === "string" ? entry : entry.value
      ),
    [predictionValues]
  );
  const prioritySummary = useMemo(() => {
    if (
      batteryMode !== "working" ||
      priorityCandidateValues.length === 0
    ) {
      return null;
    }

    return buildTileOverlapSummary(
      priorityCandidateValues
    );
  }, [batteryMode, priorityCandidateValues]);
  const filteredPriorityTiles = useMemo(() => {
    if (!prioritySummary) return [];

    return filterPriorityTiles(prioritySummary.tiles, {
      showMode: priorityShowMode,
      minimumOverlap
    });
  }, [
    minimumOverlap,
    priorityShowMode,
    prioritySummary
  ]);
  const showPriorityMapByDefault =
    batteryMode === "working" &&
    priorityCandidateValues.length > 10;
  const exactPredictionMatch = useMemo(() => {
    if (!parseResult?.valid || !calculation) return null;
    const value = parseResult.feebasValue.value;
    const match =
      calculation.candidates?.find(
        candidate => candidate.value === value
      ) ??
      calculation.uniqueValues?.find(
        candidate => candidate.value === value
      );

    return match ?? null;
  }, [calculation, parseResult]);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    setParseResult(null);
    setFileError("");
    setCalculation(null);

    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseRubySapphireSave(buffer);
      setParseResult(parsed);

      if (parsed.valid) {
        setTrainerIdInput(
          String(parsed.trainerId ?? 0).padStart(5, "0")
        );
      }
    } catch (error) {
      setFileError(
        error instanceof Error
          ? error.message
          : "Unable to parse Ruby/Sapphire save."
      );
    } finally {
      event.target.value = "";
    }
  }

  function applyStoredTrend(index = 0) {
    const trend =
      parseResult?.storedDewfordTrends?.[index];
    if (!isTrendUsable(trend)) return;

    setFirstWordIndex(trend.firstWord.index);
    setSecondWordValue(
      `${trend.secondWord.group}:${trend.secondWord.index}`
    );
    setCalculation(null);
  }

  function addStoredTrend(index) {
    const trend =
      parseResult?.storedDewfordTrends?.[index];
    if (!isTrendUsable(trend)) return;

    setOtherTrendValues(previous => [
      ...previous,
      `${trend.firstWord.index}|${trend.secondWord.group}:${trend.secondWord.index}`
    ]);
  }

  function calculatePrediction() {
    setCalculationError("");
    setCalculation(null);

    const normalized =
      normalizeTrainerId(trainerIdInput);
    if (!normalized.valid || !phraseSignature) {
      setCalculationError(
        "Trainer ID and current Dewford Trend are required."
      );
      return;
    }

    try {
      const started = performance.now();
      const result =
        batteryMode === "dead"
          ? findRsDeadBatteryCandidates({
              trainerId: normalized.trainerId,
              phraseSignature
            })
          : findRsWorkingBatteryCandidates({
              trainerId: normalized.trainerId,
              phraseSignature,
              additionalPhrases
            });
      setCalculation({
        ...result,
        elapsedMs:
          result.filterCounts?.elapsedMs ??
          performance.now() - started
      });
    } catch (error) {
      setCalculationError(
        error instanceof Error
          ? error.message
          : "R/S prediction failed."
      );
    }
  }

  async function copyRegressionFixture() {
    if (!parseResult?.valid) return;

    const report = {
      game,
      batteryAtNewGame: batteryMode,
      trainerId: parseResult.trainerId,
      storedTrends:
        parseResult.storedDewfordTrends.map(trend => ({
          index: trend.index,
          phrase: formatTrendPhrase(trend),
          firstWord: trend.firstWord.text ?? null,
          firstGroup:
            trend.firstWord.groupLabel ?? null,
          firstIndex: trend.firstWord.index ?? null,
          secondWord:
            trend.secondWord.text ?? null,
          secondGroup:
            trend.secondWord.groupLabel ?? null,
          secondIndex:
            trend.secondWord.index ?? null,
          rand: trend.randHex
        })),
      exactFeebasValue: parseResult.feebasValue.value,
      predictionValues: predictionValues.map(
        value => value.value
      ),
      matchingRecoveryStates:
        exactPredictionMatch?.matchingRecoveryStates ??
        [exactPredictionMatch].filter(Boolean),
      spotIds: exactDownstream?.generatedSpotIds ?? []
    };

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(report, null, 2)
      );
      setCopyFeedback("Regression fixture copied.");
    } catch {
      setCopyFeedback("Could not copy fixture.");
    }
  }

  return (
    <main className="rs-feebas-validator">
      <Seo
        title="Ruby/Sapphire Feebas Recovery Validator | PokeLore"
        description="Developer-only Ruby/Sapphire Route 119 Feebas validation tool."
        canonical="https://pokelore.net/dev/rs-feebas-recovery-validator"
        robots="noindex, nofollow"
      />

      <header className="rs-feebas-header">
        <div>
          <h1>Ruby/Sapphire Feebas Recovery Validator</h1>
          <p>
            Developer-only R/S save extraction and upstream prediction research.
          </p>
        </div>
        <section className="rs-feebas-card">
          <strong>Save extraction is authoritative.</strong>
          <span>
            Battery mode only affects prediction for players without save access.
          </span>
        </section>
      </header>

      <section className="rs-feebas-grid">
        <article className="rs-feebas-card">
          <h2>Inputs</h2>
          <div className="rs-feebas-button-row">
            {["ruby", "sapphire"].map(option => (
              <button
                key={option}
                type="button"
                className={
                  game === option ? "active" : ""
                }
                onClick={() => setGame(option)}
              >
                {option === "ruby" ? "Ruby" : "Sapphire"}
              </button>
            ))}
          </div>
          <label className="rs-feebas-field">
            <span>Battery when New Game was created</span>
            <select
              value={batteryMode}
              onChange={event =>
                setBatteryMode(event.target.value)
              }
            >
              <option value="working">Working</option>
              <option value="dead">
                Dead / RTC invalid
              </option>
            </select>
          </label>
          <label className="rs-feebas-field">
            <span>Trainer ID</span>
            <input
              inputMode="numeric"
              value={trainerIdInput}
              onChange={event =>
                setTrainerIdInput(event.target.value)
              }
            />
          </label>
          <label className="rs-feebas-field">
            <span>Current Dewford Trend: Conditions</span>
            <select
              value={firstWordIndex}
              onChange={event =>
                setFirstWordIndex(
                  Number(event.target.value)
                )
              }
            >
              {EMERALD_EASY_CHAT_CONDITIONS.map(word => (
                <option
                  key={word.index}
                  value={word.index}
                >
                  {word.index}: {word.text}
                </option>
              ))}
            </select>
          </label>
          <label className="rs-feebas-field">
            <span>Current Dewford Trend: second word</span>
            <select
              value={secondWordValue}
              onChange={event =>
                setSecondWordValue(
                  event.target.value
                )
              }
            >
              {secondWordOptions.map(option => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={calculatePrediction}
          >
            Calculate
          </button>
        </article>

        <article className="rs-feebas-card">
          <h2>Ruby/Sapphire Save Upload</h2>
          <p>
            Select Ruby or Sapphire first. The parser uses the shared R/S save profile and does not auto-detect version.
          </p>
          <label className="rs-feebas-field">
            <span>Choose .sav File</span>
            <input
              type="file"
              accept=".sav,application/octet-stream"
              onChange={handleFileChange}
            />
          </label>
          {fileError && (
            <p className="rs-feebas-error">{fileError}</p>
          )}
          {parseResult?.valid && (
            <dl>
              <div>
                <dt>Exact stored Feebas value</dt>
                <dd>{parseResult.feebasValue.value}</dd>
              </div>
              <div>
                <dt>Stored current Dewford trend</dt>
                <dd>
                  {formatTrendPhrase(
                    parseResult.storedDewfordTrends[0]
                  )}
                </dd>
              </div>
              <div>
                <dt>Trainer ID</dt>
                <dd>
                  {String(parseResult.trainerId).padStart(
                    5,
                    "0"
                  )}
                </dd>
              </div>
              <div>
                <dt>Save offset</dt>
                <dd>0x2DD6</dd>
              </div>
            </dl>
          )}
          {parseResult && !parseResult.valid && (
            <ul className="rs-feebas-error">
              {parseResult.errors.map(error => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </article>

        <article className="rs-feebas-card">
          <h2>R/S Constants</h2>
          <dl>
            <div>
              <dt>Dead RTC boot seed</dt>
              <dd>
                0x
                {RS_DEAD_RTC_BOOT_SEED.toString(16)
                  .toUpperCase()
                  .padStart(4, "0")}
              </dd>
            </div>
            <div>
              <dt>Normal RNG increment</dt>
              <dd>24691</dd>
            </div>
            <div>
              <dt>Shared Feebas RNG increment</dt>
              <dd>12345</dd>
            </div>
            <div>
              <dt>Timing gaps tested</dt>
              <dd>
                {RS_TID_TO_TREND_GAP_CANDIDATES.join(
                  ", "
                )}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      {parseResult?.valid && (
        <section className="rs-feebas-card">
          <div className="rs-feebas-section-header">
            <div>
              <h2>Stored Dewford Trends</h2>
              <p>
                R/S profile: base 0x2DD4, rand 0x2DD6, direct sector offset 0xED6.
              </p>
            </div>
            <div className="rs-feebas-button-row">
              <button
                type="button"
                onClick={() => applyStoredTrend(0)}
                disabled={
                  !isTrendUsable(
                    parseResult.storedDewfordTrends[0]
                  )
                }
              >
                Use Stored Current Trend
              </button>
              <button
                type="button"
                onClick={copyRegressionFixture}
              >
                Copy Regression Fixture
              </button>
              <span>{copyFeedback}</span>
            </div>
          </div>
          <div className="rs-trend-grid">
            {parseResult.storedDewfordTrends.map(trend => (
              <article
                className="rs-trend-card"
                key={trend.index}
              >
                <h3>
                  Trend {trend.index}
                  {trend.index === 0 ? " — CURRENT" : ""}
                </h3>
                <dl>
                  <div>
                    <dt>Base</dt>
                    <dd>{trend.baseOffsetHex}</dd>
                  </div>
                  <div>
                    <dt>Rand</dt>
                    <dd>{trend.randHex}</dd>
                  </div>
                  <div>
                    <dt>Phrase</dt>
                    <dd>{formatTrendPhrase(trend)}</dd>
                  </div>
                  <div>
                    <dt>Raw words</dt>
                    <dd>
                      {trend.word0RawHex} / {trend.word1RawHex}
                    </dd>
                  </div>
                </dl>
                {trend.index > 0 && (
                  <button
                    type="button"
                    onClick={() => addStoredTrend(trend.index)}
                    disabled={!isTrendUsable(trend)}
                  >
                    Add As Extra Trend
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {otherTrendValues.length > 0 && (
        <section className="rs-feebas-card">
          <h2>Other Stored Dewford Trends</h2>
          <ul>
            {additionalPhrases.map((phrase, index) => (
              <li key={`${phrase.phrase}-${index}`}>
                {phrase.phrase}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setOtherTrendValues([])}
          >
            Clear Extra Trends
          </button>
        </section>
      )}

      {calculationError && (
        <section className="rs-feebas-error rs-feebas-card">
          {calculationError}
        </section>
      )}

      {calculation && (
        <section className="rs-feebas-card">
          <div className="rs-feebas-section-header">
            <div>
              <h2>Prediction Results</h2>
              <p>
                Mode:{" "}
                {batteryMode === "dead"
                  ? "Dead / RTC invalid"
                  : "Working battery"}
              </p>
            </div>
            <span>
              Elapsed: {Math.round(calculation.elapsedMs)} ms
            </span>
          </div>

          <dl>
            <div>
              <dt>States examined</dt>
              <dd>
                {calculation.filterCounts?.statesExamined ??
                  "dead-RTC scan"}
              </dd>
            </div>
            <div>
              <dt>Surviving current phrase</dt>
              <dd>
                {calculation.filterCounts
                  ?.statesSurvivingCurrentPhrase ??
                  calculation.candidates.length}
              </dd>
            </div>
            <div>
              <dt>Unique Feebas values</dt>
              <dd>{calculation.uniqueValues.length}</dd>
            </div>
            {calculation.filterCounts
              ?.afterAdditionalPhrases?.map((count, index) => (
              <div key={index}>
                <dt>After Trend {index + 2}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>

          {parseResult?.valid && (
            <p>
              Exact save value {parseResult.feebasValue.value}:{" "}
              {exactPredictionMatch
                ? "found in predicted results"
                : "not found in predicted results"}
            </p>
          )}

          <div className="rs-value-grid">
            {predictionValues.slice(0, 40).map((entry, index) => (
              <article
                className={
                  parseResult?.feebasValue?.value ===
                  entry.value
                    ? "rs-value-card exact"
                    : "rs-value-card"
                }
                key={`${entry.value}-${index}`}
              >
                <strong>{entry.value}</strong>
                <span>
                  {entry.matchingRecoveryStates?.length ??
                    1}{" "}
                  state(s)
                </span>
                {entry.matchingRecoveryStates?.[0] && (
                  <small>
                    low16{" "}
                    {entry.matchingRecoveryStates[0]
                      .low16Hex ??
                      entry.matchingRecoveryStates[0]
                        .tidStateHex}
                    {" / "}gap{" "}
                    {
                      entry.matchingRecoveryStates[0]
                        .timingGap
                    }
                  </small>
                )}
              </article>
            ))}
          </div>

          {prioritySummary && (
            <section className="rs-priority-panel">
              <div className="rs-feebas-section-header">
                <div>
                  <h2>Working-Battery Priority Map</h2>
                  <p>
                    These tiles are ranked by how many surviving possible Feebas patterns include them. Higher-priority tiles appear in more possible patterns and are the best places to check first. This is a search-priority map, not a guaranteed exact solution.
                  </p>
                </div>
                {showPriorityMapByDefault && (
                  <strong>Priority map emphasized for large result set</strong>
                )}
              </div>

              <div className="rs-priority-stats">
                <span>
                  Possible Feebas values:{" "}
                  {prioritySummary.totalCandidateValues}
                </span>
                <span>
                  Unique highlighted tiles:{" "}
                  {prioritySummary.totalUniqueTiles}
                </span>
                <span>
                  Maximum overlap:{" "}
                  {prioritySummary.maxOverlapCount}
                </span>
                <span>
                  Average overlap:{" "}
                  {prioritySummary.averageOverlap.toFixed(2)}
                </span>
                <span>
                  High-priority tiles:{" "}
                  {prioritySummary.tierCounts.high}
                </span>
                <span>
                  Medium-priority tiles:{" "}
                  {prioritySummary.tierCounts.medium}
                </span>
                <span>
                  Low-priority tiles:{" "}
                  {prioritySummary.tierCounts.low}
                </span>
              </div>

              <div className="rs-priority-controls">
                <label className="rs-feebas-field">
                  <span>Display mode</span>
                  <select
                    value={priorityDisplayMode}
                    onChange={event =>
                      setPriorityDisplayMode(
                        event.target.value
                      )
                    }
                  >
                    <option value="tiered">
                      Tiered Priority
                    </option>
                    <option value="heatmap">Heatmap</option>
                    <option value="ranked">Ranked List</option>
                  </select>
                </label>
                <label className="rs-feebas-field">
                  <span>Show</span>
                  <select
                    value={priorityShowMode}
                    onChange={event =>
                      setPriorityShowMode(
                        event.target.value
                      )
                    }
                  >
                    <option value="all">
                      All candidate tiles
                    </option>
                    <option value="top10">Top 10 tiles</option>
                    <option value="top25">Top 25 tiles</option>
                    <option value="top50">Top 50 tiles</option>
                    <option value="high">
                      Only highest-priority tier
                    </option>
                  </select>
                </label>
                <label className="rs-feebas-field">
                  <span>Minimum overlap count</span>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(
                      1,
                      prioritySummary.maxOverlapCount
                    )}
                    value={minimumOverlap}
                    onChange={event =>
                      setMinimumOverlap(
                        Number(event.target.value)
                      )
                    }
                  />
                </label>
              </div>

              <div className="rs-priority-legend">
                <span className="high">
                  High: {prioritySummary.legend.high.tileCount}
                </span>
                <span className="medium">
                  Medium:{" "}
                  {prioritySummary.legend.medium.tileCount}
                </span>
                <span className="low">
                  Low: {prioritySummary.legend.low.tileCount}
                </span>
                <small>{prioritySummary.legend.method}</small>
              </div>

              {filteredPriorityTiles.length === 0 ? (
                <p>
                  No tiles match the current priority filters.
                </p>
              ) : priorityDisplayMode === "ranked" ? (
                <div className="rs-priority-ranked-list">
                  {filteredPriorityTiles.map(tile => (
                    <article
                      className="rs-priority-ranked-row"
                      key={`${tile.x}:${tile.y}`}
                    >
                      <strong>#{tile.rank}</strong>
                      <span>
                        x{tile.x},y{tile.y}
                      </span>
                      <span>
                        appears in {tile.count} possible pattern
                        {tile.count === 1 ? "" : "s"}
                      </span>
                      <small>
                        {tile.candidateValues
                          .slice(0, 8)
                          .join(", ")}
                        {tile.candidateValues.length > 8
                          ? ` +${tile.candidateValues.length - 8} more`
                          : ""}
                      </small>
                    </article>
                  ))}
                </div>
              ) : (
                <RseRoute119FeebasMap
                  priorityTiles={filteredPriorityTiles}
                  priorityDisplayMode={priorityDisplayMode}
                  showAllFishingSpots={showAllFishingSpots}
                  showGrid
                  showMapImage
                />
              )}
            </section>
          )}
        </section>
      )}

      {parseResult?.valid && exactDownstream && (
        <section className="rs-feebas-card">
          <div className="rs-feebas-section-header">
            <div>
              <h2>Exact Route 119 Tiles</h2>
              <p>
                Uses the shared validated RSE Feebas calculator and corrected Route 119 dataset.
              </p>
            </div>
            <label className="rs-feebas-toggle">
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
          <p>
            Spot IDs:{" "}
            {exactDownstream.generatedSpotIds.join(", ")}
          </p>
          <RseRoute119FeebasMap
            spotIds={exactDownstream.generatedSpotIds}
            showAllFishingSpots={showAllFishingSpots}
            showGrid
            showMapImage
          />
        </section>
      )}

      {!route119FeebasAudit.valid && (
        <section className="rs-feebas-card rs-feebas-error">
          Route 119 dataset audit failed.
        </section>
      )}
    </main>
  );
}

export default RsFeebasRecoveryValidatorPage;

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { parseDegreeAuditPdf } from "../assets/js/api/aiApi";
import { UNCG_PROGRAMS } from "../data/uncg-degree-plans";

const STORAGE_KEY = "uncg-degree-planner-state";
const DEFAULT_PROGRAM = UNCG_PROGRAMS[0];

function flattenCourses(groups) {
  return groups.flatMap((group) =>
    group.courses.map((course) => ({
      ...course,
      groupId: group.id,
      groupTitle: group.title,
    }))
  );
}

function dedupeCourses(courses) {
  const seen = new Set();
  return courses.filter((course) => {
    if (seen.has(course.code)) {
      return false;
    }
    seen.add(course.code);
    return true;
  });
}

function normalizeText(value) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getProgramById(programId) {
  return UNCG_PROGRAMS.find((program) => program.id === programId) || DEFAULT_PROGRAM;
}

function pickProgram(parsedAudit) {
  if (!parsedAudit) {
    return DEFAULT_PROGRAM;
  }

  const searchText = normalizeText(
    [parsedAudit.degreeName, parsedAudit.major, parsedAudit.summary].filter(Boolean).join(" ")
  );

  let bestProgram = DEFAULT_PROGRAM;
  let bestScore = -1;

  UNCG_PROGRAMS.forEach((program) => {
    const programText = normalizeText([program.name, program.overview].join(" "));
    let score = 0;

    searchText.split(" ").forEach((token) => {
      if (token && programText.includes(token)) {
        score += 1;
      }
    });

    if (programText.includes(normalizeText(parsedAudit.degreeName))) {
      score += 8;
    }
    if (programText.includes(normalizeText(parsedAudit.major))) {
      score += 8;
    }

    if (score > bestScore) {
      bestScore = score;
      bestProgram = program;
    }
  });

  return bestProgram;
}

function pickOption(options, preferredValue) {
  if (!options?.length) {
    return "";
  }
  const normalizedPreferred = normalizeText(preferredValue);
  if (!normalizedPreferred) {
    return options[0].id;
  }

  let bestOption = options[0];
  let bestScore = -1;

  options.forEach((option) => {
    const optionText = normalizeText(option.name);
    let score = 0;

    normalizedPreferred.split(" ").forEach((token) => {
      if (token && optionText.includes(token)) {
        score += 1;
      }
    });

    if (optionText.includes(normalizedPreferred)) {
      score += 6;
    }

    if (score > bestScore) {
      bestScore = score;
      bestOption = option;
    }
  });

  return bestScore <= 0 ? options[0].id : bestOption.id;
}

function normalizeCourseCode(value) {
  const normalized = (value || "").toUpperCase().replace(/[^A-Z0-9]/g, " ").replace(/\s+/g, " ").trim();
  const match = normalized.match(/^([A-Z]{2,4})\s?(\d{3}[A-Z]?)$/);
  if (!match) {
    return normalized;
  }
  return `${match[1]} ${match[2]}`;
}

function buildInitialState(storedState) {
  const parsedAudit = storedState?.parsedAudit || null;
  const initialProgram = getProgramById(storedState?.programId);

  return {
    parsedAudit,
    uploadSkipped: Boolean(storedState?.uploadSkipped),
    programId: initialProgram.id,
    catalogYear:
      storedState?.catalogYear && initialProgram.catalogYears.includes(storedState.catalogYear)
        ? storedState.catalogYear
        : initialProgram.catalogYears[0],
    concentrationId:
      storedState?.concentrationId && initialProgram.concentrations.some((item) => item.id === storedState.concentrationId)
        ? storedState.concentrationId
        : initialProgram.concentrations[0]?.id ?? "",
    minorId:
      storedState?.minorId && initialProgram.minors.some((item) => item.id === storedState.minorId)
        ? storedState.minorId
        : initialProgram.minors[0]?.id ?? "",
    creditsPerTerm: storedState?.creditsPerTerm || 15,
    completedCourses: storedState?.completedCourses || [],
  };
}

export default function ExploreTopics() {
  const storedState = loadStoredState();
  const initialState = buildInitialState(storedState);

  const [parsedAudit, setParsedAudit] = useState(initialState.parsedAudit);
  const [uploadSkipped, setUploadSkipped] = useState(initialState.uploadSkipped);
  const [programId, setProgramId] = useState(initialState.programId);
  const [catalogYear, setCatalogYear] = useState(initialState.catalogYear);
  const [concentrationId, setConcentrationId] = useState(initialState.concentrationId);
  const [minorId, setMinorId] = useState(initialState.minorId);
  const [creditsPerTerm, setCreditsPerTerm] = useState(initialState.creditsPerTerm);
  const [completedCourses, setCompletedCourses] = useState(initialState.completedCourses);
  const [takenCourseFilter, setTakenCourseFilter] = useState("");
  const [remainingCourseFilter, setRemainingCourseFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const selectorScrollRef = useRef(null);
  const pendingSelectorScrollTopRef = useRef(null);

  const program = useMemo(() => getProgramById(programId), [programId]);

  useEffect(() => {
    if (!program.catalogYears.includes(catalogYear)) {
      setCatalogYear(program.catalogYears[0]);
    }
    if (!program.concentrations.some((item) => item.id === concentrationId)) {
      setConcentrationId(program.concentrations[0]?.id ?? "");
    }
    if (!program.minors.some((item) => item.id === minorId)) {
      setMinorId(program.minors[0]?.id ?? "");
    }
  }, [program, catalogYear, concentrationId, minorId]);

  const concentration = useMemo(
    () => program.concentrations.find((item) => item.id === concentrationId) || program.concentrations[0],
    [program, concentrationId]
  );
  const minor = useMemo(
    () => program.minors.find((item) => item.id === minorId) || program.minors[0],
    [program, minorId]
  );

  const requirementGroups = useMemo(
    () => [...program.requirementGroups, ...(concentration?.requirementGroups || []), ...(minor?.requirementGroups || [])],
    [program, concentration, minor]
  );

  const requiredCourses = useMemo(() => dedupeCourses(flattenCourses(requirementGroups)), [requirementGroups]);
  const validCourseCodes = useMemo(() => new Set(requiredCourses.map((course) => course.code)), [requiredCourses]);

  useEffect(() => {
    setCompletedCourses((prev) => prev.filter((code) => validCourseCodes.has(code)));
  }, [validCourseCodes]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        parsedAudit,
        uploadSkipped,
        programId,
        catalogYear,
        concentrationId,
        minorId,
        creditsPerTerm,
        completedCourses,
      })
    );
  }, [parsedAudit, uploadSkipped, programId, catalogYear, concentrationId, minorId, creditsPerTerm, completedCourses]);

  const completedSet = useMemo(() => new Set(completedCourses), [completedCourses]);
  const importedCompletedCourses = useMemo(
    () => Array.from(new Set((parsedAudit?.completedCourses || []).map(normalizeCourseCode).filter(Boolean))),
    [parsedAudit]
  );
  const importedInProgressCourses = useMemo(
    () => Array.from(new Set((parsedAudit?.inProgressCourses || []).map(normalizeCourseCode).filter(Boolean))),
    [parsedAudit]
  );
  const importedRemainingCourses = useMemo(
    () => Array.from(new Set((parsedAudit?.remainingCourses || []).map(normalizeCourseCode).filter(Boolean))),
    [parsedAudit]
  );
  const importedNextUpCourses = useMemo(() => {
    const inProgress = importedInProgressCourses.map((code) => ({ code, label: "In progress" }));
    const remaining = importedRemainingCourses
      .filter((code) => !importedInProgressCourses.includes(code))
      .slice(0, 8)
      .map((code) => ({ code, label: "Remaining requirement" }));
    return [...inProgress, ...remaining].slice(0, 8);
  }, [importedInProgressCourses, importedRemainingCourses]);

  const completedCount = requiredCourses.filter((course) => completedSet.has(course.code)).length;
  const remainingCourses = requiredCourses.filter((course) => !completedSet.has(course.code));
  const remainingCredits = remainingCourses.reduce((sum, course) => sum + course.credits, 0);
  const readyNowCourses = remainingCourses.filter((course) => (course.prereqs || []).every((prereq) => completedSet.has(prereq)));
  const blockedCourses = remainingCourses.filter((course) => (course.prereqs || []).some((prereq) => !completedSet.has(prereq)));

  const unlockCounts = useMemo(() => {
    const counts = new Map();
    remainingCourses.forEach((course) => {
      (course.prereqs || []).forEach((prereq) => {
        counts.set(prereq, (counts.get(prereq) || 0) + 1);
      });
    });
    return counts;
  }, [remainingCourses]);

  const recommendedCourses = [...readyNowCourses]
    .sort((a, b) => {
      const unlockDelta = (unlockCounts.get(b.code) || 0) - (unlockCounts.get(a.code) || 0);
      if (unlockDelta !== 0) {
        return unlockDelta;
      }
      return a.code.localeCompare(b.code);
    })
    .slice(0, 6);

  const estimatedTerms = remainingCredits === 0 ? 0 : Math.ceil(remainingCredits / creditsPerTerm);
  const completionPercent = requiredCourses.length === 0 ? 0 : Math.round((completedCount / requiredCourses.length) * 100);

  const takenQuery = takenCourseFilter.trim().toLowerCase();
  const filteredAvailableCourses = requiredCourses.filter((course) => {
    if (!takenQuery) {
      return true;
    }
    return course.code.toLowerCase().includes(takenQuery) || course.title.toLowerCase().includes(takenQuery);
  });

  const remainingQuery = remainingCourseFilter.trim().toLowerCase();
  const filteredRemainingGroups = requirementGroups
    .map((group) => ({
      ...group,
      courses: group.courses.filter((course) => {
        if (completedSet.has(course.code)) {
          return false;
        }
        if (!remainingQuery) {
          return true;
        }
        return course.code.toLowerCase().includes(remainingQuery) || course.title.toLowerCase().includes(remainingQuery);
      }),
    }))
    .filter((group) => group.courses.length > 0);

  function applyParsedAuditData(audit) {
    const matchedProgram = pickProgram(audit);
    const matchedConcentrationId = pickOption(matchedProgram.concentrations, audit.concentration);
    const matchedMinorId = pickOption(matchedProgram.minors, audit.minor);
    const matchedCatalogYear = matchedProgram.catalogYears[0];

    const matchedConcentration =
      matchedProgram.concentrations.find((item) => item.id === matchedConcentrationId) || matchedProgram.concentrations[0];
    const matchedMinor =
      matchedProgram.minors.find((item) => item.id === matchedMinorId) || matchedProgram.minors[0];

    const allCourseCodes = new Set(
      dedupeCourses(
        flattenCourses([
          ...matchedProgram.requirementGroups,
          ...(matchedConcentration?.requirementGroups || []),
          ...(matchedMinor?.requirementGroups || []),
        ])
      ).map((course) => course.code)
    );

    const parsedCompletedCodes = Array.from(
      new Set((audit.completedCourses || []).map(normalizeCourseCode).filter((code) => allCourseCodes.has(code)))
    );

    setParsedAudit(audit);
    setUploadSkipped(false);
    setProgramId(matchedProgram.id);
    setCatalogYear(matchedCatalogYear);
    setConcentrationId(matchedConcentrationId);
    setMinorId(matchedMinorId);
    setCompletedCourses(parsedCompletedCodes);
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFileName(file.name);
    setUploading(true);
    setUploadError("");

    try {
      const audit = await parseDegreeAuditPdf(file);
      applyParsedAuditData(audit);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function toggleCourse(code) {
    if (selectorScrollRef.current) {
      pendingSelectorScrollTopRef.current = selectorScrollRef.current.scrollTop;
    }
    setCompletedCourses((prev) => (prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]));
  }

  useLayoutEffect(() => {
    if (selectorScrollRef.current && pendingSelectorScrollTopRef.current != null) {
      selectorScrollRef.current.scrollTop = pendingSelectorScrollTopRef.current;
      pendingSelectorScrollTopRef.current = null;
    }
  }, [completedCourses]);

  function resetPlanner() {
    setCompletedCourses([]);
    setTakenCourseFilter("");
    setRemainingCourseFilter("");
    setCreditsPerTerm(15);
  }

  function resetAuditImport() {
    setParsedAudit(null);
    setUploadSkipped(false);
    setCompletedCourses([]);
    setUploadError("");
    setSelectedFileName("");
  }

  const needsUpload = !parsedAudit && !uploadSkipped;
  const importedAuditMode = Boolean(parsedAudit);

  if (needsUpload) {
    return (
      <>
        <Helmet>
          <title>UNCG Planner</title>
        </Helmet>

        <main className="main main--topics">
          <section className="plannerUploadShell">
            <article className="plannerUploadHero">
              <span className="plannerHero__badge">UNCG only</span>
              <h1>Upload Your Degree Works PDF</h1>
              <p>
                Start the UNCG Planner by uploading a full PDF export of your Degree Works audit.
                Spartan Scholars will use the OpenAI API to sort through the audit and prefill your plan.
              </p>

              <div className="plannerUploadSteps">
                <h2>How to export it</h2>
                <ol>
                  <li>Go to your UNCG Degree Works from the iSpartan main page.</li>
                  <li>After in Degree Works, click the print button toward the top right below where your name is displayed.</li>
                  <li>Keep the settings the same and hit <strong>View PDF</strong>.</li>
                  <li>Once it loads, press the download button in the top right and upload the file here.</li>
                </ol>
              </div>
            </article>

            <article className="plannerUploadCard">
              <div className="plannerCard__heading">
                <h2>Import Degree Audit</h2>
                <p>Best results come from the full PDF export, not screenshots.</p>
              </div>

              <label className={`plannerDropzone ${uploading ? "plannerDropzone--busy" : ""}`} htmlFor="degreeAuditFile">
                <input
                  id="degreeAuditFile"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                <div className="plannerDropzone__icon">PDF</div>
                <h3>{uploading ? "Parsing your Degree Works audit..." : "Choose Degree Works PDF"}</h3>
                <p>
                  {selectedFileName
                    ? `Selected: ${selectedFileName}`
                    : "Upload the downloaded PDF from Degree Works and the planner will do the rest."}
                </p>
              </label>

              {uploadError && <p className="quizError">{uploadError}</p>}

              <div className="plannerUploadHint">
                <strong>What gets pulled out?</strong>
                <p>Degree, concentration, minor, completed courses, in-progress courses, and a clean summary for the planner view.</p>
              </div>

              <button
                type="button"
                className="plannerAction plannerAction--secondary"
                onClick={() => setUploadSkipped(true)}
                disabled={uploading}
              >
                Skip For Now And Build Manually
              </button>
            </article>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>UNCG Degree Planner</title>
      </Helmet>

      <main className="main main--topics">
        <section className="plannerHero">
          <div className="plannerHero__copy">
            <span className="plannerHero__badge">UNCG only</span>
            <h1>UNCG Degree Planner</h1>
            <p>
              Built for University of North Carolina Greensboro students. Upload a Degree Works PDF to prefill this planner,
              then adjust anything manually before deciding what to take next.
            </p>
          </div>

          <div className="plannerHero__panel">
            <div className="plannerHero__school">University of North Carolina Greensboro</div>
            <div className="plannerHero__meta">{program.college}</div>
            <div className="plannerHero__program">{program.name}</div>
            <p>{program.overview}</p>
          </div>
        </section>

        {parsedAudit && (
          <section className="plannerAuditBanner">
            <div>
              <strong>Imported from Degree Works PDF</strong>
              <p>{parsedAudit.summary || "Audit imported from Degree Works."}</p>
              <p className="plannerAuditBanner__meta">
                {parsedAudit.degreeName || "UNCG degree"}{parsedAudit.concentration ? ` • ${parsedAudit.concentration}` : ""}{parsedAudit.minor ? ` • Minor: ${parsedAudit.minor}` : ""}
              </p>
            </div>
            <button type="button" className="plannerAction plannerAction--secondary" onClick={resetAuditImport}>
              Upload A New Audit
            </button>
          </section>
        )}

        {importedAuditMode ? (
          <>
            <section className="plannerControls">
              <article className="plannerCard plannerCard--summary">
                <div className="plannerCard__heading">
                  <h2>Degree Works Snapshot</h2>
                  <p>
                    This view is driven directly by your uploaded audit instead of the seeded planner dataset.
                  </p>
                </div>

                <div className="plannerStats">
                  <article className="plannerStat">
                    <span>Completed</span>
                    <strong>{importedCompletedCourses.length}</strong>
                    <p>Courses the parser found as completed in your Degree Works PDF.</p>
                  </article>
                  <article className="plannerStat">
                    <span>In Progress</span>
                    <strong>{importedInProgressCourses.length}</strong>
                    <p>Classes currently underway according to the audit.</p>
                  </article>
                  <article className="plannerStat">
                    <span>Remaining</span>
                    <strong>{importedRemainingCourses.length}</strong>
                    <p>Courses or requirements still listed as remaining in the audit.</p>
                  </article>
                  <article className="plannerStat">
                    <span>Detected Program</span>
                    <strong>{parsedAudit.major || program.name}</strong>
                    <p>{parsedAudit.concentration || "No concentration detected"}</p>
                  </article>
                </div>
              </article>

              <article className="plannerCard plannerCard--recommendations">
                <div className="plannerCard__heading">
                  <h2>Next Up From Audit</h2>
                  <p>These come from your imported audit, not from the simplified seeded requirement model.</p>
                </div>

                {importedNextUpCourses.length === 0 ? (
                  <p className="plannerEmpty">No next-up courses were detected from the uploaded audit.</p>
                ) : (
                  <div className="plannerRecommendationList">
                    {importedNextUpCourses.map((item) => (
                      <article key={`${item.label}-${item.code}`} className="plannerRecommendation">
                        <div>
                          <strong>{item.code}</strong>
                          <h3>{item.label}</h3>
                          <p>Imported from Degree Works</p>
                        </div>
                        <span>{item.label}</span>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </section>

            <section className="plannerTwoColumn">
              <section className="plannerCard plannerCard--taken">
                <div className="plannerCard__heading">
                  <h2>Completed Courses</h2>
                  <p>Directly parsed from the uploaded Degree Works PDF.</p>
                </div>

                <div className="plannerCourseSelector">
                  {importedCompletedCourses.map((code) => (
                    <article key={code} className="plannerCourse plannerCourse--done">
                      <div className="plannerCourse__body">
                        <div className="plannerCourse__top">
                          <strong>{code}</strong>
                          <span>Done</span>
                        </div>
                        <h4>Completed course from audit</h4>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="plannerCard plannerCard--remainingCourses">
                <div className="plannerCard__heading">
                  <h2>Still Needed According To Audit</h2>
                  <p>This list is shown straight from Degree Works parsing so it should be closer to your real graduation status.</p>
                </div>

                <div className="plannerChecklist">
                  {importedInProgressCourses.length > 0 && (
                    <article className="plannerChecklistGroup">
                      <div className="plannerChecklistGroup__header">
                        <h3>Currently In Progress</h3>
                        <span>{importedInProgressCourses.length}</span>
                      </div>
                      <div className="plannerCourseList">
                        {importedInProgressCourses.map((code) => (
                          <article key={code} className="plannerCourse">
                            <div className="plannerCourse__body">
                              <div className="plannerCourse__top">
                                <strong>{code}</strong>
                              </div>
                              <h4>Course in progress</h4>
                              <p>Detected from Degree Works PDF.</p>
                            </div>
                            <span className="plannerCourse__status plannerCourse__status--ready">In progress</span>
                          </article>
                        ))}
                      </div>
                    </article>
                  )}

                  <article className="plannerChecklistGroup">
                    <div className="plannerChecklistGroup__header">
                      <h3>Remaining Courses</h3>
                      <span>{importedRemainingCourses.length}</span>
                    </div>
                    <div className="plannerCourseList">
                      {importedRemainingCourses.map((code) => (
                        <article key={code} className="plannerCourse">
                          <div className="plannerCourse__body">
                            <div className="plannerCourse__top">
                              <strong>{code}</strong>
                            </div>
                            <h4>Remaining requirement</h4>
                            <p>Imported from Degree Works PDF.</p>
                          </div>
                          <span className="plannerCourse__status plannerCourse__status--blocked">Remaining</span>
                        </article>
                      ))}
                    </div>
                  </article>
                </div>
              </section>
            </section>
          </>
        ) : (
        <>
        <section className="plannerControls">
          <article className="plannerCard plannerCard--form">
            <div className="plannerCard__heading">
              <h2>Build Your Plan</h2>
              <p>Set your UNCG path and refine anything the PDF parser did not catch perfectly.</p>
            </div>

            <div className="plannerFormGrid">
              <label className="plannerField">
                <span>Degree Program</span>
                <select value={programId} onChange={(event) => setProgramId(event.target.value)}>
                  {UNCG_PROGRAMS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="plannerField">
                <span>Catalog Year</span>
                <select value={catalogYear} onChange={(event) => setCatalogYear(event.target.value)}>
                  {program.catalogYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <label className="plannerField">
                <span>{program.concentrationLabel}</span>
                <select value={concentrationId} onChange={(event) => setConcentrationId(event.target.value)}>
                  {program.concentrations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="plannerField">
                <span>{program.minorLabel}</span>
                <select value={minorId} onChange={(event) => setMinorId(event.target.value)}>
                  {program.minors.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="plannerField">
                <span>Target Credits Per Term</span>
                <select value={creditsPerTerm} onChange={(event) => setCreditsPerTerm(Number(event.target.value))}>
                  {[12, 15, 18].map((value) => (
                    <option key={value} value={value}>
                      {value} credits
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="plannerActions">
              <button type="button" className="plannerAction plannerAction--secondary" onClick={resetPlanner}>
                Reset Completed Courses
              </button>
            </div>
          </article>

          <article className="plannerCard plannerCard--summary">
            <div className="plannerCard__heading">
              <h2>Audit Snapshot</h2>
              <p>{program.note}</p>
            </div>

            <div className="plannerProgress">
              <div className="plannerProgress__row">
                <span>Completion</span>
                <strong>{completionPercent}%</strong>
              </div>
              <div className="plannerProgress__bar">
                <span style={{ width: `${completionPercent}%` }}></span>
              </div>
            </div>

            <div className="plannerStats">
              <article className="plannerStat">
                <span>Completed</span>
                <strong>{completedCount}</strong>
                <p>Required courses already checked off.</p>
              </article>
              <article className="plannerStat">
                <span>Remaining</span>
                <strong>{remainingCourses.length}</strong>
                <p>Courses still left in this planner.</p>
              </article>
              <article className="plannerStat">
                <span>Ready Next</span>
                <strong>{readyNowCourses.length}</strong>
                <p>Courses whose prerequisites are already met.</p>
              </article>
              <article className="plannerStat">
                <span>Estimated Terms</span>
                <strong>{estimatedTerms}</strong>
                <p>Based on a {creditsPerTerm}-credit planning load.</p>
              </article>
            </div>
          </article>
        </section>

        <section className="plannerBoard">
          <article className="plannerCard plannerCard--recommendations">
            <div className="plannerCard__heading">
              <h2>Suggested Next Courses</h2>
              <p>Courses are ranked by how many later requirements they unlock.</p>
            </div>

            {recommendedCourses.length === 0 ? (
              <p className="plannerEmpty">Everything in this planner is either complete or blocked behind another prerequisite.</p>
            ) : (
              <div className="plannerRecommendationList">
                {recommendedCourses.map((course) => (
                  <article key={course.code} className="plannerRecommendation">
                    <div>
                      <strong>{course.code}</strong>
                      <h3>{course.title}</h3>
                      <p>{course.groupTitle}</p>
                    </div>
                    <span>{unlockCounts.get(course.code) || 0} unlocks</span>
                  </article>
                ))}
              </div>
            )}

            {blockedCourses.length > 0 && (
              <div className="plannerBlocked">
                <h3>Still blocked</h3>
                <div className="plannerPills">
                  {blockedCourses.slice(0, 6).map((course) => (
                    <span key={course.code} className="plannerPill">
                      {course.code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          <article className="plannerCard plannerCard--remaining">
            <div className="plannerCard__heading">
              <h2>Remaining Requirement Areas</h2>
              <p>Use this as the high-level view of what parts of the degree still need work.</p>
            </div>

            <div className="plannerAreaList">
              {requirementGroups.map((group) => {
                const groupCompleted = group.courses.filter((course) => completedSet.has(course.code)).length;
                const groupRemaining = group.courses.length - groupCompleted;
                return (
                  <article key={group.id} className="plannerAreaCard">
                    <div className="plannerAreaCard__top">
                      <h3>{group.title}</h3>
                      <span>{groupRemaining} left</span>
                    </div>
                    <p>
                      {groupCompleted} of {group.courses.length} complete
                    </p>
                  </article>
                );
              })}
            </div>
          </article>
        </section>

        <section className="plannerTwoColumn">
          <section className="plannerCard plannerCard--taken">
            <div className="plannerCard__heading">
              <h2>Classes You Have Already Taken</h2>
              <p>Search the current degree path, then check off courses you have completed.</p>
            </div>

            <label className="plannerField plannerField--search">
              <span>Search completed-course selector</span>
              <input
                value={takenCourseFilter}
                onChange={(event) => setTakenCourseFilter(event.target.value)}
                placeholder="Ex: CSC 130, calculus, biology"
              />
            </label>

            {completedCourses.length > 0 && (
              <div className="plannerSelected">
                <h3>Selected as completed</h3>
                <div className="plannerPills">
                  {completedCourses
                    .slice()
                    .sort((a, b) => a.localeCompare(b))
                    .map((code) => (
                      <button key={code} type="button" className="plannerPill plannerPill--interactive" onClick={() => toggleCourse(code)}>
                        {code}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="plannerCourseSelector" ref={selectorScrollRef}>
              {filteredAvailableCourses.map((course) => {
                const checked = completedSet.has(course.code);
                return (
                  <label key={course.code} className={`plannerCourse plannerCourse--selector ${checked ? "plannerCourse--done" : ""}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleCourse(course.code)} />
                    <div className="plannerCourse__body">
                      <div className="plannerCourse__top">
                        <strong>{course.code}</strong>
                        <span>{course.credits} cr</span>
                      </div>
                      <h4>{course.title}</h4>
                      <p>{course.groupTitle}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="plannerCard plannerCard--remainingCourses">
            <div className="plannerCard__heading">
              <h2>Classes You Still Need</h2>
              <p>Remaining courses for the selected UNCG plan, with prerequisites shown inline.</p>
            </div>

            <label className="plannerField plannerField--search">
              <span>Search remaining courses</span>
              <input
                value={remainingCourseFilter}
                onChange={(event) => setRemainingCourseFilter(event.target.value)}
                placeholder="Find a remaining course"
              />
            </label>

            <div className="plannerChecklist">
              {filteredRemainingGroups.map((group) => (
                <article key={group.id} className="plannerChecklistGroup">
                  <div className="plannerChecklistGroup__header">
                    <h3>{group.title}</h3>
                    <span>{group.courses.length} left</span>
                  </div>

                  <div className="plannerCourseList">
                    {group.courses.map((course) => {
                      const readyNow = (course.prereqs || []).every((prereq) => completedSet.has(prereq));
                      return (
                        <article key={course.code} className="plannerCourse">
                          <div className="plannerCourse__body">
                            <div className="plannerCourse__top">
                              <strong>{course.code}</strong>
                              <span>{course.credits} cr</span>
                            </div>
                            <h4>{course.title}</h4>
                            <p>
                              {course.prereqs?.length
                                ? `Prereqs: ${course.prereqs.join(", ")}`
                                : "Prereqs: none listed in this planner"}
                            </p>
                          </div>
                          <span className={`plannerCourse__status ${readyNow ? "plannerCourse__status--ready" : "plannerCourse__status--blocked"}`}>
                            {readyNow ? "Next up" : "Need prereqs first"}
                          </span>
                        </article>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="plannerCard plannerCard--checklist">
          <div className="plannerCard__heading">
            <h2>Requirement Area Snapshot</h2>
            <p>Quickly see which blocks of the degree still have the most work left.</p>
          </div>

          <div className="plannerAreaList">
            {requirementGroups.map((group) => {
              const groupCompleted = group.courses.filter((course) => completedSet.has(course.code)).length;
              const groupRemaining = group.courses.length - groupCompleted;
              return (
                <article key={group.id} className="plannerAreaCard">
                  <div className="plannerAreaCard__top">
                    <h3>{group.title}</h3>
                    <span>{groupRemaining} left</span>
                  </div>
                  <p>
                    {groupCompleted} of {group.courses.length} complete
                  </p>
                </article>
              );
            })}
          </div>
        </section>
        </>
        )}
      </main>
    </>
  );
}

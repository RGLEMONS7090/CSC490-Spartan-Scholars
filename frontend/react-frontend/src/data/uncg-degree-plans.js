export const UNCG_PROGRAMS = [
  {
    id: "computer-science-bs",
    name: "Computer Science, B.S.",
    college: "College of Arts and Sciences",
    catalogYears: ["2025-26", "2024-25", "2023-24"],
    overview:
      "Built for UNCG students planning the B.S. in Computer Science. Includes a core path plus an optional data science concentration and optional support tracks.",
    note:
      "Based on the UNCG catalog structure for Computer Science, B.S. Use this as a planning aid and verify exact graduation rules with your advisor and Degree Works.",
    concentrationLabel: "Concentration",
    concentrations: [
      {
        id: "general",
        name: "General Computer Science",
        requirementGroups: [],
      },
      {
        id: "data-science",
        name: "Data Science and Big Data",
        requirementGroups: [
          {
            id: "cs-ds",
            title: "Data Science Concentration",
            courses: [
              { code: "CSC 405", title: "Data Science", credits: 3, prereqs: ["CSC 330"] },
              { code: "CSC 410", title: "Big Data and Machine Learning", credits: 3, prereqs: ["CSC 405"] },
              { code: "CSC 429", title: "Artificial Intelligence", credits: 3, prereqs: ["CSC 330"] },
            ],
          },
        ],
      },
    ],
    minorLabel: "Minor or Support Track",
    minors: [
      { id: "none", name: "No Minor / Track", requirementGroups: [] },
      {
        id: "business-foundations",
        name: "Business Foundations Track",
        requirementGroups: [
          {
            id: "cs-business-track",
            title: "Business Foundations Track",
            courses: [
              { code: "ACC 201", title: "Financial Accounting", credits: 3, prereqs: [] },
              { code: "ECO 201", title: "Principles of Microeconomics", credits: 3, prereqs: [] },
              { code: "MGT 300", title: "Management of Organizations", credits: 3, prereqs: [] },
            ],
          },
        ],
      },
      {
        id: "cybersecurity-track",
        name: "Cybersecurity Support Track",
        requirementGroups: [
          {
            id: "cs-cyber-track",
            title: "Cybersecurity Support Track",
            courses: [
              { code: "ISM 201", title: "Essentials of Cyber Security", credits: 3, prereqs: [] },
              { code: "ISM 218", title: "Database Systems", credits: 3, prereqs: [] },
              { code: "ISM 324", title: "Secure Networked Systems", credits: 3, prereqs: ["ISM 201"] },
            ],
          },
        ],
      },
    ],
    requirementGroups: [
      {
        id: "cs-foundations",
        title: "Programming and Math Foundations",
        courses: [
          { code: "CSC 130", title: "Introduction to Computer Science", credits: 4, prereqs: [] },
          { code: "CSC 230", title: "Elementary Data Structures and Algorithms", credits: 3, prereqs: ["CSC 130"] },
          { code: "CSC 250", title: "Foundations of Computer Science I", credits: 3, prereqs: ["CSC 130"] },
          { code: "CSC 261", title: "Computer Organization and Assembly Language", credits: 3, prereqs: ["CSC 130"] },
          { code: "MAT 191", title: "Calculus I", credits: 4, prereqs: [] },
          { code: "MAT 292", title: "Calculus II", credits: 4, prereqs: ["MAT 191"] },
        ],
      },
      {
        id: "cs-core",
        title: "Computer Science Core",
        courses: [
          { code: "CSC 330", title: "Advanced Data Structures", credits: 3, prereqs: ["CSC 230", "CSC 250"] },
          { code: "CSC 339", title: "Concepts of Programming Languages", credits: 3, prereqs: ["CSC 230"] },
          { code: "CSC 340", title: "Software Engineering", credits: 3, prereqs: ["CSC 330"] },
          { code: "CSC 429", title: "Artificial Intelligence", credits: 3, prereqs: ["CSC 330"] },
        ],
      },
      {
        id: "cs-supporting",
        title: "Supporting and Planning Courses",
        courses: [
          { code: "STA 290", title: "Introduction to Probability and Statistics", credits: 3, prereqs: [] },
          { code: "PHY 211", title: "General Physics I", credits: 4, prereqs: ["MAT 191"] },
          { code: "CSC 490", title: "Senior Capstone Planning", credits: 3, prereqs: ["CSC 340"] },
        ],
      },
    ],
  },
  {
    id: "biology-bs",
    name: "Biology, B.S.",
    college: "College of Arts and Sciences",
    catalogYears: ["2025-26", "2024-25", "2023-24"],
    overview:
      "Focused on the UNCG Biology, B.S. path with optional biotechnology, environmental biology, and human biology concentrations.",
    note:
      "Seeded from the UNCG Biology, B.S. catalog page. Concentration lists here are a planning snapshot, not a full advising audit.",
    concentrationLabel: "Concentration",
    concentrations: [
      { id: "none", name: "No Concentration", requirementGroups: [] },
      {
        id: "biotechnology",
        name: "Biotechnology",
        requirementGroups: [
          {
            id: "bio-biotech",
            title: "Biotechnology Concentration",
            courses: [
              { code: "BIO 481", title: "General Microbiology", credits: 4, prereqs: ["BIO 355", "BIO 392"] },
              { code: "BIO 482", title: "Molecular Biological Approaches in Research", credits: 3, prereqs: ["BIO 392"] },
              { code: "BIO 494", title: "Introduction to Biotechnology", credits: 3, prereqs: ["BIO 355", "BIO 392"] },
            ],
          },
        ],
      },
      {
        id: "environmental-biology",
        name: "Environmental Biology",
        requirementGroups: [
          {
            id: "bio-environmental",
            title: "Environmental Biology Concentration",
            courses: [
              { code: "BIO 431", title: "The Biosphere", credits: 3, prereqs: ["BIO 301"] },
              { code: "BIO 426", title: "Conservation Biology", credits: 3, prereqs: ["BIO 301", "BIO 330"] },
              { code: "BIO 456", title: "Global Change", credits: 3, prereqs: ["BIO 301"] },
            ],
          },
        ],
      },
      {
        id: "human-biology",
        name: "Human Biology",
        requirementGroups: [
          {
            id: "bio-human",
            title: "Human Biology Concentration",
            courses: [
              { code: "BIO 271", title: "Human Anatomy", credits: 4, prereqs: ["BIO 111"] },
              { code: "BIO 277", title: "Human Physiology", credits: 4, prereqs: ["BIO 112"] },
              { code: "BIO 478", title: "Hormones in Action", credits: 3, prereqs: ["BIO 355"] },
            ],
          },
        ],
      },
    ],
    minorLabel: "Minor or Support Track",
    minors: [
      { id: "none", name: "No Minor / Track", requirementGroups: [] },
      {
        id: "health-professions",
        name: "Health Professions Track",
        requirementGroups: [
          {
            id: "bio-health-track",
            title: "Health Professions Track",
            courses: [
              { code: "CHE 201", title: "Organic Chemistry I", credits: 3, prereqs: ["CHE 114"] },
              { code: "CHE 202", title: "Organic Chemistry II", credits: 3, prereqs: ["CHE 201"] },
              { code: "PSY 230", title: "Biological Psychology", credits: 3, prereqs: [] },
            ],
          },
        ],
      },
      {
        id: "research-track",
        name: "Research Preparation Track",
        requirementGroups: [
          {
            id: "bio-research-track",
            title: "Research Preparation Track",
            courses: [
              { code: "BIO 375", title: "Cell Biology and Genetics Laboratory", credits: 2, prereqs: ["BIO 355", "BIO 392"] },
              { code: "BIO 499", title: "Undergraduate Research", credits: 3, prereqs: ["BIO 355"] },
            ],
          },
        ],
      },
    ],
    requirementGroups: [
      {
        id: "bio-foundations",
        title: "Biology Program Qualifications",
        courses: [
          { code: "BIO 111", title: "Principles of Biology I", credits: 4, prereqs: [] },
          { code: "BIO 112", title: "Principles of Biology II", credits: 4, prereqs: ["BIO 111"] },
        ],
      },
      {
        id: "bio-core",
        title: "Biology Core",
        courses: [
          { code: "BIO 301", title: "Principles of Ecology", credits: 3, prereqs: ["BIO 112"] },
          { code: "BIO 355", title: "Cell Biology", credits: 3, prereqs: ["BIO 112"] },
          { code: "BIO 392", title: "Genetics", credits: 3, prereqs: ["BIO 112"] },
          { code: "BIO 330", title: "Evolution", credits: 3, prereqs: ["BIO 112"] },
          { code: "BIO 315", title: "Ecology and Evolution Laboratory", credits: 2, prereqs: ["BIO 301"] },
        ],
      },
      {
        id: "bio-related",
        title: "Related Area Requirements",
        courses: [
          { code: "CHE 111", title: "General Chemistry I", credits: 3, prereqs: [] },
          { code: "CHE 112", title: "General Chemistry I Laboratory", credits: 1, prereqs: [] },
          { code: "CHE 114", title: "General Chemistry II", credits: 3, prereqs: ["CHE 111"] },
          { code: "CHE 115", title: "General Chemistry II Laboratory", credits: 1, prereqs: ["CHE 112"] },
          { code: "MAT 183", title: "Mathematics for the Life Sciences", credits: 3, prereqs: [] },
        ],
      },
    ],
  },
  {
    id: "cybersecurity-bs",
    name: "Cybersecurity, B.S.",
    college: "Bryan School of Business and Economics",
    catalogYears: ["2025-26", "2024-25"],
    overview:
      "UNCG Cybersecurity, B.S. planner with Bryan School pre-admission, business core, and cybersecurity course sequencing.",
    note:
      "Seeded from the UNCG Cybersecurity, B.S. catalog structure. Good for seeing sequencing pressure; not a substitute for an official audit.",
    concentrationLabel: "Program Path",
    concentrations: [
      { id: "traditional", name: "Traditional Path", requirementGroups: [] },
      {
        id: "analytics-support",
        name: "Analytics Support Focus",
        requirementGroups: [
          {
            id: "cyber-analytics",
            title: "Analytics Support Focus",
            courses: [
              { code: "ISM 425", title: "Business Analytics", credits: 3, prereqs: ["ISM 218", "ISM 240"] },
              { code: "SCM 260", title: "Essentials of Enterprise Resource Planning", credits: 3, prereqs: ["ISM 280"] },
            ],
          },
        ],
      },
    ],
    minorLabel: "Minor or Support Track",
    minors: [
      { id: "none", name: "No Minor / Track", requirementGroups: [] },
      {
        id: "leadership-track",
        name: "Leadership Track",
        requirementGroups: [
          {
            id: "cyber-leadership-track",
            title: "Leadership Track",
            courses: [
              { code: "BUS 328", title: "Organizational Leadership", credits: 3, prereqs: [] },
              { code: "MGT 403", title: "Decision Making in Organizations", credits: 3, prereqs: ["MGT 312"] },
            ],
          },
        ],
      },
      {
        id: "software-track",
        name: "Software Development Track",
        requirementGroups: [
          {
            id: "cyber-software-track",
            title: "Software Development Track",
            courses: [
              { code: "CSC 130", title: "Introduction to Computer Science", credits: 4, prereqs: [] },
              { code: "CSC 230", title: "Elementary Data Structures and Algorithms", credits: 3, prereqs: ["CSC 130"] },
            ],
          },
        ],
      },
    ],
    requirementGroups: [
      {
        id: "cyber-preadmission",
        title: "Bryan School Pre-Admission",
        courses: [
          { code: "BUS 115", title: "Blueprint for Personal Development", credits: 1, prereqs: [] },
          { code: "ACC 201", title: "Financial Accounting", credits: 3, prereqs: [] },
          { code: "ACC 202", title: "Managerial Accounting", credits: 3, prereqs: ["ACC 201"] },
          { code: "ECO 201", title: "Principles of Microeconomics", credits: 3, prereqs: [] },
          { code: "ECO 202", title: "Principles of Macroeconomics", credits: 3, prereqs: [] },
          { code: "ISM 110", title: "Foundations for Analytics using Spreadsheets", credits: 3, prereqs: [] },
          { code: "ISM 280", title: "Information Systems for Decision Making", credits: 3, prereqs: ["ISM 110"] },
        ],
      },
      {
        id: "cyber-business-core",
        title: "Bryan School Common Business Core",
        courses: [
          { code: "FIN 315", title: "Business Finance I", credits: 3, prereqs: ["ACC 201", "ECO 201"] },
          { code: "MGT 301", title: "Introduction to International Business", credits: 3, prereqs: [] },
          { code: "MGT 312", title: "Organizational Behavior", credits: 3, prereqs: [] },
          { code: "MGT 330", title: "The Legal Environment of Business", credits: 3, prereqs: [] },
          { code: "MKT 320", title: "Principles of Marketing", credits: 3, prereqs: [] },
          { code: "SCM 302", title: "Operations Management", credits: 3, prereqs: [] },
        ],
      },
      {
        id: "cyber-major",
        title: "Cybersecurity Major Courses",
        courses: [
          { code: "ISM 201", title: "Essentials of Cyber Security", credits: 3, prereqs: ["ISM 110"] },
          { code: "ISM 218", title: "Database Systems", credits: 3, prereqs: ["ISM 110"] },
          { code: "ISM 240", title: "Business Programming I", credits: 3, prereqs: ["ISM 110"] },
          { code: "ISM 301", title: "Systems and Process Analysis", credits: 3, prereqs: ["ISM 218", "ISM 240", "ISM 280"] },
          { code: "ISM 324", title: "Secure Networked Systems", credits: 3, prereqs: ["ISM 201"] },
          { code: "ISM 452", title: "Design of Management Information Systems", credits: 3, prereqs: ["ISM 301"] },
        ],
      },
    ],
  },
  {
    id: "accounting-bs",
    name: "Accounting, B.S.",
    college: "Bryan School of Business and Economics",
    catalogYears: ["2025-26", "2024-25"],
    overview:
      "UNCG Accounting, B.S. planner built around Bryan School pre-admission, accounting core, and optional analytics or internal audit support paths.",
    note:
      "Seeded from the UNCG Accounting catalog structure. Good for planning progress, but students should still verify exact graduation rules with advisors.",
    concentrationLabel: "Accounting Focus",
    concentrations: [
      { id: "general", name: "General Accounting", requirementGroups: [] },
      {
        id: "analytics",
        name: "Accounting Analytics Focus",
        requirementGroups: [
          {
            id: "acct-analytics",
            title: "Accounting Analytics Focus",
            courses: [
              { code: "ISM 425", title: "Business Analytics", credits: 3, prereqs: ["ISM 280"] },
              { code: "ACC 430", title: "Accounting Information Systems", credits: 3, prereqs: ["ACC 318"] },
            ],
          },
        ],
      },
    ],
    minorLabel: "Minor or Support Track",
    minors: [
      { id: "none", name: "No Minor / Track", requirementGroups: [] },
      {
        id: "finance-track",
        name: "Finance Support Track",
        requirementGroups: [
          {
            id: "acct-finance-track",
            title: "Finance Support Track",
            courses: [
              { code: "FIN 315", title: "Business Finance I", credits: 3, prereqs: ["ACC 201", "ECO 201"] },
              { code: "FIN 425", title: "Investments", credits: 3, prereqs: ["FIN 315"] },
            ],
          },
        ],
      },
    ],
    requirementGroups: [
      {
        id: "acct-preadmission",
        title: "Bryan School Pre-Admission",
        courses: [
          { code: "BUS 115", title: "Blueprint for Personal Development", credits: 1, prereqs: [] },
          { code: "ACC 201", title: "Financial Accounting", credits: 3, prereqs: [] },
          { code: "ACC 202", title: "Managerial Accounting", credits: 3, prereqs: ["ACC 201"] },
          { code: "ECO 201", title: "Principles of Microeconomics", credits: 3, prereqs: [] },
          { code: "ECO 202", title: "Principles of Macroeconomics", credits: 3, prereqs: [] },
          { code: "ISM 110", title: "Foundations for Analytics using Spreadsheets", credits: 3, prereqs: [] },
          { code: "ISM 280", title: "Information Systems for Decision Making", credits: 3, prereqs: ["ISM 110"] },
        ],
      },
      {
        id: "acct-business-core",
        title: "Common Business Core",
        courses: [
          { code: "FIN 315", title: "Business Finance I", credits: 3, prereqs: ["ACC 201", "ECO 201"] },
          { code: "MGT 301", title: "Introduction to International Business", credits: 3, prereqs: [] },
          { code: "MGT 312", title: "Organizational Behavior", credits: 3, prereqs: [] },
          { code: "MGT 330", title: "The Legal Environment of Business", credits: 3, prereqs: [] },
          { code: "MKT 320", title: "Principles of Marketing", credits: 3, prereqs: [] },
          { code: "SCM 302", title: "Operations Management", credits: 3, prereqs: [] },
        ],
      },
      {
        id: "acct-major",
        title: "Accounting Major Courses",
        courses: [
          { code: "ACC 318", title: "Intermediate Accounting I", credits: 3, prereqs: ["ACC 202"] },
          { code: "ACC 319", title: "Intermediate Accounting II", credits: 3, prereqs: ["ACC 318"] },
          { code: "ACC 324", title: "Cost Accounting", credits: 3, prereqs: ["ACC 202"] },
          { code: "ACC 330", title: "Accounting Information for Management", credits: 3, prereqs: ["ACC 202"] },
          { code: "ACC 420", title: "Federal Income Taxes", credits: 3, prereqs: ["ACC 318"] },
          { code: "ACC 424", title: "Auditing", credits: 3, prereqs: ["ACC 319"] },
        ],
      },
    ],
  },
  {
    id: "business-administration-bs",
    name: "Business Administration, B.S.",
    college: "Bryan School of Business and Economics",
    catalogYears: ["2025-26", "2024-25"],
    overview:
      "UNCG Business Administration planner with Bryan School pre-admission and a concentration menu for business studies, management, and entrepreneurship-style planning.",
    note:
      "Seeded from the UNCG Business Administration, B.S. catalog page and concentration listings. Use it as a planning board, not an official audit.",
    concentrationLabel: "Concentration",
    concentrations: [
      {
        id: "business-studies",
        name: "Business Studies",
        requirementGroups: [
          {
            id: "bus-studies",
            title: "Business Studies Concentration",
            courses: [
              { code: "MGT 300", title: "Management of Organizations", credits: 3, prereqs: [] },
              { code: "MKT 320", title: "Principles of Marketing", credits: 3, prereqs: [] },
              { code: "SCM 302", title: "Operations Management", credits: 3, prereqs: [] },
            ],
          },
        ],
      },
      {
        id: "management",
        name: "Management",
        requirementGroups: [
          {
            id: "bus-management",
            title: "Management Concentration",
            courses: [
              { code: "MGT 313", title: "Human Resource Management", credits: 3, prereqs: ["MGT 300"] },
              { code: "MGT 318", title: "Organizational Change and Development", credits: 3, prereqs: ["MGT 300"] },
              { code: "MGT 403", title: "Decision Making in Organizations", credits: 3, prereqs: ["MGT 312"] },
            ],
          },
        ],
      },
      {
        id: "entrepreneurship",
        name: "Entrepreneurship",
        requirementGroups: [
          {
            id: "bus-entrepreneurship",
            title: "Entrepreneurship Concentration",
            courses: [
              { code: "ENT 130", title: "Entrepreneurship in a Sustainable Global Environment", credits: 3, prereqs: [] },
              { code: "MKT 403", title: "Entrepreneurial Marketing", credits: 3, prereqs: ["MKT 320"] },
              { code: "MGT 490", title: "Strategic Management", credits: 3, prereqs: ["FIN 315", "MKT 320"] },
            ],
          },
        ],
      },
    ],
    minorLabel: "Minor or Support Track",
    minors: [
      { id: "none", name: "No Minor / Track", requirementGroups: [] },
      {
        id: "analytics-track",
        name: "Analytics Track",
        requirementGroups: [
          {
            id: "bus-analytics-track",
            title: "Analytics Track",
            courses: [
              { code: "ISM 425", title: "Business Analytics", credits: 3, prereqs: ["ISM 280"] },
              { code: "ISM 218", title: "Database Systems", credits: 3, prereqs: ["ISM 110"] },
            ],
          },
        ],
      },
    ],
    requirementGroups: [
      {
        id: "bus-preadmission",
        title: "Bryan School Pre-Admission",
        courses: [
          { code: "BUS 115", title: "Blueprint for Personal Development", credits: 1, prereqs: [] },
          { code: "ACC 201", title: "Financial Accounting", credits: 3, prereqs: [] },
          { code: "ACC 202", title: "Managerial Accounting", credits: 3, prereqs: ["ACC 201"] },
          { code: "ECO 201", title: "Principles of Microeconomics", credits: 3, prereqs: [] },
          { code: "ECO 202", title: "Principles of Macroeconomics", credits: 3, prereqs: [] },
          { code: "ISM 110", title: "Foundations for Analytics using Spreadsheets", credits: 3, prereqs: [] },
          { code: "ISM 280", title: "Information Systems for Decision Making", credits: 3, prereqs: ["ISM 110"] },
        ],
      },
      {
        id: "bus-core",
        title: "Common Business Core",
        courses: [
          { code: "FIN 315", title: "Business Finance I", credits: 3, prereqs: ["ACC 201", "ECO 201"] },
          { code: "MGT 301", title: "Introduction to International Business", credits: 3, prereqs: [] },
          { code: "MGT 312", title: "Organizational Behavior", credits: 3, prereqs: [] },
          { code: "MGT 330", title: "The Legal Environment of Business", credits: 3, prereqs: [] },
          { code: "MKT 320", title: "Principles of Marketing", credits: 3, prereqs: [] },
          { code: "SCM 302", title: "Operations Management", credits: 3, prereqs: [] },
        ],
      },
    ],
  },
  {
    id: "information-systems-supply-chain-bs",
    name: "Information Systems and Supply Chain Management, B.S.",
    college: "Bryan School of Business and Economics",
    catalogYears: ["2025-26", "2024-25"],
    overview:
      "UNCG ISSCM planner that covers the shared Bryan core and a program path for information systems or supply chain-focused planning.",
    note:
      "Seeded from the UNCG Information Systems and Supply Chain Management catalog area. Advising review is still needed for exact concentration and elective rules.",
    concentrationLabel: "Program Path",
    concentrations: [
      {
        id: "information-systems",
        name: "Information Systems Path",
        requirementGroups: [
          {
            id: "isscm-is",
            title: "Information Systems Path",
            courses: [
              { code: "ISM 218", title: "Database Systems", credits: 3, prereqs: ["ISM 110"] },
              { code: "ISM 240", title: "Business Programming I", credits: 3, prereqs: ["ISM 110"] },
              { code: "ISM 452", title: "Design of Management Information Systems", credits: 3, prereqs: ["ISM 301"] },
            ],
          },
        ],
      },
      {
        id: "supply-chain",
        name: "Supply Chain Path",
        requirementGroups: [
          {
            id: "isscm-scm",
            title: "Supply Chain Path",
            courses: [
              { code: "SCM 360", title: "Transportation and Logistics", credits: 3, prereqs: ["SCM 302"] },
              { code: "SCM 372", title: "Purchasing and Supply Management", credits: 3, prereqs: ["SCM 302"] },
              { code: "SCM 460", title: "Global Supply Chain Management", credits: 3, prereqs: ["SCM 302"] },
            ],
          },
        ],
      },
    ],
    minorLabel: "Minor or Support Track",
    minors: [
      { id: "none", name: "No Minor / Track", requirementGroups: [] },
      {
        id: "analytics-support",
        name: "Analytics Support Track",
        requirementGroups: [
          {
            id: "isscm-analytics-track",
            title: "Analytics Support Track",
            courses: [
              { code: "ISM 425", title: "Business Analytics", credits: 3, prereqs: ["ISM 280"] },
              { code: "STA 290", title: "Introduction to Probability and Statistics", credits: 3, prereqs: [] },
            ],
          },
        ],
      },
    ],
    requirementGroups: [
      {
        id: "isscm-preadmission",
        title: "Bryan School Pre-Admission",
        courses: [
          { code: "BUS 115", title: "Blueprint for Personal Development", credits: 1, prereqs: [] },
          { code: "ACC 201", title: "Financial Accounting", credits: 3, prereqs: [] },
          { code: "ACC 202", title: "Managerial Accounting", credits: 3, prereqs: ["ACC 201"] },
          { code: "ECO 201", title: "Principles of Microeconomics", credits: 3, prereqs: [] },
          { code: "ECO 202", title: "Principles of Macroeconomics", credits: 3, prereqs: [] },
          { code: "ISM 110", title: "Foundations for Analytics using Spreadsheets", credits: 3, prereqs: [] },
          { code: "ISM 280", title: "Information Systems for Decision Making", credits: 3, prereqs: ["ISM 110"] },
        ],
      },
      {
        id: "isscm-core",
        title: "Common Business Core",
        courses: [
          { code: "FIN 315", title: "Business Finance I", credits: 3, prereqs: ["ACC 201", "ECO 201"] },
          { code: "MGT 301", title: "Introduction to International Business", credits: 3, prereqs: [] },
          { code: "MGT 312", title: "Organizational Behavior", credits: 3, prereqs: [] },
          { code: "MKT 320", title: "Principles of Marketing", credits: 3, prereqs: [] },
          { code: "SCM 302", title: "Operations Management", credits: 3, prereqs: [] },
        ],
      },
      {
        id: "isscm-major",
        title: "ISSCM Major Requirements",
        courses: [
          { code: "ISM 301", title: "Systems and Process Analysis", credits: 3, prereqs: ["ISM 218", "ISM 240", "ISM 280"] },
          { code: "SCM 260", title: "Essentials of Enterprise Resource Planning", credits: 3, prereqs: ["ISM 280"] },
          { code: "SCM 372", title: "Purchasing and Supply Management", credits: 3, prereqs: ["SCM 302"] },
        ],
      },
    ],
  },
  {
    id: "psychology-ba",
    name: "Psychology, B.A.",
    college: "College of Arts and Sciences",
    catalogYears: ["2025-26", "2024-25"],
    overview:
      "UNCG Psychology planner with a broad B.A. sequence, science/research options, and support tracks for counseling or research preparation.",
    note:
      "Seeded from the UNCG Psychology catalog structure. Exact upper-level selections and BA/BS differences should still be reviewed with advising.",
    concentrationLabel: "Program Path",
    concentrations: [
      { id: "general", name: "General Psychology", requirementGroups: [] },
      {
        id: "research",
        name: "Research Preparation",
        requirementGroups: [
          {
            id: "psy-research",
            title: "Research Preparation",
            courses: [
              { code: "PSY 301", title: "Research Methods in Psychology", credits: 3, prereqs: ["PSY 121", "STA 108"] },
              { code: "PSY 310", title: "Experimental Psychology Laboratory", credits: 3, prereqs: ["PSY 301"] },
            ],
          },
        ],
      },
    ],
    minorLabel: "Minor or Support Track",
    minors: [
      { id: "none", name: "No Minor / Track", requirementGroups: [] },
      {
        id: "human-development",
        name: "Human Development Track",
        requirementGroups: [
          {
            id: "psy-human-dev",
            title: "Human Development Track",
            courses: [
              { code: "PSY 241", title: "Developmental Psychology", credits: 3, prereqs: ["PSY 121"] },
              { code: "PSY 327", title: "Adolescent Psychology", credits: 3, prereqs: ["PSY 241"] },
            ],
          },
        ],
      },
    ],
    requirementGroups: [
      {
        id: "psy-foundations",
        title: "Psychology Foundations",
        courses: [
          { code: "PSY 121", title: "General Psychology", credits: 3, prereqs: [] },
          { code: "STA 108", title: "Elementary Introduction to Probability and Statistics", credits: 3, prereqs: [] },
        ],
      },
      {
        id: "psy-core-areas",
        title: "Psychology Core Areas",
        courses: [
          { code: "PSY 230", title: "Biological Psychology", credits: 3, prereqs: ["PSY 121"] },
          { code: "PSY 241", title: "Developmental Psychology", credits: 3, prereqs: ["PSY 121"] },
          { code: "PSY 250", title: "Social Psychology", credits: 3, prereqs: ["PSY 121"] },
          { code: "PSY 260", title: "Cognitive Psychology", credits: 3, prereqs: ["PSY 121"] },
          { code: "PSY 321", title: "Abnormal Psychology", credits: 3, prereqs: ["PSY 121"] },
        ],
      },
      {
        id: "psy-capstone",
        title: "Methods and Advanced Work",
        courses: [
          { code: "PSY 301", title: "Research Methods in Psychology", credits: 3, prereqs: ["PSY 121", "STA 108"] },
          { code: "PSY 390", title: "History and Systems of Psychology", credits: 3, prereqs: ["PSY 121"] },
          { code: "PSY 495", title: "Psychology Capstone Seminar", credits: 3, prereqs: ["PSY 301"] },
        ],
      },
    ],
  },
];

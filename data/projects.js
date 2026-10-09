/* Projects shown on the Projects page.

   repo       "username/repository" on GitHub. When it is set, the page adds an "Open on GitHub" button and
              loads the real file tree from GitHub, so visitors can browse folders and open files.
   structure  A fallback list of file paths, used when GitHub cannot be reached or repo is empty.
              Keep it close to the real layout. Delete it once the live tree works for you.
   demo       A live link, or "" for none.
   placeholder  Remove this line (or set it to false) to take off the "Placeholder" tag. */
window.PROJECTS = [
  {
    name: "Project name one",
    summary: "One sentence on what it does and the result it produced.",
    tags: ["React", "TypeScript", "Node"],
    repo: "",
    demo: "",
    placeholder: true,
    structure: [
      "README.md",
      "package.json",
      "tsconfig.json",
      ".github/workflows/ci.yml",
      "public/index.html",
      "src/main.tsx",
      "src/App.tsx",
      "src/api/client.ts",
      "src/components/Table.tsx",
      "src/components/Form.tsx",
      "src/state/store.ts",
      "tests/App.test.tsx",
    ],
  },
  {
    name: "Project name two",
    summary: "One sentence on what it does and the result it produced.",
    tags: ["Java", "Spring Boot", "SQL"],
    repo: "",
    demo: "",
    placeholder: true,
    structure: [
      "README.md",
      "pom.xml",
      "Dockerfile",
      "src/main/java/com/example/Application.java",
      "src/main/java/com/example/api/ReportController.java",
      "src/main/java/com/example/service/ReportService.java",
      "src/main/resources/application.yml",
      "src/main/resources/db/migration/V1__init.sql",
      "src/test/java/com/example/ReportServiceTest.java",
    ],
  },
  {
    name: "Project name three",
    summary: "One sentence on what it does and the result it produced.",
    tags: ["SQL", "Power BI", "Python"],
    repo: "",
    demo: "",
    placeholder: true,
    structure: [
      "README.md",
      "requirements.txt",
      "sql/01_schema.sql",
      "sql/02_load.sql",
      "sql/03_kpi_views.sql",
      "notebooks/analysis.ipynb",
      "dashboards/kpi.pbix",
      "docs/data-dictionary.md",
    ],
  },
];

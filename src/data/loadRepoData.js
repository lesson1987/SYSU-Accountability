import cases from "../../data/cases.json";
import demands from "../../data/demands.json";
import evidence from "../../data/evidence.json";
import facts from "../../data/facts.json";
import targets from "../../data/targets.json";
import appealLetter from "../../templates/appeal-letter.md?raw";
import disclosureRequest from "../../templates/disclosure-request.md?raw";
import reportLetter from "../../templates/report-letter.md?raw";
import situationReport from "../../templates/situation-report.md?raw";

export async function loadRepoData() {
  return {
    cases,
    demands,
    evidence,
    facts,
    targets,
    templates: {
      "appeal-letter": appealLetter,
      "disclosure-request": disclosureRequest,
      "report-letter": reportLetter,
      "situation-report": situationReport
    }
  };
}

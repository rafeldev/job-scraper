import type { ISiteScraper } from "../core/interfaces.js";
import { ComputrabajoScraper } from "./computrabajo.scraper.js";
import { ElempleoScraper } from "./elempleo.scraper.js";
import { IndeedCoScraper } from "./indeedCo.scraper.js";
import { Magneto365Scraper } from "./magneto365.scraper.js";
import { RemoteOkScraper } from "./remoteOk.scraper.js";
import { WorkingNomadsScraper } from "./workingNomads.scraper.js";

export function createScraperMap(): Record<string, ISiteScraper> {
  return {
    Computrabajo: new ComputrabajoScraper(),
    ElEmpleo: new ElempleoScraper(),
    "Indeed Colombia": new IndeedCoScraper(),
    Magneto365: new Magneto365Scraper(),
    "Working Nomads": new WorkingNomadsScraper(),
    "Remote OK": new RemoteOkScraper()
  };
}

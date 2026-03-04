import { BaseSiteScraper } from "./baseSiteScraper.js";

/**
 * Working Nomads - Remote job board (gratuito para postular).
 * Listado: https://www.workingnomads.com/remote-front-end-jobs
 * Si los selectores fallan, revisar el HTML en DevTools y actualizar config/sites.yaml.
 */
export class WorkingNomadsScraper extends BaseSiteScraper {
  readonly siteName = "Working Nomads";
}

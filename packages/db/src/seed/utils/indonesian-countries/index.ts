import type { District, Province, Regency, Village } from "./types";
import { listDataFiles, readJsonFile } from "./utils";

/**
 * Reads all 38 Indonesian provinces from `provinsi/provinsi.json`.
 * Source format: `{ "11": "ACEH", "12": "SUMATERA UTARA", ... }`
 *
 * @returns Array of provinces with BPS code and name
 */
async function getIndonesianProvinces(): Promise<Province[]> {
  const raw = await readJsonFile<Record<string, string>>(
    "provinsi/provinsi.json",
  );
  return Object.entries(raw).map(([code, name]) => ({ code, name }));
}

/**
 * Reads all Indonesian regencies from split `kabupaten_kota/kab-{provinceCode}.json` files.
 * Source format per file: `{ "01": "KAB. SIMEULUE", ... }`
 * Full regency code = provinceCode + localCode (e.g. "11" + "01" = "1101").
 *
 * @returns Array of regencies with full BPS code, parent province code, and name
 */
async function getIndonesianRegencies(): Promise<Regency[]> {
  const files = await listDataFiles("kabupaten_kota");
  const result: Regency[] = [];

  for (const file of files) {
    // filename pattern: kab-{provinceCode}.json
    const provinceCode = file.replace("kab-", "").replace(".json", "");
    const raw = await readJsonFile<Record<string, string>>(
      `kabupaten_kota/${file}`,
    );

    for (const [localCode, name] of Object.entries(raw)) {
      result.push({
        code: `${provinceCode}${localCode}`,
        provinceCode,
        name,
      });
    }
  }

  return result;
}

/**
 * Reads all Indonesian districts from split `kecamatan/kec-{pc}-{rc}.json` files.
 * Source format per file: `{ "010": "TEUPAH SELATAN", ... }`
 * Full district code = provinceCode + regencyCode + localCode (e.g. "11" + "01" + "010" = "1101010").
 *
 * @returns Array of districts with full BPS code, parent regency code, and name
 */
async function getIndonesianDistricts(): Promise<District[]> {
  const files = await listDataFiles("kecamatan");
  const result: District[] = [];

  for (const file of files) {
    // filename pattern: kec-{provinceCode}-{regencyCode}.json
    const parts = file.replace("kec-", "").replace(".json", "").split("-");
    const provinceCode = parts[0]!;
    const localRegencyCode = parts[1]!;
    const regencyCode = `${provinceCode}${localRegencyCode}`;

    const raw = await readJsonFile<Record<string, string>>(`kecamatan/${file}`);

    for (const [localCode, name] of Object.entries(raw)) {
      result.push({
        code: `${regencyCode}${localCode}`,
        regencyCode,
        name,
      });
    }
  }

  return result;
}

/**
 * Reads all Indonesian villages from split `kelurahan_desa/keldesa-{pc}-{rc}-{dc}.json` files.
 * Source format per file: `{ "001": "LATIUNG", ... }`
 * Full village code = provinceCode + regencyCode + districtCode + localCode.
 *
 * @returns Array of villages with full BPS code, parent district code, and name
 */
async function getIndonesianVillages(): Promise<Village[]> {
  const files = await listDataFiles("kelurahan_desa");
  const result: Village[] = [];

  for (const file of files) {
    // filename pattern: keldesa-{provinceCode}-{regencyCode}-{districtCode}.json
    const parts = file.replace("keldesa-", "").replace(".json", "").split("-");
    const provinceCode = parts[0]!;
    const localRegencyCode = parts[1]!;
    const localDistrictCode = parts[2]!;
    const districtCode = `${provinceCode}${localRegencyCode}${localDistrictCode}`;

    const raw = await readJsonFile<Record<string, string>>(
      `kelurahan_desa/${file}`,
    );

    for (const [localCode, name] of Object.entries(raw)) {
      result.push({
        code: `${districtCode}${localCode}`,
        districtCode,
        name,
      });
    }
  }

  return result;
}

export {
  getIndonesianProvinces,
  getIndonesianRegencies,
  getIndonesianDistricts,
  getIndonesianVillages,
};

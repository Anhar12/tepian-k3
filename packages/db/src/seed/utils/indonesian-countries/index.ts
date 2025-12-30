import type { Districts, Provinces, Regencies, Villages } from "./types";
import { readJsonFile } from "./utils";

async function getIndonesianProvinces() {
  const provinces = await readJsonFile<Provinces>("data/provinces.json");

  return provinces;
}

async function getIndonesianRegencies() {
  const regencies = await readJsonFile<Regencies>("data/regencies.json");

  return regencies;
}

async function getIndonesianDistricts() {
  const districts = await readJsonFile<Districts>("data/districts.json");

  return districts;
}

async function getIndonesianVillages() {
  const villages = await readJsonFile<Villages>("data/villages.json");

  return villages;
}

export {
  getIndonesianProvinces,
  getIndonesianRegencies,
  getIndonesianDistricts,
  getIndonesianVillages,
};

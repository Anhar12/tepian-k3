export type Province = {
  /** BPS province code e.g. "11" */
  code: string;
  name: string;
};

export type Regency = {
  /** Full BPS regency code e.g. "1101" */
  code: string;
  /** Parent province BPS code e.g. "11" */
  provinceCode: string;
  name: string;
};

export type District = {
  /** Full BPS district code e.g. "1101010" */
  code: string;
  /** Parent regency BPS code e.g. "1101" */
  regencyCode: string;
  name: string;
};

export type Village = {
  /** Full BPS village code e.g. "1101010001" */
  code: string;
  /** Parent district BPS code e.g. "1101010" */
  districtCode: string;
  name: string;
};

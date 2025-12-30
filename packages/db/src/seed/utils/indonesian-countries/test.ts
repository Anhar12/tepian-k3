import { getIndonesianDistricts } from ".";

async function main() {
  const data = await getIndonesianDistricts();
  console.log(data);
}

main().catch((error) => {
  console.error("Error fetching Indonesian districts:", error);
});

export function calculateShippingCost({ packageSize, freeShipping }) {
  if (freeShipping) return 0;
  if (packageSize === "large") return 2000;
  if (packageSize === "medium") return 1000;
  return 500;
}

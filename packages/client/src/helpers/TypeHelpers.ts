/** JS is stupid and there's no integer type, but trust me bro :) */
export const getInteger = (value: unknown): number | undefined => {
  if (typeof value !== 'string') return undefined;
  const num = Number(value);
  if (Number.isNaN(num)) return undefined;
  if (!Number.isInteger(num)) return undefined;
  return num;
};

export const getPositiveInteger = (value: unknown): number | undefined => {
  const num = getInteger(value);
  return num != null && num > 0 ? num : undefined;
};

export const getNonNegativeInteger = (value: unknown): number | undefined => {
  const num = getInteger(value);
  return num != null && num >= 0 ? num : undefined;
};

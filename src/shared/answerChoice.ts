export type ChoiceValue = string | number | boolean;

const toNumber = (value: ChoiceValue) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

export const parseChoiceIndexes = (
  choice?: ChoiceValue | ChoiceValue[] | null,
  multiple = false,
) => {
  if (Array.isArray(choice)) {
    return choice
      .map(toNumber)
      .filter((value): value is number => value !== undefined);
  }

  if (choice === undefined || choice === null) return [];

  const normalized = String(choice).trim();
  if (!normalized) return [];

  if (/\D/.test(normalized)) {
    return normalized
      .split(/\D+/)
      .filter(Boolean)
      .map(Number)
      .filter(Number.isFinite);
  }

  if (multiple && normalized.length > 1) {
    return normalized
      .split("")
      .map(Number)
      .filter(Number.isFinite);
  }

  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? [numberValue] : [];
};

export const normalizeChoice = (
  choice?: ChoiceValue | ChoiceValue[] | null,
  multiple = false,
) => {
  return parseChoiceIndexes(choice, multiple)
    .slice()
    .sort((left, right) => left - right)
    .join(",");
};

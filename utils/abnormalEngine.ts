let abnormalStartTs: number | null = null;

export const updateAbnormalState = (isAbnormal: boolean) => {
  const now = Date.now();

  if (isAbnormal) {
    if (!abnormalStartTs) abnormalStartTs = now;
  } else {
    abnormalStartTs = null;
  }

  return {
    isAbnormal,
    abnormalStartTs,
    abnormalForMs: abnormalStartTs ? now - abnormalStartTs : 0,
    confirmed: abnormalStartTs ? now - abnormalStartTs >= 3 * 60 * 1000 : false,
  };
};

export const resetAbnormal = () => {
  abnormalStartTs = null;
};
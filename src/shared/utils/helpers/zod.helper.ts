import { z } from 'zod';

export const zStringToNumber = () =>
  z.preprocess((val) => {
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number());

export const zStringToInt = () =>
  z.preprocess((val) => {
    const num = parseInt(val as string, 10);
    return isNaN(num) ? undefined : num;
  }, z.number());

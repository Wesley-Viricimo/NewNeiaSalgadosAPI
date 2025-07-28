import { coerceRequiredString } from "src/shared/utils/helpers/zod.helper";
import  { z } from "zod";

export const AuthDtoSchema = z.object({
    email: z.string(),
    password: coerceRequiredString()
});

export type AuthDto = z.infer<typeof AuthDtoSchema>;
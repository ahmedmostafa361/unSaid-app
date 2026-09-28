import { z } from "zod";
import { AppError } from "../errors/error.js";

export const validateBody = (dto, body) => {
    // Validate that 'dto' passed in is a valid Zod schema using 'z'
    if (!(dto instanceof z.ZodType)) {
        throw new Error("Invalid schema provided to validateBody");
    }

    const result = dto.safeParse(body);

    if (!result.success) {
        const errorMessages = result.error.issues.map(
            issue => `${issue.path.join('.')}: ${issue.message}`
        );
        throw new AppError(errorMessages.join(", "), 400);
    }

    return result.data;
};
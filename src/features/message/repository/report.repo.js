import { Report } from "../model/report.model.js";

export const createReport = async (data) => {
    return Report.create(data);
};

import multer, {diskStorage} from 'multer';
import crypto from 'node:crypto';
import {AppError} from "../errors/error.js";

function fileUpload(allowedTypes = ['image/png, ;image/jpeg']) {
    return multer(
        {
            fileFilter: (req, file, cb) => {
                if(allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    return cb(new AppError('Invalid file format',400), false);
                }
            },
            storage: diskStorage(
                {
                    destination: "uploads",
                    filename: (req, file, cb) => {
                        console.log(file);
                        cb(null, `${crypto.randomUUID()}-${file.originalname}`);
                    }
                }
            )
        }
    )
}
// storage :
// 1. disk [hdd]
// folder => fileName
// 2. memory [ram]
export function uploadSingleFile(filedName,allowedTypes =['image/png, ;image/jpeg']) {
    return fileUpload(allowedTypes).single(filedName);
}
export function uploadMultipleFile(filedName,maxCount) {
    return fileUpload().array(filedName,maxCount);
}
export function uploadMultipleFileWithSize(fields) {
   return fileUpload().fields(
       fields
   );
}

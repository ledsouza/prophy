import { MAX_DOCUMENT_FILE_SIZE_BYTES } from "@/constants/fileSize";

import createFileSchema from "./file-schema";

const pdfFileSchema = createFileSchema({
    required: true,
    maxSizeBytes: MAX_DOCUMENT_FILE_SIZE_BYTES,
    acceptedTypes: ["application/pdf"],
    requiredMessage: "O arquivo PDF é obrigatório.",
    sizeMessage: `O arquivo PDF não pode ser maior que ${MAX_DOCUMENT_FILE_SIZE_BYTES / 1_000_000}MB.`,
    invalidFormatMessage: "O arquivo PDF deve possuir formato válido.",
    typeMessage: "O formato do arquivo deve ser PDF.",
});

export default pdfFileSchema;

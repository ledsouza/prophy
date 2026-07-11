import { MAX_DOCUMENT_FILE_SIZE_BYTES } from "@/constants/fileSize";

import createFileSchema from "./file-schema";

const wordFileSchema = createFileSchema({
    required: true,
    maxSizeBytes: MAX_DOCUMENT_FILE_SIZE_BYTES,
    acceptedTypes: [
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    ],
    requiredMessage: "O arquivo Word é obrigatório.",
    sizeMessage: `O arquivo Word não pode ser maior que ${MAX_DOCUMENT_FILE_SIZE_BYTES / 1_000_000}MB.`,
    invalidFormatMessage: "O arquivo Word deve possuir formato válido.",
    typeMessage: "O formato do arquivo deve ser DOC ou DOCX.",
});

export default wordFileSchema;

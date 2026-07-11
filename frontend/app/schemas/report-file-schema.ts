import { MAX_DOCUMENT_FILE_SIZE_BYTES } from "@/constants/fileSize";

import createFileSchema from "./file-schema";

const reportFileSchema = createFileSchema({
    required: true,
    maxSizeBytes: MAX_DOCUMENT_FILE_SIZE_BYTES,
    acceptedTypes: [
        "application/pdf",
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    ],
    typeMessage: "O formato do arquivo deve ser PDF, DOC ou DOCX.",
});

export default reportFileSchema;

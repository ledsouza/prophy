import { MAX_IMAGE_FILE_SIZE_BYTES } from "@/constants/fileSize";

import createFileSchema from "./file-schema";

const requiredFileSchema = createFileSchema({
    required: true,
    maxSizeBytes: MAX_IMAGE_FILE_SIZE_BYTES,
    acceptedTypes: ["image/jpeg", "image/jpg", "image/png"],
    typeMessage: "O formato do arquivo deve ser jpg, jpeg ou png.",
});

export default requiredFileSchema;

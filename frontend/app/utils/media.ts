import { resolveApiPath } from "@/utils/url";

export async function fetchPhoto(endpoint: string): Promise<File> {
    try {
        const response = await fetch(resolveApiPath(endpoint));
        const blob = await response.blob();

        const filename = endpoint.split("/").pop();

        if (!filename) {
            throw new Error("Could not get filename from endpoint");
        }

        return new File([blob], filename, {
            type: blob.type,
        });
    } catch (error) {
        throw error;
    }
}

export async function fetchPhoto(endpoint: string): Promise<File> {
    try {
        const response = await fetch(process.env.NEXT_PUBLIC_HOST + endpoint);
        const blob = await response.blob();

        const filename = endpoint.split("/").pop();

        if (!filename) {
            throw new Error("Could not get filename from endpoint");
        }

        return new File([blob], filename, {
            type: blob.type,
        });
    } catch (error) {
        // Re-throw the error to allow the caller to handle it
        throw error;
    }
}

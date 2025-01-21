export function fetchPhoto(endpoint: string, setPhoto: (file: File) => void) {
    fetch(process.env.NEXT_PUBLIC_HOST + endpoint)
        .then((response) => response.blob())
        .then((blob) => {
            const filename = endpoint.split("/").pop();

            if (!filename) {
                throw new Error("Could not get filename from endpoint");
            }

            const file = new File([blob], filename, {
                type: blob.type,
            });
            setPhoto(file);
        });
}

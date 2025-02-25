class AccessoryCreationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AccessoryCreationError";
    }
}

import zxcvbn from "zxcvbn";

export const checkPasswordScore = (password: string) => {
    const result = zxcvbn(password);
    return result.score > 1;
};

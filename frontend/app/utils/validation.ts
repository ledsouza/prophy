import zxcvbn from "zxcvbn";

export const checkPasswordScore = (password: string) => {
    const result = zxcvbn(password);
    return result.score > 1;
};

export const isValidPhonePTBR = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, "");
    const mobileRegex = /^([1-9]{2})(9[0-9]{8})$/;
    const fixedRegex = /^([1-9]{2})([2-5][0-9]{7})$/;

    return mobileRegex.test(cleanPhone) || fixedRegex.test(cleanPhone);
};

type JwtPayload = {
    user_id: number;
    exp: number;
    iat: number;
};

export default JwtPayload;

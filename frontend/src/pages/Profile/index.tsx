import { useEffect, useState } from "react";

import api from "@/server/api";

type UserData = {
    email: string;
    username: string;
};

const Profile = () => {
    const [profileData, setProfileData] = useState<UserData[] | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get<UserData[]>(
                    "autenticacao/user/"
                );
                setProfileData(response.data);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            {profileData ? (
                <>
                    <p>Email: {profileData[0].email}</p>
                    <p>Username: {profileData[0].username}</p>
                </>
            ) : (
                <p>Não foi encontrada nenhuma informação sobre esse usuário</p>
            )}
        </div>
    );
};

export default Profile;

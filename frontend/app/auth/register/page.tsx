"use client";

import { CNPJForm, RegisterForm } from "@/components/forms";
import { useState } from "react";
import { Modal } from "@/components/common";
import { useCNPJValidation, useRegistrationForm } from "@/hooks";

const RegisterPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { validateCNPJ, validatedCNPJ } = useCNPJValidation(setIsModalOpen);
    const { onSubmit } = useRegistrationForm({
        validatedCNPJ,
        setIsModalOpen,
    });

    return (
        <main>
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <CNPJForm onSubmit={validateCNPJ} />
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                className="max-w-lg"
            >
                <div className="m-6 sm:mx-auto sm:w-full sm:max-w-md max-w-sm">
                    <RegisterForm
                        onSubmit={onSubmit}
                        setIsModalOpen={setIsModalOpen}
                    />
                </div>
            </Modal>
        </main>
    );
};

export default RegisterPage;

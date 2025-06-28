import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { mask as cnpjMask } from "validation-br/dist/cnpj";

import { Button } from "@/components/common";
import { Typography } from "@/components/foundation";

type ClientDetailHeaderProps = {
    clientName?: string;
};

function ClientDetailHeader({ clientName }: ClientDetailHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        router.push("/dashboard");
    };

    return (
        <div className="mb-6">
            <Button
                variant="secondary"
                onClick={handleBack}
                className="mb-4 flex items-center gap-2"
                data-testid="btn-back-to-search"
            >
                <ArrowLeft size={16} />
                Voltar à busca
            </Button>
        </div>
    );
}

export default ClientDetailHeader;

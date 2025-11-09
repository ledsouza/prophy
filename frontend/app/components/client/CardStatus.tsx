import { OperationStatus } from "@/enums";
import { Typography } from "@/components/foundation";

type CardStatusProps = {
    status: OperationStatus | undefined;
};

function CardStatus({ status }: CardStatusProps) {
    return (
        <>
            {status === OperationStatus.ACCEPTED && (
                <Typography className="text-success font-medium" size="sm">
                    Aprovada
                </Typography>
            )}
            {status === OperationStatus.REJECTED && (
                <Typography className="text-danger font-medium" size="sm">
                    Rejeitada
                </Typography>
            )}
            {status === OperationStatus.REVIEW && (
                <Typography className="text-warning font-medium" size="sm">
                    Pendente
                </Typography>
            )}
        </>
    );
}

export default CardStatus;
